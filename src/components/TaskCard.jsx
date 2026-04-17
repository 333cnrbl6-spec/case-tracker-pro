import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Clock, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-800',
  under_investigation: 'bg-blue-100 text-blue-800',
  evidence_review: 'bg-amber-100 text-amber-800',
  resolution: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function TaskCard({ task, onDelete, users }) {
  const queryClient = useQueryClient();
  const taskData = task.data;
  const isOverdue = taskData.deadline && new Date(taskData.deadline) < new Date() && 
    !['completed', 'blocked'].includes(taskData.status);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates) => {
      await base44.entities.IncidentTask.update(task.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
      toast.success('Task updated');
    }
  });

  const handleStatusChange = (newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'completed') {
      updates.completion_date = new Date().toISOString().split('T')[0];
    }
    updateTaskMutation.mutate(updates);
  };

  return (
    <Card className={isOverdue ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-lg">{taskData.title}</h3>
              {taskData.description && (
                <p className="text-sm text-slate-600 mt-1">{taskData.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={taskData.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="evidence_review">Evidence Review</SelectItem>
                <SelectItem value="resolution">Resolution</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Badge className={PRIORITY_COLORS[taskData.priority]}>
              {taskData.priority}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {taskData.assigned_to && (
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span>{taskData.assigned_to}</span>
              </div>
            )}

            {taskData.deadline && (
              <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>
                <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-slate-400'}`} />
                <span>{new Date(taskData.deadline).toLocaleDateString()}</span>
                {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
              </div>
            )}

            {taskData.completion_date && (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Completed {new Date(taskData.completion_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {taskData.notes && (
            <div className="bg-white p-3 rounded border border-slate-200">
              <p className="text-xs text-slate-600 font-medium mb-1">Notes</p>
              <p className="text-sm text-slate-700">{taskData.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}