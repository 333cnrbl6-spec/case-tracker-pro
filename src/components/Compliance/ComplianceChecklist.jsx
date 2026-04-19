import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Shield, FileCheck, Download } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 🏛️ Universal Compliance Checklist Component
 * 
 * Implements portfolio-wide compliance validation pattern.
 * Every feature MUST pass all checks before being marked complete.
 * 
 * Based on: Portfolio Compliance & AI Processing Standards (April 2026)
 */

// 🏛️ COMPLIANCE STANDARD: Universal checklist for all apps
const COMPLIANCE_CATEGORIES = {
  dataProtection: {
    title: 'Data Protection (GDPR)',
    icon: Shield,
    checks: [
      'All personal data encrypted at rest',
      'GDPR-compliant storage with clear retention policies',
      'Right to access/export implemented for users',
      'Data processing agreement in place',
      'Privacy notice visible to end users'
    ]
  },
  auditTrail: {
    title: 'Audit Trail',
    icon: FileCheck,
    checks: [
      'Every create/update/delete logged with timestamp',
      'User email captured for all actions',
      'Audit logs immutable and exportable',
      'Change history visible for critical records'
    ]
  },
  accessControl: {
    title: 'Access Control',
    icon: Shield,
    checks: [
      'Role-based permissions enforced (admin/user)',
      'User cannot access other firms data',
      'Sensitive operations require admin role',
      'Session timeout implemented'
    ]
  },
  errorHandling: {
    title: 'Error Handling',
    icon: AlertCircle,
    checks: [
      'Graceful failures with user-friendly messages',
      'No sensitive data in error messages or logs',
      'Retry logic for transient failures',
      'Error tracking and alerting configured'
    ]
  },
  fileValidation: {
    title: 'File Validation',
    icon: FileCheck,
    checks: [
      'File type validation on upload',
      'Virus/malware scanning (via Base44)',
      'Rejection of executable files',
      'Image sanitization for uploaded photos'
    ]
  },
  performance: {
    title: 'Performance',
    icon: CheckCircle2,
    checks: [
      'Page loads in <2 seconds',
      'AI calls complete in <10 seconds',
      'Export completes in <30 seconds',
      'No memory leaks or performance degradation'
    ]
  }
};

// Domain-specific compliance for legal practice
const LEGAL_COMPLIANCE_ADDONS = {
  SRA: [
    'SRA Code of Conduct compliance',
    'Limitation date tracking (critical — negligence risk)',
    'Client care letter requirements',
    'Costs transparency and client communication'
  ],
  RICS: [
    'RICS Rules of Conduct alignment',
    'Professional Standards compliance (PS-1.x)',
    'Honesty and Integrity (PS-2)',
    'Conflicts of Interest (PS-3)',
    'Client Relations (PS-4)',
    'Complaints Handling (PS-6)',
    'Documentation standards (PS-7)'
  ]
};

export default function ComplianceChecklist({ 
  featureName, 
  includeLegalAddons = true,
  onValidationComplete 
}) {
  const [checkedItems, setCheckedItems] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const allChecks = Object.entries(COMPLIANCE_CATEGORIES).flatMap(([category, config]) =>
    config.checks.map(check => `${category}:${check}`)
  );

  const legalChecks = includeLegalAddons 
    ? [...LEGAL_COMPLIANCE_ADDONS.SRA, ...LEGAL_COMPLIANCE_ADDONS.RICS].map(check => `legal:${check}`)
    : [];

  const totalChecks = allChecks.length + legalChecks.length;
  const checkedCount = Object.values(checkedItems).filter(v => v).length;
  const complianceScore = Math.round((checkedCount / totalChecks) * 100);

  const handleCheck = (checkId) => {
    setCheckedItems(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }));
  };

  const handleExportReport = () => {
    const report = {
      feature: featureName,
      timestamp: new Date().toISOString(),
      score: complianceScore,
      passed: complianceScore === 100,
      checks: checkedItems
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${featureName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Compliance report exported', {
      description: `Score: ${complianceScore}% - Ready for handover pack`
    });

    onValidationComplete?.(report);
  };

  const getScoreColor = (score) => {
    if (score === 100) return 'bg-green-600';
    if (score >= 80) return 'bg-amber-600';
    return 'bg-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${getScoreColor(complianceScore)} flex items-center justify-center text-white font-bold text-lg`}>
              {complianceScore}%
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                🏛️ Compliance Checklist: {featureName}
              </CardTitle>
              <CardDescription>
                Portfolio standard validation — {checkedCount}/{totalChecks} checks passed
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              disabled={complianceScore < 100}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Compliance Categories */}
          {Object.entries(COMPLIANCE_CATEGORIES).map(([category, config]) => {
            const Icon = config.icon;
            return (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">{config.title}</h3>
                </div>
                <div className="space-y-2">
                  {config.checks.map((check, idx) => {
                    const checkId = `${category}:${check}`;
                    const isChecked = checkedItems[checkId];
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <Checkbox
                          id={checkId}
                          checked={isChecked}
                          onCheckedChange={() => handleCheck(checkId)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={checkId}
                          className={`text-sm ${isChecked ? 'text-green-700 line-through' : 'text-slate-700'}`}
                        >
                          {check}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Legal Domain-Specific Checks */}
          {includeLegalAddons && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Legal Practice Compliance (SRA/RICS)</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">SRA Requirements</h4>
                  <div className="space-y-2">
                    {LEGAL_COMPLIANCE_ADDONS.SRA.map((check, idx) => {
                      const checkId = `legal:sra:${check}`;
                      const isChecked = checkedItems[checkId];
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <Checkbox
                            id={checkId}
                            checked={isChecked}
                            onCheckedChange={() => handleCheck(checkId)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={checkId}
                            className={`text-sm ${isChecked ? 'text-green-700 line-through' : 'text-slate-700'}`}
                          >
                            {check}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-2">RICS Requirements</h4>
                  <div className="space-y-2">
                    {LEGAL_COMPLIANCE_ADDONS.RICS.map((check, idx) => {
                      const checkId = `legal:rics:${check}`;
                      const isChecked = checkedItems[checkId];
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <Checkbox
                            id={checkId}
                            checked={isChecked}
                            onCheckedChange={() => handleCheck(checkId)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={checkId}
                            className={`text-sm ${isChecked ? 'text-green-700 line-through' : 'text-slate-700'}`}
                          >
                            {check}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Alert */}
          {complianceScore === 100 ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2 text-green-800">
                <strong>Feature Ready for Deployment!</strong> All compliance checks passed. 
                Export the report and add to the handover pack.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{totalChecks - checkedCount} checks remaining</strong> before this feature 
                can be marked complete and added to the App Rollout Workbench.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}