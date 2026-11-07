// components/dashboard/charts/TopServicesList.tsx
'use client';

import { Activity } from 'lucide-react';

interface TopServicesListProps {
  services: Array<{
    serviceId: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
}

export function TopServicesList({ services }: TopServicesListProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Top Services</h2>
            <p className="mt-1 text-sm text-gray-500">Most booked services</p>
          </div>
          <Activity className="h-4 w-4 text-gray-300" />
        </div>
        <div className="flex h-32 items-center justify-center text-gray-400">No service data available</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Top Services</h2>
          <p className="mt-1 text-sm text-gray-500">Most booked services</p>
        </div>
        <Activity className="h-4 w-4 text-gray-300" />
      </div>
      <div className="space-y-3">
        {services.map((service, idx) => (
          <div key={service.serviceId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center text-gray-900 text-xs font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-500">{service.bookings} bookings</p>
                  <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-400 rounded-full transition-all duration-500"
                      style={{ width: `${(service.bookings / services[0].bookings) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900">{service.revenue.toLocaleString()} EGP</p>
          </div>
        ))}
      </div>
    </div>
  );
}