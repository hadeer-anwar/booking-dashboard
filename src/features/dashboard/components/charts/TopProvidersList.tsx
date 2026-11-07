// components/dashboard/charts/TopProvidersList.tsx
'use client';

import { Users, Zap } from 'lucide-react';

interface TopProvidersListProps {
  providers: Array<{
    providerId: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
}

export function TopProvidersList({ providers }: TopProvidersListProps) {
  if (providers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Top Providers</h2>
            <p className="mt-1 text-sm text-gray-500">Most active staff members</p>
          </div>
          <Users className="h-4 w-4 text-gray-300" />
        </div>
        <div className="flex h-32 items-center justify-center text-gray-400">No provider data available</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Top Providers</h2>
          <p className="mt-1 text-sm text-gray-500">Most active staff members</p>
        </div>
        <Users className="h-4 w-4 text-gray-300" />
      </div>
      <div className="space-y-3">
        {providers.map((provider, idx) => (
          <div key={provider.providerId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-tan-400 to-tan-700 flex items-center justify-center text-gray-900 text-xs font-bold">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
                {idx === 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <Zap className="w-3 h-3 text-gold-700 fill-gold-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{provider.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-500">{provider.bookings} appointments</p>
                  <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tan-400 rounded-full transition-all duration-500"
                      style={{ width: `${(provider.bookings / providers[0].bookings) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900">{provider.revenue.toLocaleString()} EGP</p>
          </div>
        ))}
      </div>
    </div>
  );
}