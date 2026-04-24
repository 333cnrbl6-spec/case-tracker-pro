import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CASE_TYPE_STRUCTURES } from '@/lib/caseTypeStructures';

export default function CaseTypeGuidance({ caseType }) {
  const [expandedSections, setExpandedSections] = useState({});
  const structure = CASE_TYPE_STRUCTURES[caseType];

  if (!structure) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-100">
            No guidance available for this case type
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{structure.name} Case Guidance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {structure.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Governing Framework
              </p>
              <div className="space-y-1">
                {structure.governing_framework.map((item, idx) => (
                  <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                    • {item}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Professional Bodies
              </p>
              <div className="space-y-1">
                {structure.professional_bodies.map((body, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {body}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Limitation Rules */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
              ⏰ Limitation Period
            </p>
            {typeof structure.limitation_rules === 'object' ? (
              <div className="space-y-1">
                {Object.entries(structure.limitation_rules).map(([key, value]) => (
                  <p key={key} className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>{key}:</strong> {value}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {structure.limitation_rules}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Essential Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Essential Legal Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(structure.essential_elements).map(([key, element]) => (
            <div
              key={key}
              className="border rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => toggleSection(`element_${key}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {element.description}
                  </p>
                </div>
                {expandedSections[`element_${key}`] ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {expandedSections[`element_${key}`] && (
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Guidance:</strong> {element.guidance}
                  </p>
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Evidence Required:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {element.evidence_types.map((evidence, idx) => (
                        <li
                          key={idx}
                          className="text-slate-600 dark:text-slate-400 ml-2"
                        >
                          {evidence.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Key Deadlines */}
      {structure.key_deadlines && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📅 Critical Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(structure.key_deadlines).map(([key, deadline]) => (
              <div key={key} className="flex items-start gap-3 p-2 bg-orange-50 dark:bg-orange-950 rounded">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-orange-800 dark:text-orange-200">{deadline}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Damages Structure */}
      {structure.damages_structure && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Damages & Quantum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {structure.damages_structure.map((damage, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <p className="font-medium text-sm">{damage.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {damage.description}
                </p>
                {damage.items && (
                  <ul className="list-disc list-inside mt-2 space-y-0.5">
                    {damage.items.map((item, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 ml-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {damage.guidance && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                    {damage.guidance}
                  </p>
                )}
                {damage.calculation && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                    {damage.calculation}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Critical Checkpoints */}
      {structure.critical_checkpoints && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">✓ Critical Checkpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {structure.critical_checkpoints.map((checkpoint, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">{checkpoint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}