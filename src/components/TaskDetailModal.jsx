import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Calendar, AlertCircle, MessageCircle, Loader2, Upload, FileIcon, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { daysUntil } from '@/lib/dateUtils';
import { Input } from '@/components/ui/input';
import TaskDependencyManager from '@/components/TaskDependencyManager';

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function TaskDetailModal({ task, incident, isOpen, onClose, allTasks = [] }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        if (isMounted) setCurrentUser(user ?? null);
      } catch {
        if (isMounted) setCurrentUser(null);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  // Fetch task comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: () => {
      if (!task?.id) return [];
      return base44.entities.TaskComment.filter({ task_id: task.id }, '-created_date');
    },
    enabled: !!task?.id && isOpen,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content) => {
      const user = await currentUser;
      return base44.entities.TaskComment.create({
        task_id: task.id,
        content,
        author_email: user?.email || 'unknown@example.com',
        author_name: user?.full_name || 'Unknown',
        comment_type: 'update',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
      setCommentText('');
      toast.success('Comment added');
    },
    onError: (err) => toast.error(err.message),
  });

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      if (!currentUser) {
        toast.error('User not authenticated');
        setUploading(false);
        return;
      }

      const user = currentUser;
      const file = files[0];
      const response = await base44.integrations.Core.UploadFile({ file });

      if (response.file_url) {
        const currentAttachments = task.attachments || [];
        const newAttachment = {
          file_name: file.name,
          file_url: response.file_url,
          file_type: file.type,
          uploaded_by: user?.email || 'unknown@example.com',
          uploaded_at: new Date().toISOString(),
        };

        await base44.entities.IncidentTask.update(task.id, {
          attachments: [...currentAttachments, newAttachment],
        });

        queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
        toast.success('File uploaded successfully');
        e.target.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Handle file delete
  const handleDeleteAttachment = async (index) => {
    try {
      const currentAttachments = task.attachments || [];
      const updated = currentAttachments.filter((_, i) => i !== index);
      await base44.entities.IncidentTask.update(task.id, { attachments: updated });
      queryClient.invalidateQueries({ queryKey: ['incident-tasks'] });
      toast.success('Attachment removed');
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    createCommentMutation.mutate(commentText);
  };

  const isTaskOverdue = task?.deadline && daysUntil(task.deadline) < 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">{task?.title}</h2>
              {incident && (
                <p className="text-xs text-slate-600 mt-1">Incident: {incident.title}</p>
              )}
            </div>
            {isTaskOverdue && (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Status</p>
                  <p className="text-sm text-slate-900 capitalize">{task?.status?.replace(/_/g, ' ')}</p>
                </div>

                {/* Priority */}
                {task?.priority && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Priority</p>
                    <Badge className={PRIORITY_COLORS[task.priority]}>
                      {task.priority}
                    </Badge>
                  </div>
                )}

                {/* Deadline */}
                {task?.deadline && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Deadline</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className={`text-sm ${isTaskOverdue ? 'text-red-600 font-semibold' : 'text-slate-900'}`}>
                        {isTaskOverdue
                          ? `Overdue ${Math.abs(daysUntil(task.deadline))}d`
                          : `Due in ${daysUntil(task.deadline)}d`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Assigned To */}
                {task?.assigned_to && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Assigned To</p>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-900">{task.assigned_to}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {task?.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Description</p>
                  <p className="text-sm text-slate-700">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dependencies Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Task Dependencies</h3>
            <TaskDependencyManager 
              task={task} 
              incidentId={incident?.id} 
              allTasks={allTasks}
            />
          </div>

          {/* Attachments Section */}
          {(task?.attachments?.length > 0 || true) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Attachments</h3>
                <span className="text-xs text-slate-600 ml-auto">({task?.attachments?.length || 0})</span>
              </div>

              {/* Attachment List */}
              {task?.attachments && task.attachments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {task.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 flex-1 hover:text-indigo-600"
                      >
                        <FileIcon className="w-4 h-4 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{attachment.file_name}</p>
                          <p className="text-xs text-slate-500">
                            by {attachment.uploaded_by?.split('@')[0]}
                          </p>
                        </div>
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(index)}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Input */}
              <div className="relative">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="text-sm"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-slate-700" />
              <h3 className="font-semibold text-slate-900">Comments & Updates</h3>
              <span className="text-xs text-slate-600 ml-auto">({comments.length})</span>
            </div>

            {/* Comments List */}
            <ScrollArea className="h-64 border rounded-lg p-4 bg-slate-50">
              {commentsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="pb-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900">{comment.author_name}</p>
                            <p className="text-xs text-slate-500">{comment.author_email}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(comment.created_date).toLocaleDateString('en-GB', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-sm text-slate-800 mt-1 break-words">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No comments yet
                </div>
              )}
            </ScrollArea>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment, status update, or question..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-20 text-sm"
              />
              <Button
                onClick={handleAddComment}
                disabled={createCommentMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {createCommentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}