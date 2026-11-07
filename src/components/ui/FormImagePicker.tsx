'use client';

import { useId } from 'react';
import { ImagePlus } from 'lucide-react';

interface FormImagePickerProps {
  label?: string;
  hint?: string;
  files: File[];
  onChange: (files: File[]) => void;
}

export function FormImagePicker({
  label = 'Photos',
  hint = 'Optional. Upload one or more images (sent as form field "images").',
  files,
  onChange,
}: FormImagePickerProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700">
        {label}
      </label>
      <p className="text-xs text-gray-500">{hint}</p>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-4 py-6 text-center transition-colors hover:border-gray-400 hover:bg-gray-50"
      >
        <ImagePlus className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Choose images</span>
        <span className="text-xs text-gray-500">PNG, JPG, WebP</span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const next = Array.from(e.target.files ?? []);
          onChange(next);
          e.target.value = '';
        }}
      />
      {files.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}-${f.lastModified}`} className="truncate">
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
