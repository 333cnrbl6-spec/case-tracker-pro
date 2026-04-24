import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { report_type, case_id } = await req.json();

        if (!report_type) {
            return Response.json({ error: 'Report type required' }, { status: 400 });
        }

        // Fetch relevant data based on report type
        let reportData = {};
        
        if (report_type === 'rics_breach') {
            const incidents = await base44.entities.Incident.filter({});
            const ricsRules = await base44.entities.RICSRule.filter({});
            
            const breachIncidents = incidents.filter(i => i.rics_violations?.length > 0);
            
            reportData = {
                title: 'RICS Breach Notification Report',
                subtitle: 'Professional Conduct Violation Summary',
                generated_date: new Date().toLocaleDateString('en-GB'),
                total_incidents: breachIncidents.length,
                violations: breachIncidents.map(incident => ({
                    date: incident.date,
                    title: incident.title,
                    description: incident.description,
                    severity: incident.severity,
                    violations: incident.rics_violations,
                    legal_issues: incident.legal_issues
                })),
                rules_reference: ricsRules.slice(0, 10)
            };
        } else if (report_type === 'gift_aid') {
            // Placeholder for charity data - would need Charity entity
            reportData = {
                title: 'Gift Aid Declaration Summary',
                subtitle: 'Charity Commission Compliance Report',
                generated_date: new Date().toLocaleDateString('en-GB'),
                note: 'Gift aid data requires Charity entity integration'
            };
        } else if (report_type === 'gas_safety') {
            // Placeholder for property compliance data
            reportData = {
                title: 'Gas Safety Compliance Report',
                subtitle: 'Property Safety Certificate Summary',
                generated_date: new Date().toLocaleDateString('en-GB'),
                note: 'Gas safety data requires Property entity integration'
            };
        } else if (report_type === 'limitation_dates') {
            const cases = await base44.entities.LegalCase.filter({});
            const alerts = await base44.entities.ComplianceAlert.filter({});
            
            const urgentCases = cases.filter(c => {
                if (!c.limitation_date) return false;
                const daysUntil = Math.ceil((new Date(c.limitation_date) - new Date()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 30;
            });
            
            reportData = {
                title: 'Limitation Date Compliance Report',
                subtitle: 'Critical Deadline Tracking Summary',
                generated_date: new Date().toLocaleDateString('en-GB'),
                total_cases: cases.length,
                urgent_cases: urgentCases.length,
                cases: urgentCases.map(c => ({
                    case_ref: c.case_ref,
                    client_name: c.client_name,
                    limitation_date: c.limitation_date,
                    days_remaining: Math.ceil((new Date(c.limitation_date) - new Date()) / (1000 * 60 * 60 * 24)),
                    status: c.status
                })),
                active_alerts: alerts.filter(a => a.status === 'active').length
            };
        } else if (report_type === 'case_compliance') {
            const cases = await base44.entities.LegalCase.filter({});
            const risks = await base44.entities.ComplianceRisk.filter({});
            
            reportData = {
                title: 'Case Compliance Summary Report',
                subtitle: 'Evidence Validation & Risk Assessment',
                generated_date: new Date().toLocaleDateString('en-GB'),
                total_cases: cases.length,
                active_risks: risks.filter(r => r.mitigation_status !== 'mitigated').length,
                cases: cases.slice(0, 20).map(c => ({
                    case_ref: c.case_ref,
                    client_name: c.client_name,
                    status: c.status,
                    case_type: c.case_type
                })),
                risk_summary: {
                    critical: risks.filter(r => r.risk_level === 'critical').length,
                    high: risks.filter(r => r.risk_level === 'high').length,
                    medium: risks.filter(r => r.risk_level === 'medium').length
                }
            };
        } else if (report_type === 'incident_report') {
            const incidents = await base44.entities.Incident.filter({});
            const tasks = await base44.entities.IncidentTask.filter({});
            
            reportData = {
                title: 'Incident Analysis Report',
                subtitle: 'Breach Patterns & Severity Clustering',
                generated_date: new Date().toLocaleDateString('en-GB'),
                total_incidents: incidents.length,
                open_incidents: incidents.filter(i => i.status === 'open').length,
                incidents: incidents.slice(0, 20).map(i => ({
                    title: i.title,
                    date: i.date,
                    severity: i.severity,
                    status: i.status,
                    type: i.incident_type
                })),
                severity_summary: {
                    critical: incidents.filter(i => i.severity === 'critical').length,
                    high: incidents.filter(i => i.severity === 'high').length,
                    medium: incidents.filter(i => i.severity === 'medium').length,
                    low: incidents.filter(i => i.severity === 'low').length
                },
                pending_tasks: tasks.filter(t => t.status === 'not_started').length
            };
        }

        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header with branding
        doc.setFillColor(30, 58, 138); // Blue-800
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(reportData.title, 15, 20);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(reportData.subtitle || '', 15, 30);
        
        // Metadata
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Generated: ${reportData.generated_date}`, 15, 48);
        doc.text(`Generated by: ${user.full_name || user.email}`, 15, 53);
        
        // Content
        let yPos = 65;
        doc.setTextColor(0, 0, 0);
        
        if (report_type === 'rics_breach') {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Breach Incidents: ${reportData.total_incidents}`, 15, yPos);
            yPos += 15;
            
            reportData.violations.forEach((violation, idx) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`${idx + 1}. ${violation.title}`, 15, yPos);
                yPos += 8;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Date: ${violation.date} | Severity: ${violation.severity}`, 15, yPos);
                yPos += 6;
                
                const splitDesc = doc.splitTextToSize(violation.description, 180);
                doc.text(splitDesc, 15, yPos);
                yPos += (splitDesc.length * 5) + 2;
                
                if (violation.violations?.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('RICS Violations:', 15, yPos);
                    yPos += 6;
                    doc.setFont('helvetica', 'normal');
                    violation.violations.forEach(rule => {
                        doc.text(`• ${rule}`, 20, yPos);
                        yPos += 5;
                    });
                    yPos += 2;
                }
                
                yPos += 5;
            });
        } else if (report_type === 'limitation_dates') {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Cases: ${reportData.total_cases} | Urgent Cases: ${reportData.urgent_cases}`, 15, yPos);
            yPos += 15;
            
            reportData.cases.forEach((c, idx) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                const daysColor = c.days_remaining < 0 ? [220, 38, 38] : c.days_remaining <= 7 ? [234, 179, 8] : [34, 197, 94];
                doc.setFillColor(...daysColor);
                doc.rect(15, yPos - 8, 180, 25, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${c.case_ref} - ${c.client_name}`, 20, yPos);
                yPos += 6;
                
                doc.setFont('helvetica', 'normal');
                doc.text(`Limitation Date: ${c.limitation_date} | Days Remaining: ${c.days_remaining}`, 20, yPos);
                yPos += 6;
                doc.text(`Status: ${c.status}`, 20, yPos);
                yPos += 12;
                
                doc.setTextColor(0, 0, 0);
            });
        } else if (report_type === 'case_compliance') {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Cases: ${reportData.total_cases} | Active Risks: ${reportData.active_risks}`, 15, yPos);
            yPos += 10;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Risk Summary:', 15, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Critical: ${reportData.risk_summary.critical}`, 20, yPos);
            yPos += 5;
            doc.text(`• High: ${reportData.risk_summary.high}`, 20, yPos);
            yPos += 5;
            doc.text(`• Medium: ${reportData.risk_summary.medium}`, 20, yPos);
            yPos += 10;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Cases Review:', 15, yPos);
            yPos += 6;
            
            doc.setFont('helvetica', 'normal');
            reportData.cases.forEach((c, idx) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${idx + 1}. ${c.case_ref} - ${c.client_name}`, 20, yPos);
                yPos += 4;
                doc.text(`Type: ${c.case_type} | Status: ${c.status}`, 25, yPos);
                yPos += 6;
            });
        } else if (report_type === 'incident_report') {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Incidents: ${reportData.total_incidents} | Open: ${reportData.open_incidents}`, 15, yPos);
            yPos += 10;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Severity Distribution:', 15, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Critical: ${reportData.severity_summary.critical}`, 20, yPos);
            yPos += 5;
            doc.text(`• High: ${reportData.severity_summary.high}`, 20, yPos);
            yPos += 5;
            doc.text(`• Medium: ${reportData.severity_summary.medium}`, 20, yPos);
            yPos += 5;
            doc.text(`• Low: ${reportData.severity_summary.low}`, 20, yPos);
            yPos += 10;
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Pending Tasks: ${reportData.pending_tasks}`, 15, yPos);
            yPos += 10;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Incident Details:', 15, yPos);
            yPos += 6;
            
            doc.setFont('helvetica', 'normal');
            reportData.incidents.forEach((i, idx) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${idx + 1}. ${i.title}`, 20, yPos);
                yPos += 4;
                doc.text(`Date: ${i.date} | Severity: ${i.severity} | Status: ${i.status}`, 25, yPos);
                yPos += 6;
            });
        } else {
            doc.setFontSize(12);
            doc.text(reportData.note || 'No data available', 15, yPos);
        }
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
        }
        
        const pdfBytes = doc.output('arraybuffer');
        
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${report_type.replace('_', '-')}-report-${new Date().toISOString().split('T')[0]}.pdf"`
            }
        });
    } catch (error) {
        console.error('Error generating compliance report:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});