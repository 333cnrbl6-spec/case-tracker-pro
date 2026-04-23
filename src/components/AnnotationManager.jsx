import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Link as LinkIcon, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnotationManager({ evidenceId, onAnnotationSaved = () => {} }) {
  const [editingId, setEditingId] = useState(null);
  const [selectedRules, setSelectedRules] = useState([]);
  const [significance, setSignificance] = useState('supporting');
  const [annotationNote, setAnnotationNote] = useState('');
  const queryClient = useQueryClient();

  const { data: annotations = [] } = useQuery({
    queryKey: ['annotations', evidenceId],
    queryFn: () => base44.entities.Annotation.filter({ evidence_id: evidenceId })
  });

  const { data: ricsRules = [] } = useQuery({
    queryKey: ['rics-rules'],
    queryFn: () => base44.entities.RICSRule.list('-updated_date', 50)
  });

  const updateAnnotationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Annotation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', evidenceId] });
      setEditingId(null);
      setSelectedRules([]);
      setAnnotationNote('');
      toast.success('Annotation updated');
      onAnnotationSaved();
    }
  });

  const deleteAnnotationMutation = useMutation({
    mutationFn: (id) => base44.entities.Annotation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', evidenceId] });
      toast.success('Annotation deleted');
      onAnnotationSaved();
    }
  });

  const handleSaveAnnotation = () => {
    if (!editingId) return;
    updateAnnotationMutation.mutate({
      id: editingId,
      data: {
        linked_rics_rules: selectedRules,
        annotation_note: annotationNote,
        significance
      }
    });
  };

  const handleEditAnnotation = (annotation) => {
    setEditingId(annotation.id);
    setSelectedRules(annotation.linked_rics_rules || []);
    setAnnotationNote(annotation.annotation_note || '');
    setSignificance(annotation.significance || 'supporting');
  };

  const significanceColors = {
    supporting: 'bg-blue-100 text-blue-800',
    critical: 'bg-red-100 text-red-800',
    contextual: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            Annotations & Rule Linking ({annotations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {annotations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Highlight text in the document to create annotations
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">
                        "{annotation.highlight_text.substring(0, 60)}..."
                      </p>
                      <Badge className={`mt-2 text-xs capitalize ${significanceColors[annotation.significance]}`}>
                        {annotation.significance}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAnnotation(annotation)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteAnnotationMutation.mutate(annotation.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {annotation.annotation_note && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded mb-3 italic">
                      "{annotation.annotation_note}"
                    </p>
                  )}

                  {annotation.linked_rics_rules?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Linked Rules:</p>
                      <div className="flex flex-wrap gap-2">
                        {annotation.linked_rics_rules.map((ruleId) => {
                          const rule = ricsRules.find(r => r.id === ruleId);
                          return (
                            <Badge key={ruleId} variant="outline" className="text-xs">
                              {rule?.rule_number || ruleId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Annotation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Significance</label>
              <Select value={significance} onValueChange={setSignificance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supporting">Supporting Evidence</SelectItem>
                  <SelectItem value="critical">Critical Evidence</SelectItem>
                  <SelectItem value="contextual">Contextual Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Interpretation Note</label>
              <Textarea
                placeholder="Explain why this passage is important..."
                value={annotationNote}
                onChange={(e) => setAnnotationNote(e.target.value)}
                className="mt-1 min-h-20"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Link to RICS Rules</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                {ricsRules.map((rule) => (
                  <label key={rule.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRules.includes(rule.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRules([...selectedRules, rule.id]);
                        } else {
                          setSelectedRules(selectedRules.filter(id => id !== rule.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-xs text-slate-700 font-medium">{rule.rule_number}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={handleSaveAnnotation}
                disabled={updateAnnotationMutation.isPending}
              >
                {updateAnnotationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}