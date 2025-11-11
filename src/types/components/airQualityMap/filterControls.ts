import { z } from "zod";

import type { filterSchema } from "@/constants/airQualityMap";
import type { UseFormReturn } from "react-hook-form";

export interface FilterControlsProps {
  form: UseFormReturn<FilterFormValues>;
  onSubmit: (values: FilterFormValues) => void;
  isSearching: boolean;
  isDataLoading: boolean;
  combinedError: Error | null | undefined;
}

export type FilterFormValues = z.infer<typeof filterSchema>;
