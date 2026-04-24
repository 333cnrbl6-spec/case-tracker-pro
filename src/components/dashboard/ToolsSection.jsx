import React from 'react';
import { ToolsCard } from '@/components/DashboardCards';
import { AlertTriangle, MessageSquare, FileText, Link2, Briefcase, FileText as FileTextIcon } from 'lucide-react';

export default function ToolsSection() {
  const tools = [
    {
      path: '/incidents',
      icon: AlertTriangle,
      title: 'Log Incidents',
      description: 'Document specific incidents, behaviors, and breaches',
      color: 'text-red-600'
    },
    {
      path: '/communications',
      icon: MessageSquare,
      title: 'Communications',
      description: 'Track emails, letters, and other communications',
      color: 'text-blue-600'
    },
    {
      path: '/communication-mapper',
      icon: Link2,
      title: 'Communication Mapper',
      description: 'Auto-map communications to RICS violations & flag discrepancies',
      color: 'text-purple-600'
    },
    {
      path: '/evidence',
      icon: FileText,
      title: 'Evidence & Documents',
      description: 'Upload and organize supporting documents',
      color: 'text-green-600'
    },
    {
      path: '/solicitor-brief',
      icon: Briefcase,
      title: 'Solicitor Brief',
      description: 'AI-generated legal brief with claims analysis & strategy',
      color: 'text-indigo-600'
    },
    {
      path: '/rics-documents',
      icon: FileTextIcon,
      title: 'RICS Documents',
      description: 'AI-assisted drafting of complaint letters, responses & disclosures',
      color: 'text-emerald-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      {tools.map(tool => (
        <ToolsCard key={tool.path} {...tool} />
      ))}
    </div>
  );
}