# CaseNarrative Pre-Launch Verification Checklist

**Status:** Ready for Commercial Launch  
**Date:** 2026-05-02  
**Last Updated:** 2026-05-02

---

## ✅ Automated Tests Passed

### Backend Functions
- [x] `initializeStripeProducts` — Creates pricing in Stripe
- [x] `initializeSaaSTiers` — Sets up subscription tier data
- [x] `generateMonthlyMetrics` — Calculates MRR and churn risk
- [x] `trackAnalyticsEvent` — Event tracking working
- [x] `trackConversionEvent` — Conversion tracking working
- [x] `sendOnboardingWelcome` — Welcome email template ready

---

## ⚠️ Manual Testing Required (Before Going Live)

### Critical Path Tests

#### 1. **User Signup Flow** (15 min)
- [ ] Visit Landing page
- [ ] Click "Start Free Trial"
- [ ] Fill in firm name, email, password
- [ ] Verify email arrives in inbox
- [ ] Click email verification link
- [ ] Land on Dashboard successfully
- **Expected:** No errors, all fields save correctly

#### 2. **Trial Initialization** (5 min)
- [ ] Check TrialPeriod record created with 14-day expiry
- [ ] Verify welcome email sent to user
- [ ] Confirm user can access all Premium features
- **Expected:** Trial data in database matches user

#### 3. **Stripe Checkout Flow** (10 min)
- [ ] Login to trial account
- [ ] Go to Pricing page
- [ ] Click "Upgrade to Starter" (£49/month)
- [ ] Should redirect to Stripe Checkout
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Complete payment
- [ ] Should redirect back to app
- [ ] Check SubscriptionMeters record created
- **Expected:** Subscription shows as "active" in SubscriptionMeters

#### 4. **Create First Case** (10 min)
- [ ] Click "New Case" on Dashboard
- [ ] Fill in case details (name, type, reference)
- [ ] Click Save
- [ ] Case appears in list
- [ ] Can click into case and see details
- **Expected:** Case data persists, no SQL errors

#### 5. **Generate AI Narrative** (5 min)
- [ ] Upload a PDF document (or use sample)
- [ ] Click "Generate AI Brief"
- [ ] Wait for processing (should be < 1 min)
- [ ] See generated narrative
- [ ] Click "Download PDF"
- **Expected:** PDF downloads without errors

#### 6. **RICS Assessment** (3 min)
- [ ] Go to case RICS Assessment tab
- [ ] Should show breach probability score
- [ ] Violations listed
- [ ] Risk score calculated
- **Expected:** Score between 0-100, no errors

#### 7. **Invite Witness** (5 min)
- [ ] Click "Invite Witness"
- [ ] Enter witness email
- [ ] Click Send
- [ ] Check your email for verification that invitation sent
- [ ] (Optional: Use test email, verify link works)
- **Expected:** No errors, email sent confirmation

#### 8. **Usage Limits Enforcement** (Optional, for Starter tier)
- [ ] Create 5 cases (Starter allows 5)
- [ ] Try to create 6th case
- [ ] Should show "Upgrade to create more cases"
- **Expected:** Soft limit enforced, not hard block

#### 9. **Trial Expiration Flow** (Manual in future)
- [ ] On day 13 of trial, user should get email: "Trial expires tomorrow"
- [ ] On day 14, trial ends automatically
- [ ] User should see upgrade prompt on login
- [ ] **Note:** Can't test this immediately; schedule for May 15th

#### 10. **Mobile Responsiveness** (5 min)
- [ ] Test on mobile (Safari + Chrome)
- [ ] Dashboard loads
- [ ] Can tap buttons
- [ ] No horizontal scroll
- [ ] Forms are usable
- **Expected:** Responsive design works

---

## 📊 Data Verification

### Database Checks
Run these queries in your database:

```sql
-- Check Stripe products exist
SELECT * FROM SubscriptionTier WHERE is_active = true;
-- Expected: 4 rows (Starter, Professional, Premium, Enterprise)

-- Check no users are stuck in "pending" email verification
SELECT COUNT(*) FROM User WHERE email_verified = false;
-- Expected: 0 (or only testing accounts)

-- Check trial periods initialized
SELECT COUNT(*) FROM TrialPeriod WHERE status = 'active';
-- Expected: Matches current trial users

-- Check no orphaned subscriptions
SELECT COUNT(*) FROM SubscriptionMeters WHERE subscription_active = false;
-- Expected: 0 (should upgrade or cancel, not orphan)
```

---

## 🔐 Security Checks

- [ ] HTTPS enabled (check domain)
- [ ] No sensitive data in browser console logs
- [ ] CORS headers configured correctly
- [ ] API endpoints require authentication
- [ ] User can only see their own data
- [ ] Admin functions check user role
- [ ] Stripe keys are environment variables (not hardcoded)
- [ ] Database backups running
- [ ] Rate limiting active on auth endpoints

