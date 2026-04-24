import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Send,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const UPDATE_TYPES = {
  progress_update: { label: 'Progress Update', icon: '📊', color: 'bg-blue-100 text-blue-800' },
  feedback: { label: 'Feedback', icon: '💬', color: 'bg-green-100 text-green-800' },
  signature_request: { label: 'Signature Request', icon: '✍️', color: 'bg-purple-100 text-purple-800' },
  document_share: { label: 'Document Share', icon: '📄', color: 'bg-orange-100 text-orange-800' },
  milestone: { label: 'Milestone', icon: '🎯', color: 'bg-yellow-100 text-yellow-800' },
};

const SIGNATURE_STATUS = {
  not_requested: { label: 'Not Requested', icon: AlertCircle, color: 'text-slate-500' },
  pending: { label: 'Pending', icon: Clock, color: 'text-orange-500' },
  signed: { label: 'Signed', icon: CheckCircle2, color: 'text-green-500' },
  rejected: { label: 'Rejected', icon: AlertCircle, color: 'text-red-500' },
};

export default function ClientPortalManager() {
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'progress_update',
    title: '',
    content: '',
    signature_required: false,
    deadline: '',
    sentiment: 'neutral',
    document_url: '',
    document_name: '',
  });

  // Fetch cases
  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list('-created_date'),
  });

  // Fetch client updates
  const { data: updates = [] } = useQuery({
    queryKey: ['client-updates', selectedCaseId],
    queryFn: () =>
      selectedCaseId
        ? base44.entities.ClientUpdate.filter({
            case_id: selectedCaseId,
            visibility: 'public',
          })
        : Promise.resolve([]),
    enabled: !!selectedCaseId,
  });

  // Create update mutation
  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ClientUpdate.create({
        ...data,
        case_id: selectedCaseId,
        case_ref: cases.find((c) => c.id === selectedCaseId)?.case_ref,
        visibility: 'public',
        published_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-updates', selectedCaseId] });
      setOpen(false);
      setFormData({
        type: 'progress_update',
        title: '',
        content: '',
        signature_required: false,
        deadline: '',
        sentiment: 'neutral',
        document_url: '',
        document_name: '',
      });
      toast.success('Update published to client portal');
    },
    onError: (e) => toast.error(e.message),
  });

  // Mark as viewed mutation
  const viewedMutation = useMutation({
    mutationFn: (updateId) =>
      base44.entities.ClientUpdate.update(updateId, {
        client_viewed: true,
        client_viewed_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-updates', selectedCaseId] });
    },
  });

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const recentUpdates = [...updates].reverse().slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Send className="w-8 h-8" />
            Client Portal Manager
          </h1>
          <p className="text-slate-600 mt-2">
            Share progress updates, request signatures, and manage client communications
          </p>
        </div>

        {/* Case Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="max-w-xs">
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_ref} - {c.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedCaseId && (
          <>
            {/* Header with button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedCase?.client_name}
                </h2>
                <p className="text-sm text-slate-600">
                  {selectedCase?.case_ref}
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    <Plus className="w-4 h-4" />
                    New Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Publish Update to Client Portal</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Update Type
                      </label>
                      <Select
                        value={formData.type}
                        onValueChange={(v) =>
                          setFormData({ ...formData, type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(UPDATE_TYPES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.icon} {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Title *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Update title"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Message *
                      </label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="Client-facing message..."
                        className="min-h-24"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Tone
                      </label>
                      <Select
                        value={formData.sentiment}
                        onValueChange={(v) =>
                          setFormData({ ...formData, sentiment: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">
                            ✅ Positive (Good news)
                          </SelectItem>
                          <SelectItem value="neutral">
                            ℹ️ Neutral (Information)
                          </SelectItem>
                          <SelectItem value="cautionary">
                            ⚠️ Cautionary (Warning)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Signature Request Section */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="sig-required"
                          checked={formData.signature_required}
                          onCheckedChange={(v) =>
                            setFormData({
                              ...formData,
                              signature_required: v,
                            })
                          }
                        />
                        <label
                          htmlFor="sig-required"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Request Document Signature
                        </label>
                      </div>

                      {formData.signature_required && (
                        <>
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Document Name
                            </label>
                            <Input
                              value={formData.document_name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  document_name: e.target.value,
                                })
                              }
                              placeholder="e.g. Settlement Agreement"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Document URL
                            </label>
                            <Input
                              value={formData.document_url}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  document_url: e.target.value,
                                })
                              }
                              placeholder="https://..."
                              type="url"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Signature Deadline
                            </label>
                            <Input
                              type="date"
                              value={formData.deadline}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  deadline: e.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending
                          ? 'Publishing...'
                          : 'Publish Update'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Updates List */}
            <div className="space-y-3">
              {recentUpdates.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-slate-400">
                    No updates published yet
                  </p>
                </Card>
              ) : (
                recentUpdates.map((update) => (
                  <Card key={update.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-lg">
                              {UPDATE_TYPES[update.type].icon}
                            </span>
                            <Badge className={UPDATE_TYPES[update.type].color}>
                              {UPDATE_TYPES[update.type].label}
                            </Badge>
                            {update.client_viewed && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 text-xs"
                              >
                                <Eye className="w-3 h-3" />
                                Viewed
                              </Badge>
                            )}
                            {update.signature_required && (
                              <Badge
                                variant={
                                  update.signature_status === 'signed'
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {
                                  SIGNATURE_STATUS[update.signature_status]
                                    .label
                                }
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-2">
                            {update.title}
                          </h3>
                          <p className="text-slate-700 mb-3">
                            {update.content}
                          </p>

                          {update.signature_required && (
                            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm mb-3">
                              <p className="font-medium mb-1">
                                📄 {update.document_name}
                              </p>
                              {update.deadline && (
                                <p className="text-xs text-slate-600">
                                  Deadline:{' '}
                                  {new Date(
                                    update.deadline
                                  ).toLocaleDateString('en-GB')}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>
                              {new Date(update.created_date).toLocaleDateString(
                                'en-GB'
                              )}
                            </span>
                            {update.client_viewed_at && (
                              <span>
                                Client viewed:{' '}
                                {new Date(
                                  update.client_viewed_at
                                ).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {!update.client_viewed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewedMutation.mutate(update.id)}
                            >
                              Mark Viewed
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}