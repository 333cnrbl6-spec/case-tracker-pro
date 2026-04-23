import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2, Sparkles, CheckSquare, Clock, User, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Circle, SquareCheck, Zap, Calendar,
  ClipboardList, Edit2, Check, X
} from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_STYLE = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-slate-100 border-slate-300 text-slate-600',
};

const PRIORITY_DOT = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-slate-400',
};

const STATUS_ICON = {
  not_started: <Circle className="w-4 h-4 text-slate-400" />,
  under_investigation: <Clock className="w-4 h-4 text-blue-500" />,
  evidence_review: <ClipboardList className="w-4 h-4 text-purple-500" />,
  resolution: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  blocked: <X className="w-4 h-4 text-red-500" />,
};

function TaskRow({ task, onStatusChange, onAssigneeChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeInput, setAssigneeInput] = useState(task.assigned_to || '');
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
  const daysUntil = task.deadline
    ? Math.ceil((new Date(task.deadline) - new Date()) / 86400000)
    : null;

  const statusOptions = ['not_started', 'under_investigation', 'evidence_review', 'resolution', 'completed', 'blocked'];

  return (
    <div className={`rounded-lg border ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium} mb-2`}>
      <div className="flex items-start gap-3 p-3">
        <button onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'not_started' : 'completed')} className="mt-0.5 flex-shrink-0">
          {STATUS_ICON[task.status] || STATUS_ICON.not_started}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>{task.title}</p>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {task.deadline && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-700 font-semibold' : 'opacity-70'}`}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? `Overdue ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Due today' : `${daysUntil}d left`}
                {' · '}{new Date(task.deadline).toLocaleDateString('en-GB')}
              </span>
            )}
            {editingAssignee ? (
              <span className="flex items-center gap-1">
                <Input
                  className="h-6 text-xs px-2 w-40"
                  value={assigneeInput}
                  onChange={e => setAssigneeInput(e.target.value)}
                  placeholder="email@firm.com"
                  autoFocus
                />
                <button onClick={() => { onAssigneeChange(task.id, assigneeInput); setEditingAssignee(false); }} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingAssignee(false)} className="text-slate-400"><X className="w-3.5 h-3.5" /></button>
              </span>
            ) : (
              <button onClick={() => setEditingAssignee(true)} className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100">
                <User className="w-3 h-3" />
                {task.assigned_to || 'Unassigned'}
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}
            <select
              value={task.status}
              onChange={e => onStatusChange(task.id, e.target.value)}
              className="text-xs border border-current border-opacity-30 rounded px-1 py-0.5 bg-transparent cursor-pointer"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-current border-opacity-20 pt-2">
          <p className="text-xs opacity-80 whitespace-pre-line">{task.description}</p>
          {task.notes && (
            <p className="text-xs italic opacity-60">{task.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RemediationPlan({ incident }) {
  const [generating, setGenerating] = useState(false);
  const [planMeta, setPlanMeta] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['incident-tasks', incident.id],
    queryFn: () => base44.entities.IncidentTask.filter({ incident_id: incident.id }),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IncidentTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incident-tasks', incident.id] }),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await base44.functions.invoke('generateRemediationPlan', { incident_id: incident.id });
    setPlanMeta(res.data?.plan);
    queryClient.invalidateQueries({ queryKey: ['incident-tasks', incident.id] });
    toast.success(`Remediation plan created — ${res.data?.created_task_count} tasks generated`);
    setGenerating(false);
  };

  const onStatusChange = (id, status) => updateTask.mutate({ id, data: { status, completion_date: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined } });
  const onAssigneeChange = (id, assigned_to) => { updateTask.mutate({ id, data: { assigned_to } }); toast.success('Assignee updated'); };

  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Remediation Plan</span>
          {tasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">{completed}/{tasks.length} complete</Badge>
          )}
          {overdue > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs border border-red-200">{overdue} overdue</Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs h-7"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {tasks.length > 0 ? 'Regenerate' : 'Generate Plan'}
        </Button>
      </div>

      {/* Generating state */}
      {generating && (
        <div className="flex items-center gap-3 py-4 bg-indigo-50 rounded-lg border border-indigo-200 px-4">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <div>
            <p className="text-sm font-medium text-indigo-900">Generating RICS-compliant remediation plan…</p>
            <p className="text-xs text-indigo-600">Analysing incident severity, RICS violations, and creating task assignments</p>
          </div>
        </div>
      )}

      {/* Plan summary if just generated */}
      {planMeta && !generating && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-indigo-900">{planMeta.summary}</p>
          {planMeta.compliance_deadline && (
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs text-indigo-700 font-medium">
                Compliance deadline: {new Date(planMeta.compliance_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          {planMeta.escalation_triggers?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-indigo-700 mb-1">Escalation triggers:</p>
              <ul className="space-y-0.5">
                {planMeta.escalation_triggers.map((t, i) => (
                  <li key={i} className="text-xs text-indigo-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-orange-500" />{t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && !generating && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
      ) : tasks.length === 0 && !generating ? (
        <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <SquareCheck className="w-6 h-6 text-slate-300 mx-auto mb-1" />
          <p className="text-xs text-slate-400">No tasks yet. Generate a remediation plan to get started.</p>
        </div>
      ) : (
        <div>
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} onAssigneeChange={onAssigneeChange} />
          ))}
        </div>
      )}
    </div>
  );
}