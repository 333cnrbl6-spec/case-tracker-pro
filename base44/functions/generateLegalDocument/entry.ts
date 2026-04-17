import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RICS_COMPLAINT = `
FORMAL COMPLAINT TO RICS REGULATORY BOARD

Re: CONFLICT OF INTEREST — Malcolm Belcher (RICS Member)
Date of Complaint: [DATE]
Your Complaint Reference: [RICS_REF]

1. COMPLAINANT DETAILS
Name: [CLIENT_NAME]
Address: [ADDRESS]
Email: [EMAIL]
Phone: [PHONE]

2. RESPONDENT DETAILS
Name: Malcolm Belcher
RICS Registration Number: [TO_BE_CONFIRMED]
Professional Address: [TO_BE_CONFIRMED]

3. SUBJECT MATTER OF COMPLAINT
This complaint concerns a serious breach of RICS Conflict of Interest rules by Mr. Belcher, whereby he simultaneously:
  (a) Charged a professional fee of £50,000 as a Quantity Surveyor (QS) for valuation services
  (b) Earned a £3,000 commission as a selling agent in the same transaction
  (c) Failed to disclose this dual role or obtain informed consent prior to engagement

This dual role creates an inherent conflict of interest and constitutes a breach of RICS Global Professional and Ethical Standards 2024, specifically:
  • Conflict of Interest (Ethics Standard 2)
  • Honesty and Integrity (Rule 1, RICS Rules of Conduct)
  • Trustworthiness (Rule 4, RICS Rules of Conduct)

4. FACTUAL BACKGROUND
On 20 January 2024, Mr. Belcher sent an "Engagement Confirmation" letter to the client stating:

"I confirm engagement for property valuation (£50k fee). I'm also representing the seller's agent in discussions (£3k commission). My involvement in both capacities ensures coordinated approach."

This disclosure is materially deficient because:
  (a) It appears in a routine engagement letter, not as a prominent conflict declaration
  (b) It fails to explain the financial conflict or its implications
  (c) It does not seek the client's informed consent to proceed with conflicted roles
  (d) It presents the conflict as a "coordinated approach" rather than a serious professional breach

5. BREACHES OF RICS STANDARDS
The complaint alleges the following breaches:

Breach 1: CONFLICT OF INTEREST (Ethics Standard 2)
  • A professional cannot receive financial benefit from multiple roles in the same transaction
  • Mr. Belcher's £50k valuation fee and £3k selling commission represent dual financial interests
  • These interests are inherently conflicting because the valuation directly affects the selling price, and thus Belcher's commission

Breach 2: HONESTY AND INTEGRITY (Rule 1, RICS Rules of Conduct)
  • The manner of disclosure (buried in a routine letter) suggests deliberate concealment
  • The characterization of the conflict as a "coordinated approach" misrepresents its seriousness
  • This constitutes a failure to be honest with the client

Breach 3: TRUSTWORTHINESS (Rule 4, RICS Rules of Conduct)
  • A member must act in a manner that upholds RICS's reputation and the profession's trust
  • Accepting conflicted roles without proper consent undermines the profession's integrity

6. REGULATORY PRECEDENT
RICS Regulatory Board decisions (e.g., 2023–2024) have consistently held that:
  • Conflicts of interest must be disclosed BEFORE engagement, not within engagement letters
  • "Informed consent" requires the client to understand the nature and implications of the conflict
  • Receiving financial benefit from multiple roles in the same transaction is presumptively in breach unless scrupulously managed

7. REQUESTED OUTCOME
This complaint seeks:
  (a) A formal investigation by the RICS Regulatory Board
  (b) Disciplinary action against Mr. Belcher for breach of Ethics Standard 2 and Rules 1 & 4
  (c) A determination that Mr. Belcher was not properly engaged to provide the valuation in question
  (d) Any further remedies the Board considers appropriate

8. SUPPORTING DOCUMENTATION
Attached to this complaint:
  • Copy of Engagement Confirmation letter dated 20 January 2024
  • Copies of all related communications and contracts
  • RICS Ethics Standards 2024 (relevant excerpts)

Yours faithfully,
[CLIENT_SIGNATURE]
[CLIENT_NAME]

---
Date of Complaint: [DATE]
`;