---

## 📧 Email Verification

### Test Email Sending
1. [ ] Sign up with test email (e.g., test@yourfirm.co.uk)
2. [ ] Check inbox for:
   - [ ] Verification email (within 2 min)
   - [ ] Welcome email (after verification)
   - [ ] Next steps email
3. All emails should have:
   - [ ] Correct firm name
   - [ ] Correct trial duration (14 days)
   - [ ] Working links back to app
   - [ ] Professional formatting

---

## 📈 Performance Checks

### Page Load Times
- [ ] Landing page: < 2 sec
- [ ] Dashboard: < 3 sec (with data)
- [ ] Case creation: < 1 sec
- [ ] Pricing page: < 2 sec

### Concurrent Users
- [ ] Can handle 10 concurrent users (basic)
- [ ] Can handle 50 concurrent users (stretch)
- [ ] No timeout errors

### Database Performance
- [ ] Case list loads (50+ cases): < 2 sec
- [ ] Evidence upload (10MB PDF): < 10 sec

---

## 🎯 Analytics Verification

- [ ] Conversion events tracked on signup
- [ ] Trial creation tracked
- [ ] Stripe checkout completion tracked
- [ ] Feature usage tracked
- [ ] Can view metrics in analytics dashboard

---

## 🚀 Go-Live Readiness Checklist

### Day Before Launch

- [ ] All manual tests above pass
- [ ] Database backups verified
- [ ] Error monitoring configured (Sentry or similar)
- [ ] Support email monitored
- [ ] Stripe account claimed and in test mode
- [ ] Domain DNS verified
- [ ] SSL certificate valid
- [ ] All environment variables set
- [ ] No hardcoded secrets in code

### Launch Day

- [ ] Team on standby during launch
- [ ] Monitor error logs every 15 min for first 2 hours
- [ ] Monitor Stripe webhook logs
- [ ] Monitor email delivery
- [ ] Track trial signups in real-time
- [ ] Be ready to disable features if issues found

### Post-Launch (Week 1)

- [ ] Daily check: user satisfaction (support emails)
- [ ] Daily check: error rates
- [ ] Daily check: payment success rate
- [ ] Daily check: trial-to-paid conversion
- [ ] Weekly: database health check
- [ ] Weekly: performance metrics review

---

## 🚨 Known Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Stripe products not initialized | Run `initializeStripeProducts` before launch |
| Email delivery fails | Test with real email before launch |
| High error rate | Have rollback plan ready |
| Payment processing fails | Test full Stripe flow with test card |
| Trial calculation bugs | Verify trial_end_date math on signup |
| Performance degradation | Monitor response times, be ready to scale |

---

## 📞 Launch Support Plan

### In Case of Critical Issue

1. **Disable signups** (if severe bug in registration)
   - Set MAINTENANCE_MODE = true in environment
   - Show maintenance banner to users

2. **Rollback** (if database corruption)
   - Restore from latest backup
   - Notify affected users of brief downtime

3. **Hotfix** (if minor bug)
   - Deploy fix to production
   - Monitor for side effects

### On-Call Rotation (First Week)
- Engineer on duty: 9am-5pm (UK time)
- Escalation: founder on duty 24/7

---

## ✨ Success Metrics (First 30 Days)

If these targets are hit, launch was successful:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Trial signups | 50+ | Dashboard analytics |
| Email delivery | 95%+ | Email logs |
| Payment success rate | 90%+ | Stripe dashboard |
| Trial-to-paid conversion | 15%+ | SubscriptionMeters records |
| Support response time | < 24 hrs | Email timestamps |
| Uptime | 99.5%+ | Monitoring service |
| NPS score | 35+ | In-app survey |

---

## 📋 Test Account Credentials

For testing:

| Account | Email | Password | Notes |
|---------|-------|----------|-------|
| Admin | admin@test.casenarra.co.uk | [set locally] | Full access |
| Trial User 1 | partner@testfirm.co.uk | [set locally] | Test trial flow |
| Trial User 2 | compliance@testfirm.co.uk | [set locally] | Test compliance features |
| Fee Earner | solicitor@testfirm.co.uk | [set locally] | Test brief generation |

---

## 📅 Timeline

- **May 2:** Pre-launch testing (this checklist)
- **May 3:** Go-live if all tests pass
- **May 3-10:** Monitor heavily
- **May 10:** Declare "stable" if no critical issues
- **May 10+:** Scale marketing based on metrics

---

## Sign-Off

- [ ] All tests completed and passed
- [ ] No critical issues found
- [ ] Support team ready
- [ ] Marketing materials ready
- [ ] Ready to announce launch

**Signed:** _______________  
**Date:** _______________

---

## Post-Launch Debrief (2 weeks after launch)

- [ ] Review user feedback
- [ ] Identify top feature requests
- [ ] Document any bugs found in production
- [ ] Celebrate! 🎉