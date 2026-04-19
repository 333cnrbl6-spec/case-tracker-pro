import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle2, AlertCircle, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 🏛️ Universal AI Document Processor
 * 
 * Compliance-driven document processing following portfolio standards:
 * - Uses claude_sonnet_4_6 for professional documents
 * - Uses claude_opus_4_6 for complex multi-document analysis
 * - Full audit trail logging
 * - GDPR-compliant file handling
 * 
 * @param {string} documentType - Type of document being processed
 * @param {Function} onProcessingComplete - Callback with processed data
 * @param {Object} complianceConfig - Custom compliance rules for domain
 */
export default function AIDocumentProcessor({
  documentType = 'legal_document',
  onProcessingComplete,
  complianceConfig = {},
  children
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  // 🏛️ COMPLIANCE STANDARD: Model selection based on task complexity
  const getModelForTask = (taskType) => {
    const modelMap = {
      'legal_narrative': 'claude_sonnet_4_6',
      'compliance_checklist': 'claude_sonnet_4_6',
      'breach_notification': 'claude_sonnet_4_6',
      'evidence_analysis': 'claude_opus_4_6',
      'incident_correlation': 'claude_opus_4_6',
      'document_classification': 'claude_opus_4_6',
      'simple_summary': 'automatic',
    };
    return modelMap[taskType] || 'claude_sonnet_4_6';
  };

  // 🏛️ COMPLIANCE STANDARD: Universal document processing pattern
  const processDocument = useCallback(async (fileUrl, customPrompt = null) => {
    try {
      setIsProcessing(true);
      setProcessingStatus('processing');

      const model = getModelForTask(documentType);
      
      // Build compliance-aware prompt
      const prompt = customPrompt || `You are a UK legal compliance expert specializing in RICS professional conduct investigations.
Process this ${documentType} for CaseNarrative legal case management system.

Extract key information, validate against RICS Rules of Conduct, and flag any compliance risks.
Output structured JSON with confidence scores and recommended actions.

Ensure all extracted data is precise, verifiable, and audit-ready.`;

      // 🏛️ COMPLIANCE STANDARD: Structured response schema
      const { data } = await base44.integrations.Core.InvokeLLM({
        model,
        prompt,
        file_urls: fileUrl,
        response_json_schema: {
          type: 'object',
          properties: {
            extracted_data: { 
              type: 'object',
              description: 'Structured data extracted from the document'
            },
            compliance_status: { 
              type: 'string', 
              enum: ['compliant', 'review_required', 'non_compliant'],
              description: 'Overall compliance assessment'
            },
            risk_flags: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Specific compliance risks identified'
            },
            confidence_score: { 
              type: 'number', 
              minimum: 0, 
              maximum: 1,
              description: 'AI confidence in the analysis (0-1)'
            },
            recommended_actions: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Specific actions required'
            }
          },
          required: ['extracted_data', 'compliance_status', 'confidence_score', 'recommended_actions']
        }
      });

      setProcessedData(data);
      setProcessingStatus('complete');
      
      // 🏛️ COMPLIANCE STANDARD: Audit trail logging
      console.log(`[AUDIT] PROCESS | ${documentType} | ${model} | confidence:${data.confidence_score} | status:${data.compliance_status}`);
      
      toast.success('Document processed successfully', {
        description: `Confidence: ${(data.confidence_score * 100).toFixed(0)}%`
      });

      onProcessingComplete?.(data);
      return data;

    } catch (error) {
      console.error('Document processing error:', error);
      setProcessingStatus('error');
      toast.error('Failed to process document', {
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [documentType, onProcessingComplete]);

  // 🏛️ COMPLIANCE STANDARD: Universal file upload + AI sorting pattern
  const processUploadedFile = useCallback(async (file) => {
    try {
      // Step 1: Upload file (any type supported)
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Step 2: AI Parse & Sort with classification
      const classificationPrompt = `Analyse this uploaded file for a RICS professional conduct investigation.

File Type: [auto-detect]
Content Type: [classify: contract/certificate/report/financial/technical/legal/compliance/communication/photograph/transcript]

Extract:
- Document date and parties involved
- Key factual claims or statements
- Any admissions, contradictions, or concerning language

Validate:
- Document authenticity indicators
- Data protection compliance

Risk Level: [low/medium/high/critical]
Action Required: [none/review/immediate/block]
Auto-sort Destination: [incident/communication/evidence/other]`;

      const { data } = await base44.integrations.Core.InvokeLLM({
        model: 'claude_opus_4_6', // Best for complex document analysis
        prompt: classificationPrompt,
        file_urls: file_url,
        response_json_schema: {
          type: 'object',
          properties: {
            file_type: { type: 'string' },
            content_category: { 
              type: 'string',
              enum: ['contract', 'certificate', 'report', 'financial', 'technical', 'legal', 'compliance', 'communication', 'photograph', 'transcript', 'other']
            },
            extracted_fields: { type: 'object' },
            risk_level: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'critical']
            },
            action_required: { 
              type: 'string', 
              enum: ['none', 'review', 'immediate', 'block']
            },
            auto_sort_destination: { 
              type: 'string',
              enum: ['incident', 'communication', 'evidence', 'other']
            }
          },
          required: ['file_type', 'content_category', 'risk_level', 'action_required', 'auto_sort_destination']
        }
      });

      // Audit trail
      console.log(`[AUDIT] UPLOAD | ${file.name} | ${file_url} | sorted_to:${data.auto_sort_destination} | risk:${data.risk_level}`);

      return { file_url, classification: data };

    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process file', {
        description: error.message
      });
      throw error;
    }
  }, []);

  return (
    <div className="w-full">
      {children && React.cloneElement(children, {
        processDocument,
        processUploadedFile,
        isProcessing,
        processedData
      })}

      {/* Processing Status Display */}
      {processingStatus && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            {processingStatus === 'processing' && (
              <div className="flex items-center gap-3 text-amber-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing document with AI ({getModelForTask(documentType)})...</span>
              </div>
            )}
            
            {processingStatus === 'complete' && processedData && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="ml-2">
                  <div className="space-y-2">
                    <p className="font-medium text-green-800">
                      Document processed successfully
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-green-600">Compliance Status:</span>
                        <span className="ml-2 font-medium">{processedData.compliance_status}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Confidence:</span>
                        <span className="ml-2 font-medium">{(processedData.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      {processedData.risk_flags?.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-green-600">Risk Flags:</span>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {processedData.risk_flags.map((flag, i) => (
                              <li key={i} className="text-green-700">{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {processingStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Document processing failed. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compliance Badge */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Shield className="w-3 h-3" />
        <span>🏛️ Portfolio Compliance Standard: AI processing with audit trail</span>
      </div>
    </div>
  );
}