import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { HeatmapChart, ScatterChart } from "echarts/charts";
import {
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption, EChartsType } from "echarts";
import "echarts-extension-gmap";
import { format } from "date-fns";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoaderCircle, AlertTriangle } from "lucide-react";
import type { TopLevelFormatterParams } from "echarts/types/src/component/tooltip/TooltipModel.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface AirQualityData {
  uid: number;
  aqi: string;
  time: TimeData;
  station: StationData;
}

interface TimeData {
  tz: string;
  stime: string;
  vtime: number;
}

interface StationData {
  name: string;
  geo: [number, number];
  url: string;
}

interface BasicStationData {
  lat: number;
  lon: number;
  uid: number;
  aqi: string;
}

interface AttributionsData {
  url: string;
  name: string;
}

interface DetailedStationData {
  aqi: number;
  idx: number;
  attributions: AttributionsData[];
  city: {
    geo: [number, number];
    name: string;
    url: string;
  };
  dominentpol: string;
  iaqi: { [key: string]: { v: number } };
  time: {
    s: string;
    tz: string;
    v: number;
    iso: string;
  };
}

interface EnrichedStationDataPoint {
  name: string;
  uid: number;
  value: [number, number, number];
  details: DetailedStationData;
}

echarts.use([
  HeatmapChart,
  ScatterChart,
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const AQICN_API_TOKEN = import.meta.env.VITE_AQICN_TOKEN;

const searchLocationBounds = async (
  query: string,
): Promise<google.maps.LatLngBounds> => {
  if (!query) throw new Error("O termo de busca não pode ser vazio.");
  const searchUrl = `https://api.waqi.info/search/?token=${AQICN_API_TOKEN}&keyword=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl);
  const result = await response.json();

  if (result.status !== "ok" || result.data.length === 0) {
    throw new Error("Nenhuma estação encontrada para esta busca.");
  }

  const bounds = new google.maps.LatLngBounds();
  result.data.forEach((station: AirQualityData) => {
    if (station.station?.geo) {
      bounds.extend(
        new google.maps.LatLng(station.station.geo[0], station.station.geo[1]),
      );
    }
  });
  return bounds;
};

const fetchVisibleStations = async (
  boundsStr: string,
): Promise<BasicStationData[]> => {
  if (!boundsStr) return [];
  if (!AQICN_API_TOKEN)
    throw new Error("Chave de API do AQICN não encontrada.");

  const url = `https://api.waqi.info/v2/map/bounds/?latlng=${boundsStr}&token=${AQICN_API_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Erro na API de limites: ${response.statusText}`);
  const result = await response.json();
  if (result.status !== "ok")
    throw new Error(`API de limites retornou um erro: ${result.data}`);
  return result.data;
};

const fetchStationDetails = async (
  lat: number,
  lon: number,
): Promise<DetailedStationData> => {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_API_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Erro ao buscar detalhes da estação (${lat}, ${lon})`);
  const result = await response.json();
  if (result.status !== "ok")
    throw new Error(`API de detalhes retornou um erro: ${result.data}`);
  return result.data;
};

const formatPollutantName = (name: string): string => name.toUpperCase();

const AirQualityHeatmap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("Brasil");
  const [boundsStr, setBoundsStr] = useState<string>("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const echartsInstanceRef = useRef<EChartsType | null>(null);
  const isInitialSearch = useRef(true);

  const [aqiRange, setAqiRange] = useState<[number, number]>([0, 500]);
  const [selectedPollutant, setSelectedPollutant] = useState<string>("aqi");

  const visibleStationsQuery = useQuery<BasicStationData[], Error>({
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

  const filteredMapData = useMemo(() => {
    if (!rawMapData) return [];

    return rawMapData

      .map((station) => {
        let displayValue = 0;
        if (selectedPollutant === "aqi") {
          displayValue = station.value[2];
        } else {
          displayValue = station.details.iaqi[selectedPollutant]?.v ?? -1;
        }

        return {
          ...station,
          displayValue: displayValue,
        };
      })

      .filter((station) => station.displayValue !== -1)

      .filter(
        (station) =>
          station.displayValue >= aqiRange[0] &&
          station.displayValue <= aqiRange[1],
      )

      .map((station) => ({
        ...station,
        value: [station.value[0], station.value[1], station.displayValue],
      }));
  }, [rawMapData, aqiRange, selectedPollutant]);

  const summaryStats = useMemo(() => {
    if (!filteredMapData || filteredMapData.length === 0) {
      return {
        average: "N/A",
        stationCount: 0,
        bestStation: null,
        worstStation: null,
        mostCommonPollutant: "N/A",
      };
    }

    let sum = 0;
    let bestStation = filteredMapData[0];
    let worstStation = filteredMapData[0];
    const pollutantCounts: { [key: string]: number } = {};

    for (const station of filteredMapData) {
      const currentValue = station.value[2];
      sum += currentValue;

      if (currentValue < bestStation.value[2]) {
        bestStation = station;
      }
      if (currentValue > worstStation.value[2]) {
        worstStation = station;
      }

      const dominantPollutant = station.details.dominentpol;
      if (dominantPollutant) {
        pollutantCounts[dominantPollutant] =
          (pollutantCounts[dominantPollutant] || 0) + 1;
      }
    }

    const mostCommonPollutant =
      Object.keys(pollutantCounts).length > 0
        ? Object.entries(pollutantCounts).reduce((a, b) =>
            a[1] > b[1] ? a : b,
          )[0]
        : "N/A";

    return {
      average: (sum / filteredMapData.length).toFixed(1),
      stationCount: filteredMapData.length,
      bestStation: { name: bestStation.name, value: bestStation.value[2] },
      worstStation: { name: worstStation.name, value: worstStation.value[2] },
      mostCommonPollutant: formatPollutantName(mostCommonPollutant),
    };
  }, [filteredMapData]);

  const isOverallLoading =
    visibleStationsQuery.isLoading ||
    stationDetailsQueries.some((q) => q.isLoading);
  const firstError =
    visibleStationsQuery.error ||
    stationDetailsQueries.find((q) => q.error)?.error;

  const searchMutation = useMutation<google.maps.LatLngBounds, Error, string>({
    mutationFn: searchLocationBounds,
    onSuccess: (bounds) => {
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
        const zoomLevel = mapRef.current.getZoom();
        if (zoomLevel && zoomLevel > 12) mapRef.current.setZoom(12);

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        setBoundsStr(`${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`);
      }
    },
  });

  useEffect(() => {
    if (echartsInstanceRef.current && !isOverallLoading) {
      echartsInstanceRef.current.setOption({
        series: [{ data: filteredMapData }, { data: filteredMapData }],
      });
    }
  }, [filteredMapData, isOverallLoading]);

  const updateDataFromMapBounds = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
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
      //@ts-expect-error getModel is private
      .getModel()
      ?.getComponent("gmap")
      ?.getGoogleMap();
    if (gmap) {
      mapRef.current = gmap;
      gmap.addListener("dragend", debouncedUpdate);
      gmap.addListener("zoomend", debouncedUpdate);
      if (isInitialSearch.current) {
        searchMutation.mutate(searchQuery);
        isInitialSearch.current = false;
      }
    }
  };

  const handleSearchClick = () => {
    searchMutation.mutate(searchQuery);
  };

  const initialChartOptions = useMemo(
    (): EChartsOption => ({
      //@ts-expect-error echarts tooltip type error
      tooltip: {
        trigger: "item",
        formatter: (
          params: TopLevelFormatterParams & { data: EnrichedStationDataPoint },
        ) => {
          const data: EnrichedStationDataPoint = params.data;
          if (!data || !data.details) return "";

          const { name, details } = data;
          const displayValue = data.value[2];

          let pollutantsHtml = "";

          for (const key in details.iaqi) {
            pollutantsHtml += `<tr><td>${formatPollutantName(key)}:</td><td style="text-align: right;"><strong>${details.iaqi[key].v}</strong></td></tr>`;
          }

          return `<div style="font-family: sans-serif; font-size: 14px;">
              <strong style="font-size: 16px;">${name}</strong><br/>
              <span>${formatPollutantName(selectedPollutant)}:</span>
              <span style="font-size: 18px; font-weight: bold;">${displayValue}</span><br/>
              <em style="font-size: 12px; color: #666;">Atualizado em: ${format(new Date(details.time.iso), "dd/MM/yyyy HH:mm:ss")}</em>
              ${pollutantsHtml ? `<hr style="margin: 8px 0;" /><strong style="font-size: 14px;">Detalhes Completos</strong><table style="width: 100%; margin-top: 5px;">${pollutantsHtml}</table>` : ""}
            </div>`;
        },
      },
      renderer: "canvas",
      gmap: {
        roam: true,
        echartsLayerZIndex: 2019,
      },
      visualMap: {
        show: true,
        min: 0,
        max: 500,
        left: "left",
        top: "bottom",
        calculable: true,
        seriesIndex: 0,
        inRange: {
          color: [
            "#00E400",
            "#FFFF00",
            "#FF7E00",
            "#FF0000",
            "#8F3F97",
            "#7E0023",
          ],
        },
      },
      //@ts-expect-error echarts series coordinateSystem type error
      series: [
        {
          name: "Qualidade do Ar",
          type: "heatmap",
          coordinateSystem: "gmap",
          data: filteredMapData || [],
          pointSize: 15,
          blurSize: 5,
        },
        {
          name: "Tooltip Trigger",
          type: "scatter",
          coordinateSystem: "gmap",
          data: filteredMapData || [],
          symbolSize: 15,
          itemStyle: { color: "transparent" },
        },
      ],
    }),
    [filteredMapData, selectedPollutant],
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-gray-100 overflow-hidden">
      <aside className="w-full gap-y-4 flex flex-col lg:w-96 bg-white border-r p-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Visualização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location-search">Localização</Label>
              <div className="flex gap-2">
                <Input
                  id="location-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) =>
                    !(searchMutation.isPending || isOverallLoading) &&
                    e.key === "Enter" &&
                    handleSearchClick()
                  }
                  placeholder="País, cidade..."
                />
                <Button
                  onClick={handleSearchClick}
                  disabled={searchMutation.isPending || isOverallLoading}
                >
                  {searchMutation.isPending && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}
                  {!searchMutation.isPending && "Buscar"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pollutant-select">Visualizar por Poluente</Label>
              <Select
                value={selectedPollutant}
                onValueChange={setSelectedPollutant}
              >
                <SelectTrigger id="pollutant-select">
                  <SelectValue placeholder="Selecione um poluente" />
                </SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>
                  Faixa de Valor ({formatPollutantName(selectedPollutant)})
                </Label>
                <span className="text-sm font-medium text-gray-700">
                  {aqiRange[0]} - {aqiRange[1]}
                </span>
              </div>
              <Slider
                value={aqiRange}
                onValueChange={(value) =>
                  setAqiRange(value as [number, number])
                }
                min={0}
                max={500}
                step={1}
              />
            </div>

            <div className="pt-4">
              {isOverallLoading && (
                <Alert>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <AlertTitle>Carregando dados...</AlertTitle>
                </Alert>
              )}
              {(firstError || searchMutation.isError) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {firstError?.message || searchMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do filtro aplicado</CardTitle>
            <CardDescription>
              Estatísticas baseadas nos {summaryStats.stationCount} locais
              filtrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Média ({formatPollutantName(selectedPollutant)}):
              </span>
              <span className="font-bold text-lg">{summaryStats.average}</span>
            </div>
            <div className="flex flex-col justify-between items-start">
              <span className="text-gray-600">Melhor Qualidade (Menor):</span>
              {summaryStats.bestStation ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger className="font-semibold max-w-[80vw] lg:max-w-80 text-green-600 truncate">
                      <span>
                        {summaryStats.bestStation.name} (
                        {summaryStats.bestStation.value})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {summaryStats.bestStation.name} (
                      {summaryStats.bestStation.value})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="font-semibold">N/A</span>
              )}
            </div>
            <div className="flex flex-col justify-between items-start max-w-full">
              <span className="text-gray-600">Pior Qualidade (Maior):</span>
              {summaryStats.worstStation ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger className="font-semibold text-red-600 truncate max-w-[80vw] lg:max-w-80">
                      <span>
                        {summaryStats.worstStation.name} (
                        {summaryStats.worstStation.value})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {summaryStats.worstStation.name} (
                      {summaryStats.worstStation.value})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="font-semibold">N/A</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Poluente Dominante:</span>
              <span className="font-semibold">
                {summaryStats.mostCommonPollutant}
              </span>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="flex-1 min-h-96 min-w-80">
        <ReactECharts
          option={initialChartOptions}
          style={{ height: "100%", width: "100%" }}
          onChartReady={onChartReady}
        />
      </main>
    </div>
  );
};

export default AirQualityHeatmap;
