'use client';

import { MapPin, Phone, Tag, Activity, Info, Pencil, ImagePlus } from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { formatTime24To12 } from '@/src/utils/helpers';
import type { Clinic } from '../types/types';
import type { ClinicScheduleHour } from '@/src/features/schedule/types/types';
import { resolveMediaUrl } from '@/src/lib/api/media';

const getTodaySchedule = (workingDays: { day: string; isOpen: boolean; hours: ClinicScheduleHour[] }[]) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return workingDays.find((d) => d.day === today);
};

interface ClinicOverviewTabProps {
  clinic: Clinic;
  onEdit?: () => void;
  onUploadPhotos?: () => void;
}

interface InfoFieldProps {
  icon: typeof MapPin;
  label: string;
  value: string;
  fullWidth?: boolean;
}

function InfoField({ icon: Icon, label, value, fullWidth }: InfoFieldProps) {
  return (
    <div className={`flex items-start gap-3 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-relaxed text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function ClinicOverviewTab({ clinic, onEdit, onUploadPhotos }: ClinicOverviewTabProps) {
  const todaySchedule = getTodaySchedule(clinic.schedule?.workingDays ?? []);
  const isOpenToday = Boolean(todaySchedule?.isOpen && todaySchedule.hours?.length);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">General Information</h2>
          <StatusBadge active={Boolean(clinic.isActive)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onUploadPhotos && (
            <button
              type="button"
              onClick={onUploadPhotos}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ImagePlus className="h-4 w-4 text-gray-500" />
              Upload Photos
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4 text-gray-500" />
              Edit Clinic
            </button>
          )}
        </div>
      </div>

      {/* Photos */}
      {clinic.images && clinic.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {clinic.images.map((src) => (
            <div
              key={src}
              className="relative h-40 w-56 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(src)} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Details card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InfoField icon={MapPin} label="Address" value={clinic.address} fullWidth />
          <InfoField icon={Phone} label="Phone" value={clinic.phone ?? '—'} />
          <InfoField icon={Tag} label="Clinic type" value={clinic.type ?? '—'} />
          {clinic.about && <InfoField icon={Info} label="About" value={clinic.about} fullWidth />}
        </div>

        {/* Today's hours — always shown, not just when open, so a closed
            day reads as "closed" rather than the row silently vanishing. */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-700">Today&apos;s hours</span>
            {isOpenToday && todaySchedule && (
              <span className="text-gray-900">
                {todaySchedule.hours
                  .map((h) => `${formatTime24To12(h.start)} – ${formatTime24To12(h.end)}`)
                  .join(', ')}
              </span>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isOpenToday ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOpenToday ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isOpenToday ? 'Open now' : 'Closed today'}
          </span>
        </div>
      </div>
    </div>
  );
}
