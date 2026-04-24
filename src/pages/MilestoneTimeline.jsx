import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Scale,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const MILESTONE_TYPES = {
  limitation_date: { label: 'Limitation Date', icon: '⚖️', color: 'text-red-600' },
  court_deadline: { label: 'Court Deadline', icon: '📋', color: 'text-blue-600' },
  client_contact_due: { label: 'Client Contact', icon: '📞', color: 'text-green-600' },
  client_care_letter_due: { label: 'Client Care Letter', icon: '📧', color: 'text-purple-600' },
  settlement_deadline: { label: 'Settlement', icon: '🤝', color: 'text-orange-600' },
  custom: { label: 'Custom', icon: '📌', color: 'text-slate-600' },
};

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};

export default function MilestoneTimeline() {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('days_remaining');

  // Fetch all milestones
  const { data: reminders = [] } = useQuery({
    queryKey: ['milestone-reminders'],
    queryFn: () => base44.entities.MilestoneReminder.list('-milestone_date'),
  });

  // Fetch cases for context
  const { data: cases = [] } = useQuery({
    queryKey: ['legal-cases'],
    queryFn: () => base44.entities.LegalCase.list('-created_date'),
  });

  const filtered = reminders.filter((r) => {
    const matchSeverity =
      filterSeverity === 'all' || r.severity === filterSeverity;
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSeverity && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'days_remaining') {
      return (a.days_remaining || 999) - (b.days_remaining || 999);
    }
    if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (
        (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
      );
    }
    return new Date(a.milestone_date) - new Date(b.milestone_date);
  });

  // Calculate statistics
  const criticalCount = reminders.filter(
    (r) => r.severity === 'critical' && r.status === 'pending'
  ).length;
  const completedCount = reminders.filter((r) => r.status === 'completed').length;
  const upcomingCount = reminders.filter(
    (r) => r.status === 'pending' && (r.days_remaining || 0) > 0
  ).length;

  const getClientName = (caseId) => {
    return cases.find((c) => c.id === caseId)?.client_name || 'Unknown';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <Clock className="w-5 h-5 text-orange-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Milestone Timeline
          </h1>
          <p className="text-slate-600 mt-2">
            Track and manage all case limitation dates, court deadlines, and critical milestones
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-slate-600">Critical</p>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-slate-600">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-slate-600">Completed</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold">{reminders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="notified">Notified</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  Severity
                </label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days_remaining">Days Remaining</SelectItem>
                    <SelectItem value="severity">Severity</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <Card className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No milestones found</p>
            </Card>
          ) : (
            sorted.map((reminder, idx) => (
              <Card
                key={reminder.id}
                className={`border-l-4 hover:shadow-md transition-shadow ${
                  reminder.severity === 'critical'
                    ? 'border-l-red-500'
                    : reminder.severity === 'high'
                      ? 'border-l-orange-500'
                      : reminder.severity === 'medium'
                        ? 'border-l-yellow-500'
                        : 'border-l-green-500'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Icon and Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-2xl">
                          {MILESTONE_TYPES[reminder.milestone_type]?.icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-lg">
                            {reminder.title}
                          </h3>
                          <p className="text-xs text-slate-600">
                            {getClientName(reminder.case_id)}
                          </p>
                        </div>
                      </div>

                      {reminder.description && (
                        <p className="text-sm text-slate-700 ml-11 mb-3">
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 ml-11 flex-wrap">
                        <Badge className={SEVERITY_COLORS[reminder.severity]}>
                          {reminder.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {MILESTONE_TYPES[reminder.milestone_type]?.label}
                        </Badge>
                        <Badge variant="outline">{reminder.status}</Badge>
                        {reminder.reminder_sent && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 text-xs"
                          >
                            ✓ Notified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right: Date and Status */}
                    <div className="text-right shrink-0">
                      <div className="flex flex-col items-end gap-2 mb-3">
                        {getStatusIcon(reminder.status)}
                        <p className="text-sm font-mono font-bold text-slate-900">
                          {new Date(
                            reminder.milestone_date
                          ).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      {reminder.days_remaining !== null && (
                        <div
                          className={`px-3 py-1.5 rounded text-sm font-bold ${
                            reminder.days_remaining < 0
                              ? 'bg-slate-200 text-slate-800'
                              : reminder.days_remaining <= 3
                                ? 'bg-red-200 text-red-900'
                                : reminder.days_remaining <= 7
                                  ? 'bg-orange-200 text-orange-900'
                                  : 'bg-blue-200 text-blue-900'
                          }`}
                        >
                          {reminder.days_remaining < 0
                            ? 'OVERDUE'
                            : `${reminder.days_remaining}d`}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Banner */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Automated Reminder System Active</p>
                <p>
                  All milestones are checked daily. Email notifications are sent to assigned fee earners when key dates approach. In-app reminders are created automatically for critical and high-priority items.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}