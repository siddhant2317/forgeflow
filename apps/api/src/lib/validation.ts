import { z } from 'zod';
import { GraphQLError } from 'graphql';

export const CreatePartSchema = z.object({
  partNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  unit: z.enum(['each', 'kg', 'lb', 'm', 'ft', 'L', 'gal']),
});

export const UpdatePartSchema = z.object({
  partNumber: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  unit: z.enum(['each', 'kg', 'lb', 'm', 'ft', 'L', 'gal']).optional(),
});

export const CreateWorkOrderSchema = z.object({
  title: z.string().min(1).max(200),
  partId: z.string().min(1),
  steps: z.array(z.string().min(1).max(500)).min(1).max(50),
});

export const AddInventoryItemSchema = z.object({
  partId: z.string().min(1),
  location: z.string().min(1).max(200),
  quantity: z.number().positive(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new GraphQLError(`Validation failed: ${fieldErrors.join('; ')}`, {
      extensions: { code: 'BAD_USER_INPUT', fieldErrors: result.error.flatten().fieldErrors },
    });
  }
  return result.data;
}
