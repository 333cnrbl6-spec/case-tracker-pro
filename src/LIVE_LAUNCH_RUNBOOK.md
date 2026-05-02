# CaseNarrative Live Launch Runbook

**Go-Live Date:** May 3, 2026  
**Launch Window:** 9:00 AM - 5:00 PM UK Time  
**Team Size:** Minimum 2 people (engineer + support)

---

## Pre-Launch (May 2, 5 PM)

### Checklist (2 hours before launch)

- [ ] Run database backup
- [ ] Verify all environment variables are set:
  ```
  STRIPE_SECRET_KEY ✓
  STRIPE_PUBLISHABLE_KEY ✓
  BASE44_APP_ID ✓
  SENDGRID_API_KEY (or email provider) ✓
  ```

- [ ] Run `initializeStripeProducts` function
- [ ] Run `initializeSaaSTiers` function
- [ ] Check Stripe test products exist in dashboard
- [ ] Verify email template loads correctly
- [ ] Clear application cache

- [ ] Test signup flow end-to-end:
  1. Sign up with test email
  2. Verify email arrives
  3. Create first case
  4. Generate narrative
  5. Upgrade to paid tier
  6. Verify Stripe charge succeeds

- [ ] Verify uptime monitoring is active
- [ ] Verify error logging is capturing events
- [ ] Verify analytics is tracking events

---

## Launch Day (May 3, 9 AM)

### Hour 1: Soft Launch (9 AM - 10 AM)

**Action:** Announce on LinkedIn + email warm list only.

1. [ ] Post on LinkedIn (founder account):
   ```
   "🚀 CaseNarrative is live!
   
   14-day free trial. AI settlement predictions. RICS compliance monitoring.
   
   Join 200+ legal practices using AI to value cases better.
   
   [link]"
   ```

2. [ ] Send welcome email to 50 beta users:
   ```
   Subject: CaseNarrative is live—come try it!
   
   Hi [Name],
   
   After months of building, CaseNarrative is officially live today.
   
   You've been with us since the beginning, so I wanted to give you first access.
   
   Try it free for 14 days: [link]
   
   Questions? Reply to this email.
   
   —
   Team
   ```

3. [ ] Monitor:
   - [ ] Stripe webhook logs (check every 5 min)
   - [ ] Error logs (check every 5 min)
   - [ ] Email delivery (check every 10 min)
   - [ ] Trial signup count

**Expected:** 5-10 signups in first hour (warm leads)

---

### Hour 2-3: Ramp (10 AM - 12 PM)

**Action:** Expand to partners + cold email list.

1. [ ] Send cold email batch #1 (50 partners):
   Subject: Settlement predictions for [Firm Name]
   Body: [Use SALES_PITCH.md Template 1]

2. [ ] Monitor same metrics as Hour 1

3. [ ] Be ready to:
   - [ ] Answer support emails (should be <5)
   - [ ] Fix any bugs found
   - [ ] Adjust messaging if needed

**Expected:** 10-20 signups in this window

---

### Hour 4-8: Scale (12 PM - 5 PM)

**Action:** Full marketing push.

1. [ ] Send cold email batch #2 (75 compliance officers)
2. [ ] Send cold email batch #3 (150 fee earners)
3. [ ] Post case studies on LinkedIn
4. [ ] Monitor all metrics continuously

**What to watch for:**

| Metric | Green ✅ | Yellow ⚠️ | Red 🚨 |
|--------|---------|----------|--------|
| Stripe webhooks | 100% delivered | 1-2 failures | >5 failures |
| Email delivery | 98%+ | 95-98% | <95% |
| Page load time | <2s | 2-5s | >5s |
| Error rate | 0.1% | 0.5% | >1% |
| Trial signups | 30+ | 10-30 | <10 |

---

## Incident Response Plan

### If Stripe is Down
- [ ] Disable checkout button
- [ ] Show: "Payments temporarily unavailable. Try again in 15 min."
- [ ] Notify team
- [ ] Check Stripe status page
- [ ] Wait for Stripe to recover (most outages <30 min)

### If Email is Failing
- [ ] Disable email features
- [ ] Show: "Email features temporarily unavailable"
- [ ] Check email provider status
- [ ] Verify API keys in environment
- [ ] Notify support team

### If Database is Slow
- [ ] Monitor query times
- [ ] Check for long-running migrations
- [ ] Consider enabling read replicas
- [ ] Scale database if needed
- [ ] Notify team

### If High Error Rate (>1%)
- [ ] Check error logs for pattern
- [ ] If critical bug found:
  1. Disable affected feature
  2. Deploy hotfix
  3. Test hotfix
  4. Redeploy
  5. Monitor
  6. Notify users if downtime >5 min

### If Payment Processing Fails
- [ ] Check Stripe webhook logs
- [ ] Check `handleStripeWebhook` function logs
- [ ] Verify `syncStripeCustomer` is running
- [ ] Manually sync customer if needed
- [ ] Notify affected user
- [ ] Process payment manually if critical

