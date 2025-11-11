import { z } from "zod";

export const filterSchema = z.object({
  searchQuery: z.string().optional(),
  selectedPollutant: z.string().min(1, "Selecione um poluente."),
  aqiRange: z
    .array(z.number())
    .min(2, "A faixa de AQI deve ter dois valores.")
    .max(2, "A faixa de AQI deve ter dois valores."),
});
