import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automation_id } = await req.json();

    if (!automation_id) {
      return Response.json({ error: 'Missing automation_id' }, { status: 400 });
    }

    // Disable the automation
    await base44.asServiceRole.functions.invoke('toggleAutomation', {
      automation_id: automation_id,
      is_active: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});