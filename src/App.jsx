import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import { base44 } from '@/api/base44Client';
import Dashboard from '@/pages/Dashboard';
import Incidents from '@/pages/Incidents';
import Communications from '@/pages/Communications';
import Evidence from '@/pages/Evidence';
import EvidenceScanner from '@/pages/EvidenceScanner';
import RICSAssessment from '@/pages/RICSAssessment';
import LegalAnalysis from '@/pages/LegalAnalysis';
import CaseNarrative from '@/pages/CaseNarrative';
import LegalActionBundle from '@/pages/LegalActionBundle';
import BundleProcessor from '@/pages/BundleProcessor';
import LegalNextSteps from '@/pages/LegalNextSteps';
import RICSBreachNotification from '@/pages/RICSBreachNotification';
import RICSCommunicationMapper from '@/pages/RICSCommunicationMapper';
import SolicitorBriefGenerator from '@/pages/SolicitorBriefGenerator';
import RICSDocumentGenerator from '@/pages/RICSDocumentGenerator';
import RICSRulesLibrary from '@/pages/RICSRulesLibrary';
import ComplianceChecklist from '@/pages/ComplianceChecklist';
import AnalyticsDashboard from '@/pages/AnalyticsDashboard';
import ExecutiveDashboard from '@/pages/ExecutiveDashboard';
import EvidenceValidator from '@/pages/EvidenceValidator';
import IncidentTaskManager from '@/pages/IncidentTaskManager';
import CaseManager from '@/pages/CaseManager';
import CaseNarrativeBuilder from '@/pages/CaseNarrativeBuilder';
import CaseWeaknessRebuttal from '@/pages/CaseWeaknessRebuttal';
import ComplianceAlerts from '@/pages/ComplianceAlerts';
import PracticeAnalytics from '@/pages/PracticeAnalytics';
import OnboardingWizard from '@/pages/OnboardingWizard';
import ComplianceDashboard from '@/pages/ComplianceDashboard';
import ComplianceReportGenerator from '@/pages/ComplianceReportGenerator';
import ComplianceRiskDashboard from '@/pages/ComplianceRiskDashboard';
import AuditLog from '@/pages/AuditLog';
import FeeEarnerAnalytics from '@/pages/FeeEarnerAnalytics';
import EventTimeline from '@/pages/EventTimeline';
import IncidentReporter from '@/pages/IncidentReporter';
import InvestigationCompliance from '@/pages/InvestigationCompliance';
import PermissionsManager from '@/pages/PermissionsManager';
import Pricing from '@/pages/Pricing';
import CaseOverviewDashboard from '@/pages/CaseOverviewDashboard';
import RICSComplianceDashboard from '@/pages/RICSComplianceDashboard';
import NetworkMap from '@/pages/NetworkMap';
import RICSRiskModule from '@/pages/RICSRiskModule';
import IncidentKanban from '@/pages/IncidentKanban';
import ReportBuilder from '@/pages/ReportBuilder';
import WitnessPortal from '@/pages/WitnessPortal';
import CaseTimeline from '@/pages/CaseTimeline';
import DisclosureBundleBuilder from '@/pages/DisclosureBundleBuilder';
import CostScheduleAnalysis from '@/pages/CostScheduleAnalysis';
import FinancialLossSummary from '@/pages/FinancialLossSummary';
import BatchExportBuilder from '@/pages/BatchExportBuilder';
import CaseRiskDashboard from '@/pages/CaseRiskDashboard.jsx';
import ProfessionalEntityDatabase from '@/pages/ProfessionalEntityDatabase';
import BreachDiscoveryTool from '@/pages/BreachDiscoveryTool';
import InteractiveEventTimeline from '@/pages/InteractiveEventTimeline';
import FirmSettings from '@/pages/FirmSettings';
import SecuritySettings from '@/pages/SecuritySettings';
import HelpAndDocs from '@/pages/HelpAndDocs';
import RICSComplianceAdvisor from '@/pages/RICSComplianceAdvisor';
import DocumentTemplateEngine from '@/pages/DocumentTemplateEngine';
import VisualNetworkMap from '@/pages/VisualNetworkMap';
import SpecialismFrameworkViewer from '@/components/SpecialismFrameworkViewer';
import AutomatedBundleGenerator from '@/pages/AutomatedBundleGenerator';
import ClientPortalManager from '@/pages/ClientPortalManager';
import ClientPortalView from '@/pages/ClientPortalView';
import MilestoneTimeline from '@/pages/MilestoneTimeline';
import CaseTaskWorkflow from '@/pages/CaseTaskWorkflow';
import FeeEarnerWeeklyReports from '@/pages/FeeEarnerWeeklyReports';
import TaskAnalyticsDashboard from '@/pages/TaskAnalyticsDashboard';
import CaseNarrativeOnboarding from '@/pages/CaseNarrativeOnboarding';
import LegalKPIDashboard from '@/pages/LegalKPIDashboard';
import CaseTrackerPro from '@/pages/CaseTrackerPro';
import CaseDocumentAnalyzer from '@/pages/CaseDocumentAnalyzer';
import DocumentBundleCompiler from '@/pages/DocumentBundleCompiler';
import CaseValuationInsights from '@/pages/CaseValuationInsights';
import ComplianceAuditDashboard from '@/pages/ComplianceAuditDashboard';
import SaaSAdminDashboard from '@/pages/SaaSAdminDashboard';
import CustomerBillingPortal from '@/pages/CustomerBillingPortal';
import CustomerUsagePortal from '@/pages/CustomerUsagePortal';
import CustomerOnboarding from '@/pages/CustomerOnboarding';
import VerifyEmail from '@/pages/VerifyEmail';
import Landing from '@/pages/Landing';
import EnterpriseSalesPage from '@/pages/EnterpriseSalesPage';
import GettingStartedGuide from '@/pages/GettingStartedGuide';
import AppLayout from '@/components/AppLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Analytics tracking
  useEffect(() => {
    base44.functions.invoke('trackAnalyticsEvent', {
      event_name: 'page_view',
      properties: { page: location.pathname }
    }).catch(err => console.log('Analytics error:', err));
  }, [location.pathname]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AppLayout>
      <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/incidents" element={<Incidents />} />
      <Route path="/communications" element={<Communications />} />
      <Route path="/evidence" element={<Evidence />} />
      <Route path="/scanner" element={<EvidenceScanner />} />
      <Route path="/assessment" element={<RICSAssessment />} />
      <Route path="/legal-analysis" element={<LegalAnalysis />} />
      <Route path="/case-narrative" element={<CaseNarrative />} />
      <Route path="/action-bundle" element={<LegalActionBundle />} />
      <Route path="/bundle-processor" element={<BundleProcessor />} />
      <Route path="/next-steps" element={<LegalNextSteps />} />
      <Route path="/rics-breach-notification" element={<RICSBreachNotification />} />
      <Route path="/communication-mapper" element={<RICSCommunicationMapper />} />
      <Route path="/solicitor-brief" element={<SolicitorBriefGenerator />} />
      <Route path="/rics-documents" element={<RICSDocumentGenerator />} />
      <Route path="/rics-rules" element={<RICSRulesLibrary />} />
      <Route path="/compliance-checklist" element={<ComplianceChecklist />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
      <Route path="/evidence-validator" element={<EvidenceValidator />} />
      <Route path="/incident-tasks" element={<IncidentTaskManager />} />
      <Route path="/case-manager" element={<CaseManager />} />
      <Route path="/case-narrative-builder" element={<CaseNarrativeBuilder />} />
      <Route path="/case-weakness-rebuttal" element={<CaseWeaknessRebuttal />} />
      <Route path="/compliance-alerts" element={<ComplianceAlerts />} />
      <Route path="/practice-analytics" element={<PracticeAnalytics />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route path="/compliance-reports" element={<ComplianceReportGenerator />} />
      <Route path="/risk-dashboard" element={<ComplianceRiskDashboard />} />
      <Route path="/audit-log" element={<AuditLog />} />
      <Route path="/fee-earner-analytics" element={<FeeEarnerAnalytics />} />
      <Route path="/timeline" element={<EventTimeline />} />
      <Route path="/incident-reporter" element={<IncidentReporter />} />
      <Route path="/investigation-compliance" element={<InvestigationCompliance />} />
      <Route path="/permissions" element={<PermissionsManager />} />
      <Route path="/case-overview" element={<CaseOverviewDashboard />} />
      <Route path="/rics-compliance" element={<RICSComplianceDashboard />} />
      <Route path="/network-map" element={<NetworkMap />} />
      <Route path="/rics-risk" element={<RICSRiskModule />} />
      <Route path="/incident-kanban" element={<IncidentKanban />} />
      <Route path="/report-builder" element={<ReportBuilder />} />
      <Route path="/case-timeline/:incidentId" element={<CaseTimeline />} />
      <Route path="/witness/:token" element={<WitnessPortal />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/disclosure-bundle" element={<DisclosureBundleBuilder />} />
      <Route path="/cost-schedules" element={<CostScheduleAnalysis />} />
      <Route path="/financial-loss" element={<FinancialLossSummary />} />
      <Route path="/batch-export" element={<BatchExportBuilder />} />
      <Route path="/case-risk-dashboard" element={<CaseRiskDashboard />} />
      <Route path="/entity-database" element={<ProfessionalEntityDatabase />} />
      <Route path="/breach-discovery" element={<BreachDiscoveryTool />} />
      <Route path="/event-timeline" element={<InteractiveEventTimeline />} />
      <Route path="/settings" element={<FirmSettings />} />
      <Route path="/security" element={<SecuritySettings />} />
      <Route path="/help" element={<HelpAndDocs />} />
      <Route path="/compliance-advisor" element={<RICSComplianceAdvisor />} />
      <Route path="/document-templates" element={<DocumentTemplateEngine />} />
      <Route path="/network-map" element={<VisualNetworkMap />} />
      <Route path="/specialisms" element={<SpecialismFrameworkViewer />} />
      <Route path="/bundle-generator" element={<AutomatedBundleGenerator />} />
      <Route path="/client-portal-manager" element={<ClientPortalManager />} />
      <Route path="/client-portal" element={<ClientPortalView />} />
      <Route path="/milestone-timeline" element={<MilestoneTimeline />} />
      <Route path="/case-narrative-builder" element={<CaseNarrativeBuilder />} />
      <Route path="/case-task-workflow" element={<CaseTaskWorkflow />} />
      <Route path="/fee-earner-reports" element={<FeeEarnerWeeklyReports />} />
      <Route path="/task-analytics" element={<TaskAnalyticsDashboard />} />
      <Route path="/onboarding-case-narrative" element={<CaseNarrativeOnboarding />} />
      <Route path="/legal-kpi-dashboard" element={<LegalKPIDashboard />} />
      <Route path="/case-tracker-pro" element={<CaseTrackerPro />} />
      <Route path="/document-analyzer" element={<CaseDocumentAnalyzer />} />
      <Route path="/document-bundle-compiler" element={<DocumentBundleCompiler />} />
      <Route path="/case-valuation-insights" element={<CaseValuationInsights />} />
      <Route path="/compliance-audit" element={<ComplianceAuditDashboard />} />
      <Route path="/saas-admin" element={<SaaSAdminDashboard />} />
      <Route path="/customer-billing" element={<CustomerBillingPortal />} />
      <Route path="/customer-usage" element={<CustomerUsagePortal />} />
      <Route path="/onboarding-trial" element={<CustomerOnboarding />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/enterprise" element={<EnterpriseSalesPage />} />
      <Route path="/getting-started" element={<GettingStartedGuide />} />
      <Route path="/help" element={<HelpAndDocs />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </AppLayout>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App