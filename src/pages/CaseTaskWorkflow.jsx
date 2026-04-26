import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, RefreshCw, Loader2, Calendar, User, Zap, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { daysUntil } from '@/lib/dateUtils';
import TaskDetailModal from '@/components/TaskDetailModal';

const COLUMNS = {
  not_started: { title: 'To Do', color: 'bg-slate-50', borderColor: 'border-slate-300' },
  under_investigation: { title: 'In Progress', color: 'bg-blue-50', borderColor: 'border-blue-300' },
  evidence_review: { title: 'Review', color: 'bg-purple-50', borderColor: 'border-purple-300' },
  resolution: { title: 'Resolution', color: 'bg-amber-50', borderColor: 'border-amber-300' },
  completed: { title: 'Completed', color: 'bg-green-50', borderColor: 'border-green-300' },
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function CaseTaskWorkflow() {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState([]);
  const [incidents, setIncidents] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch tasks and incidents
  const { data: tasksData = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['incident-tasks'],
    queryFn: () => base44.entities.IncidentTask.list('-created_date'),
  });

  const { data: incidentsData = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  // Build incident map
  useEffect(() => {
    const map = {};
    incidentsData.forEach(incident => {
      map[incident.id] = incident;
    });
    setIncidents(map);
  }, [incidentsData]);

  // Update tasks on data change
  useEffect(() => {
    setTasks(tasksData);
  }, [tasksData]);

  // Mutation for updating task status
  const updateTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.IncidentTask.update(data.id, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
      toast.success('Task status updated');
    },
    onError: (err) => toast.error(err.message),
  });

  // Mutation for checking overdue tasks and sending notifications
  const checkOverdueMutation = useMutation({
    mutationFn: () => base44.functions.invoke('checkAndNotifyOverdueTasks', {}),
    onSuccess: (response) => {
      const count = response.data?.notified_count || 0;
      toast.success(`${count} overdue task notification${count !== 1 ? 's' : ''} sent`);
      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = draggableId;
    const newStatus = destination.droppableId;

    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const isTaskOverdue = (task) => {
    if (!task.deadline) return false;
    return daysUntil(task.deadline) < 0;
  };

  const tasksByStatus = {};
  Object.keys(COLUMNS).forEach(status => {
    tasksByStatus[status] = getTasksByStatus(status);
  });

  const overdueCount = tasks.filter(t => isTaskOverdue(t) && t.status !== 'completed').length;

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Case Task Workflow
              {overdueCount > 0 && (
                <Badge className="bg-red-600 text-white ml-2">{overdueCount} overdue</Badge>
              )}
            </h1>
            <p className="text-slate-600 mt-1">Drag tasks between columns to update status · Auto-notify fee earners of overdue tasks</p>
          </div>
          <Button
            onClick={() => checkOverdueMutation.mutate()}
            disabled={checkOverdueMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {checkOverdueMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Checking...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" /> Check & Notify Overdue
              </>
            )}
          </Button>
        </div>

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">{overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</p>
                <p className="text-xs text-red-800 mt-1">Click "Check & Notify Overdue" to alert assigned fee earners</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {Object.entries(COLUMNS).map(([statusKey, column]) => (
              <div key={statusKey} className="flex flex-col">
                <div className="mb-4">
                  <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    {column.title}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      ({tasksByStatus[statusKey].length})
                    </span>
                  </h2>
                </div>

                <Droppable droppableId={statusKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 rounded-lg border-2 border-dashed ${column.color} ${
                        snapshot.isDraggingOver ? 'bg-opacity-60 border-opacity-100' : 'border-opacity-40'
                      } min-h-[600px] transition-all`}
                    >
                      <div className="space-y-3">
                        {tasksByStatus[statusKey].map((task, index) => {
                          const incident = incidents[task.incident_id];
                          const isOverdue = isTaskOverdue(task);

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-lg border-l-4 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                                    isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-slate-300'
                                  } ${snapshot.isDragging ? 'shadow-lg rotate-3' : ''}`}
                                >
                                  {/* Task Title */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="font-semibold text-sm text-slate-900 leading-tight flex-1">
                                      {task.title}
                                    </p>
                                    {isOverdue && (
                                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>

                                  {/* Incident Info */}
                                  {incident && (
                                    <p className="text-xs text-slate-600 mb-2 truncate">
                                      Incident: {incident.title}
                                    </p>
                                  )}

                                  {/* Priority Badge */}
                                  {task.priority && (
                                    <div className="mb-2">
                                      <Badge className={PRIORITY_COLORS[task.priority]}>
                                        {task.priority}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Deadline */}
                                  {task.deadline && (
                                    <div className="flex items-center gap-1 text-xs mb-2">
                                      <Calendar className="w-3 h-3 text-slate-500" />
                                      <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                                        {isOverdue
                                          ? `Overdue ${Math.abs(daysUntil(task.deadline))}d`
                                          : `Due in ${daysUntil(task.deadline)}d`}
                                      </span>
                                    </div>
                                  )}

                                  {/* Assigned To */}
                                  {task.assigned_to && (
                                    <div className="flex items-center gap-1 text-xs text-slate-600">
                                      <User className="w-3 h-3" />
                                      <span className="truncate">{task.assigned_to}</span>
                                    </div>
                                  )}

                                  {/* View Details Button */}
                                  <Button
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setModalOpen(true);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-2 text-xs h-7 gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    View & Comment
                                  </Button>
                                  </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(COLUMNS).map(([statusKey, column]) => (
            <Card key={statusKey}>
              <CardContent className="pt-4">
                <p className="text-xs text-slate-600 uppercase font-semibold">{column.title}</p>
                <p className="text-2xl font-bold text-slate-900">{tasksByStatus[statusKey].length}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            incident={incidents[selectedTask.incident_id]}
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}