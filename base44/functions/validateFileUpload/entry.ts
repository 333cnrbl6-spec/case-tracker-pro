import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileSize, fileUrl } = await req.json();

    // Check for duplicate by file URL in existing evidence
    const allEvidence = await base44.entities.Evidence.list();
    const isDuplicate = allEvidence.some(e => e.file_url === fileUrl);

    if (isDuplicate) {
      return Response.json({
        valid: false,
        error: 'This document has already been uploaded',
        isDuplicate: true
      });
    }

    return Response.json({
      valid: true,
      fileName,
      fileSize,
      fileUrl,
      isDuplicate: false
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});