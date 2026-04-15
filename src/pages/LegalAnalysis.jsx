import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Scale, Info } from 'lucide-react';

const LEGAL_FRAMEWORKS = [
  {
    id: 'negligence',
    title: 'Professional Negligence',
    jurisdiction: 'Common Law (UK & other jurisdictions)',
    description: 'Breach of duty of care owed to client resulting in loss',
    elements: [
      'Duty of care owed (surveyor-client relationship)',
      'Breach of standard of care (professional negligence)',
      'Causation (breach caused the loss)',
      'Quantifiable loss or damage'
    ],
    examples: [
      'Incompetent survey or valuation',
      'Failure to identify defects a competent surveyor would find',
      'Inadequate investigation or analysis',
      'Failure to advise on material risks'
    ]
  },
  {
    id: 'breach_contract',
    title: 'Breach of Contract',
    jurisdiction: 'Contract Law (UK)',
    description: 'Failure to perform contractual obligations',
    elements: [
      'Valid contract for services exists',
      'Breach of specific terms or implied terms',
      'Resulting loss or damage',
      'Breach not excused by circumstances'
    ],
    examples: [
      'Failure to complete services as agreed',
      'Delivery of reports outside agreed timeframe',
      'Failure to meet contractual quality standards',
      'Unreasonable restriction of access or information'
    ]
  },
  {
    id: 'harassment',
    title: 'Harassment & Intimidation',
    jurisdiction: 'Protection from Harassment Act 1997 (UK)',
    description: 'Course of conduct causing alarm or distress',
    elements: [
      'Pattern of unwanted conduct (not isolated incident)',
      'Intended to cause alarm/distress OR reckless as to effect',
      'Actual effect: alarm or distress',
      'Reasonable person would regard as harassment'
    ],
    examples: [
      'Repeated threatening communications',
      'Deliberate blocking of access to information',
      'Intimidation tactics or aggressive behavior patterns',
      'Isolation from other professionals/advisors'
    ]
  },
  {
    id: 'discrimination',
    title: 'Discrimination',
    jurisdiction: 'Equality Act 2010 (UK)',
    description: 'Unfair treatment based on protected characteristics',
    elements: [
      'Less favorable treatment compared to comparable person',
      'Based on protected characteristic (age, disability, gender, etc.)',
      'In provision of services or goods',
      'No objective justification'
    ],
    examples: [
      'Denial of services based on protected attribute',
      'Different treatment than other clients',
      'Unequal access or communication restrictions'
    ]
  },
  {
    id: 'misrepresentation',
    title: 'Misrepresentation',
    jurisdiction: 'Misrepresentation Act 1967 (UK)',
    description: 'False statements inducing contract or transaction',
    elements: [
      'False statement of fact (not opinion)',
      'Known to be false OR reckless as to truth',
      'Induced reliance on the misrepresentation',
      'Resulting loss'
    ],
    examples: [
      'False credentials or qualifications',
      'Misrepresenting survey findings',
      'False statements about scope of work',
      'Misleading cost or fee information'
    ]
  },
  {
    id: 'defamation',
    title: 'Defamation / Malicious Falsehood',
    jurisdiction: 'Common Law (UK)',
    description: 'False statements causing damage to reputation',
    elements: [
      'Statement published to third party',
      'Statement identifies claimant clearly',
      'Statement is false',
      'Causes real damage'
    ],
    examples: [
      'False allegations about character or conduct',
      'Misrepresenting facts in reports about others',
      'Making false accusations'
    ]
  },
  {
    id: 'abuse_process',
    title: 'Abuse of Process / Improper Conduct',
    jurisdiction: 'Common Law & Professional Disciplinary Bodies',
    description: 'Using position or process improperly',
    elements: [
      'Position of authority or trust misused',
      'Deliberate restriction of rights or access',
      'Pattern of deliberate obstruction',
      'Demonstrable prejudice or harm'
    ],
    examples: [
      'Preventing independent professional review',
      'Withholding information for improper purpose',
      'Using intermediary position to control narrative',
      'Deliberate gatekeeping that damages client'
    ]
  }
];

export default function LegalAnalysis() {
  const [selectedIssues, setSelectedIssues] = useState({});

  const toggleIssue = (id) => {
    setSelectedIssues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const relevantIssuesCount = Object.values(selectedIssues).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Legal Analysis & Grounds for Action</h1>
          <p className="text-slate-600">Identify potential legal violations and available remedies</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-600" />
              Legal Assessment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 mb-4">
              Below are UK legal frameworks under which Malcolm Belcher's conduct could potentially be challenged. Select the legal areas that apply to your situation.
            </p>
            {relevantIssuesCount > 0 && (
              <div className="bg-white/60 p-3 rounded border border-blue-200">
                <p className="text-sm font-medium text-slate-900">
                  {relevantIssuesCount} legal framework{relevantIssuesCount !== 1 ? 's' : ''} identified as potentially relevant.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal Frameworks */}
        <div className="space-y-4">
          {LEGAL_FRAMEWORKS.map((framework) => {
            const isSelected = selectedIssues[framework.id] || false;

            return (
              <Card 
                key={framework.id} 
                className={`cursor-pointer transition-all ${isSelected ? 'border-2 border-indigo-600 bg-indigo-50' : 'hover:shadow-md'}`}
                onClick={() => toggleIssue(framework.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-3">
                      {isSelected ? (
                        <input type="checkbox" checked className="w-5 h-5 rounded" />
                      ) : (
                        <input type="checkbox" className="w-5 h-5 rounded" />
                      )}
                      {framework.title}
                    </span>
                    <Badge variant="outline">{framework.jurisdiction}</Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-2">{framework.description}</p>
                </CardHeader>

                {isSelected && (
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Legal Elements Required
                      </h4>
                      <ul className="space-y-2">
                        {framework.elements.map((element, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex gap-3">
                            <input type="checkbox" className="mt-0.5 w-4 h-4" />
                            <span>{element}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Relevant Examples
                      </h4>
                      <ul className="space-y-1">
                        {framework.examples.map((example, idx) => (
                          <li key={idx} className="text-sm text-slate-700 list-disc list-inside">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-100 border-l-4 border-blue-600 p-3 rounded">
                      <p className="text-xs text-slate-800">
                        <strong>Next Steps:</strong> To pursue this avenue, you would need to consult with a solicitor specializing in {framework.title.toLowerCase()} to assess the strength of evidence and likelihood of success.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Recommendations */}
        <Card className="mt-8 bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Important Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>
              1. <strong>Document everything:</strong> Keep detailed records of all incidents, communications, and evidence with dates and context.
            </p>
            <p>
              2. <strong>Professional consultation:</strong> Before taking legal action, consult with a solicitor specializing in the relevant area (professional negligence, disciplinary, etc.).
            </p>
            <p>
              3. <strong>Parallel routes:</strong> Consider both RICS disciplinary complaint AND legal action — these are separate processes with different standards and outcomes.
            </p>
            <p>
              4. <strong>Statute of limitations:</strong> Be aware of time limits for legal claims (typically 6 years from breach, but varies).
            </p>
            <p>
              5. <strong>Evidence preservation:</strong> Keep all original communications, documents, and records. Do not alter or destroy anything.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}