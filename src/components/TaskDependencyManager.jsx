import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link2, Unlink2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskDependencyManager({ task, incidentId, allTasks }) {
  const [selectedBlocker, setSelectedBlocker] = useState('');
  const [linking, setLinking] = useState(false);
  const queryClient = useQueryClient();

  // Get blocking tasks
  const blockerTasks = allTasks?.filter(t => task?.blocked_by?.includes(t.id)) || [];

  // Get blocked tasks
  const blockedTasks = allTasks?.filter(t => task?.blocks?.includes(t.id)) || [];

  // Add dependency
  const handleAddDependency = async () => {
    if (!selectedBlocker) return;

    setLinking(true);
    try {
      const blockerTask = allTasks.find(t => t.id === selectedBlocker);
      
      // Update current task's blocked_by
      const updatedBlockedBy = [...(task.blocked_by || []), selectedBlocker];
      await base44.entities.IncidentTask.update(task.id, { blocked_by: updatedBlockedBy });

      // Update blocker task's blocks
      const updatedBlocks = [...(blockerTask.blocks || []), task.id];
      await base44.entities.IncidentTask.update(selectedBlocker, { blocks: updatedBlocks });

      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
      setSelectedBlocker('');
      toast.success('Dependency added');
    } catch (error) {
      toast.error('Failed to add dependency');
    } finally {
      setLinking(false);
    }
  };

  // Remove dependency
  const handleRemoveDependency = async (blockerId) => {
    try {
      const blockerTask = allTasks.find(t => t.id === blockerId);

      // Update current task
      const updatedBlockedBy = (task.blocked_by || []).filter(id => id !== blockerId);
      await base44.entities.IncidentTask.update(task.id, { blocked_by: updatedBlockedBy });

      // Update blocker task
      const updatedBlocks = (blockerTask.blocks || []).filter(id => id !== task.id);
      await base44.entities.IncidentTask.update(blockerId, { blocks: updatedBlocks });

      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
      toast.success('Dependency removed');
    } catch (error) {
      toast.error('Failed to remove dependency');
    }
  };

  // Get available blockers (exclude this task and already blocked)
  const availableBlockers = allTasks?.filter(t =>
    t.id !== task.id && !task?.blocked_by?.includes(t.id) && t.incident_id === incidentId
  ) || [];

  return (
    <div className="space-y-4">
      {/* Blocked by section */}
      {blockerTasks.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="font-medium text-red-900 text-sm">Blocked by {blockerTasks.length} task(s)</p>
          </div>
          <div className="space-y-1">
            {blockerTasks.map(blocker => (
              <div key={blocker.id} className="flex items-center justify-between p-2 bg-white rounded border-l-2 border-red-400">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{blocker.title}</p>
                  <p className="text-xs text-slate-600">Status: {blocker.status}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveDependency(blocker.id)}
                  className="h-7 w-7 p-0"
                >
                  <Unlink2 className="w-3 h-3 text-slate-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add dependency section */}
      <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
        <p className="text-xs font-medium text-slate-700">Mark as blocked by</p>
        <div className="flex gap-2">
          <Select value={selectedBlocker} onValueChange={setSelectedBlocker}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Select blocking task..." />
            </SelectTrigger>
            <SelectContent>
              {availableBlockers.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAddDependency}
            disabled={!selectedBlocker || linking}
            className="h-8"
          >
            {linking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Link2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Blocks section */}
      {blockedTasks.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <p className="font-medium text-blue-900 text-sm">Blocking {blockedTasks.length} task(s)</p>
          </div>
          <div className="space-y-1">
            {blockedTasks.map(blocked => (
              <div key={blocked.id} className="flex items-center justify-between p-2 bg-white rounded border-l-2 border-blue-400">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{blocked.title}</p>
                  <p className="text-xs text-slate-600">Status: {blocked.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}