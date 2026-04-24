import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weakness, evidence_ids } = await req.json();

    if (!weakness || !evidence_ids || evidence_ids.length === 0) {
      return Response.json({ error: 'Weakness and evidence IDs required' }, { status: 400 });
    }

    // Fetch evidence and communication records
    const allEvidence = await base44.entities.Evidence.list();
    const allComms = await base44.entities.Communication.list();

    const linkedItems = evidence_ids.map(id => {
      const evid = allEvidence.find(e => e.id === id);
      if (evid) {
        return {
          type: 'evidence',
          title: evid.title,
          description: evid.description,
          date: evid.date_collected,
          content: evid.notes
        };
      }
      const comm = allComms.find(c => c.id === id);
      if (comm) {
        return {
          type: 'communication',
          title: comm.subject,
          from: comm.from,
          to: comm.to,
          date: comm.date,
          content: comm.content
        };
      }
      return null;
    }).filter(Boolean);

    // Build prompt with evidence details
    const evidenceText = linkedItems.map(item => {
      if (item.type === 'evidence') {
        return `Evidence: "${item.title}" (${item.date})\n${item.description || ''}\nNotes: ${item.content || ''}`;
      } else {
        return `Communication: "${item.title}" from ${item.from} to ${item.to} (${item.date})\n${item.content || ''}`;
      }
    }).join('\n\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a legal professional drafting rebuttals to case weaknesses. 

Identified Weakness:
"${weakness}"

Linked Evidence & Communications:
${evidenceText}

Based on the linked evidence above, draft a concise, professional rebuttal paragraph (2-3 sentences) that addresses this weakness. The rebuttal should:
- Reference specific evidence or communications where relevant
- Be measured and professional in tone
- Provide context or counterarguments
- Be suitable for a legal case narrative

Generate only the rebuttal paragraph, no preamble.`,
      model: 'claude_sonnet_4_6'
    });

    return Response.json({ rebuttal: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});