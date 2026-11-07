// Re-exported from the zod schema so the runtime contract and the TypeScript
// type can never drift apart — see schemas/settings.schema.ts.
export type { ClinicSettings, ProviderSelectionPolicy, AvailabilityReleasePolicy } from '../schemas/settings.schema';
