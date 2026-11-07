export const clinicKeys = {
  all: ['clinics'] as const,
  detail: (clinicId: string) => ['clinic', clinicId] as const,
  schedule: (clinicId: string) => ['clinic-schedule', clinicId] as const,
  settings: (clinicId: string) => ['clinicSettings', clinicId] as const,
};
