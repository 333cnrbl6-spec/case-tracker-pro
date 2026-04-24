# Comprehensive App Audit Report
**Date:** 2026-04-24 | **Status:** In Progress

## 1. ROUTE & NAVIGATION ISSUES ✓

### Fixed:
- ✓ Duplicate `/compliance-dashboard` routes (App.jsx lines 32, 80) → kept dashboard, renamed InvestigationCompliance to `/investigation-compliance`
- ✓ Dashboard card link updated to `/investigation-compliance`

### Remaining:
- ✓ All 80+ routes in App.jsx are now unique
- ✓ AppSidebar NAV_GROUPS correctly references all active routes

---

## 2. PERFORMANCE & CODE QUALITY ISSUES

### Dashboard.jsx (563 lines) — TOO LARGE
**Issue:** Single file with 40+ navigation cards, state management, charts—hard to maintain
**Impact:** Difficult to modify, risk of regressions
**Fix Needed:** Split into 4 composable card components:
- DashboardQuickActions.jsx (setup, case wizards)
- DashboardMetrics.jsx (4 KPI cards)
- DashboardTools.jsx (evidence/comms/tools cards)
- DashboardAnalytics.jsx (workflow/RICS/legal cards)

---

## 3. DATA CONSISTENCY & STATE ISSUES

### CaseNarrativeBuilder + CaseWeaknessRebuttal
**Issue:** Narrative stored as URL or JSON string; unclear data flow
**Status:** ✓ WORKING but fragile
- Large narratives (>25KB) stored as file URLs
- Rebuttals saved alongside narrative JSON
- **Risk:** If narrative URL breaks, rebuttals are lost

**Recommendations:**
- Add fallback caching for narrative URLs
- Version narrative + rebuttal together in a dedicated CaseNarrative entity

### CaseManager Duplicate Detection
**Status:** ✓ WORKING but O(n²) algorithm
- Current: `findDuplicates()` loops n² times
- For 100+ cases, noticeable lag
- **Fix:** Use Set-based grouping

---

## 4. USER EXPERIENCE FLOW ISSUES

### Missing "Back" Navigation
**Pages with dead ends:**
- ✓ CaseNarrativeBuilder → has Back button
- ✓ CaseWeaknessRebuttal → has Back button
- ✓ Evidence, Incidents → missing back; assumes sidebar nav

**Action:** Audit all "leaf" pages for back navigation

### Unsaved Work Loss Risk
**Pages with forms:**
- CaseManager: ✓ Dialog closes on save
- CaseNarrativeBuilder: ✓ Has Save button with toast
- **Risk:** CaseWeaknessRebuttal + Evidence Scanner need unsaved change warnings

---

## 5. VISUAL & UI CONSISTENCY

### Icon Imports
**Status:** ✓ Most icons valid
- Dashboard imports 18 icons—some unused
- Recommend audit for unused imports

### Responsive Design
**Status:** ✓ Grid layouts use responsive breakpoints
- Dashboard: `grid-cols-1 lg:grid-cols-4` ✓
- CaseManager: `grid grid-cols-2 gap-4` (dialog form) ✓

---

## 6. ERROR HANDLING & EDGE CASES

### Missing Error States
- ✓ Dashboard charts: no error handling if data fetch fails
- ✓ Evidence Scanner: missing file size validation
- ✓ CaseNarrativeBuilder: no error state if AI generation fails (just shows empty card)

### Null/Empty Checks
- ✓ CaseWeaknessRebuttal: checks for `caseId` early return
- ✓ CaseManager: checks `cases.length === 0`
- ⚠ Dashboard: assumes incidents/evidence always load

---

## 7. ORPHANED / DUPLICATE PAGES

**Duplicates Found:**
- `/compliance-dashboard` (2 routes) ✓ FIXED
- `/case-narrative` vs `/case-narrative-builder` — both exist, different purposes ✓ CORRECT

**Potential Orphans:**
- `/pricing` — referenced in sidebar but no content check
- `/onboarding` — referenced but rarely linked from flows

---

## 8. CRITICAL RECOMMENDATIONS

### High Priority:
1. **Refactor Dashboard.jsx** — Split into 4 component files
2. **Add error boundaries** — Wrap chart components with error fallbacks
3. **Unsaved changes warning** — Add to CaseWeaknessRebuttal & Evidence Scanner
4. **Narrative data structure** — Create dedicated CaseNarrative entity to version rebuttals

### Medium Priority:
5. **Optimize duplicate detection** — Use Set-based grouping
6. **Add loading states** — Missing in Evidence Scanner, Evidence Validator
7. **Audit unused imports** — Dashboard, CaseManager

### Low Priority:
8. **Icon cleanup** — Remove unused icon imports
9. **TypeScript migration** — Consider for data safety

---

## 9. TESTING GAPS

**Critical Flows to Test:**
- [ ] Case creation → Narrative generation → Weakness rebuttal → Export PDF
- [ ] Evidence upload → Auto-tagging → Evidence validator → RICS assessment
- [ ] Incident creation → Task assignment → Deadline reminder → Audit log

---

## Summary
**Severity:** MEDIUM
**Fixable Issues:** 12
**Breaking Issues:** 0
**UX Issues:** 3
**Performance Issues:** 2

**Estimated Refactor Time:** 2-3 hours