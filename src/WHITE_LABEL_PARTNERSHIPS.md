# White-Label Partnership Program

## 🤝 Partner Integration Guide

### How It Works
1. Partner integrates CaseNarrative API into their platform
2. Their users get case valuation + AI narrative features
3. CaseNarrative gets 20% revenue share on partner transactions
4. Partner white-labels as their own (custom branding optional)

### API Endpoints (v1)

#### 1. Generate Case Valuation
```bash
POST /whitelabelAPI
{
  "api_key": "partner_key_...",
  "action": "generate_case_valuation",
  "case_id": "case_123"
}

Response:
{
  "case_id": "case_123",
  "valuation_estimate": 75000,
  "confidence": 85,
  "recommended_settlement_range": [52500, 82500]
}
```

#### 2. Generate AI Narrative
```bash
POST /whitelabelAPI
{
  "api_key": "partner_key_...",
  "action": "generate_narrative",
  "case_id": "case_123"
}

Response:
{
  "case_id": "case_123",
  "narrative_generated": true,
  "narrative": { ... full case brief ... }
}
```

#### 3. List Available Integrations
```bash
POST /whitelabelAPI
{
  "api_key": "partner_key_...",
  "action": "list_partnerships"
}

Response:
{
  "available_integrations": [
    "Practice Management (Clio, Rocket Matter)",
    "Document Automation (HotDocs, Contract Express)",
    "Case Valuation",
    "Evidence Analysis"
  ]
}
```

---

## 🎯 Target Partners (Priority Order)

### Tier 1: Practice Management (Highest Volume)
**1. Clio** (50,000+ firms)
- Platform: Cloud PMS, calendars, billing
- Use case: Add case valuation to client matters
- Integration point: Case module → "Get AI valuation"
- Expected users: 5,000+ in year 1
- Commission: 20% + £500/month minimum

**2. Rocket Matter** (20,000+ firms)
- Platform: Cloud PMS, document management
- Use case: Auto-generate case summaries for discovery
- Integration point: Matter dashboard → "Generate brief"
- Expected users: 2,000+ in year 1
- Commission: 20%

**3. LawGility** (15,000+ firms)
- Platform: Legal operations, task management
- Use case: Case risk scoring for prioritization
- Integration point: Matter list → "Risk score"
- Expected users: 1,500+ in year 1
- Commission: 20%

### Tier 2: Document Automation
**4. HotDocs** (100,000+ firms using templates)
- Platform: Document assembly, template library
- Use case: Embed case narrative into templates
- Integration point: Template → "Insert case brief"
- Expected users: 3,000+ in year 1
- Commission: 15% (lower due to lower transaction value)

**5. Contract Express** (50,000+ users)
- Platform: Document automation, e-signature
- Use case: Auto-generate demand letters from case data
- Integration point: New document → "CaseNarrative brief"
- Expected users: 1,000+ in year 1
- Commission: 15%

---

## 💰 Revenue Model

### Per-Transaction Pricing
- Case Valuation API call: £5 per call → CaseNarrative gets £1
- Narrative Generation: £10 per call → CaseNarrative gets £2
- Minimum commitment: £500/month (100 API calls/month)

### Example: Clio Partnership Year 1
- 5,000 Clio users discover feature
- 20% adoption rate = 1,000 active users
- Average: 10 API calls/month per user
- 1,000 users × 10 calls × £1.50 avg = £15,000/month
- Annual revenue: £180,000 from Clio alone

### Multi-Partner Revenue Projection
| Year | Partners | Users/Partner | Avg Calls/Month | Revenue |
|---|---|---|---|---|
| Y1 | 3 | 2,500 | 8 | £180k |
| Y2 | 8 | 5,000 | 12 | £720k |
| Y3 | 15 | 10,000 | 15 | £2.7M |

---

## 📋 Partner Onboarding Checklist

### Phase 1: Qualification (Week 1)
- [ ] Confirm partner interest + legal agreement
- [ ] Create Partner record in database
- [ ] Generate API key + assign limits (100 calls/day initially)
- [ ] Invite to Slack channel for technical support

### Phase 2: Integration (Week 2-4)
- [ ] Partner gets API documentation
- [ ] Partner gets sandbox API key
- [ ] Schedule technical kickoff call
- [ ] Provide UI mockups for their integration
- [ ] Answer technical questions (2-hour SLA)

### Phase 3: Testing (Week 4-6)
- [ ] Partner tests in sandbox
- [ ] CaseNarrative team validates test transactions
- [ ] Performance testing (load testing)
- [ ] Security review of integration

### Phase 4: Launch (Week 6-8)
- [ ] Migrate to production API key
- [ ] Joint launch announcement
- [ ] Co-marketing: blog post + webinar
- [ ] Increase API call limit to production levels
- [ ] Bi-weekly sync calls for Q&A

---

## 🚀 Co-Marketing Template

### Blog Post Example
**Title:** "Clio + CaseNarrative: Instant Case Valuations in Your Favorite PMS"

```markdown
Clio users can now get AI-powered settlement predictions directly from their matter dashboard.

No more switching between tools. No more manual case analysis. Just:
1. Open your Clio matter
2. Click "Get AI Valuation"
3. Receive settlement range + confidence score

Available now for all Clio + CaseNarrative users.
```

### Email to Partner Users
```
Subject: Introducing Case Valuation in [Partner Platform]

Hi [Name],

We've partnered with CaseNarrative to bring AI-powered case valuations directly into [Platform].

Generate settlement predictions + full case briefs without leaving the platform.

Try it free: [Link]
```

---

## 📞 Support & SLA

**Partner Support SLA:**
- Technical questions: 2-hour response
- API bugs: 4-hour fix or workaround
- Monthly business review: Health check on API usage

**Escalation Path:**
- Slack channel: Immediate
- Weekly Zoom if issues active
- Monthly metrics review

---

## 🎁 Partner Success Metrics

We track (and share monthly):
- API calls this month
- Error rate
- Average response time
- Top features used
- New users added
- Revenue generated (transparent billing)

---

## 🔒 Security & Data

- API keys are rotated quarterly
- All API calls logged (audit trail)
- Partner data segregated (multi-tenant)
- GDPR-compliant (partner responsible for user consent)
- Rate limiting: 100 calls/day baseline, negotiable

---

## Next Steps

1. Identify 5 target partners
2. Schedule intro calls (week of May 13)
3. Send partnership proposals
4. Sign legal agreements
5. Begin technical integration
6. Launch 2 partners by June 30

**Goal:** 3 live partnerships by end of Q2 2026, 10 by end of Q4 2026.