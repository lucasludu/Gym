import { z } from 'zod';

import { idSchema, nonEmptyStringSchema, positiveIntSchema } from './common';

export const planSchema = z.object({
  id: idSchema,
  name: nonEmptyStringSchema,
  /** Price in ARS. */
  price: z.number().nonnegative(),
  /** `null` means unlimited bookings. */
  weeklyClassLimit: positiveIntSchema.nullable(),
});

export type Plan = z.infer<typeof planSchema>;
