'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useCategories, useClinicCategoriesMutation } from '@/src/features/categories/hooks/useCategories';
import { CategoriesToolbar } from '@/src/features/categories/components/CategoriesToolbar';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { usePagination } from '@/src/hooks/usePagination';
import { Pagination } from '@/src/components/ui/Pagination';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { AddCategoryModal } from '@/src/features/categories/components/AddCategoryModal';
import { UpdateCategoryModal } from '@/src/features/categories/components/UpdateCategoryModal';
import { DeleteCategoryModal } from '@/src/features/categories/components/DeleteCategoryModal';
import { AddClinicCategoryModal } from '@/src/features/clinics/components/AddClinicCategoryModal';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { isClinicManagerRole } from '@/src/types';
import type { Category } from '@/src/features/categories/types/types';
import { DashboardPageHeader } from '@/src/components/ui/DashboardPageHeader';
import { Tags, Plus, Heart, FileText, Minus, Pencil, Trash2, Activity, LinkIcon, ImagePlus } from 'lucide-react';
import { UploadImagesModal } from '@/src/components/ui/UploadImagesModal';
import { useUploadCategoryImagesMutation } from '@/src/features/categories/hooks/useCategories';
import { resolveMediaUrl } from '@/src/lib/api/media';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { KebabMenu, KebabMenuItem, KebabMenuSeparator } from '@/src/components/ui/KebabMenu';

// ─── Table row ────────────────────────────────────────────────────────────────

interface CategoryTableRowProps {
  category: Category;
  index: number;
  canManage: boolean;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onUploadImages: (cat: Category) => void;
}

