'use client';

import { Building2, Sparkles, User } from 'lucide-react';
import { getBlockScope } from '../utils/scope';

interface ScopeBadgeProps {
  providerId: string | null;
  serviceId: string | null;
  providerName?: string;
  serviceName?: string;
}


export function ScopeBadge({ providerId, serviceId, providerName, serviceName }: ScopeBadgeProps) {
  const scope = getBlockScope({ providerId, serviceId });

  if (scope === 'providerService') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <User className="h-3 w-3" />
        {providerName ?? 'Provider'}
        <span className="text-amber-400">×</span>
        <Sparkles className="h-3 w-3" />
        {serviceName ?? 'Service'}
      </span>
    );
  }

  if (scope === 'provider') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <User className="h-3 w-3" />
        {providerName ?? 'Provider'}
      </span>
    );
  }

  if (scope === 'service') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
        <Sparkles className="h-3 w-3" />
        {serviceName ?? 'Service'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      <Building2 className="h-3 w-3" />
      Entire clinic
    </span>
  );
}
