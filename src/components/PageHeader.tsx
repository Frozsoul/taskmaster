
import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionButtons?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actionButtons }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 text-primary" />}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {actionButtons && <div className="flex gap-2">{actionButtons}</div>}
      </div>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
  );
}
