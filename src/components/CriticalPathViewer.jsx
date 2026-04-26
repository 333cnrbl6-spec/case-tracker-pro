import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export default function CriticalPathViewer({ tasks = [] }) {
  // Calculate critical path
  const criticalPath = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    // Validate tasks array
    const validTasks = tasks.filter(t => t && t.id);
    if (validTasks.length === 0) return [];

    // Find root tasks (not blocked by anything)
    const rootTasks = validTasks.filter(t => !Array.isArray(t?.blocked_by) || t.blocked_by.length === 0);
    
    // Build dependency graph with cycle detection
    const buildPath = (task, visited = new Set(), depth = 0) => {
      // Prevent infinite recursion
      if (depth > validTasks.length) return [task];
      if (!task?.id || visited.has(task.id)) return [task];
      
      const newVisited = new Set(visited);
      newVisited.add(task.id);

      const dependentTasks = validTasks.filter(t => 
        Array.isArray(task?.blocks) && task.blocks.includes(t?.id)
      );
      
      if (dependentTasks.length === 0) {
        return [task];
      }

      // Find the path with the most tasks
      let longestPath = [task];
      for (const dependent of dependentTasks) {
        if (dependent?.id && !newVisited.has(dependent.id)) {
          const subPath = buildPath(dependent, newVisited, depth + 1);
          if (subPath.length + 1 > longestPath.length) {
            longestPath = [task, ...subPath];
          }
        }
      }
      return longestPath;
    };

    let criticalPathTasks = [];
    for (const root of rootTasks) {
      const path = buildPath(root);
      if (path.length > criticalPathTasks.length) {
        criticalPathTasks = path;
      }
    }

    return criticalPathTasks;
  }, [tasks]);

  // Mark critical path tasks
  const criticalPathIds = new Set(criticalPath.map(t => t.id));

  // Group tasks by status
  const tasksByStatus = {
    completed: tasks.filter(t => t.status === 'completed' && criticalPathIds.has(t.id)),
    inProgress: tasks.filter(t => 
      ['under_investigation', 'evidence_review', 'resolution'].includes(t.status) && 
      criticalPathIds.has(t.id)
    ),
    blocked: tasks.filter(t => t.status === 'blocked' && criticalPathIds.has(t.id)),
    notStarted: tasks.filter(t => t.status === 'not_started' && criticalPathIds.has(t.id)),
  };

  const blockedCount = tasksByStatus.blocked.length;
  const completionRate = tasks.length > 0 
    ? Math.round((tasksByStatus.completed.length / tasks.length) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Critical Path Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded">
            <p className="text-xs text-slate-600">Critical Tasks</p>
            <p className="text-xl font-bold text-slate-900">{criticalPath.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-blue-600">Completion</p>
            <p className="text-xl font-bold text-blue-900">{completionRate}%</p>
          </div>
          <div className={`p-3 rounded ${blockedCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className={`text-xs ${blockedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Blocked Tasks
            </p>
            <p className={`text-xl font-bold ${blockedCount > 0 ? 'text-red-900' : 'text-green-900'}`}>
              {blockedCount}
            </p>
          </div>
        </div>

        {/* Critical path visualization */}
        {criticalPath.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">Dependency Chain</p>
            <div className="space-y-1">
              {criticalPath.map((task, index) => (
                <div key={task.id}>
                  <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{task.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {task.status}
                        </Badge>
                        {task.priority === 'critical' && (
                          <Badge className="text-xs bg-red-100 text-red-800">Critical</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < criticalPath.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-0.5 h-3 bg-indigo-300"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4">No critical path found</p>
        )}

        {/* Blocked tasks warning */}
        {blockedCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-900">
                {blockedCount} critical task{blockedCount !== 1 ? 's' : ''} blocked
              </p>
              <p className="text-xs text-red-700 mt-1">
                Resolve blocking dependencies to advance project timeline.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}