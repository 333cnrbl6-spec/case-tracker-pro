import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { day_of_week, time } = await req.json();

    if (day_of_week === undefined || !time) {
      return Response.json({ error: 'Missing day_of_week or time' }, { status: 400 });
    }

    // Create the automation using base44 service role
    const automation = await base44.asServiceRole.functions.invoke('createAutomation', {
      automation_type: 'scheduled',
      name: 'Weekly Fee Earner Reports',
      function_name: 'generateWeeklyFeeEarnerReports',
      schedule_type: 'simple',
      repeat_unit: 'weeks',
      repeat_interval: 1,
      repeat_on_days: [day_of_week],
      start_time: time,
      is_active: true,
    });

    return Response.json({
      automation_id: automation.id,
      success: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});