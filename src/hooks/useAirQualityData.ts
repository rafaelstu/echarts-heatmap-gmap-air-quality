import { useMemo } from "react";
import {
  fetchVisibleStations,
  fetchStationDetails,
} from "@/services/airQualityMap";
import type {
  EnrichedStationDataPoint,
  DetailedStationData,
} from "@/types/components/airQualityMap/airQualityMap";
import { useQuery, useQueries } from "@tanstack/react-query";

export const useAirQualityData = (boundsStr: string) => {
  const visibleStationsQuery = useQuery({
    queryKey: ["visibleStations", boundsStr],
    queryFn: () => fetchVisibleStations(boundsStr),
    enabled: !!boundsStr,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  const stationDetailsQueries = useQueries({
    queries: (visibleStationsQuery.data ?? []).map((station) => ({
      queryKey: ["stationDetail", station.uid],
      queryFn: () => fetchStationDetails(station.lat, station.lon),
      enabled: !!visibleStationsQuery.data,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const rawMapData = useMemo((): EnrichedStationDataPoint[] => {
    return stationDetailsQueries
      .filter((query) => query.isSuccess && query.data)
      .map((query) => {
        const station = query.data as DetailedStationData;
        return {
          uid: station.idx,
          name: station.city.name,
          value: [station.city.geo[1], station.city.geo[0], station.aqi],
          details: station,
        };
      });
  }, [stationDetailsQueries]);

  const isLoading =
    visibleStationsQuery.isLoading ||
    stationDetailsQueries.some((q) => q.isLoading);
  const error =
    visibleStationsQuery.error ||
    stationDetailsQueries.find((q) => q.error)?.error;

  return {
    rawMapData,
    isLoading,
    error,
  };
};
