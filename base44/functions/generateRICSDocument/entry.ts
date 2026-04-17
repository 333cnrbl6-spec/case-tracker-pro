import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentType, incidents, evidence, senderName, senderEmail } = await req.json();

    if (!documentType || !incidents || incidents.length === 0) {
      return Response.json({ error: 'Document type and incidents are required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const incidentSummary = incidents.map(i => 
      `- ${i.title} (${i.date}, ${i.severity}): ${i.description}\n  RICS Violations: ${i.rics_violations?.join(', ') || 'None'}\n  Legal Issues: ${i.legal_issues?.join(', ') || 'None'}`
    ).join('\n');

    const evidenceSummary = evidence.map(e =>
      `- ${e.title} (${e.evidence_type}): ${e.description} [Strength: ${e.strength}]`
    ).join('\n');

    let prompt = '';
    let title = '';

    if (documentType === 'complaint') {
      title = 'Formal Complaint to RICS';
      prompt = `Draft a formal complaint letter to RICS regarding professional misconduct. 

Sender: ${senderName || 'The Complainant'}
Email: ${senderEmail || 'N/A'}
Date: ${today}

INCIDENTS:
${incidentSummary}

SUPPORTING EVIDENCE:
${evidenceSummary}

Write a professional formal complaint letter that:
1. Clearly states the allegations and RICS rule violations
2. Provides chronological narrative of incidents
3. References supporting evidence
4. Requests formal investigation
5. Is suitable for submission to RICS Regulatory Board

Format as a formal letter with proper structure. Include all necessary details.`;
    } else if (documentType === 'response') {
      title = 'Response to RICS Investigator Enquiries';
      prompt = `Draft a response to RICS investigator enquiries regarding professional misconduct allegations.

Sender: ${senderName || 'The Respondent'}
Email: ${senderEmail || 'N/A'}
Date: ${today}

INCIDENTS UNDER INVESTIGATION:
${incidentSummary}

AVAILABLE EVIDENCE:
${evidenceSummary}

Write a professional response to RICS investigator that:
1. Addresses the allegations systematically
2. Provides detailed responses to each incident
3. References supporting evidence for key claims
4. Demonstrates good faith cooperation with investigation
5. Maintains professional tone throughout

Format as formal correspondence suitable for RICS submission.`;
    } else if (documentType === 'disclosure') {
      title = 'Disclosure Statement to RICS';
      prompt = `Draft a comprehensive disclosure statement listing all evidence and documentation to be submitted to RICS.

Sender: ${senderName || 'The Complainant'}
Email: ${senderEmail || 'N/A'}
Date: ${today}

INCIDENTS:
${incidentSummary}

EVIDENCE TO DISCLOSE:
${evidenceSummary}

Write a professional disclosure statement that:
1. Lists all evidence being submitted
2. Describes each document and its relevance
3. Explains how evidence supports allegations
4. Organizes evidence logically by incident/issue
5. Includes brief index of materials

Format as formal disclosure statement suitable for RICS submission.`;
    }

    const documentContent = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          content: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      document: {
        title,
        documentType,
        content: documentContent.content,
        generatedDate: today,
        sender: senderName || 'Anonymous',
        senderEmail: senderEmail || 'Not provided'
      }
    });
  } catch (error) {
    console.error('Error generating RICS document:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});