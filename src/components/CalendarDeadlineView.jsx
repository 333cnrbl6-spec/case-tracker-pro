import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, differenceInDays, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle, Calendar as CalendarIcon, Upload } from 'lucide-react';

export default function CalendarDeadlineView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch all case limitation dates, court deadlines, and milestone reminders
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.MilestoneReminder.list(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.LegalCase.list(),
  });

  // Process and organize deadlines by date
  const deadlinesByDate = useMemo(() => {
    const map = {};
    
    milestones.forEach(milestone => {
      const date = milestone.milestone_date ? format(parseISO(milestone.milestone_date), 'yyyy-MM-dd') : null;
      if (!date) return;
      
      if (!map[date]) map[date] = [];
      
      const daysRemaining = differenceInDays(parseISO(milestone.milestone_date), new Date());
      let severity = 'low';
      if (daysRemaining <= 1) severity = 'critical';
      else if (daysRemaining <= 7) severity = 'high';
      else if (daysRemaining <= 30) severity = 'medium';
      
      map[date].push({
        id: milestone.id,
        title: milestone.title,
        type: milestone.milestone_type,
        caseRef: milestone.case_ref,
        daysRemaining,
        severity,
        description: milestone.description,
      });
    });

    return map;
  }, [milestones]);

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get severity badge color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getMilestoneIcon = (type) => {
    switch (type) {
      case 'limitation_date':
        return <AlertCircle className="w-4 h-4" />;
      case 'court_deadline':
        return <Clock className="w-4 h-4" />;
      case 'client_contact_due':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Case Deadline Calendar
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/calendar-sync'}>
              <Upload className="w-4 h-4 mr-2" />
              Sync to Calendar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayDeadlines = deadlinesByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={`min-h-20 p-2 border rounded text-sm ${
                    !isCurrentMonth ? 'bg-slate-50 text-slate-400' : ''
                  } ${isTodayDate ? 'border-primary border-2 bg-blue-50' : 'border-slate-200'}`}
                >
                  <div className={`font-semibold mb-1 ${isTodayDate ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayDeadlines.slice(0, 2).map(deadline => (
                      <div
                        key={deadline.id}
                        className={`${getSeverityColor(deadline.severity)} rounded px-1.5 py-0.5 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:opacity-80`}
                        title={deadline.title}
                      >
                        {getMilestoneIcon(deadline.type)}
                        <span className="truncate">{deadline.title.substring(0, 10)}</span>
                      </div>
                    ))}
                    {dayDeadlines.length > 2 && (
                      <div className="text-xs text-slate-600 px-1.5">
                        +{dayDeadlines.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critical & Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {milestones
              .sort((a, b) => parseISO(a.milestone_date) - parseISO(b.milestone_date))
              .slice(0, 10)
              .map(milestone => {
                const daysRemaining = differenceInDays(parseISO(milestone.milestone_date), new Date());
                let severity = 'low';
                if (daysRemaining <= 1) severity = 'critical';
                else if (daysRemaining <= 7) severity = 'high';
                else if (daysRemaining <= 30) severity = 'medium';

                return (
                  <div key={milestone.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                    <div className={`${getSeverityColor(severity)} rounded-full p-2 flex-shrink-0`}>
                      {getMilestoneIcon(milestone.milestone_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm truncate">{milestone.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{milestone.case_ref}</p>
                        </div>
                        <Badge variant="outline" className={`flex-shrink-0 ${getSeverityColor(severity)}`}>
                          {daysRemaining <= 0 ? 'OVERDUE' : `${daysRemaining}d`}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{milestone.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(parseISO(milestone.milestone_date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            {milestones.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-6">No deadlines scheduled yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}