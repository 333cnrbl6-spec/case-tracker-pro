import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { evidenceIds = [] } = await req.json();

    if (evidenceIds.length === 0) {
      return Response.json({ error: 'No evidence selected' }, { status: 400 });
    }

    // Fetch all evidence and their annotations
    const evidencePromises = evidenceIds.map(id => base44.entities.Evidence.filter({ id }));
    const evidenceResults = await Promise.all(evidencePromises);
    const evidence = evidenceResults.flatMap(r => r).filter(e => e.id);

    // Fetch all annotations
    const annotationPromises = evidenceIds.map(id =>
      base44.entities.Annotation.filter({ evidence_id: id })
    );
    const annotationResults = await Promise.all(annotationPromises);
    const annotations = annotationResults.flatMap(r => r);

    // Fetch RICS rules for reference
    const ricsRules = await base44.entities.RICSRule.list('-updated_date', 100);

    // Fetch incidents for context
    const incidents = await base44.entities.Incident.list('-updated_date', 50);

    // Group annotations by significance
    const critical = annotations.filter(a => a.significance === 'critical').sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const supporting = annotations.filter(a => a.significance === 'supporting').sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const contextual = annotations.filter(a => a.significance === 'contextual').sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Build structured statement
    const statement = {
      title: 'Statement of Evidence',
      generated_date: new Date().toISOString().split('T')[0],
      generated_by: user.email,
      evidence_count: evidence.length,
      annotation_count: annotations.length,
      
      executive_summary: {
        total_critical: critical.length,
        total_supporting: supporting.length,
        total_contextual: contextual.length,
        rics_rules_implicated: [...new Set(annotations.flatMap(a => a.linked_rics_rules || []))].length
      },

      evidence_list: evidence.map(e => ({
        id: e.id,
        title: e.title,
        type: e.evidence_type,
        date: e.date_collected,
        strength: e.strength,
        annotation_count: annotations.filter(a => a.evidence_id === e.id).length
      })),

      critical_findings: critical.map(ann => {
        const sourceEvidence = evidence.find(e => e.id === ann.evidence_id);
        const linkedRules = (ann.linked_rics_rules || [])
          .map(ruleId => ricsRules.find(r => r.id === ruleId))
          .filter(Boolean);

        return {
          excerpt: ann.highlight_text,
          source_document: sourceEvidence?.title || 'Unknown',
          interpretation: ann.annotation_note,
          linked_rics_violations: linkedRules.map(r => ({
            rule_number: r.rule_number,
            rule_title: r.title,
            category: r.category,
            severity: r.severity_if_breached
          })),
          created_by: ann.created_by,
          created_date: ann.created_date
        };
      }),

      supporting_evidence: supporting.map(ann => {
        const sourceEvidence = evidence.find(e => e.id === ann.evidence_id);
        return {
          excerpt: ann.highlight_text,
          source_document: sourceEvidence?.title || 'Unknown',
          note: ann.annotation_note,
          created_date: ann.created_date
        };
      }),

      contextual_information: contextual.map(ann => {
        const sourceEvidence = evidence.find(e => e.id === ann.evidence_id);
        return {
          excerpt: ann.highlight_text,
          source_document: sourceEvidence?.title || 'Unknown',
          created_date: ann.created_date
        };
      }),

      rics_violations_summary: [...new Set(annotations.flatMap(a => a.linked_rics_rules || []))]
        .map(ruleId => ricsRules.find(r => r.id === ruleId))
        .filter(Boolean)
        .map(rule => ({
          rule_number: rule.rule_number,
          title: rule.title,
          category: rule.category,
          severity: rule.severity_if_breached,
          supporting_annotations: annotations.filter(a => 
            a.linked_rics_rules?.includes(rule.id)
          ).length
        })),

      methodology: {
        annotation_process: 'Documents reviewed and annotated by authorized users',
        rule_linkage: 'Annotations linked to RICS Code of Conduct provisions',
        significance_classification: 'Each annotation categorized by evidential weight',
        review_date: new Date().toISOString().split('T')[0]
      }
    };

    return Response.json({ success: true, statement });
  } catch (error) {
    console.error('Statement generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});