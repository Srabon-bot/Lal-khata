import { z } from "zod";

export const ExtractionTypeSchema = z.enum(["credit_sale", "cash_sale", "repayment", "unclear"]);
export type ExtractionType = z.infer<typeof ExtractionTypeSchema>;

export const ExtractionResultSchema = z.object({
  type: ExtractionTypeSchema,
  customer: z.string().nullable(),
  item: z.string().nullable(),
  amount_taka: z.number().nullable(),
  confidence: z.object({
    customer: z.number().min(0).max(1),
    item: z.number().min(0).max(1),
    amount: z.number().min(0).max(1),
  }),
  transcript: z.string(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
