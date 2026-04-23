import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, GripVertical, Trash2, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export default function TimelineBuilder({ incidentId, onTimelineUpdate }) {
  const [focusedItem, setFocusedItem] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [timelineItems, setTimelineItems] = useState([]);
  const [startDate, setStartDate] = useState('');
  const queryClient = useQueryClient();

  // Fetch incident, evidence, and communications
  const { data: incident } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => base44.asServiceRole.entities.Incident.get(incidentId),
    enabled: !!incidentId
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => base44.asServiceRole.entities.Evidence.list('-date_collected', 100)
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['communications'],
    queryFn: () => base44.asServiceRole.entities.Communication.list('-date', 100)
  });

  // Build timeline from incident date
  useMemo(() => {
    if (!incident || !startDate) return;

    const baseDate = parseISO(startDate);
    const items = [];

    // Add incident as reference point
    items.push({
      id: `incident-${incident.id}`,
      type: 'incident',
      date: incident.date,
      title: incident.title,
      severity: incident.severity,
      order: 0,
      isPrimary: true
    });

    // Add related evidence
    evidence.forEach((e) => {
      if (e.related_incidents?.includes(incidentId) || !e.related_incidents?.length) {
        items.push({
          id: `evidence-${e.id}`,
          type: 'evidence',
          date: e.date_collected,
          title: e.title,
          strength: e.strength,
          order: items.length,
          data: e
        });
      }
    });

    // Add related communications
    communications.forEach((c) => {
      if (c.related_incidents?.includes(incidentId) || !c.related_incidents?.length) {
        items.push({
          id: `communication-${c.id}`,
          type: 'communication',
          date: c.date,
          title: `${c.from} → ${c.to}`,
          tone: c.tone,
          order: items.length,
          data: c
        });
      }
    });

    // Sort by date
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    setTimelineItems(items);
  }, [incident, evidence, communications, startDate, incidentId]);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const newItems = [...timelineItems];
    const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id);
    const targetIndex = newItems.findIndex(i => i.id === targetItem.id);

    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setTimelineItems(newItems);
    setDraggedItem(null);

    // Update order metadata
    if (onTimelineUpdate) {
      onTimelineUpdate(newItems);
    }
  };

  const handleDeleteItem = (itemId) => {
    setTimelineItems(timelineItems.filter(i => i.id !== itemId));
  };

  const typeIcons = {
    incident: '📍',
    evidence: '📎',
    communication: '💬'
  };

  const typeColors = {
    incident: 'bg-red-50 border-red-200',
    evidence: 'bg-blue-50 border-blue-200',
    communication: 'bg-purple-50 border-purple-200'
  };

  const toneColors = {
    professional: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    aggressive: 'bg-red-100 text-red-800',
    dismissive: 'bg-orange-100 text-orange-800',
    threatening: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Timeline Builder</h2>
        <p className="text-slate-600 text-sm">Arrange evidence and communications chronologically to build your narrative</p>
      </div>

      {/* Start Date Picker */}
      {incident && !startDate && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900 mb-2">Incident: {incident.title}</p>
                <p className="text-sm text-slate-600 mb-4">Date: {format(parseISO(incident.date), 'dd MMM yyyy')}</p>
                <Button
                  size="sm"
                  onClick={() => setStartDate(incident.date)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Use This as Timeline Start
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {startDate && timelineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Chronological Timeline</span>
              <Badge variant="outline">{timelineItems.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Timeline line */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-slate-200" />

                {/* Timeline items */}
                <AnimatePresence>
                  {timelineItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item)}
                      className={`ml-20 p-4 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${typeColors[item.type]} ${
                        draggedItem?.id === item.id ? 'opacity-50' : ''
                      } ${focusedItem?.id === item.id ? 'ring-2 ring-indigo-400' : ''}`}
                    >
                      {/* Timeline node */}
                      <div className="absolute -left-5 top-6 w-10 h-10 bg-white border-2 border-indigo-400 rounded-full flex items-center justify-center text-lg shadow-md">
                        {typeIcons[item.type]}
                      </div>

                      {/* Item content */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {format(parseISO(item.date), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 cursor-grab active:cursor-grabbing"
                              onMouseDown={() => setFocusedItem(item)}
                            >
                              <GripVertical className="w-3 h-3 text-slate-400" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.type}
                          </Badge>
                          {item.severity && (
                            <Badge className={`text-xs ${
                              item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              item.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.severity}
                            </Badge>
                          )}
                          {item.strength && (
                            <Badge className="text-xs bg-slate-100 text-slate-800">
                              {item.strength}
                            </Badge>
                          )}
                          {item.tone && (
                            <Badge className={`text-xs ${toneColors[item.tone]}`}>
                              {item.tone}
                            </Badge>
                          )}
                        </div>

                        {/* Summary */}
                        {item.type === 'evidence' && item.data?.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-2">{item.data.description}</p>
                        )}
                        {item.type === 'communication' && item.data?.subject && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                            <span className="font-medium">Subject:</span> {item.data.subject}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {timelineItems.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {timelineItems.filter(i => i.type === 'evidence').length}
                </p>
                <p className="text-xs text-slate-600">Evidence Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {timelineItems.filter(i => i.type === 'communication').length}
                </p>
                <p className="text-xs text-slate-600">Communications</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {timelineItems.length > 0 ? Math.ceil((new Date(timelineItems[timelineItems.length - 1].date) - new Date(timelineItems[0].date)) / (1000 * 60 * 60 * 24)) : 0}
                </p>
                <p className="text-xs text-slate-600">Days Spanned</p>
              </div>
              <div>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Download className="w-3 h-3" />
                  Export Timeline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}