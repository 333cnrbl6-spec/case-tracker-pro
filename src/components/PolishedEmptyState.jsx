import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PolishedEmptyState({ icon: Icon, title, description, actionLabel, onAction, actionVariant = 'default' }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full p-6 mb-4">
          <Icon className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm">{description}</p>
        {onAction && actionLabel && (
          <Button onClick={onAction} variant={actionVariant} className="gap-2">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}