'use client';

import { createElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/src/utils/helpers';

export interface DashboardPageHeaderProps {
  className?: string;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function DashboardPageHeader({
  className,
  icon,
  title,
  description,
  badge,
  actions,
  children,
}: DashboardPageHeaderProps) {
  const showStandard = Boolean(icon && title);

  return (
    <div className={cn('animate-fade-in-up', className)}>
      {showStandard && icon ? (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-100">
              {createElement(icon, {
                className: 'h-5 w-5 text-brand-800',
                'aria-hidden': true,
              })}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl text-gray-900 sm:text-3xl">
                  {title}
                </h1>
                {badge}
              </div>
              {description ? (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {!showStandard ? children : null}
    </div>
  );
}
