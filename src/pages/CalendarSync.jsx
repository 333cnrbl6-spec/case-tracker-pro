import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Loader, Calendar, X, CheckCircle } from 'lucide-react';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';

export default function CalendarSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => null);
  }, []);

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.MilestoneReminder.list(),
  });

  const handleGoogleCalendarSync = async () => {
    try {
      setSyncing(true);
      setSyncStatus({ service: 'google', status: 'connecting' });

      // Step 1: Get OAuth authorization
      const url = await base44.connectors.connectAppUser('googlecalendar-sync');
      const popup = window.open(url, '_blank', 'width=600,height=600');

      // Step 2: Poll for popup closure
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          handleSyncToGoogle();
        }
      }, 500);
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      setSyncStatus({ service: 'google', status: 'error', error: error.message });
      setSyncing(false);
    }
  };

  const handleSyncToGoogle = async () => {
    try {
      setSyncStatus({ service: 'google', status: 'syncing' });
      
      // Call backend function to sync deadlines to Google Calendar
      const response = await base44.functions.invoke('syncDeadlinesToGoogleCalendar', {
        deadlines: milestones.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          date: m.milestone_date,
          type: m.milestone_type,
          caseRef: m.case_ref,
        })),
      });

      setSyncStatus({ 
        service: 'google', 
        status: 'success', 
        count: response.data.synced_count,
        message: `${response.data.synced_count} deadlines synced to Google Calendar`
      });
      setSyncing(false);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus({ service: 'google', status: 'error', error: error.message });
      setSyncing(false);
    }
  };

  const handleOutlookSync = async () => {
    try {
      setSyncing(true);
      setSyncStatus({ service: 'outlook', status: 'connecting' });

      // Get OAuth authorization
      const url = await base44.connectors.connectAppUser('outlook-sync');
      const popup = window.open(url, '_blank', 'width=600,height=600');

      // Poll for popup closure
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          handleSyncToOutlook();
        }
      }, 500);
    } catch (error) {
      console.error('Outlook sync failed:', error);
      setSyncStatus({ service: 'outlook', status: 'error', error: error.message });
      setSyncing(false);
    }
  };

  const handleSyncToOutlook = async () => {
    try {
      setSyncStatus({ service: 'outlook', status: 'syncing' });
      
      const response = await base44.functions.invoke('syncDeadlinesToOutlook', {
        deadlines: milestones.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          date: m.milestone_date,
          type: m.milestone_type,
          caseRef: m.case_ref,
        })),
      });

      setSyncStatus({ 
        service: 'outlook', 
        status: 'success', 
        count: response.data.synced_count,
        message: `${response.data.synced_count} deadlines synced to Outlook Calendar`
      });
      setSyncing(false);
    } catch (error) {
      console.error('Outlook sync failed:', error);
      setSyncStatus({ service: 'outlook', status: 'error', error: error.message });
      setSyncing(false);
    }
  };

  const renderSyncStatus = (service) => {
    const status = syncStatus[service];
    if (!status) return null;

    const statusConfig = {
      connecting: { icon: Loader, color: 'text-blue-600', text: 'Connecting...' },
      syncing: { icon: Loader, color: 'text-blue-600', text: 'Syncing deadlines...' },
      success: { icon: CheckCircle, color: 'text-green-600', text: 'Synced successfully' },
      error: { icon: AlertCircle, color: 'text-red-600', text: 'Sync failed' },
    };

    const config = statusConfig[status.status];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${status.status === 'success' ? 'bg-green-50 border-green-200' : status.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <Icon className={`w-5 h-5 ${config.color} ${status.status === 'syncing' || status.status === 'connecting' ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <p className="font-medium text-sm">{config.text}</p>
          {status.message && <p className="text-xs text-slate-600">{status.message}</p>}
          {status.error && <p className="text-xs text-red-600">{status.error}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Sync Deadlines to Calendar</h1>
          <p className="text-slate-600">Automatically add all case limitation dates, court deadlines, and milestone reminders to your external calendar</p>
        </div>

        {/* Available Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Deadlines Ready to Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">
                You have <strong>{milestones.length} deadlines</strong> ready to sync to your external calendar:
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-slate-600">Limitation Dates</p>
                  <p className="text-2xl font-bold text-red-600">
                    {milestones.filter(m => m.milestone_type === 'limitation_date').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-slate-600">Court Deadlines</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {milestones.filter(m => m.milestone_type === 'court_deadline').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-slate-600">Other Reminders</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {milestones.filter(m => !['limitation_date', 'court_deadline'].includes(m.milestone_type)).length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Calendar */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📅 Google Calendar
                </CardTitle>
                {syncStatus.google?.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Sync all deadlines to your Google Calendar. Create color-coded events with full details and reminders.
              </p>
              {renderSyncStatus('google')}
              {syncing && syncStatus.google?.status === 'syncing' && (
                <ProcessingFeedback
                  label="Syncing to Google Calendar..."
                  detail={`Adding ${milestones.length} deadlines to your calendar`}
                  tips={[
                    'Each deadline will appear as an event on the scheduled date',
                    'Critical deadlines (≤7 days) will be color-coded red for visibility',
                    'You can edit or delete events directly in Google Calendar'
                  ]}
                />
              )}
              <Button 
                onClick={handleGoogleCalendarSync}
                disabled={syncing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {syncStatus.google?.status === 'success' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Re-sync to Google Calendar
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Sync to Google Calendar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Outlook Calendar */}
          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📧 Outlook Calendar
                </CardTitle>
                {syncStatus.outlook?.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Sync all deadlines to your Outlook/Microsoft 365 Calendar. Keep your practice synchronized across all devices.
              </p>
              {renderSyncStatus('outlook')}
              {syncing && syncStatus.outlook?.status === 'syncing' && (
                <ProcessingFeedback
                  label="Syncing to Outlook Calendar..."
                  detail={`Adding ${milestones.length} deadlines to your calendar`}
                  tips={[
                    'Deadlines will sync to your default Outlook calendar',
                    'Each event includes case reference and reminder notifications',
                    'Changes sync across all your Outlook devices automatically'
                  ]}
                />
              )}
              <Button 
                onClick={handleOutlookSync}
                disabled={syncing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {syncStatus.outlook?.status === 'success' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Re-sync to Outlook Calendar
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Sync to Outlook Calendar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-2">🔄 Automatic Sync</h3>
              <p className="text-xs text-slate-700">New milestones added to CaseNarrative automatically appear in your external calendar</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-2">⏰ Smart Reminders</h3>
              <p className="text-xs text-slate-700">Calendar events include 30-day, 7-day, and 1-day reminders for critical deadlines</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-2">🔗 Two-Way Sync</h3>
              <p className="text-xs text-slate-700">Keep your CaseNarrative deadlines in sync with your external calendar (manual refresh)</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Note */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 space-y-2">
            <p>✓ Your CaseNarrative credentials are never shared with Google or Outlook</p>
            <p>✓ Calendar sync uses secure OAuth authentication (you authorize once, that's it)</p>
            <p>✓ Only deadline event details are synced — no case files or evidence</p>
            <p>✓ You can disconnect sync anytime from your account settings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}