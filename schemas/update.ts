import { z } from "zod";

export const createUpdateSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(200),
  body: z.string().trim().min(1, "Write something").max(5000),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;
