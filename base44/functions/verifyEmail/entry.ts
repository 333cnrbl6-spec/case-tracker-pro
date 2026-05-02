import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    // Check token validity
    if (user.email_verification_token !== token) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    const expiresAt = new Date(user.email_verification_expires);
    if (new Date() > expiresAt) {
      return Response.json({ error: 'Token expired' }, { status: 400 });
    }

    // Mark as verified
    await base44.auth.updateMe({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    return Response.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});