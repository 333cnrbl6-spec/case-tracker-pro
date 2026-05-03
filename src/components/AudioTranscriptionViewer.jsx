import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function AudioTranscriptionViewer({ caseId, evidenceId }) {
  const [expandedPhrase, setExpandedPhrase] = useState(null);

  const { data: transcription, isLoading, error } = useQuery({
    queryKey: ['transcription', caseId, evidenceId],
    queryFn: async () => {
      const transcriptions = await base44.asServiceRole.entities.AudioTranscription.filter({
        case_id: caseId,
        evidence_id: evidenceId,
      });
      return transcriptions[0] || null;
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Transcribing audio evidence...</p>
            <p className="text-sm text-blue-700">This may take a few minutes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !transcription) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-red-800">Failed to load transcription</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (transcription.transcription_status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-base">Audio Transcription</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  {transcription.file_type === 'audio' ? '🎙️ Audio' : '🎥 Video'} •{' '}
                  {transcription.quality_score && `${transcription.quality_score}% quality`}
                </p>
              </div>
            </div>
            {transcription.transcription_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={transcription.transcription_url} download>
                  <Download className="w-3 h-3 mr-1" /> Download
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Transcription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Full Transcription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {transcription.transcription_text}
          </p>
          {transcription.detected_speakers && transcription.detected_speakers.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-slate-600 mb-2">Speakers detected:</p>
              <div className="flex flex-wrap gap-2">
                {transcription.detected_speakers.map((speaker, idx) => (
                  <Badge key={idx} variant="outline">{speaker}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Phrases & RICS Indicators */}
      {(transcription.key_phrases?.length > 0 || transcription.rics_breach_indicators?.length > 0) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm">🚨 Key Phrases & RICS Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transcription.rics_breach_indicators?.map((indicator, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-lg border border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setExpandedPhrase(expandedPhrase === idx ? null : idx)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{indicator.breach_type}</p>
                    <p className="text-xs text-slate-600 mt-1">"{indicator.evidence_text}"</p>
                  </div>
                  <Badge className={getSentimentColor('negative')}>
                    {Math.round(indicator.confidence * 100)}%
                  </Badge>
                </div>
                {expandedPhrase === idx && (
                  <div className="mt-2 pt-2 border-t text-xs text-slate-600">
                    Timestamp: {Math.floor(indicator.timestamp / 60)}:{String(indicator.timestamp % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
            ))}

            {transcription.key_phrases?.map((phrase, idx) => (
              <div
                key={`phrase-${idx}`}
                className="bg-white p-3 rounded-lg border border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setExpandedPhrase(expandedPhrase === `phrase-${idx}` ? null : `phrase-${idx}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{phrase.phrase}</p>
                    <p className="text-xs text-slate-600 mt-1">{phrase.context}</p>
                  </div>
                  <Badge variant="outline">{phrase.relevance}</Badge>
                </div>
                {expandedPhrase === `phrase-${idx}` && (
                  <div className="mt-2 pt-2 border-t text-xs text-slate-600">
                    Timestamp: {Math.floor(phrase.timestamp / 60)}:{String(phrase.timestamp % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sentiment Analysis */}
      {transcription.sentiment_analysis?.overall_sentiment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall:</span>
              <Badge className={getSentimentColor(transcription.sentiment_analysis.overall_sentiment)}>
                {transcription.sentiment_analysis.overall_sentiment.toUpperCase()}
              </Badge>
            </div>
            {transcription.sentiment_analysis.segments?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Key segments:</p>
                {transcription.sentiment_analysis.segments.slice(0, 3).map((seg, idx) => (
                  <div key={idx} className="text-xs bg-slate-50 p-2 rounded">
                    <p className="text-slate-700">"{seg.text}"</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getSentimentColor(seg.sentiment)} variant="outline">
                        {seg.sentiment}
                      </Badge>
                      <span className="text-slate-500">{Math.round(seg.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Incidents */}
      {transcription.linked_incidents?.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-sm">✓ Linked to {transcription.linked_incidents.length} Incident(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-800">
              This transcription has been automatically linked to relevant timeline incidents and RICS breach analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}