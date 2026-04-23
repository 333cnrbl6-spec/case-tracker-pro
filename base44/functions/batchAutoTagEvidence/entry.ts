import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all evidence records
    const allEvidence = await base44.asServiceRole.entities.Evidence.list('-created_date', 1000);
    
    const results = {
      total: allEvidence.length,
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const evidence of allEvidence) {
      // Skip if no file URL
      if (!evidence.file_url) {
        results.skipped++;
        continue;
      }

      // Skip if already has related_incidents (likely already tagged)
      if (evidence.related_incidents && evidence.related_incidents.length > 0) {
        results.skipped++;
        continue;
      }

      results.processed++;

      try {
        // Call auto-tagging function
        const tagResult = await base44.asServiceRole.functions.invoke('aiAutoTagDocument', {
          fileUrl: evidence.file_url,
          fileName: evidence.title || 'Document'
        });

        if (tagResult.data?.success) {
          // Update evidence record with auto-tagged data
          await base44.asServiceRole.entities.Evidence.update(evidence.id, {
            related_incidents: tagResult.data.related_incidents || [],
            strength: tagResult.data.strength || evidence.strength,
            notes: (evidence.notes ? evidence.notes + '\n---\n' : '') + 
                   `[AUTO-TAGGED] Key findings: ${tagResult.data.key_findings?.join('; ') || 'None'}. Severity: ${tagResult.data.severity}. Confidence: ${tagResult.data.confidence_score}%`
          });

          results.updated++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          evidenceId: evidence.id,
          title: evidence.title,
          error: err.message
        });
      }

      // Rate limiting - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return Response.json({
      success: true,
      message: `Batch auto-tagging completed. Updated ${results.updated}/${results.processed} evidence items.`,
      results
    });
  } catch (error) {
    console.error('Batch auto-tag error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});