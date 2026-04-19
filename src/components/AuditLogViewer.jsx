import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatAuditEventType, getSeverityColor } from '@/lib/auditLogger';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogViewer() {
  const [filters, setFilters] = useState({
    event_type: '',
    severity: '',
    search: ''
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-updated_date', 500),
  });

  const filteredLogs = logs.filter(log => {
    if (filters.event_type && log.event_type !== filters.event_type) return false;
    if (filters.severity && log.severity !== filters.severity) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.case_ref?.toLowerCase().includes(searchLower) ||
        log.triggered_by.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusBadgeColor = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Case ref, action, user..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={filters.event_type} onValueChange={(value) => setFilters({ ...filters, event_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Events</SelectItem>
                  <SelectItem value="workflow_triggered">Workflow Triggered</SelectItem>
                  <SelectItem value="task_created">Task Created</SelectItem>
                  <SelectItem value="task_escalated">Task Escalated</SelectItem>
                  <SelectItem value="reminder_sent">Reminder Sent</SelectItem>
                  <SelectItem value="escalation_sent">Escalation Sent</SelectItem>
                  <SelectItem value="risk_assessment_created">Risk Assessment Created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No audit events found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Timestamp</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Event Type</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Action</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Case Ref</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Triggered By</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Assigned To</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Severity</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {format(new Date(log.timestamp), 'dd MMM yy HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Badge variant="outline">{formatAuditEventType(log.event_type)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate" title={log.action}>
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {log.case_ref || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {log.triggered_by === 'system' ? (
                          <Badge className="bg-slate-100 text-slate-700">System</Badge>
                        ) : (
                          log.triggered_by
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {log.assigned_to || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Badge className={getStatusBadgeColor(log.status)}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}