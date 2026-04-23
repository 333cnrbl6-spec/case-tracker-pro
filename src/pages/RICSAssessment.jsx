import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const RICS_STANDARDS = [
  {
    id: 'competence',
    title: 'Competence & Fitness',
    description: 'Providing services only within competence and ensuring fitness for professional conduct',
    indicators: [
      'Claims expertise outside qualifications',
      'Provides services without proper professional indemnity insurance',
      'Lacks relevant professional standards or up-to-date knowledge',
      'Unable to demonstrate competence in specific technical areas'
    ]
  },
  {
    id: 'conflict_of_interest',
    title: 'Conflicts of Interest',
    description: 'Managing or avoiding conflicts that could prejudice clients',
    indicators: [
      'Acts for multiple parties with conflicting interests without disclosure',
      'Personal financial interest in the outcome of the transaction',
      'Fails to disclose material conflicts to all parties',
      'Uses position to gain unfair advantage'
    ]
  },
  {
    id: 'communication',
    title: 'Clear Communication',
    description: 'Communicating openly and honestly with all parties',
    indicators: [
      'Withholds information from relevant parties',
      'Acts as sole communication channel to isolate decision-makers',
      'Misrepresents findings or advice',
      'Fails to provide clear scope of work or terms'
    ]
  },
  {
    id: 'honesty',
    title: 'Honesty & Integrity',
    description: 'Acting with honesty and integrity in all professional dealings',
    indicators: [
      'Misrepresents credentials or experience',
      'Provides false or misleading reports',
      'Engages in deceptive practices',
      'Violates client confidentiality improperly'
    ]
  },
  {
    id: 'gatekeeping',
    title: 'Gatekeeping & Access Control (Behavioral Red Flag)',
    description: 'Preventing inappropriate gatekeeping or isolation tactics',
    indicators: [
      'Controls all communication between principal and other advisors',
      'Restricts contractor or expert access to client/asset',
      'Creates information asymmetry deliberately',
      'Uses position to prevent scrutiny or independent advice',
      'Implements unreasonable communication restrictions'
    ]
  },
  {
    id: 'professionalism',
    title: 'Professional Conduct & Respect',
    description: 'Treating others professionally and respectfully',
    indicators: [
      'Harassment or bullying behavior toward colleagues or parties',
      'Aggressive or threatening communication',
      'Disrespectful conduct toward other professionals',
      'Abusive language or conduct patterns'
    ]
  },
  {
    id: 'transparency',
    title: 'Transparency & Disclosure',
    description: 'Being transparent about fees, interests, and processes',
    indicators: [
      'Lack of transparency in fee structures',
      'Undisclosed commissions or benefits',
      'Failure to disclose professional limitations',
      'Hiding material information from clients'
    ]
  }
];

export default function RICSAssessment() {
  const [assessments, setAssessments] = useState({});
  const [generating, setGenerating] = useState(false);

  const toggleAssessment = (standardId, indicatorIndex) => {
    const key = `${standardId}-${indicatorIndex}`;
    setAssessments(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetAssessment = () => {
    setAssessments({});
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateRICSComplaintReport', {
        assessments,
        surveyorName: 'Malcolm Belcher'
      });

      if (response.data.file_url) {
        const link = document.createElement('a');
        link.href = response.data.file_url;
        link.download = 'RICS_Complaint_Report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('RICS Complaint Report generated successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const getStandardStatus = (standardId) => {
    const standard = RICS_STANDARDS.find(s => s.id === standardId);
    const indicators = standard.indicators;
    const flaggedCount = indicators.filter((_, i) => assessments[`${standardId}-${i}`]).length;
    
    if (flaggedCount === 0) return 'none';
    if (flaggedCount <= 1) return 'minor';
    if (flaggedCount <= 2) return 'moderate';
    return 'severe';
  };

  const overallAssessment = () => {
    const statuses = RICS_STANDARDS.map(s => getStandardStatus(s.id));
    const severeCount = statuses.filter(s => s === 'severe').length;
    const moderateCount = statuses.filter(s => s === 'moderate').length;
    
    if (severeCount >= 2) return 'critical';
    if (severeCount >= 1 && moderateCount >= 1) return 'serious';
    if (moderateCount >= 2) return 'concerning';
    return 'minor';
  };

  const overallLevel = overallAssessment();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">RICS Code of Conduct Assessment</h1>
          <p className="text-slate-600">Evaluate Malcolm Belcher's conduct against RICS standards</p>
        </div>

        {/* Overall Assessment Summary */}
        <Card className="mb-8 border-2 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Overall Assessment</span>
              <Badge className={`${
                overallLevel === 'critical' ? 'bg-red-600' :
                overallLevel === 'serious' ? 'bg-orange-600' :
                overallLevel === 'concerning' ? 'bg-yellow-600' :
                'bg-slate-600'
              } text-white`}>
                {overallLevel.charAt(0).toUpperCase() + overallLevel.slice(1)} Violations
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              {overallLevel === 'critical' && 'Multiple serious breaches of RICS standards identified. Strong grounds for formal complaint.'}
              {overallLevel === 'serious' && 'Significant violations of RICS code. Reasonable basis for complaint and investigation.'}
              {overallLevel === 'concerning' && 'Multiple breaches identified. Sufficient grounds to consider formal complaint.'}
              {overallLevel === 'minor' && 'Limited evidence of standards violations. May require additional documentation.'}
            </p>
          </CardContent>
        </Card>

        {/* Standards Assessment */}
        <div className="space-y-4">
          {RICS_STANDARDS.map((standard) => {
            const status = getStandardStatus(standard.id);
            const statusColors = {
              none: 'border-l-4 border-l-green-600 bg-green-50',
              minor: 'border-l-4 border-l-yellow-600 bg-yellow-50',
              moderate: 'border-l-4 border-l-orange-600 bg-orange-50',
              severe: 'border-l-4 border-l-red-600 bg-red-50'
            };

            const statusIcons = {
              none: <CheckCircle2 className="w-5 h-5 text-green-600" />,
              minor: <AlertCircle className="w-5 h-5 text-yellow-600" />,
              moderate: <AlertCircle className="w-5 h-5 text-orange-600" />,
              severe: <XCircle className="w-5 h-5 text-red-600" />
            };

            return (
              <Card key={standard.id} className={statusColors}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-3">
                      {statusIcons[status]}
                      {standard.title}
                    </span>
                    <Badge variant={status === 'none' ? 'secondary' : 'outline'}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-2">{standard.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {standard.indicators.map((indicator, idx) => {
                      const key = `${standard.id}-${idx}`;
                      const isChecked = assessments[key] || false;
                      
                      return (
                        <label key={idx} className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-white/50 transition">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssessment(standard.id, idx)}
                            className="mt-1 w-4 h-4 rounded border-slate-300"
                          />
                          <span className={`text-sm ${isChecked ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                            {indicator}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button variant="outline" className="flex-1" onClick={handleResetAssessment}>
            Reset Assessment
          </Button>
          <Button 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700" 
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate RICS Complaint Report'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}