import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Search, Loader2 } from 'lucide-react';

export default function IncidentRulesPanel({ linkedRules, onUnlink }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: allRules = [], isLoading } = useQuery({
    queryKey: ['rics-rules'],
    queryFn: () => base44.entities.RICSRule.list(),
  });

  const linkedRuleDetails = allRules.filter(r => 
    linkedRules.includes(r.data.rule_number)
  );

  const availableRules = allRules.filter(r =>
    !linkedRules.includes(r.data.rule_number) &&
    (r.data.rule_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.data.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLinkRule = (ruleNumber) => {
    // This is typically handled by parent component, but can also be called here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linked RICS Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedRuleDetails.length === 0 ? (
          <p className="text-sm text-slate-500">No rules linked yet</p>
        ) : (
          <div className="space-y-2">
            {linkedRuleDetails.map(rule => (
              <div key={rule.id} className="flex items-start justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold text-slate-900">{rule.data.rule_number}</p>
                  <p className="text-sm text-slate-700">{rule.data.title}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {rule.data.category}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUnlink(rule.data.rule_number)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
          className="w-full"
        >
          <Search className="w-4 h-4 mr-2" />
          Add Rules
        </Button>

        {showSearch && (
          <div className="space-y-2 p-3 bg-slate-50 rounded border border-slate-200">
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableRules.slice(0, 10).map(rule => (
                  <button
                    key={rule.id}
                    onClick={() => {
                      // Parent component should handle this
                      handleLinkRule(rule.data.rule_number);
                    }}
                    className="w-full text-left p-2 hover:bg-white rounded text-sm"
                  >
                    <p className="font-mono font-semibold text-slate-900">{rule.data.rule_number}</p>
                    <p className="text-xs text-slate-600">{rule.data.title}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}