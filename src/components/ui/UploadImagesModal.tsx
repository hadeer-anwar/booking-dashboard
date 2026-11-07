'use client';

import { useState, useEffect } from 'react';
import { X, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { FormImagePicker } from './FormImagePicker';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

interface UploadImagesModalProps {
  open: boolean;
  onClose: () => void;
  /** Modal heading, e.g. "Upload Clinic Photos" */
  title: string;
  /** Name of the entity shown below the title for context */
  entityName?: string;
  /** Called with selected files; should call the API and resolve/reject */
  onUpload: (files: File[]) => Promise<void>;
  isUploading?: boolean;
}

export function UploadImagesModal({
  open,
  onClose,
  title,
  entityName,
  onUpload,
  isUploading = false,
}: UploadImagesModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) {
      setError('Please select at least one image.');
      return;
    }
    setError(null);
    try {
      await onUpload(files);
      onClose();
    } catch {
      setError('Upload failed. Please try again.');
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {entityName && (
              <p className="mt-0.5 text-sm text-gray-500 truncate max-w-xs">{entityName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          <FormImagePicker files={files} onChange={setFiles} label="Photos" />

          {files.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <span className="text-xs text-gray-600">
                {files.length} image{files.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => setFiles([])}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 pt-2 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || files.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  Upload Photos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
