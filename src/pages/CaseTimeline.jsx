import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TimelineBuilder from '@/components/TimelineBuilder';
import { Card, CardContent } from '@/components/ui/card';

export default function CaseTimeline() {
  const { incidentId } = useParams();
  const [timeline, setTimeline] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Timeline</h1>
          <p className="text-slate-600">Build your narrative by arranging evidence and communications chronologically</p>
        </div>

        {incidentId ? (
          <TimelineBuilder 
            incidentId={incidentId}
            onTimelineUpdate={setTimeline}
          />
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              <p>Select an incident to build its timeline</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}