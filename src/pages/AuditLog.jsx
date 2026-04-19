import React from 'react';
import AuditLogViewer from '@/components/AuditLogViewer';

export default function AuditLog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Audit Log</h1>
          <p className="text-slate-600">Track all automated workflow actions and compliance events for reporting</p>
        </div>

        <AuditLogViewer />
      </div>
    </div>
  );
}