import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHash, randomBytes } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, secret, code } = await req.json();

    if (action === 'generate') {
      // Generate base32 secret for TOTP
      const buffer = randomBytes(20);
      const secret = Buffer.from(buffer).toString('base64').substring(0, 32);

      // Generate QR code data
      const label = encodeURIComponent(`${user.email} (CaseNarrative)`);
      const qrUrl = `otpauth://totp/${label}?secret=${secret}&issuer=CaseNarrative`;

      return Response.json({
        secret,
        qrUrl,
        message: 'Scan this QR code with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)'
      });
    }

    if (action === 'verify') {
      if (!secret || !code) {
        return Response.json({ error: 'Secret and code required' }, { status: 400 });
      }

      // Verify TOTP code (6 digits)
      if (!/^\d{6}$/.test(code)) {
        return Response.json({ error: 'Invalid code format' }, { status: 400 });
      }

      // Simple TOTP verification
      const timeCounter = Math.floor(Date.now() / 1000 / 30);
      const hmac = createHash('hmac')
        .update(Buffer.from([0, 0, 0, 0, (timeCounter >> 24) & 0xff, (timeCounter >> 16) & 0xff, (timeCounter >> 8) & 0xff, timeCounter & 0xff]))
        .digest();

      const offset = hmac[hmac.length - 1] & 0x0f;
      const otp = (((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)) % 1000000;

      if (String(otp).padStart(6, '0') !== code) {
        return Response.json({ error: 'Invalid code' }, { status: 400 });
      }

      // Enable 2FA
      await base44.auth.updateMe({
        two_fa_enabled: true,
        two_fa_secret: secret,
        two_fa_backup_codes: Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 8).toUpperCase()
        )
      });

      return Response.json({
        success: true,
        message: '2FA enabled successfully',
        backup_codes: user.two_fa_backup_codes
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});