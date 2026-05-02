import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate verification token (8 random chars)
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Store in user metadata temporarily (expires in 24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await base44.auth.updateMe({
      email_verification_token: token,
      email_verification_expires: expiresAt.toISOString(),
      email_verified: false
    });

    // Send verification email
    const verifyUrl = `${Deno.env.get('APP_URL') || 'https://app.example.com'}/verify-email?token=${token}`;
    
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Verify Your Email - CaseNarrative',
      body: `Hi ${user.full_name},\n\nWelcome to CaseNarrative! Please verify your email to activate your trial.\n\nVerification Code: ${token}\n\nOr click here to verify: ${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, please ignore this email.`,
      from_name: 'CaseNarrative Support'
    });

    return Response.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});