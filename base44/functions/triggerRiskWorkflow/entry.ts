import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { risk_id, case_id, risk_level, predicted_failures, recommended_actions } = await req.json();

        // Fetch case and risk details
        const riskRecord = await base44.entities.ComplianceRisk.get(risk_id);
        const caseData = await base44.entities.LegalCase.get(case_id);

        if (!caseData) {
            return Response.json({ error: 'Case not found' }, { status: 404 });
        }

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