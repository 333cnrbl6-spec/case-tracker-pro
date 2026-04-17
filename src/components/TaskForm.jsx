import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskForm({ incidentId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    assigned_to: '',
    deadline: '',
    priority: 'medium',
    notes: ''
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.entities.IncidentTask.create({
        incident_id: incidentId,
        ...formData
      });
      return result;
    },
    onSuccess: () => {
      toast.success('Task created');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create task');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    createTaskMutation.mutate();
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create New Task</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Task Title *
            </label>
            <Input
              placeholder="e.g., Collect witness statements"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Description
            </label>
            <Textarea
              placeholder="Details about this task..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Status
              </label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Priority
              </label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Assigned To
              </label>
              <Input
                type="email"
                placeholder="team.member@firm.com"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Deadline
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Notes
            </label>
            <Textarea
              placeholder="Internal notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="gap-2"
            >
              {createTaskMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}