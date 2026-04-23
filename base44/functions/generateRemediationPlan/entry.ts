import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { incident_id } = await req.json();
  if (!incident_id) return Response.json({ error: 'incident_id required' }, { status: 400 });

  const incident = await base44.entities.Incident.get(incident_id);
  if (!incident) return Response.json({ error: 'Incident not found' }, { status: 404 });

  // Fetch relevant context
  const [users, existingTasks] = await Promise.all([
    base44.entities.User.list(),
    base44.entities.IncidentTask.filter({ incident_id }),
  ]);

  const teamEmails = users.map(u => u.email).filter(Boolean).slice(0, 10);

  const plan = await base44.integrations.Core.InvokeLLM({
    model: 'claude_sonnet_4_6',
    prompt: `You are a RICS compliance officer generating a formal remediation plan for a professional conduct incident.

INCIDENT DETAILS:
Title: ${incident.title}
Date: ${incident.date}
Type: ${incident.incident_type?.replace(/_/g, ' ')}
Severity: ${incident.severity}
Description: ${incident.description}
Evidence Notes: ${incident.evidence_notes || 'None'}
RICS Violations Identified: ${(incident.rics_violations || []).join(', ') || 'None specified'}
Legal Issues: ${(incident.legal_issues || []).join(', ') || 'None specified'}

TEAM MEMBERS AVAILABLE: ${teamEmails.join(', ') || 'Not specified'}

EXISTING TASKS ALREADY CREATED (${existingTasks.length}): ${existingTasks.map(t => t.title).join(', ') || 'None'}

Generate a comprehensive RICS-compliant remediation plan. Return JSON with:
- "summary": A 2-3 sentence executive summary of the remediation approach
- "urgency_rationale": Why this severity/timeline is appropriate under RICS rules
- "tasks": Array of remediation tasks (generate 4-8 tasks appropriate to severity), each with:
    - "title": Clear action title (imperative verb, e.g. "Obtain witness statements from...")
    - "description": Detailed steps to complete this task under RICS guidelines
    - "priority": "low" | "medium" | "high" | "critical"
    - "category": "evidence_gathering" | "legal_action" | "regulatory_reporting" | "communication" | "documentation" | "investigation" | "escalation"
    - "rics_rule_reference": The specific RICS rule or PS section this task addresses (e.g. "RICS PS 2017 Rule 3")
    - "deadline_days": Number of days from today to complete (be realistic and proportional to severity — critical = 3–7 days, high = 7–14, medium = 14–30, low = 30–60)
    - "assigned_role": The most appropriate role from the team (use actual email if team members listed, otherwise "solicitor", "compliance officer", "case handler", "senior partner")
    - "suggested_assignee": Pick one email from the team list if available, otherwise null
    - "checklist": Array of 3-5 specific sub-steps the assignee must complete
- "escalation_triggers": Array of strings — conditions that should trigger immediate escalation
- "compliance_deadline": ISO date string — the hard regulatory deadline by which all actions must be complete`,
    response_json_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        urgency_rationale: { type: 'string' },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              category: { type: 'string' },
              rics_rule_reference: { type: 'string' },
              deadline_days: { type: 'number' },
              assigned_role: { type: 'string' },
              suggested_assignee: { type: 'string' },
              checklist: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        escalation_triggers: { type: 'array', items: { type: 'string' } },
        compliance_deadline: { type: 'string' },
      },
    },
  });

  // Auto-create the tasks in the database
  const today = new Date();
  const createdTasks = await Promise.all(
    (plan.tasks || []).map(task => {
      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + (task.deadline_days || 14));
      return base44.asServiceRole.entities.IncidentTask.create({
        incident_id,
        title: task.title,
        description: `${task.description}\n\nRICS Rule: ${task.rics_rule_reference || 'N/A'}\n\nChecklist:\n${(task.checklist || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
        priority: task.priority || 'high',
        status: 'not_started',
        assigned_to: task.suggested_assignee || '',
        deadline: deadline.toISOString().split('T')[0],
        notes: `Category: ${task.category || ''} | Role: ${task.assigned_role || ''}`,
      });
    })
  );

  return Response.json({ plan, created_task_count: createdTasks.length });
});