import { z } from 'zod';

/**
 * Runtime contracts for the analytics dashboard responses. These are the
 * single source of truth for `DashboardData`/`SuperAdminData` (see the
 * inferred exports below) — previously this feature had no validation at
 * all between the raw API response and the TypeScript type, just an
 * unchecked generic-type cast on the axios response.
 */

const trendPointSchema = z.object({
  count: z.number(),
  date: z.string(),
});

const statusDistributionSchema = z.object({
  count: z.number(),
  status: z.string(),
});

const revenueTrendPointSchema = z.object({
  revenue: z.number(),
  month: z.string(),
});

const topServiceSchema = z.object({
  bookings: z.number(),
  revenue: z.number(),
  serviceId: z.string(),
  name: z.string(),
});

const topProviderSchema = z.object({
  bookings: z.number(),
  revenue: z.number(),
  providerId: z.string(),
  name: z.string(),
});

export const dashboardDataSchema = z.object({
  clinicData: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
  }),
  overview: z.object({
    totalBookings: z.number(),
    completed: z.number(),
    cancelled: z.number(),
    noShow: z.number(),
  }),
  bookingsTrend: z.array(trendPointSchema),
  statusDistribution: z.array(statusDistributionSchema),
  revenue: z.number(),
  revenueTrend: z.array(revenueTrendPointSchema),
  topServices: z.array(topServiceSchema),
  topProviders: z.array(topProviderSchema),
  ratings: z.object({
    avgRating: z.number(),
    totalReviews: z.number(),
  }),
});

export const superAdminDataSchema = z.object({
  totalClinics: z.number(),
  totalBookings: z.number(),
  totalRevenue: z.number(),
  activeUsers: z.number(),
  clinicsTrend: z.array(z.object({ month: z.string(), count: z.number() })),
  topClinics: z.array(z.object({ name: z.string(), bookings: z.number(), revenue: z.number() })),
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;
export type SuperAdminData = z.infer<typeof superAdminDataSchema>;