const CategoryTableRow = memo(function CategoryTableRow({
  category,
  index,
  canManage,
  onEdit,
  onDelete,
  onUploadImages,
}: CategoryTableRowProps) {
  const createdLabel = category.createdAt
    ? new Date(category.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const thumb = category.images?.[0];

  return (
    <tr
      className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70 animate-fade-in-up"
      style={{ '--stagger-index': index } as React.CSSProperties}
    >
      <td className="px-5 py-4 w-14">
        {thumb ? (
          <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(thumb)} alt={category.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-400">
            —
          </div>
        )}
      </td>

      <td className="px-5 py-4">
        <span className="font-medium text-gray-900">{category.name}</span>
      </td>

      <td className="px-5 py-4 max-w-md">
        {category.description?.trim() ? (
          <span className="line-clamp-2 text-sm text-gray-600">{category.description}</span>
        ) : (
          <span className="text-xs italic text-gray-400">No description</span>
        )}
      </td>

      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{createdLabel}</td>

      <td className="px-3 py-4 w-12">
        {canManage && (
          <KebabMenu>
            {(close) => (
              <>
           
                <KebabMenuItem icon={Pencil} onClick={() => { close(); setTimeout(() => onEdit(category), 0); }}>
                  Edit
                </KebabMenuItem>
                <KebabMenuItem
                  icon={ImagePlus}
                  onClick={() => { close(); setTimeout(() => onUploadImages(category), 0); }}
                >
                  Upload Photos
                </KebabMenuItem>
                <KebabMenuSeparator />
                <KebabMenuItem
                  icon={Trash2}
                  tone="danger"
                  onClick={() => { close(); setTimeout(() => onDelete(category), 0); }}
                >
                  Delete
                </KebabMenuItem>
              </>
            )}
          </KebabMenu>
        )}
      </td>
    </tr>
  );
});

// ─── Clinic Admin view ────────────────────────────────────────────────────────

interface ClinicCategoriesViewProps {
  clinicId: string;
}

function ClinicCategoriesView({ clinicId }: ClinicCategoriesViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const { page, limit, setPage } = usePagination({ resetKey: debouncedSearch });

  const { categories, meta, isLoading, isFetching, isError, error, refetch } = useCategories({
    clinicId,
    search: debouncedSearch,
    page,
    limit,
  });
  const { updateClinicCategoriesAsync, isPending: removing } = useClinicCategoriesMutation(clinicId);

  const errorMessage =
    (error as Error | undefined)?.message || 'Failed to load categories. Please try again.';

  const sorted = useMemo(() => {
    if (!categories?.length) return [];
    return [...categories].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [categories]);

  const handleRemove = async (cat: Category) => {
    setRemovingId(cat.id);
    try {
      await updateClinicCategoriesAsync({ action: 'remove', categoryIds: [cat.id] });
    } finally {
      setRemovingId(null);
    }
  };


  if (isLoading && !debouncedSearch) return <LoadingState message="Loading categories..." page />;
  if (isError) return <ErrorState message={errorMessage} onRetry={() => refetch()} page />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <DashboardPageHeader
        icon={Tags}
        title="Categories"
        description="Categories linked to your clinic. Add or remove categories for your services."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Tags className="h-4 w-4 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Linked Categories</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{categories.length}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-500">
            <FileText className="h-4 w-4 text-emerald-700 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">With description</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">
              {categories.filter((c) => typeof c.description === 'string' && c.description.trim()).length}
            </p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-200">
            <LinkIcon className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">No description</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">
              {categories.filter((c) => !c.description?.trim()).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search + Table header + Add button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinic categories..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Clinic Categories</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              {categories.length} {categories.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>
      </div>

      {sorted.length > 0 || meta.total > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 w-14">Photo</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Description</th>
                  <th className="px-3 py-3.5 w-24 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((cat, i) => {
                  const thumb = cat.images?.[0];
                  const isRemoving = removingId === cat.id;
                  return (
                    <tr
                      key={cat.id}
                      className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-100/70"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                    >
                      <td className="px-5 py-4 w-14">
                        {thumb ? (
                          <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-100 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={resolveMediaUrl(thumb)} alt={cat.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
                            <Activity className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-5 py-4 max-w-xs">
                        {cat.description?.trim() ? (
                          <span className="line-clamp-2 text-sm text-gray-600">{cat.description}</span>
                        ) : (
                          <span className="text-xs italic text-gray-400">No description</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={removing}
                          onClick={() => void handleRemove(cat)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-all lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            itemLabel="category"
            onPageChange={setPage}
            isFetching={isFetching}
          />
        </div>
      ) : (
        <EmptyState
          icon={Tags}
          title="No categories linked yet"
          description="Link categories to your clinic so patients can find your services more easily."
          action={{ label: 'Add first category', icon: Plus, onClick: () => setIsAddOpen(true) }}
        />
      )}

      <div className="flex items-center justify-end border-t border-gray-100 pt-5">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <Heart className="h-3 w-3" />
          Made with Lola Clinic Admin
        </button>
      </div>

      <AddClinicCategoryModal
        open={isAddOpen}
        clinicId={clinicId}
        onClose={() => setIsAddOpen(false)}
        onAdded={() => setIsAddOpen(false)}
      />
    </div>
  );
}

// ─── Super Admin view (global categories) ─────────────────────────────────────

function SuperAdminCategoriesView() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [uploadImagesCategory, setUploadImagesCategory] = useState<Category | null>(null);
  const { uploadCategoryImages, isPending: isUploading } = useUploadCategoryImagesMutation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const { page, limit, setPage } = usePagination({ resetKey: debouncedSearch });

  const { categories, meta, isLoading, isFetching, isError, error, refetch } = useCategories({
    search: debouncedSearch,
    page,
    limit,
  });

  const errorMessage =
    (error as Error | undefined)?.message || 'Failed to load categories. Please try again later.';

  const stats = useMemo(() => {
    const list = categories ?? [];
    const total = list.length;
    const withDescription = list.filter(
      (c) => typeof c.description === 'string' && c.description.trim().length > 0
    ).length;
    return { total, withDescription, withoutDescription: total - withDescription };
  }, [categories]);

  const sortedCategories = useMemo(() => {
    if (!categories?.length) return [];
    return [...categories].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [categories]);

  // Stable references — passed into the memoized CategoryTableRow, so an
  // inline arrow recreated every render would silently defeat that memo.
  const handleEditCategory = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setIsEditOpen(true);
  }, []);
  const handleDeleteCategory = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setIsDeleteOpen(true);
  }, []);
  const handleUploadImagesForCategory = useCallback((cat: Category) => {
    setUploadImagesCategory(cat);
  }, []);

  // Show the full-page loader only on the first load — keep typing responsive
  // while later debounced searches refetch in the background.
  if (isLoading && !debouncedSearch) return <LoadingState message="Loading categories..." page />;
  if (isError) return <ErrorState message={errorMessage} onRetry={() => refetch()} page />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <DashboardPageHeader
        icon={Tags}
        title="Categories"
        description="Organize clinic services into categories for management and discovery"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Tags className="h-4 w-4 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Total Categories</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-500">
            <FileText className="h-4 w-4 text-emerald-700 transition-colors group-hover:text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">With description</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{stats.withDescription}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-200">
            <Minus className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">No description</p>
            <p className="mt-0.5 font-heading text-2xl text-gray-900">{stats.withoutDescription}</p>
          </div>
        </div>
      </div>

      <CategoriesToolbar
        onAddCategory={() => setIsAddOpen(true)}
        search={search}
        onSearchChange={setSearch}
      />

      {(categories && categories.length > 0) || meta.total > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">All Categories</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {meta.total} {meta.total === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">Sorted by name</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 w-14">Photo</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Description</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">Created</th>
                    <th className="px-3 py-3.5 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((category, index) => (
                    <CategoryTableRow
                      key={category.id}
                      category={category}
                      index={index}
                      canManage
                      onEdit={handleEditCategory}
                      onDelete={handleDeleteCategory}
                      onUploadImages={handleUploadImagesForCategory}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel="category"
              onPageChange={setPage}
              isFetching={isFetching}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create categories to organize clinic services and make them easier to find."
          action={{ label: 'Add your first category', icon: Plus, onClick: () => setIsAddOpen(true) }}
        />
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span>
            Last updated{' '}
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <Heart className="h-3 w-3" />
          Made with Lola Clinic Admin
        </button>
      </div>

      <AddCategoryModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={() => refetch()}
      />
      <UpdateCategoryModal
        open={isEditOpen}
        category={selectedCategory}
        onClose={() => { setIsEditOpen(false); setSelectedCategory(null); }}
        onSaved={() => refetch()}
      />
      <DeleteCategoryModal
        open={isDeleteOpen}
        category={selectedCategory}
        onClose={() => { setIsDeleteOpen(false); setSelectedCategory(null); }}
        onConfirm={() => refetch()}
      />
      <UploadImagesModal
        open={Boolean(uploadImagesCategory)}
        onClose={() => setUploadImagesCategory(null)}
        title="Upload Category Photos"
        entityName={uploadImagesCategory?.name}
        onUpload={(files) => uploadCategoryImages({ id: uploadImagesCategory!.id, files })}
        isUploading={isUploading}
      />
    </div>
  );
}

// ─── Root component (role-aware) ──────────────────────────────────────────────

export const CategoriesManagement = () => {
  const { user } = useAuthStore();

  if (isClinicManagerRole(user?.role) && user?.clinicId) {
    return <ClinicCategoriesView clinicId={user.clinicId} />;
  }

  return <SuperAdminCategoriesView />;
};