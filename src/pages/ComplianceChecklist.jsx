import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceChecklist() {
  const [selectedRules, setSelectedRules] = useState([]);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [checklistItems, setChecklistItems] = useState({});
  const [autoPopulated, setAutoPopulated] = useState(false);

  const { data: rules = [] } = useQuery({
    queryKey: ['rics-rules'],
    queryFn: () => base44.entities.RICSRule.list(),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  // Auto-populate rules from incidents with linked rules
  const handleAutoPopulateRules = () => {
    const linkedRuleIds = new Set();
    incidents.forEach(incident => {
      if (incident.data.rics_violations && Array.isArray(incident.data.rics_violations)) {
        incident.data.rics_violations.forEach(ruleNum => {
          const rule = rules.find(r => r.data.rule_number === ruleNum);
          if (rule) {
            linkedRuleIds.add(rule.id);
          }
        });
      }
    });
    if (linkedRuleIds.size > 0) {
      setSelectedRules(Array.from(linkedRuleIds));
      setAutoPopulated(true);
    }
  };

  const generateChecklist = useMutation({
    mutationFn: async () => {
      if (selectedRules.length === 0) {
        throw new Error('Select at least one rule');
      }

      const selectedRuleData = rules
        .filter(r => selectedRules.includes(r.id))
        .map(r => ({ id: r.id, ...r.data }));

      const selectedIncidentData = incidents
        .filter(i => selectedIncidents.includes(i.id))
        .map(i => ({ id: i.id, ...i.data }));

      const result = await base44.functions.invoke('generateComplianceChecklist', {
        rules: selectedRuleData,
        incidents: selectedIncidentData
      });

      const items = {};
      result.data.checklist.items.forEach(item => {
        items[item.id] = false;
      });

      setChecklist(result.data.checklist);
      setChecklistItems(items);
      return result.data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate checklist');
    }
  });

  const toggleRule = (id) => {
    setSelectedRules(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleIncident = (id) => {
    setSelectedIncidents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleItem = (itemId) => {
    setChecklistItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const downloadChecklist = () => {
    if (!checklist) return;

    const content = generateChecklistContent();
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Compliance_Checklist_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Checklist downloaded');
  };

  const generateChecklistContent = () => {
    if (!checklist) return '';

    let content = `RICS COMPLIANCE CHECKLIST\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    content += `= OVERVIEW =\n`;
    content += `Rules Reviewed: ${checklist.ruleCount}\n`;
    content += `Incidents Assessed: ${checklist.incidentCount}\n`;
    content += `Risk Level: ${checklist.overallRiskLevel}\n\n`;

    content += `= COMPLIANCE ITEMS =\n\n`;
    checklist.items.forEach(item => {
      const isChecked = checklistItems[item.id];
      content += `${isChecked ? '[✓]' : '[ ]'} ${item.description}\n`;
      if (item.relatedRule) {
        content += `    Rule: ${item.relatedRule}\n`;
      }
      if (item.action) {
        content += `    Action: ${item.action}\n`;
      }
      content += '\n';
    });

    const completedCount = Object.values(checklistItems).filter(Boolean).length;
    content += `= PROGRESS =\n`;
    content += `Completed: ${completedCount} of ${checklist.items.length}\n`;
    content += `Progress: ${Math.round((completedCount / checklist.items.length) * 100)}%\n`;

    return content;
  };

  if (checklist) {
    const completedCount = Object.values(checklistItems).filter(Boolean).length;
    const totalCount = checklist.items.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Compliance Checklist</h1>
              <p className="text-slate-600 mt-1">Generated: {new Date().toLocaleDateString()}</p>
            </div>
            <Button
              onClick={() => setChecklist(null)}
              variant="outline"
            >
              Generate New
            </Button>
          </div>

          {/* Progress */}
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Progress</span>
                  <span className="text-lg font-bold text-indigo-600">{completedCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">{progressPercent}% Complete</p>
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Rules</p>
                <p className="text-2xl font-bold text-slate-900">{checklist.ruleCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Incidents</p>
                <p className="text-2xl font-bold text-slate-900">{checklist.incidentCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Risk Level</p>
                <Badge className={
                  checklist.overallRiskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                  checklist.overallRiskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                  checklist.overallRiskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-green-100 text-green-800'
                }>
                  {checklist.overallRiskLevel}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Checklist Items */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.items.map(item => (
                <div key={item.id} className="flex gap-3 p-3 hover:bg-slate-50 rounded border border-slate-200">
                  <Checkbox
                    checked={checklistItems[item.id] || false}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${checklistItems[item.id] ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {item.description}
                    </p>
                    {item.relatedRule && (
                      <p className="text-xs text-indigo-600 mt-1">Rule: {item.relatedRule}</p>
                    )}
                    {item.action && (
                      <p className="text-xs text-slate-600 mt-1">Action: {item.action}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Download */}
          <div className="flex justify-end">
            <Button
              onClick={downloadChecklist}
              className="gap-2 bg-slate-900 hover:bg-slate-800"
            >
              <FileDown className="w-4 h-4" />
              Download Checklist
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Compliance Checklist Generator</h1>
          <p className="text-lg text-slate-600">Create compliance checklists based on RICS rules and incidents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rules Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select RICS Rules ({selectedRules.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {rules.length === 0 ? (
                <p className="text-sm text-slate-500">No rules available</p>
              ) : (
                rules.map(rule => (
                  rule.data && (
                    <div key={rule.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => toggleRule(rule.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          <span className="font-mono text-indigo-600">{rule.data.rule_number}</span> {rule.data.title}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">{rule.data.category}</Badge>
                      </div>
                    </div>
                  )
                ))
              )}
            </CardContent>
          </Card>

          {/* Incidents Selection */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Select Incidents ({selectedIncidents.length})</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAutoPopulateRules}
                    className="text-xs"
                  >
                    Auto-populate rules
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {incidents.length === 0 ? (
                <p className="text-sm text-slate-500">No incidents logged</p>
              ) : (
                incidents.map(incident => (
                  incident.data && (
                    <div key={incident.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox
                        checked={selectedIncidents.includes(incident.id)}
                        onChange={() => toggleIncident(incident.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{incident.data.title}</p>
                        <Badge variant="outline" className="mt-1 text-xs">{incident.data.severity}</Badge>
                      </div>
                    </div>
                  )
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => generateChecklist.mutate()}
            disabled={selectedRules.length === 0 || generateChecklist.isPending}
            size="lg"
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            {generateChecklist.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Generate Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}