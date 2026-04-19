import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertTriangle, MessageSquare, CheckCircle2, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const eventTypeConfig = {
  incident: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800 border-red-300'
  },
  task: {
    icon: CheckCircle2,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  communication: {
    icon: MessageSquare,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-800 border-purple-300'
  }
};

const severityColors = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

export default function TimelineEvent({ event, isConnected = false }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  let title = '';
  let subtitle = '';
  let details = [];
  let severity = null;

  if (event.type === 'incident') {
    title = event.data.title;
    subtitle = event.data.incident_type;
    severity = event.data.severity;
    details = [
      event.data.status,
      event.data.rics_violations?.length > 0 && `${event.data.rics_violations.length} RICS violations`
    ].filter(Boolean);
  } else if (event.type === 'task') {
    title = event.data.title;
    subtitle = event.data.status;
    severity = event.data.priority;
    details = [
      event.data.assigned_to,
      event.data.deadline && `Due: ${new Date(event.data.deadline).toLocaleDateString()}`
    ].filter(Boolean);
  } else if (event.type === 'communication') {
    title = event.data.subject;
    subtitle = `${event.data.from} → ${event.data.to}`;
    details = [
      event.data.type,
      event.data.tone
    ].filter(Boolean);
  }

  return (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${config.color} border-2 border-white shadow-md`} />
        {isConnected && <div className="w-0.5 h-16 bg-slate-200" />}
      </div>

      {/* Event Card */}
      <Card className={`flex-1 mb-6 border-l-4 ${config.bg}`} style={{ borderLeftColor: config.color }}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.color}`} />
              <div>
                <h3 className="font-semibold text-slate-900 line-clamp-2">{title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
              </div>
            </div>
            <Badge className={config.badge}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </Badge>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-2 mb-3">
            {severity && (
              <Badge className={severityColors[severity]}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Badge>
            )}
            {details.map((detail, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {detail}
              </Badge>
            ))}
          </div>

          {/* Metadata */}
          <div className="flex gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
            </span>
            {event.data.assigned_to && event.type === 'task' && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.data.assigned_to}
              </span>
            )}
            {event.data.created_by && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event.data.created_by}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}