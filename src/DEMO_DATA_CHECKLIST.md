# Demo Data Polishing Checklist

## Current Demo Cases

### ✅ Bradley v Belcher (Professional Negligence)
**Status:** Live via `generateBradleyBelcherTestData()`

**Current data:**
- Incident: Surveyor missed critical damp issue
- RICS violations: Competence, Professional Conduct
- Settlement estimate: £65,000
- Evidence: 8 documents, 6 communications
- Witnesses: 3 (surveyor, structural engineer, client)

**Polish needed:**
- [ ] Add 2 more realistic communications (email chain showing missed reports)
- [ ] Add photo evidence (damp damage, missing mold inspection)
- [ ] Add expert valuation report PDF
- [ ] Update RICS Risk Score output (currently hardcoded)

---

### Template: Professional Negligence (Smith v Jones)
**Status:** To create

**Scenario:**
- Solo surveyor missed structural defects in commercial property
- Client (property developer) discovers issues 6 months post-survey
- Claim: £120,000 (rebuild costs + lost profits)

**Pre-populate with:**
- 5 incident records (initial contact, complaint, investigation phases)
- 4 communications (initial survey request, follow-up, complaint letters)
- 3 evidence documents (survey report, expert rebuttal, photos)
- 2 witness records (surveyor + independent expert)
- RICS violations: Competence, Client Care
- AI-generated narrative (via generateLegalNarrative function)

---

### Template: Surveyor RICS Breach (Johnson v ABC Surveyors)
**Status:** To create

**Scenario:**
- Multi-party case involving RICS rules violations
- Surveyors had conflict of interest (also advising buyer)
- Settlement: £95,000

**Pre-populate with:**
- 6 incidents (timeline of events)
- 5 communications (showing conflict of interest)
- 4 evidence documents
- 4 witnesses (2 surveyors, 2 clients)
- RICS violations: Conflicts of Interest, Gatekeeping
- Risk score: 87% breach probability

---

### Template: Competence Dispute (Wilson v Specialist Surveyors)
**Status:** To create

**Scenario:**
- Specialist surveys required for building defects
- Surveyor lacked proper qualifications
- Costly remediation needed

**Pre-populate with:**
- 5 incidents
- 4 communications
- 3 technical reports + CVs showing qualification gaps
- 3 witnesses
- RICS violations: Competence, Professional Conduct
- Estimated settlement: £180,000

---

## Checklist for Each Template

For each new template case, ensure:

- [ ] Case created via `base44.entities.LegalCase.create()`
- [ ] 5-7 incident records created
- [ ] 3-5 communication records with realistic email chains
- [ ] 3-5 evidence documents (uploaded as file_url)
- [ ] 2-4 witness records created
- [ ] Case party records for all involved parties
- [ ] RICS Risk Score calculated via `generateRICSBreachProbabilityEngine()`
- [ ] AI narrative generated via `generateLegalNarrative()`
- [ ] Settlement estimates populated in `CaseValuationInsight`
- [ ] Milestone reminders set (limitation dates, court deadlines)
- [ ] Document bundle compiled and ready for export

---

## Implementation Tasks

**Task 1:** Polish Bradley v Belcher
- Time: 30 mins
- Action: Add realistic comms + evidence docs + update risk score output

**Task 2:** Create Smith v Jones template
- Time: 1 hour
- Action: Use `createBradleyVBelcherCase()` as base, modify scenario

**Task 3:** Create Johnson v ABC Surveyors template
- Time: 1 hour
- Action: Focus on multi-party witness coordination

**Task 4:** Create Wilson v Specialist Surveyors template
- Time: 1 hour
- Action: Technical/qualification focus

**Total time:** ~3.5 hours to fully polish demo data

---

## Trial User Experience

When a trial user signs up + selects a template:

1. Template case is cloned into their account
2. All documents/communications/evidence copied
3. They see a fully populated case ready to explore
4. Can modify, extend, or generate new narratives
5. Demonstrates full feature set in <5 minutes

---

## Success Metrics

- [ ] First-time users spend 10+ mins in app (vs 3 mins on blank case)
- [ ] 40%+ users generate at least one AI narrative on day 1
- [ ] 20%+ users invite a witness during trial
- [ ] Demo data drives 30%+ conversion to paid (target)

---

## Script for Onboarding

"Pick your first case:
- **Blank Case** — Start from scratch
- **Professional Negligence (Example)** — Fully worked example showing all features
- **RICS Breach (Example)** — Shows multi-party collaboration
- **Competence Dispute (Example)** — Complex technical case

We recommend starting with an example to see CaseNarrative in action. Takes 2 mins to explore."