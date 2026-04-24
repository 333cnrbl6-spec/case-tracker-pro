import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { case_id, export_type } = await req.json();
    if (!case_id) return Response.json({ error: 'case_id required' }, { status: 400 });

    const [caseRecords, incidents, communications, evidence] = await Promise.all([
      base44.entities.LegalCase.filter({ id: case_id }),
      base44.entities.Incident.list('-date'),
      base44.entities.Communication.list('-date'),
      base44.entities.Evidence.list('-date_collected')
    ]);

    const legalCase = caseRecords[0];
    if (!legalCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    const now = new Date().toLocaleDateString('en-GB');

    let htmlContent = '';

    if (export_type === 'full_narrative') {
      if (!legalCase.ai_narrative) {
        return Response.json({ error: 'No narrative generated yet. Generate one from the Case Narrative Builder first.' }, { status: 400 });
      }
      
      const narrative = JSON.parse(legalCase.ai_narrative);
      htmlContent = `
        <h1>Legal Case Narrative — ${legalCase.case_ref}</h1>
        <p><strong>Client:</strong> ${legalCase.client_name} | <strong>Generated:</strong> ${now}</p>
        <hr/>
        <h2>Background & Parties</h2><p>${narrative.background_parties || ''}</p>
        <h2>Chronology</h2><p>${narrative.chronology || ''}</p>
        <h2>Liability Analysis</h2><p>${narrative.liability_analysis || ''}</p>
        <h2>Quantum Assessment</h2><p>${narrative.quantum_assessment || ''}</p>
        <h2>Legal Framework</h2><p>${narrative.legal_framework || ''}</p>
        ${narrative.applicable_statutes?.length > 0 ? `<h2>Applicable Statutes</h2><ul>${narrative.applicable_statutes.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
        ${narrative.recommended_actions?.length > 0 ? `<h2>Recommended Actions</h2><ul>${narrative.recommended_actions.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
        ${narrative.risk_assessment ? `<h2>Risk Assessment</h2><p>${narrative.risk_assessment}</p>` : ''}
      `;
    } else if (export_type === 'evidence_bundle') {
      htmlContent = `
        <h1>Evidence Bundle Index — ${legalCase.case_ref}</h1>
        <p><strong>Client:</strong> ${legalCase.client_name} | <strong>Generated:</strong> ${now}</p>
        <hr/>
        <table border="1" cellpadding="8" style="width:100%;border-collapse:collapse">
          <tr><th>#</th><th>Date</th><th>Title</th><th>Type</th><th>Strength</th><th>Relevance</th></tr>
          ${evidence.map((e, i) => `<tr>
            <td>${i + 1}</td>
            <td>${e.date_collected}</td>
            <td>${e.title}</td>
            <td>${e.evidence_type}</td>
            <td>${e.strength}</td>
            <td>${e.relevance}</td>
          </tr>`).join('')}
        </table>
      `;
    } else if (export_type === 'chronology') {
      const events = [
        ...incidents.map(i => ({ date: i.date, type: 'Incident', desc: `${i.title} (${i.severity})` })),
        ...communications.map(c => ({ date: c.date, type: 'Communication', desc: `${c.type}: ${c.subject}` })),
        ...evidence.map(e => ({ date: e.date_collected, type: 'Evidence', desc: e.title }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      htmlContent = `
        <h1>Chronological Timeline — ${legalCase.case_ref}</h1>
        <p><strong>Client:</strong> ${legalCase.client_name} | <strong>Generated:</strong> ${now}</p>
        <hr/>
        ${events.map(e => `<div style="margin-bottom:12px;padding:8px;border-left:3px solid #666">
          <strong>${e.date}</strong> — <em>${e.type}</em><br/>${e.desc}
        </div>`).join('')}
      `;
    } else if (export_type === 'client_care_letter') {
      htmlContent = `
        <div style="font-family:Arial;max-width:600px;margin:40px auto">
          <h2>${now}</h2>
          <p>Dear ${legalCase.client_name},</p>
          <h3>RE: ${legalCase.case_ref} — Client Care Letter</h3>
          <p>Thank you for instructing us in connection with your ${legalCase.case_type?.replace(/_/g, ' ')} matter. This letter sets out the terms on which we will act for you.</p>
          <h4>Your Matter</h4>
          <p>${legalCase.facts || 'Details of your matter as discussed.'}</p>
          <h4>Your Instructions</h4>
          <p>${legalCase.instructions || 'To advise and act on your behalf.'}</p>
          <h4>Important Dates</h4>
          <p><strong>Limitation Date:</strong> ${legalCase.limitation_date || 'To be confirmed'} — it is critical that legal proceedings are issued before this date.</p>
          <h4>Our Costs</h4>
          <p>We will provide a costs estimate in due course. You will be kept informed of costs throughout.</p>
          <p>Please sign and return the enclosed copy to confirm your instructions.</p>
          <p>Yours sincerely,</p>
          <br/><p>[Solicitor Name]<br/>For and on behalf of [Firm Name]</p>
        </div>
      `;
    } else if (export_type === 'settlement_proposal') {
      htmlContent = `
        <h1>Settlement Proposal — ${legalCase.case_ref}</h1>
        <p><strong>Client:</strong> ${legalCase.client_name} | <strong>Date:</strong> ${now}</p>
        <hr/>
        <p><strong>Opponent:</strong> ${legalCase.opponent_name || 'N/A'}</p>
        <p><strong>Estimated Case Value:</strong> £${legalCase.estimated_value?.toLocaleString() || 'TBC'}</p>
        <h3>Without Prejudice</h3>
        <p>Our client is prepared to settle this matter on the following basis:</p>
        <p>[Settlement terms to be inserted by fee earner]</p>
        <p>This offer is open for 21 days from the date of this letter.</p>
      `;
    } else if (export_type === 'court_bundle_checklist') {
      htmlContent = `
        <h1>Court Bundle Checklist — ${legalCase.case_ref}</h1>
        <p><strong>Client:</strong> ${legalCase.client_name} | <strong>Generated:</strong> ${now}</p>
        <hr/>
        <h3>Section A — Claim Documents</h3>
        <p>☐ Claim Form<br/>☐ Particulars of Claim<br/>☐ Schedule of Loss<br/>☐ Defence</p>
        <h3>Section B — Evidence</h3>
        ${evidence.map((e, i) => `<p>☐ Tab ${i + 1}: ${e.title} (${e.date_collected})</p>`).join('')}
        <h3>Section C — Expert Reports</h3>
        <p>☐ Expert Report (if applicable)<br/>☐ Joint Statement (if applicable)</p>
        <h3>Section D — Correspondence</h3>
        ${communications.slice(0, 10).map((c, i) => `<p>☐ ${c.date}: ${c.subject}</p>`).join('')}
      `;
    }

    return Response.json({
      success: true,
      html_content: htmlContent,
      case_ref: legalCase.case_ref,
      export_type,
      generated_at: now
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});