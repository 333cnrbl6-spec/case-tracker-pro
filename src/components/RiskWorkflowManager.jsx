import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Zap, Clock } from 'lucide-react';

export default function RiskWorkflowManager({ risk, caseData, onWorkflowTriggered }) {
    const queryClient = useQueryClient();
    const [showConfirm, setShowConfirm] = useState(false);

    const triggerWorkflowMutation = useMutation({
        mutationFn: () => base44.functions.invoke('triggerRiskWorkflow', {
            risk_id: risk.id,
            case_id: caseData.id,
            risk_level: risk.risk_level,
            predicted_failures: risk.predicted_failures,
            recommended_actions: risk.recommended_actions
        }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['incidentTasks'] });
            setShowConfirm(false);
            if (onWorkflowTriggered) onWorkflowTriggered(response.data);
        },
    });

    const isHighOrCritical = ['high', 'critical'].includes(risk.risk_level);

    if (!isHighOrCritical) {
        return null;
    }

    return (
        <Card className={risk.risk_level === 'critical' ? 'border-red-400 bg-red-50' : 'border-orange-400 bg-orange-50'}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className={`w-5 h-5 ${risk.risk_level === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
                    Automated Workflow Engine
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className={`p-3 rounded-lg ${risk.risk_level === 'critical' ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <p className="text-sm font-semibold mb-2">
                        {risk.risk_level === 'critical' 
                            ? '🚨 Critical Risk Detected - Management escalation will be triggered'
                            : '⚠️ High Risk Detected - Automated task assignment will occur'
                        }
                    </p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Create prioritized tasks for fee earner: {caseData.assigned_fee_earner}</li>
                        <li>Set automatic deadline reminders (1, 3, 7 days before)</li>
                        <li>Escalate overdue tasks to management</li>
                        {risk.risk_level === 'critical' && <li>Immediate escalation to management for approval</li>}
                    </ul>
                </div>

                {showConfirm ? (
                    <Alert className="bg-blue-50 border-blue-300">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            <strong>Confirm Workflow Trigger:</strong> This will create {
                                risk.recommended_actions ? JSON.parse(risk.recommended_actions).length : 0
                            } tasks and {risk.risk_level === 'critical' ? '1 management escalation' : 'set deadline reminders'}. This action cannot be undone.
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="flex gap-2">
                    {!showConfirm ? (
                        <Button
                            onClick={() => setShowConfirm(true)}
                            className={risk.risk_level === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Trigger Workflow
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={() => triggerWorkflowMutation.mutate()}
                                disabled={triggerWorkflowMutation.isPending}
                                className={risk.risk_level === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
                            >
                                {triggerWorkflowMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Executing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm & Execute
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => setShowConfirm(false)}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </div>

                {triggerWorkflowMutation.isSuccess && (
                    <Alert className="bg-green-50 border-green-300">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <strong>Workflow executed successfully:</strong> {triggerWorkflowMutation.data.data.tasks_created} tasks created, {triggerWorkflowMutation.data.data.escalations} escalations triggered.
                        </AlertDescription>
                    </Alert>
                )}

                {triggerWorkflowMutation.isError && (
                    <Alert className="bg-red-50 border-red-300">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            Error executing workflow: {triggerWorkflowMutation.error.message}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}