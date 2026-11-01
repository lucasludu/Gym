import { z } from 'zod';

import { idSchema, nonEmptyStringSchema, positiveIntSchema } from './common';

export const routineDaySchema = z.object({
  id: idSchema,
  routineId: idSchema,
  order: positiveIntSchema,
  name: nonEmptyStringSchema,
});

export type RoutineDay = z.infer<typeof routineDaySchema>;
