# CaseNarrative Launch Checklist ✅

## Pre-Launch (Today)

### ✅ Completed
- [x] Landing page (`/landing`) with hero, features, pricing teaser
- [x] Footer with legal links (Terms, Privacy, GDPR) + support email
- [x] Email verification required before trial activation
- [x] Help & Docs page (`/help`) with 8 FAQs
- [x] 2FA setup (TOTP authenticator app support)
- [x] Error logging (`logErrorEvent` function)
- [x] Analytics tracking (page views, signups, upgrades)
- [x] Free 14-day trial system with auto-reminders
- [x] Customer billing & usage portals
- [x] Multi-tier pricing (Free, Starter, Professional, Premium, Enterprise)

### ⏳ Manual Dashboard Setup (Required)
1. **Stripe Setup** (5 mins)
   - Go to Dashboard > Integrations > Stripe
   - Click "Claim Account" to own the sandbox
   - Create products for each tier:
     - Starter (£99/month)
     - Professional (£199/month)
     - Premium (£349/month)
     - Enterprise (custom)

2. **Legal Documents** (10 mins)
   - Go to `/saas-admin` page
   - Generate Terms of Service, Privacy Policy, GDPR DPA
   - Download PDFs and upload to your legal/website folder
   - Update footer links to point to actual URLs

3. **Status Page** (optional, 15 mins)
   - Sign up at StatusPage.io or UptimeRobot
   - Set up monitoring for your app URL
   - Add status page link to footer

---

## Launch Day

### Pre-Launch Verification (1 hour)
- [ ] Test full signup flow:
  1. Go to `/landing` or `/pricing`
  2. Click "Start Free Trial"
  3. Complete onboarding
  4. Verify email
  5. Check trial activated + welcome email received
  
- [ ] Test upgrade flow:
  1. From `/customer-billing`, click "Upgrade to Starter"
  2. Use test card: 4242 4242 4242 4242
  3. Verify payment succeeds + invoice created

- [ ] Mobile responsiveness:
  1. Open `/landing`, `/pricing`, `/onboarding-trial` on phone
  2. Check forms are usable, buttons clickable
  
- [ ] Check all links:
  1. Footer links (Terms, Privacy, GDPR)
  2. Support email link
  3. Help page FAQs

### Go Live
- [ ] Publish app to production URL
- [ ] Update landing page domain references (if needed)
- [ ] Send launch announcement email to waitlist
- [ ] Monitor `/saas-admin` telemetry for first signups

---

## Post-Launch (Week 1)

### Monitoring
- [ ] Check error logs in `/saas-admin` daily
- [ ] Monitor Stripe webhook success rate
- [ ] Track signup → verified → trial conversion rates
- [ ] Check email delivery (look for bounces in EmailLog)

### Customer Support
- [ ] Respond to support@casenarra.co.uk within 2 hours
- [ ] Collect feedback from first trial users
- [ ] Fix any reported bugs immediately

### Iteration
- [ ] Update `/help` FAQs based on questions
- [ ] Optimize onboarding if drop-off is high
- [ ] A/B test pricing if conversion is low

---

## Going Live with Real Payments

When ready to accept real money:
1. Go to Dashboard > Integrations > Stripe
2. Click your Stripe integration
3. Replace test keys with your **live** Stripe keys
4. Toggle "Live Mode" to ON
5. Update pricing to your final amounts
6. Test with real card (small charge)

---

## Architecture Summary

**Frontend:**
- Landing page → Pricing → Onboarding → Email Verify → Trial Active
- Customer portals: Billing, Usage, Help
- Error tracking + analytics on all pages

**Backend:**
- Email verification (sendEmailVerification, verifyEmail)
- Trial management (handleTrialManagement)
- Billing (manageBillingInvoices, createStripeCheckout)
- 2FA (enable2FA)
- Error logging (logErrorEvent)
- Analytics (trackAnalyticsEvent)

**Automations:**
- Daily: Check trial expiration, send warnings
- On invoice create: Log to audit trail
- On email send: Log to audit trail

**Key Entities:**
- TrialPeriod, BillingInvoice, EmailLog, SubscriptionMeters
- All multi-tenant (firm_email as key)

---

## Support Contacts

- **Customer Support:** support@casenarra.co.uk
- **Documentation:** /help page
- **Status Updates:** [StatusPage link - add when set up]

---

## Success Metrics (First 30 Days)

- Goal: 100+ signups
- Target: 20% trial → paid conversion
- Target: <2% churn in first month
- Target: <1% email bounce rate

---

**Last Updated:** 2026-05-02  
**Status:** Ready for Launch ✅