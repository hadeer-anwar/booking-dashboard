/**
 * Common identity fields shared by every "raw person" shape a backend
 * endpoint returns (appointment participants, customers, providers, staff).
 * Backends disagree on which fields are required and whether the id comes
 * back as `id` or `_id`, so this is intentionally the loosest common shape —
 * each feature's Raw* type narrows it with `Omit<RawPersonIdentity, ...> & {...}`
 * to declare exactly which fields IT requires, instead of every feature
 * redefining the same six fields from scratch.
 */
export interface RawPersonIdentity {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}