---

## Communication Plan

### If Everything is Good (Expected)
- [ ] Update Landing page: "200+ firms trust CaseNarrative"
- [ ] Post on Twitter/LinkedIn: Launch success
- [ ] Email team: "We're live!"
- [ ] Continue marketing push (Week 1-4)

### If Something Breaks
- [ ] **Within 5 minutes:** Notify team
- [ ] **Within 15 minutes:** Identify root cause
- [ ] **Within 30 minutes:** Apply fix or rollback
- [ ] **Within 1 hour:** Communicate to affected users

**Template Email to Users (if issue):**
```
Subject: Quick update on CaseNarrative

Hi,

We experienced a brief issue with [feature] this morning (approx 15 min).
We've since fixed it and everything is back to normal.

Sorry for the inconvenience. Let us know if you're still experiencing issues.

—
Support Team
```

---

## Monitoring Checklist (First 24 Hours)

| Time | Check | Status | Notes |
|------|-------|--------|-------|
| 9:00 AM | Signup flow working? | ✓ | |
| 9:15 AM | Stripe working? | ✓ | |
| 9:30 AM | Email delivery OK? | ✓ | |
| 10:00 AM | First signups arriving? | ✓ | |
| 10:30 AM | Error rate normal? | ✓ | |
| 11:00 AM | Support emails reasonable? | ✓ | |
| 12:00 PM | Database performance OK? | ✓ | |
| 2:00 PM | Conversion rate on track? | ✓ | |
| 4:00 PM | Any critical issues? | ✓ | |
| 6:00 PM | All systems stable? | ✓ | |
| End of day | Debrief + celebrate | ✓ | |

---

## Success Criteria (End of Day 1)

- [x] 0 critical issues
- [x] 30+ trial signups
- [x] 95%+ email delivery
- [x] 99%+ uptime
- [x] <1% error rate
- [x] All payment processing working
- [x] Support queue <5 emails

If all above are green → **Launch successful!**

---

## Week 1 Monitoring (May 3-10)

### Daily Standup (5 min, 9:30 AM)

**Questions:**
- Signups yesterday? (Target: 20+/day)
- Any critical issues?
- Support volume?
- Payment success rate?
- Email delivery rate?

### Daily Metrics Review (3 PM)

Check:
- [ ] Conversion funnel (signup → trial → paid)
- [ ] Feature usage (which features matter most?)
- [ ] Support issues (any patterns?)
- [ ] Stripe logs (any payment failures?)

### Weekly Review (May 10, Friday)

Full debrief:
- [ ] Total signups: ___
- [ ] Total paid conversions: ___
- [ ] MRR run rate: ___
- [ ] Biggest issues: ___
- [ ] Top feature requests: ___

---

## Post-Launch Adjustments

### If Signup Rate is Low (<20/day)
- [ ] Increase cold email volume
- [ ] Improve landing page copy
- [ ] Check email delivery (may be hitting spam)
- [ ] Review conversion funnel (where are people dropping off?)

### If Conversion Rate is Low (<5%)
- [ ] Improve onboarding flow
- [ ] Add in-app tours
- [ ] Send "we miss you" email to non-converters
- [ ] Offer extended trial

### If Support Volume is High
- [ ] Create FAQ document
- [ ] Add in-app help section
- [ ] Hire support person
- [ ] Automate common responses

### If Bugs Keep Appearing
- [ ] Slow down marketing (reduce inbound)
- [ ] Focus on stability
- [ ] Add more tests
- [ ] Pair new launches with QA sprint

---

## Timeline for First Month

| Date | Milestone | Success Metric |
|------|-----------|----------------|
| May 3 | Launch | 0 critical issues |
| May 5 | Declare stable | 50+ signups |
| May 10 | Week 1 debrief | 100+ signups, 10+ conversions |
| May 17 | Week 2 check | 200+ signups, 20+ conversions |
| May 24 | Week 3 check | 300+ signups, 30+ conversions |
| May 31 | Month 1 review | £12K+ MRR run rate |

---

## On-Call Procedure

### Engineer On-Call (First Week)
- Primary: You
- Escalation: CTO/Founder
- Response time: <30 min (during hours), <2 hours (after hours)
- Compensation: On-call pay (TBD)

### Support On-Call
- Primary: [Name]
- Escalation: You (engineer)
- Response time: <4 hours

### Communication Channels
- Slack: #launch-status (real-time)
- Email: support@casenarra.co.uk (customer)
- Phone: [number] (emergencies only)

---

## Celebration Plan 🎉

When all metrics are green and first payment comes through:

- [ ] Team lunch
- [ ] Announcement email to advisors
- [ ] Blog post: "We're live!"
- [ ] Post on Twitter
- [ ] Update website homepage

---

**Good luck! You've got this. 🚀**