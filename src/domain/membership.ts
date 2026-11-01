import { z } from 'zod';

import { idSchema, isoDateSchema } from './common';

/** Stored fields only; `status` and `daysLeft` are derived in the domain. */
export const membershipSchema = z
  .object({
    id: idSchema,
    userId: idSchema,
    planId: idSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine((m) => m.endDate >= m.startDate, {
    message: 'endDate cannot be before startDate',
    path: ['endDate'],
  });

export type Membership = z.infer<typeof membershipSchema>;
