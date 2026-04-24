import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, Loader2, CheckCircle, Clock, AlertTriangle, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function FeeEarnerWeeklyReports() {
  const queryClient = useQueryClient();
  const [lastReport, setLastReport] = useState(null);

  // Fetch all tasks to show preview
  const { data: tasks = [] } = useQuery({
    queryKey: ['incident-tasks-preview'],
    queryFn: () => base44.entities.IncidentTask.list('-created_date'),
  });

  // Generate and send reports
  const generateReportsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('generateWeeklyFeeEarnerReports', {}),
    onSuccess: (response) => {
      setLastReport(response.data);
      toast.success(`Weekly reports sent to ${response.data.reports_sent} fee earner${response.data.reports_sent !== 1 ? 's' : ''}`);
      queryClient.invalidateQueries({ queryKey: ['incident-tasks-preview'] });
    },
    onError: (err) => toast.error(err.message),
  });

  // Group tasks by fee earner
  const tasksByFeeEarner = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach(task => {
    if (!task.assigned_to) return;

    if (!tasksByFeeEarner[task.assigned_to]) {
      tasksByFeeEarner[task.assigned_to] = {
        completed: [],
        in_progress: [],
        overdue: [],
        due_soon: [],
        total: 0,
      };
    }

    tasksByFeeEarner[task.assigned_to].total++;

    if (task.status === 'completed') {
      tasksByFeeEarner[task.assigned_to].completed.push(task);
    } else if (['under_investigation', 'evidence_review', 'resolution'].includes(task.status)) {
      tasksByFeeEarner[task.assigned_to].in_progress.push(task);
    } else if (task.deadline) {
      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      if (deadline < today) {
        tasksByFeeEarner[task.assigned_to].overdue.push(task);
      } else {
        const daysUntil = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 3) {
          tasksByFeeEarner[task.assigned_to].due_soon.push(task);
        }
      }
    }
  });

  const feeEarners = Object.keys(tasksByFeeEarner).sort();
  const totalFeeEarners = feeEarners.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fee Earner Weekly Reports</h1>
            <p className="text-slate-600 mt-1">Generate and email automated task summaries to each fee earner</p>
          </div>
          <Button
            onClick={() => generateReportsMutation.mutate()}
            disabled={generateReportsMutation.isPending || totalFeeEarners === 0}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {generateReportsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" /> Generate & Send Reports
              </>
            )}
          </Button>
        </div>

        {/* Last Report Summary */}
        {lastReport && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Reports sent successfully</p>
                  <p className="text-sm text-green-800 mt-1">
                    {lastReport.reports_sent} report{lastReport.reports_sent !== 1 ? 's' : ''} generated and emailed at {new Date().toLocaleTimeString('en-GB')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Earner Previews */}
        {totalFeeEarners === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No assigned tasks yet</p>
                <p className="text-sm text-slate-500 mt-1">Assign tasks in the Case Task Workflow to generate reports</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {feeEarners.map(feeEarner => {
              const summary = tasksByFeeEarner[feeEarner];
              const completionRate = summary.total > 0 
                ? Math.round((summary.completed.length / (summary.completed.length + summary.in_progress.length + summary.overdue.length + summary.due_soon.length)) * 100) 
                : 0;

              return (
                <Card key={feeEarner} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{feeEarner}</CardTitle>
                      </div>
                      <Badge variant="outline">{summary.total} tasks</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Completion Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600">Completion Rate</span>
                        <span className="text-sm font-bold text-slate-900">{completionRate}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Task Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCheck className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{summary.completed.length}</p>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">In Progress</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{summary.in_progress.length}</p>
                      </div>

                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-semibold text-orange-700">Due Soon</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{summary.due_soon.length}</p>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-semibold text-red-700">Overdue</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{summary.overdue.length}</p>
                      </div>
                    </div>

                    {/* Overdue Alert */}
                    {summary.overdue.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800">
                          <p className="font-semibold">{summary.overdue.length} overdue task{summary.overdue.length !== 1 ? 's' : ''}</p>
                          <p className="text-red-700 mt-1">
                            {summary.overdue.slice(0, 2).map(t => t.title).join(', ')}
                            {summary.overdue.length > 2 ? ` +${summary.overdue.length - 2} more` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8 bg-slate-100">
          <CardHeader>
            <CardTitle className="text-base">About Weekly Reports</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>• Each report includes completed, in-progress, overdue, and due-soon tasks</p>
            <p>• Reports are sent to the email address of each assigned fee earner</p>
            <p>• You can manually trigger reports at any time using the button above</p>
            <p>• Set up a scheduled automation to send reports automatically every week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}