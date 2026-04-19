import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const logAuditEvent = async (base44, event) => {
  try {
    await base44.entities.AuditLog.create({
      event_type: event.event_type,
      action: event.action,
      triggered_by: event.triggered_by || 'system',
      case_id: event.case_id,
      case_ref: event.case_ref,
      risk_id: event.risk_id,
      task_id: event.task_id,
      assigned_to: event.assigned_to,
      severity: event.severity || 'medium',
      details: typeof event.details === 'string' ? event.details : JSON.stringify(event.details || {}),
      status: event.status || 'success',
      error_message: event.error_message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.email;
        const { risk_id, case_id, risk_level, predicted_failures, recommended_actions } = await req.json();

        // Fetch case and risk details
        const riskRecord = await base44.entities.ComplianceRisk.get(risk_id);
        const caseData = await base44.entities.LegalCase.get(case_id);

        if (!caseData) {
            return Response.json({ error: 'Case not found' }, { status: 404 });
        }

        // Log workflow trigger
        await logAuditEvent(base44, {
            event_type: 'workflow_triggered',
            action: `Risk workflow triggered for case ${caseData.case_ref} (${risk_level} risk)`,
            triggered_by: userId,
            case_id: case_id,
            case_ref: caseData.case_ref,
            risk_id: risk_id,
            severity: risk_level,
            details: { risk_score: riskRecord.overall_risk_score }
        });

        const tasksCreated = [];
        const escalations = [];

        // Only process high and critical risks
        if (risk_level !== 'high' && risk_level !== 'critical') {
            return Response.json({ tasksCreated, escalations });
        }

        // Parse recommended actions from risk assessment
        let actions = [];
        if (typeof recommended_actions === 'string') {
            actions = JSON.parse(recommended_actions);
        } else if (Array.isArray(recommended_actions)) {
            actions = recommended_actions;
        }

        // Create tasks for each recommended action
        for (const action of actions) {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + (action.deadline_days || 7));

            const taskTitle = `[${risk_level.toUpperCase()} RISK] ${action.action}`;
            const task = await base44.entities.IncidentTask.create({
                incident_id: case_id,
                title: taskTitle,
                description: `Auto-generated from risk assessment: ${action.action}. Case: ${caseData.case_ref}`,
                status: 'not_started',
                assigned_to: caseData.assigned_fee_earner,
                deadline: deadline.toISOString().split('T')[0],
                priority: action.priority || 'high',
                notes: `Risk Level: ${risk_level} | Assessment Date: ${riskRecord.assessment_date}`
            });

            tasksCreated.push({
                task_id: task.id,
                title: taskTitle,
                assigned_to: caseData.assigned_fee_earner,
                deadline: deadline.toISOString().split('T')[0]
            });

            // Send email notification to fee earner
            try {
                await base44.integrations.Core.SendEmail({
                    to: caseData.assigned_fee_earner,
                    subject: `NEW ${risk_level.toUpperCase()} RISK TASK: ${caseData.case_ref}`,
                    body: `A new ${risk_level} risk remediation task has been assigned to you.\n\nCase: ${caseData.case_ref}\nTask: ${taskTitle}\nPriority: ${action.priority || 'high'}\nDeadline: ${deadline.toISOString().split('T')[0]}\n\nAction: ${action.action}\n\nPlease review and implement this remediation action urgently.`,
                    from_name: 'Compliance System'
                });
            } catch (emailError) {
                console.error('Failed to send task assignment email:', emailError);
            }

            // Log task creation
            await logAuditEvent(base44, {
                event_type: 'task_created',
                action: `Task created: "${taskTitle}"`,
                triggered_by: 'system',
                case_id: case_id,
                case_ref: caseData.case_ref,
                risk_id: risk_id,
                task_id: task.id,
                assigned_to: caseData.assigned_fee_earner,
                severity: risk_level,
                details: { deadline: deadline.toISOString().split('T')[0] }
            });
        }

        // Escalation to management for critical risks
        if (risk_level === 'critical') {
            const escalationTask = await base44.entities.IncidentTask.create({
                incident_id: case_id,
                title: `🚨 MANAGEMENT ESCALATION - Critical Risk Case: ${caseData.case_ref}`,
                description: `Critical compliance risk detected on ${caseData.case_ref}. Requires management review and approval of remediation actions. Fee earner: ${caseData.assigned_fee_earner}`,
                status: 'not_started',
                assigned_to: 'management@firm.local', // Placeholder - should use actual management email
                deadline: new Date().toISOString().split('T')[0], // Same day escalation
                priority: 'critical',
                notes: `Risk Score: ${riskRecord.overall_risk_score}/100 | Confidence: ${riskRecord.confidence_score}%`
            });

            escalations.push({
                escalation_id: escalationTask.id,
                case_ref: caseData.case_ref,
                risk_level,
                risk_score: riskRecord.overall_risk_score,
                escalated_at: new Date().toISOString()
            });

            // Send escalation email to management
            try {
                await base44.integrations.Core.SendEmail({
                    to: 'management@firm.local',
                    subject: `🚨 CRITICAL RISK ESCALATION: ${caseData.case_ref}`,
                    body: `A CRITICAL compliance risk has been detected and requires immediate management review.\n\nCase: ${caseData.case_ref}\nRisk Score: ${riskRecord.overall_risk_score}/100\nConfidence: ${riskRecord.confidence_score}%\nFee Earner: ${caseData.assigned_fee_earner}\n\nImmediate review and approval of remediation actions required.\n\nPlease log in to the compliance system to review recommended actions and approve the remediation strategy.`,
                    from_name: 'Compliance System'
                });
            } catch (emailError) {
                console.error('Failed to send escalation email:', emailError);
            }

            // Log escalation
            await logAuditEvent(base44, {
                event_type: 'escalation_sent',
                action: `Management escalation triggered for critical risk: ${caseData.case_ref}`,
                triggered_by: 'system',
                case_id: case_id,
                case_ref: caseData.case_ref,
                risk_id: risk_id,
                task_id: escalationTask.id,
                assigned_to: 'management@firm.local',
                severity: 'critical',
                details: { risk_score: riskRecord.overall_risk_score }
            });
        }

        // Log workflow execution
        console.log(`Risk Workflow Triggered: ${case_id} - Level: ${risk_level} - Tasks: ${tasksCreated.length} - Escalations: ${escalations.length}`);

        return Response.json({
            success: true,
            case_ref: caseData.case_ref,
            risk_level,
            tasks_created: tasksCreated.length,
            escalations: escalations.length,
            details: {
                tasks: tasksCreated,
                escalations: escalations
            }
        });
    } catch (error) {
        console.error('Error triggering risk workflow:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});