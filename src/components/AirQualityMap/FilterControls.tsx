import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { formatPollutantName } from "@/utils/formatters";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import type { FilterControlsProps } from "@/types/components/airQualityMap/filterControls";

const FilterControls: React.FC<FilterControlsProps> = ({
  form,
  onSubmit,
  isSearching,
  isDataLoading,
  combinedError,
}) => {
  const aqiRange = form.watch("aqiRange");
  const selectedPollutant = form.watch("selectedPollutant");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="searchQuery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localização</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="País, cidade..."
                    {...field}
                    onKeyUp={(e) =>
                      !(isSearching || isDataLoading) &&
                      e.key === "Enter" &&
                      form.handleSubmit(onSubmit)()
                    }
                  />
                </FormControl>
                <Button type="submit" disabled={isSearching || isDataLoading}>
                  {isSearching ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selectedPollutant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visualizar por Poluente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um poluente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="aqi">AQI Geral</SelectItem>
                  <SelectItem value="pm25">PM2.5</SelectItem>
                  <SelectItem value="pm10">PM10</SelectItem>
                  <SelectItem value="o3">
                    O<sub>3</sub> (Ozônio)
                  </SelectItem>
                  <SelectItem value="no2">
                    NO<sub>2</sub> (Dióxido de Nitrogênio)
                  </SelectItem>
                  <SelectItem value="so2">
                    SO<sub>2</sub> (Dióxido de Enxofre)
                  </SelectItem>
                  <SelectItem value="co">CO (Monóxido de Carbono)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aqiRange"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>
                  Faixa de Valor ({formatPollutantName(selectedPollutant)})
                </FormLabel>
                <span className="text-sm font-medium text-gray-700">
                  {aqiRange[0]} - {aqiRange[1]}
                </span>
              </div>
              <FormControl>
                <Slider
                  value={field.value}
                  onValueChange={field.onChange}
                  min={0}
                  max={500}
                  step={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          {isDataLoading && !isSearching && (
            <Alert>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <AlertTitle>Carregando dados do mapa...</AlertTitle>
            </Alert>
          )}
          {combinedError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{combinedError.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </form>
    </Form>
  );
};

export default FilterControls;
