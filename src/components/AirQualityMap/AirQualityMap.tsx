import React, { useState, useRef, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import type { EChartsType } from "echarts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAirQualityData } from "@/hooks/useAirQualityData";
import { formatPollutantName } from "@/utils/formatters";
import FilterControls from "./FilterControls";
import SummaryStats from "./SummaryStats";
import MapComponent from "./MapComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { filterSchema } from "@/constants/airQualityMap";
import { searchLocationBounds } from "@/services/airQualityMap";
import type { FilterFormValues } from "@/types/components/airQualityMap/filterControls";
import type { EnrichedStationDataPoint } from "@/types/components/airQualityMap/airQualityMap";

const AirQualityMap: React.FC = () => {
  const [boundsStr, setBoundsStr] = useState<string>("");
  const mapRef = useRef<google.maps.Map | null>(null);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      searchQuery: "",
      selectedPollutant: "aqi",
      aqiRange: [0, 500],
    },
    mode: "onChange",
  });

  const selectedPollutant = form.watch("selectedPollutant");
  const aqiRange = form.watch("aqiRange");

  const {
    rawMapData,
    isLoading: isDataLoading,
    error: dataError,
  } = useAirQualityData(boundsStr);

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchLocationBounds(query),
    onSuccess: (bounds) => {
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
        if ((mapRef.current.getZoom() ?? 0) > 12) mapRef.current.setZoom(12);

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setBoundsStr(`${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`);
      }
    },
  });

  const handleSearch = (values: FilterFormValues) => {
    if (values.searchQuery) {
      searchMutation.mutate(values.searchQuery);
    }
  };

  const filteredMapData: EnrichedStationDataPoint[] = useMemo(() => {
    return rawMapData
      .map((station) => {
        const displayValue =
          selectedPollutant === "aqi"
            ? station.value[2]
            : (station.details.iaqi[selectedPollutant]?.v ?? -1);
        return { ...station, displayValue };
      })
      .filter(
        (station) =>
          station.displayValue !== -1 &&
          station.displayValue >= aqiRange[0] &&
          station.displayValue <= aqiRange[1],
      )
      .map((station) => ({
        ...station,
        value: [station.value[0], station.value[1], station.displayValue],
      }));
  }, [rawMapData, aqiRange, selectedPollutant]);

  const summaryStats = useMemo(() => {
    if (filteredMapData.length === 0) {
      return {
        average: "N/A",
        stationCount: 0,
        bestStation: null,
        worstStation: null,
        mostCommonPollutant: "N/A",
      };
    }
    const sum = filteredMapData.reduce((acc, s) => acc + s.value[2], 0);
    const best = filteredMapData.reduce((a, b) =>
      a.value[2] < b.value[2] ? a : b,
    );
    const worst = filteredMapData.reduce((a, b) =>
      a.value[2] > b.value[2] ? a : b,
    );
    const pollutantCounts = filteredMapData.reduce(
      (acc, s) => {
        const pol = s.details.dominentpol;
        if (pol) acc[pol] = (acc[pol] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const mostCommon =
      Object.keys(pollutantCounts).length > 0
        ? Object.entries(pollutantCounts).reduce((a, b) =>
            a[1] > b[1] ? a : b,
          )[0]
        : "N/A";
    return {
      average: (sum / filteredMapData.length).toFixed(1),
      stationCount: filteredMapData.length,
      bestStation: { name: best.name, value: best.value[2] },
      worstStation: { name: worst.name, value: worst.value[2] },
      mostCommonPollutant: formatPollutantName(mostCommon),
    };
  }, [filteredMapData]);

  const updateDataFromMapBounds = useCallback(() => {
    const bounds = mapRef.current?.getBounds();
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      setBoundsStr(`${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`);
    }
  }, []);

  const debouncedUpdate = useRef(
    (() => {
      let timer: number;
      return () => {
        clearTimeout(timer);
        timer = window.setTimeout(updateDataFromMapBounds, 1000);
      };
    })(),
  ).current;

  const onChartReady = (echartsInstance: EChartsType) => {
    const gmap = echartsInstance
      // @ts-expect-error getModel is private
      .getModel()
      ?.getComponent("gmap")
      ?.getGoogleMap();
    if (gmap) {
      mapRef.current = gmap;
      gmap.addListener("dragend", debouncedUpdate);
      gmap.addListener("zoomend", debouncedUpdate);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-gray-100 overflow-hidden">
      <div className="w-full gap-y-4 flex flex-col lg:w-96 bg-white border-r p-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterControls
              form={form}
              onSubmit={handleSearch}
              isSearching={searchMutation.isPending}
              isDataLoading={isDataLoading}
              combinedError={searchMutation.error || dataError}
            />
          </CardContent>
        </Card>

        <SummaryStats stats={summaryStats} pollutant={selectedPollutant} />
      </div>

      <div className="flex-1 min-h-96 min-w-80">
        <MapComponent
          data={filteredMapData}
          selectedPollutant={selectedPollutant}
          onChartReady={onChartReady}
        />
      </div>
    </div>
  );
};

export default AirQualityMap;
