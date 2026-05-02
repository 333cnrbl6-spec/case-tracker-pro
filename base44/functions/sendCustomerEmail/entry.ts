import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient_email, email_type, subject, body, metadata } = await req.json();

    if (!recipient_email || !email_type || !subject || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send via Core integration
    const emailResult = await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: subject,
      body: body
    });

    // Log email for compliance & tracking
    const logEntry = await base44.entities.EmailLog.create({
      recipient_email: recipient_email,
      firm_email: user.email,
      email_type: email_type,
      subject: subject,
      status: 'sent',
      sent_date: new Date().toISOString()
    });

    console.log(`[sendCustomerEmail] Sent ${email_type} to ${recipient_email}`);

    return Response.json({
      success: true,
      email_logged_id: logEntry.id,
      recipient: recipient_email
    });
  } catch (error) {
    console.error('[sendCustomerEmail]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});