import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus, Trash2, ExternalLink } from 'lucide-react';
import AISummaryBanner from '@/components/AISummaryBanner';
import RiskScoreBadge from '@/components/RiskScoreBadge';
import { scoreCommunication } from '@/lib/riskScoring';
import AnnotationPanel from '../components/AnnotationPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const toneColors = {
  neutral: 'bg-slate-100 text-slate-800',
  professional: 'bg-green-100 text-green-800',
  dismissive: 'bg-yellow-100 text-yellow-800',
  aggressive: 'bg-orange-100 text-orange-800',
  threatening: 'bg-red-100 text-red-800',
  unprofessional: 'bg-purple-100 text-purple-800',
};

export default function Communications() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    type: 'email',
    from: '',
    to: '',
    subject: '',
    content: '',
    tone: 'neutral',
    concerning_elements: [],
  });

  const queryClient = useQueryClient();
  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.entities.Communication.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Communication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      setOpen(false);
      setFormData({
        date: '',
        type: 'email',
        from: '',
        to: '',
        subject: '',
        content: '',
        tone: 'neutral',
        concerning_elements: [],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Communication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Communications Log</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Communication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log Communication</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="phone_call">Phone Call</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">From</label>
                    <Input
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <Input
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Content/Summary</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="min-h-32"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="dismissive">Dismissive</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                      <SelectItem value="threatening">Threatening</SelectItem>
                      <SelectItem value="unprofessional">Unprofessional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {communications.length > 0 && (
          <div className="mb-6">
            <AISummaryBanner
              title="AI Summary — Communications"
              colorScheme="purple"
              prompt={`You are a legal compliance expert. Provide a concise 3–5 bullet point summary of the following communication thread for a RICS conduct investigation. Highlight: key patterns of behaviour, the most concerning communications, tone trends, and any evidence of misconduct or unprofessional conduct.

Communications (most recent first):
${communications.map((c, i) => `${i + 1}. [${c.tone?.toUpperCase()}] ${c.date} | ${c.type} | From: ${c.from} → To: ${c.to} | Subject: ${c.subject} | ${c.content ? c.content.slice(0, 200) : ''} ${c.concerning_elements?.length ? '| Concerning: ' + c.concerning_elements.join(', ') : ''}`).join('\n')}`}
            />
          </div>
        )}

        <div className="space-y-4">
          {communications.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500">No communications logged. Start documenting Belcher's communications.</p>
            </Card>
          ) : (
            communications.map((comm) => {
              const risk = scoreCommunication(comm);
              return (
              <Card key={comm.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base mb-2">
                        <MessageSquare className="w-4 h-4" />
                        {comm.subject}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap items-center">
                        <Badge variant="secondary">{comm.type}</Badge>
                        <Badge className={toneColors[comm.tone]}>
                          {comm.tone.charAt(0).toUpperCase() + comm.tone.slice(1)}
                        </Badge>
                        <span className="text-xs text-slate-500">{new Date(comm.date).toLocaleDateString()}</span>
                        <RiskScoreBadge score={risk.score} level={risk.level} size="sm" />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(comm.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">From:</p>
                      <p className="text-slate-600">{comm.from}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">To:</p>
                      <p className="text-slate-600">{comm.to}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded text-sm text-slate-700 max-h-48 overflow-y-auto">
                    {comm.content}
                  </div>
                  <AnnotationPanel
                    entityName="Communication"
                    recordId={comm.id}
                    field="annotations"
                    value={comm.annotations || ''}
                    queryKey={['communications']}
                  />
                </CardContent>
              </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}