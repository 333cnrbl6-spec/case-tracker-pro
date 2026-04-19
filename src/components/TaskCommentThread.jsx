import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Send, Loader2, AlertCircle, Paperclip, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const commentTypeColors = {
  update: 'bg-blue-100 text-blue-800 border-blue-300',
  discussion: 'bg-slate-100 text-slate-800 border-slate-300',
  resolution: 'bg-green-100 text-green-800 border-green-300',
  escalation: 'bg-red-100 text-red-800 border-red-300'
};

export default function TaskCommentThread({ taskId, taskAssignedTo }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('update');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return me;
    },
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: taskId }, '-created_date'),
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      return base44.entities.TaskComment.create(commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
      setNewComment('');
      setCommentType('update');
      setUploadedFiles([]);
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      task_id: taskId,
      content: newComment,
      author_email: user.email,
      author_name: user.full_name,
      comment_type: commentType,
      attachments: uploadedFiles,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFiles([...uploadedFiles, { file_name: file.name, file_url }]);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploadingFile(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Task Discussion</h3>
        <Badge variant="outline" className="ml-auto">
          {comments.length} comments
        </Badge>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No comments yet. Start the discussion!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-l-4 border-slate-200 pl-4 py-3 bg-slate-50 rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900">{comment.author_name}</p>
                  <p className="text-xs text-slate-500">{comment.author_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={commentTypeColors[comment.comment_type]}>
                    {comment.comment_type}
                  </Badge>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-2">{comment.content}</p>
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {comment.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" /> {att.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment or update on remediation progress..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-24"
          />

          <div className="flex gap-2 flex-wrap">
            {['update', 'discussion', 'resolution', 'escalation'].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={commentType === type ? 'default' : 'outline'}
                onClick={() => setCommentType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Attachments:</p>
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-700 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> {file.file_name}
                  </span>
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploadingFile}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4 mr-2" />
                )}
                Attach File
              </Button>
            </label>

            <Button
              onClick={handleAddComment}
              disabled={createCommentMutation.isPending || !newComment.trim()}
              className="ml-auto bg-blue-600 hover:bg-blue-700"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}