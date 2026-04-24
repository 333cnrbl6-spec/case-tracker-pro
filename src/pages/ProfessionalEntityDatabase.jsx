import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Edit2, Loader2, User, Award, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfessionalEntityDatabase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    surveyor_name: '',
    rics_registration_number: '',
    specialism: '',
    qualifications: [],
    disciplinary_history: '',
    years_in_profession: ''
  });

  const queryClient = useQueryClient();

  const { data: surveyors = [] } = useQuery({
    queryKey: ['surveyor-profiles'],
    queryFn: () => base44.entities.RICSSurveyorProfile.list('-rics_registration_number'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RICSSurveyorProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyor-profiles'] });
      setFormData({
        surveyor_name: '',
        rics_registration_number: '',
        specialism: '',
        qualifications: [],
        disciplinary_history: '',
        years_in_profession: ''
      });
      setShowForm(false);
      toast.success('Surveyor added to database');
    },
    onError: (e) => toast.error(e.message)
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.RICSSurveyorProfile.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyor-profiles'] });
      setEditingId(null);
      setShowForm(false);
      setFormData({
        surveyor_name: '',
        rics_registration_number: '',
        specialism: '',
        qualifications: [],
        disciplinary_history: '',
        years_in_profession: ''
      });
      toast.success('Surveyor updated');
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RICSSurveyorProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveyor-profiles'] });
      toast.success('Surveyor removed from database');
    },
    onError: (e) => toast.error(e.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.surveyor_name) {
      toast.error('Surveyor name required');
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (surveyor) => {
    setEditingId(surveyor.id);
    setFormData({
      surveyor_name: surveyor.surveyor_name,
      rics_registration_number: surveyor.rics_registration_number || '',
      specialism: surveyor.specialism || '',
      qualifications: surveyor.qualifications || [],
      disciplinary_history: surveyor.disciplinary_history || '',
      years_in_profession: surveyor.years_in_profession || ''
    });
    setShowForm(true);
  };

  const filteredSurveyors = surveyors.filter(s =>
    s.surveyor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rics_registration_number?.includes(searchTerm) ||
    s.specialism?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const withDisciplinaryIssues = filteredSurveyors.filter(s => s.disciplinary_history);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Professional Entity Database</h1>
            <p className="text-slate-600 mt-1">Searchable directory of surveyors and contractors for conflict detection</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="w-4 h-4" /> Add Surveyor
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, RICS number, or specialism..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warnings Banner */}
        {withDisciplinaryIssues.length > 0 && (
          <Card className="mb-6 bg-orange-50 border-orange-200">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">{withDisciplinaryIssues.length} surveyor{withDisciplinaryIssues.length > 1 ? 's' : ''} with disciplinary history</p>
                <p className="text-xs text-orange-800 mt-1">These profiles will trigger high-severity alerts when appearing in new cases</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {showForm && (
          <Card className="mb-6 border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Surveyor' : 'Add New Surveyor'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Surveyor Name *</label>
                    <Input
                      value={formData.surveyor_name}
                      onChange={(e) => setFormData({ ...formData, surveyor_name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">RICS Registration Number</label>
                    <Input
                      value={formData.rics_registration_number}
                      onChange={(e) => setFormData({ ...formData, rics_registration_number: e.target.value })}
                      placeholder="e.g., MRICS123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Specialism</label>
                  <Input
                    value={formData.specialism}
                    onChange={(e) => setFormData({ ...formData, specialism: e.target.value })}
                    placeholder="e.g., Residential, Commercial, Valuation"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Years in Profession</label>
                  <Input
                    type="number"
                    value={formData.years_in_profession}
                    onChange={(e) => setFormData({ ...formData, years_in_profession: parseFloat(e.target.value) })}
                    placeholder="e.g., 15"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Disciplinary History</label>
                  <textarea
                    value={formData.disciplinary_history}
                    onChange={(e) => setFormData({ ...formData, disciplinary_history: e.target.value })}
                    placeholder="Leave blank if none. Describe any RICS complaints, warnings, or sanctions."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    rows="3"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({
                        surveyor_name: '',
                        rics_registration_number: '',
                        specialism: '',
                        qualifications: [],
                        disciplinary_history: '',
                        years_in_profession: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Database Records ({filteredSurveyors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSurveyors.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>{searchTerm ? 'No surveyors match your search' : 'No surveyors in database yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSurveyors.map(surveyor => (
                  <div key={surveyor.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{surveyor.surveyor_name}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {surveyor.rics_registration_number && (
                            <Badge variant="secondary" className="text-xs">{surveyor.rics_registration_number}</Badge>
                          )}
                          {surveyor.specialism && (
                            <Badge variant="outline" className="text-xs">{surveyor.specialism}</Badge>
                          )}
                          {surveyor.disciplinary_history && (
                            <Badge className="bg-red-100 text-red-800 text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Disciplinary record
                            </Badge>
                          )}
                        </div>
                        {surveyor.disciplinary_history && (
                          <p className="text-xs text-red-700 mt-2 bg-red-50 rounded p-2">{surveyor.disciplinary_history}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(surveyor)}
                          className="gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteMutation.mutate(surveyor.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}