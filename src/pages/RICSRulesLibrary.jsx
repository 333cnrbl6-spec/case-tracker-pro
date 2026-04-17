import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, Copy, Shield } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  "Professional Standards",
  "Competence",
  "Honesty and Integrity",
  "Conflicts of Interest",
  "Client Relations",
  "Complaints Handling",
  "Documentation",
  "Conduct & Behaviour"
];

const SEVERITY_COLORS = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-amber-100 text-amber-800',
  serious: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function RICSRulesLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedRule, setExpandedRule] = useState(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rics-rules'],
    queryFn: () => base44.entities.RICSRule.list(),
  });

  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const ruleData = rule.data;
      const matchesSearch = searchTerm === '' || 
        ruleData.rule_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ruleData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ruleData.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === null || ruleData.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [rules, searchTerm, selectedCategory]);

  const rulesByCategory = useMemo(() => {
    const grouped = {};
    filteredRules.forEach(rule => {
      const category = rule.data.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(rule);
    });
    return grouped;
  }, [filteredRules]);

  const copyRuleText = (rule) => {
    const text = `${rule.data.rule_number}: ${rule.data.title}\n\n${rule.data.description}`;
    navigator.clipboard.writeText(text);
    toast.success('Rule copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b pb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">RICS Rules of Conduct Library</h1>
          <p className="text-lg text-slate-600">Search and reference RICS professional standards and conduct requirements</p>
        </div>

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by rule number, title, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2 text-base"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All Categories
            </Button>
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Rules Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : Object.keys(rulesByCategory).length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-600 text-lg">No rules match your search criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900 sticky top-0 bg-white py-2">
                  {category}
                </h2>
                <div className="space-y-2">
                  {categoryRules.map((rule) => (
                    <Card
                      key={rule.id}
                      className={`cursor-pointer transition-all ${expandedRule === rule.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
                      onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Shield className="w-4 h-4 text-indigo-600" />
                              <span className="font-mono text-indigo-600 font-bold">{rule.data.rule_number}</span>
                              {rule.data.title}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={SEVERITY_COLORS[rule.data.severity_if_breached]}>
                              {rule.data.severity_if_breached}
                            </Badge>
                            {expandedRule === rule.id ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {expandedRule === rule.id && (
                        <CardContent className="space-y-4 border-t pt-4">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Rule Text</h4>
                            <p className="text-slate-700 text-sm leading-relaxed">{rule.data.description}</p>
                          </div>

                          {rule.data.guidance && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Guidance</h4>
                              <p className="text-slate-600 text-sm leading-relaxed">{rule.data.guidance}</p>
                            </div>
                          )}

                          {rule.data.compliance_points && rule.data.compliance_points.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Compliance Checkpoints</h4>
                              <ul className="space-y-1">
                                {rule.data.compliance_points.map((point, idx) => (
                                  <li key={idx} className="text-sm text-slate-700 flex gap-2">
                                    <span className="text-indigo-600">✓</span> {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {rule.data.related_rules && rule.data.related_rules.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">Related Rules</h4>
                              <div className="flex flex-wrap gap-2">
                                {rule.data.related_rules.map((relatedId, idx) => (
                                  <Badge key={idx} variant="outline">{relatedId}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyRuleText(rule);
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Rule
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">About This Library</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>This library contains RICS Rules of Conduct covering professional standards, competence, honesty and integrity, and conduct requirements.</p>
            <p>Use this reference to understand specific rules when documenting incidents and assessing regulatory compliance.</p>
            <p>Search by rule number (e.g., PS-1.1) or keyword to find relevant requirements quickly.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}