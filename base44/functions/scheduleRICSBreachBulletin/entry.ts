import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Setting up monthly RICS breach bulletin automation...');

    // This automation will trigger sendRICSBreachBulletin() on the 1st of each month at 09:00 UTC
    const automationCreated = await base44.functions.invoke('createAutomation', {
      automation_type: 'scheduled',
      name: 'Monthly RICS Breach Bulletin',
      description: 'Generates and sends monthly RICS breach trends bulletin to all subscribers',
      function_name: 'sendRICSBreachBulletin',
      schedule_type: 'simple',
      repeat_unit: 'months',
      repeat_interval: 1,
      repeat_on_day_of_month: 1,
      start_time: '09:00',
      is_active: true
    });

    console.log('Automation created:', automationCreated);

    return Response.json({
      success: true,
      message: 'RICS breach bulletin automation scheduled for 1st of each month at 09:00 UTC',
      automation: automationCreated
    });
  } catch (error) {
    console.error('Breach bulletin scheduling error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});