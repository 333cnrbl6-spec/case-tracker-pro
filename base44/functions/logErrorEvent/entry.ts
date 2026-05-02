import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { error_type, message, stack_trace, user_email, page, severity = 'error' } = await req.json();

    // Log to console for now (integrate with Sentry/DataDog in production)
    console.error(`[${severity.toUpperCase()}] ${error_type}: ${message}`, {
      user_email,
      page,
      stack_trace,
      timestamp: new Date().toISOString()
    });

    // Store error log in database (optional - create SystemAlert entity)
    // This provides audit trail and allows review of issues
    if (base44.entities.SystemAlert) {
      await base44.asServiceRole.entities.SystemAlert.create({
        error_type,
        message,
        severity,
        user_email,
        page,
        status: 'new'
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error logging failed:', error);
    return Response.json({ success: false }, { status: 500 });
  }
});