const SOLICITOR_BRIEF = `
CONFIDENTIAL LEGAL BRIEF
SOLICITOR INSTRUCTION

To: [SOLICITOR_NAME & FIRM]
From: [CLIENT_NAME]
Date: [DATE]
Matter: Claim against Malcolm Belcher — Professional Negligence, Breach of Contract & Economic Duress

1. EXECUTIVE SUMMARY
The client has suffered approximately £40,000 in direct losses as a result of a series of deliberate and unlawful professional breaches by Malcolm Belcher, a RICS-registered Quantity Surveyor. The client instructs this firm to pursue a claim against Belcher covering:
  (a) Breach of Contract (written agreement to value works at £185,000)
  (b) Economic Duress (threat to withhold certification unless client complied with unilateral demands)
  (c) Professional Negligence (undervaluation of completed works)
  (d) Tortious Interference (obstruction of third-party contractor's payment claim)
  (e) Breach of RICS Professional Standards

2. FACTUAL CHRONOLOGY

2.1 INITIAL ENGAGEMENT & WRITTEN AGREEMENT (November 2023)
On 20 November 2023, Belcher sent an email to the client confirming:
"I will provide comprehensive QS valuation for the three properties. All works will be valued and certified at the agreed rate of £185,000 total across all sites."

This email constitutes written contractual confirmation of a binding agreement between the client and Belcher at the sum of £185,000.

2.2 UNILATERAL COST REDUCTION & CONDITIONAL CERTIFICATION (16 December 2023)
Belcher unilaterally reduced the valuation from £185,000 to £145,000 (a 21.6% reduction, £40,000) and made certification conditional upon receipt of:
  (a) Original architect certificates for all structural work
  (b) Electrical compliance certificates
  (c) Building Control sign-off
  (d) Photographic evidence pre/post completion

These requirements had NEVER been mentioned prior to completion of works and were not part of the original agreed scope. The 14-day deadline for delivery was presented as an ultimatum.

2.3 CLIENT OBJECTION & CONTINUED PRESSURE (20 December 2023 – 5 January 2024)
The client objected in writing that the documentation requirements were not part of the original scope and that Belcher appeared to be "using the valuation to force compliance."

Belcher maintained the reduced valuation and conditional certification position, falsely claiming these were "standard practice."

2.4 INFORMATION OBSTRUCTION & SITE ACCESS EXCLUSION (8 February – 14 March 2024)
Belcher:
  (a) Refused to share survey data with the client's co-instructed architect, citing "confidentiality" (8 Feb)
  (b) Demanded exclusive site access, instructing that "no other professionals" be present (14 Mar)

These actions obstructed the client's right to obtain coordinated professional advice and constituted unlawful exclusion of co-instructed professionals.

2.5 UNDISCLOSED CONFLICT OF INTEREST (20 January 2024)
In an engagement letter, Belcher disclosed that he was simultaneously earning:
  (a) £50,000 as the client's valuer
  (b) £3,000 as the seller's agent in related discussions

This dual role was not properly disclosed, was not presented as a conflict of interest, and did not obtain the client's informed consent.

3. LEGAL ANALYSIS

3.1 BREACH OF CONTRACT
The 20 November 2023 email constitutes a binding written agreement to value the works at £185,000. The unilateral reduction to £145,000 (16 December) breaches this agreement. 
  • Governing law: English contract law
  • Damages: Difference between agreed valuation (£185k) and amount actually paid/certified (£145k) = £40,000

3.2 ECONOMIC DURESS
The combination of:
  (a) Threat to withhold professional certification (conditioning element)
  (b) Demand for previously undisclosed documentation (illegitimate demand)
  (c) 14-day ultimatum (time pressure)
...constitutes economic duress under *DSND Subsea v Petroleum Geo-Services* [2000] BLR 530.

The client has grounds to rescind the undervaluation and recover the £40,000 difference.

3.3 PROFESSIONAL NEGLIGENCE
Belcher owed a duty of care as a RICS-registered professional to:
  (a) Provide an accurate valuation of completed works
  (b) Apply professional standards in valuation methodology
  (c) Avoid conflicts of interest

The £40,000 reduction, made unilaterally and without proper justification, falls below the standard of competence expected of a RICS member (*Bolam v Friern Hospital* applied to professional standards).

3.4 TORTIOUS INTERFERENCE WITH BUSINESS RELATIONS
Belcher's:
  (a) Undervaluation of works directly prevented a contractor (Bradley) from recovering payment
  (b) Site access exclusion and information gatekeeping obstructed the contractor's ability to obtain supporting evidence
  (c) Actions were deliberate and intentional

This constitutes tortious interference at common law (*Lonrho Ltd v Fayed* [1992]).

3.5 BREACH OF RICS PROFESSIONAL STANDARDS
Breaches include:
  • Conflict of Interest (undisclosed dual role, Ethics Standard 2)
  • Cost Certainty (written £185k agreement unilaterally varied, RICS Rules)
  • Professional Conduct (information obstruction, RICS Rule 3 — Treating Others Fairly)
  • Independence and Objectivity (appointment by disputing party post-completion, RICS Standards)

These breaches are independently reportable to RICS.

4. REMEDIES SOUGHT

4.1 DIRECT DAMAGES
  £40,000 — difference between agreed valuation and actual certification

4.2 CONSEQUENTIAL DAMAGES
  (a) Bradley's unrecovered payment claim — estimated £[TO_BE_CALCULATED]
  (b) Interest on delayed payment/recovery
  (c) Reputational loss and business disruption

4.3 LEGAL COSTS & DISBURSEMENTS
  (a) Solicitor's fees for preparation and conduct
  (b) Barrister's fees (if proceedings)
  (c) Expert evidence (valuation specialist)
  (d) RICS complaint handling costs

4.4 INTERIM RELIEF
  Subject to further advice, consideration should be given to:
  (a) Interim injunction to prevent Belcher from withholding certification pending trial
  (b) Summary judgment application (strong prima facie evidence of breach on undisputed facts)

5. EVIDENCE STRENGTH

5.1 WRITTEN DOCUMENTATION
  • Email 20 Nov 2023 (written contract) — STRONG
  • Email 16 Dec 2023 (unilateral reduction + ultimatum) — VERY STRONG
  • Email 8 Feb 2024 (information obstruction) — STRONG
  • Letter 20 Jan 2024 (undisclosed conflict) — VERY STRONG

5.2 PHOTOGRAPHIC EVIDENCE
  • 17 photographs documenting works completion (Oct-Nov 2022) — VERY STRONG
  • Handover date established as 24 November 2022 — VERY STRONG

5.3 WITNESS AVAILABILITY
  • Client (direct testimony of duress, cost discussions)
  • Contractor Bradley (victim of interference, payment denial)
  • Site workers (works completion)
  • Co-instructed architect (victim of information gatekeeping)
  • Client assistant (witness to Belcher communications)

Overall Assessment: STRONG CASE. Multiple breaches on documented evidence, clear damages, and reliable witness support.

6. RECOMMENDATIONS

6.1 IMMEDIATE ACTIONS (Next 2 weeks)
  (a) Obtain original email headers and metadata for all communications
  (b) Compile and organize all photographs with timeline annotations
  (c) Gather invoice records and payment documentation
  (d) Prepare witness statement schedule

6.2 SHORT TERM (Weeks 2-4)
  (a) File RICS conflict of interest complaint (independent of civil claim)
  (b) Obtain formal witness statements
  (c) Instruct valuation expert to review Belcher's work and opine on negligence
  (d) Calculate damages comprehensively

6.3 MEDIUM TERM (Weeks 4-8)
  (a) Issue pre-action protocol letter to Belcher (28-day response deadline)
  (b) Pursue RICS complaint to conclusion
  (c) Prepare for court proceedings if settlement not reached

7. COST ESTIMATE
  (a) Solicitor's fees: £[TO_BE_AGREED]
  (b) Barrister (opinion + pleadings): £[TO_BE_AGREED]
  (c) Expert valuation evidence: £[TO_BE_AGREED]
  (d) Disbursements & court fees: £[TO_BE_AGREED]

8. NEXT STEPS
Please confirm:
  (a) Acceptance of instructions
  (b) Proposed fee arrangement (conditional fee agreement / hourly rate)
  (c) Availability to meet with client within 5 working days
  (d) Proposed timeline for pre-action letter

Yours faithfully,
[CLIENT_SIGNATURE]
[CLIENT_NAME]
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = await req.json();

    let document = '';
    let fileName = '';

    if (templateId === 'rics-complaint' || templateId === 2) {
      document = RICS_COMPLAINT;
      fileName = 'RICS_Conflict_of_Interest_Complaint.txt';
    } else if (templateId === 'solicitor-brief' || templateId === 3) {
      document = SOLICITOR_BRIEF;
      fileName = 'Solicitor_Instruction_Brief.txt';
    } else {
      return Response.json({ error: 'Unknown template' }, { status: 400 });
    }

    // Populate document with current date
    const today = new Date().toISOString().split('T')[0];
    document = document.replace(/\[DATE\]/g, today);

    // Return as downloadable text
    const encoded = new TextEncoder().encode(document);
    return new Response(encoded, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': encoded.length.toString()
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});