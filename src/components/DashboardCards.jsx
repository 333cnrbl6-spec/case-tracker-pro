import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle, MessageSquare, FileText, FileCheck, CheckCircle, Link2, Briefcase, FileTextIcon, Scale, BarChart2, Bell, Shield, TrendingUp, Download, BarChart3, Lock } from 'lucide-react';

export function QuickActionsCards({ onQuickSetup, onCustomCase }) {
  return (
    <div className="flex gap-2 mb-8">
      <Button 
        onClick={onQuickSetup}
        className="gap-2 bg-green-600 hover:bg-green-700 whitespace-nowrap"
      >
        <span>⚡</span>
        Bradley v. Belcher
      </Button>
      <Button 
        onClick={onCustomCase}
        variant="outline"
        className="gap-2 whitespace-nowrap"
      >
        <span>📋</span>
        Custom Case
      </Button>
    </div>
  );
}

export function ToolsCard({ path, icon: Icon, title, description }) {
  return (
    <Link to={path} className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">{description}</p>
          <Button variant="outline" className="w-full">Open {title}</Button>
        </CardContent>
      </Card>
    </Link>
  );
}

export function AnalyticsCard({ path, icon: Icon, title, description, bgColor }) {
  return (
    <Link to={path} className="block">
      <Card className={`bg-gradient-to-br ${bgColor} hover:shadow-lg transition-shadow cursor-pointer h-full`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 mb-4">{description}</p>
          <Button className="w-full" variant={bgColor.includes('from-blue') ? 'default' : 'default'}>View {title}</Button>
        </CardContent>
      </Card>
    </Link>
  );
}