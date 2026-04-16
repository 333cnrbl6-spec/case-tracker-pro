import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to private storage (no size limit)
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });

    // Create a long-lived signed URL (7 days)
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ 
      file_uri,
      expires_in: 604800
    });

    return Response.json({ 
      file_url: signed_url,
      file_uri: file_uri,
      file_name: file.name,
      file_size: file.size
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});