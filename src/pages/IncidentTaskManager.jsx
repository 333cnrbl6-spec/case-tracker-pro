import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Plus, Trash2, Clock, User, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import TaskForm from '@/components/TaskForm';
import TaskCard from '@/components/TaskCard';

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-800',
  under_investigation: 'bg-blue-100 text-blue-800',
  evidence_review: 'bg-amber-100 text-amber-800',
  resolution: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'text-slate-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  critical: 'text-red-600'
};

export default function IncidentTaskManager() {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const queryClient = useQueryClient();

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['incident-tasks'],
    queryFn: () => base44.entities.IncidentTask.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.IncidentTask.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
      toast.success('Task deleted');
    }
  });

  const incidentTasks = selectedIncident
    ? tasks.filter(t => t.data.incident_id === selectedIncident.id)
    : [];

  const filteredTasks = incidentTasks.filter(task => {
    if (filterStatus && task.data.status !== filterStatus) return false;
    if (filterPriority && task.data.priority !== filterPriority) return false;
    return true;
  });

  const overdueTasks = filteredTasks.filter(t => {
    if (t.data.deadline && new Date(t.data.deadline) < new Date()) {
      return !['completed', 'blocked'].includes(t.data.status);
    }
    return false;
  });

  const completedCount = incidentTasks.filter(t => t.data.status === 'completed').length;
  const progressPercent = incidentTasks.length > 0 ? Math.round((completedCount / incidentTasks.length) * 100) : 0;

  if (!selectedIncident) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Task Management</h1>
            <p className="text-slate-600">Manage follow-up actions and track incident resolution progress</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map(incident => {
              const incidentTasks = tasks.filter(t => t.data.incident_id === incident.id);
              const completedTasks = incidentTasks.filter(t => t.data.status === 'completed').length;
              const overdue = incidentTasks.filter(t => {
                if (t.data.deadline && new Date(t.data.deadline) < new Date()) {
                  return !['completed', 'blocked'].includes(t.data.status);
                }
                return false;
              }).length;

              return (
                <Card
                  key={incident.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <CardHeader>
                    <CardTitle className="text-base line-clamp-2">{incident.data.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600">Progress</span>
                        <span className="text-xs font-semibold text-slate-900">
                          {completedTasks}/{incidentTasks.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${incidentTasks.length > 0 ? (completedTasks / incidentTasks.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600 text-xs">Total Tasks</p>
                        <p className="text-lg font-bold text-slate-900">{incidentTasks.length}</p>
                      </div>
                      {overdue > 0 && (
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-slate-600 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            Overdue
                          </p>
                          <p className="text-lg font-bold text-red-600">{overdue}</p>
                        </div>
                      )}
                    </div>

                    <Badge className={STATUS_COLORS[incident.data.status] || 'bg-slate-100'}>
                      {incident.data.status || 'open'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(null)} className="mb-2">
              ← Back to Incidents
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">{selectedIncident.data.title}</h1>
            <p className="text-slate-600 mt-1">Manage tasks and track resolution progress</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-900">Overall Progress</span>
                  <span className="text-sm font-bold text-slate-600">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-slate-600">Total</p>
                  <p className="text-xl font-bold text-slate-900">{incidentTasks.length}</p>
                </div>
                <div>
                  <p className="text-slate-600">Completed</p>
                  <p className="text-xl font-bold text-green-600">{completedCount}</p>
                </div>
                <div>
                  <p className="text-slate-600">In Progress</p>
                  <p className="text-xl font-bold text-blue-600">
                    {incidentTasks.filter(t => ['under_investigation', 'evidence_review', 'resolution'].includes(t.data.status)).length}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Overdue
                  </p>
                  <p className="text-xl font-bold text-red-600">{overdueTasks.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        {showForm && (
          <TaskForm
            incidentId={selectedIncident.id}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            All Statuses
          </Button>
          {['under_investigation', 'evidence_review', 'resolution', 'completed'].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Button>
          ))}
        </div>

        {/* Overdue Alert */}
        {overdueTasks.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Overdue Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.map(task => (
                <div key={task.id} className="text-sm text-red-800">
                  <strong>{task.data.title}</strong> - Due {new Date(task.data.deadline).toLocaleDateString()}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tasks */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={() => deleteTaskMutation.mutate(task.id)}
                users={users}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}