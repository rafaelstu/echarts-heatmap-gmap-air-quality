import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { TopLevelFormatterParams } from "echarts/types/src/component/tooltip/TooltipModel.js";
import { format } from "date-fns";

import "echarts-extension-gmap";
import * as echarts from "echarts/core";
import { HeatmapChart, ScatterChart } from "echarts/charts";
import {
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import type { EnrichedStationDataPoint } from "@/types/components/airQualityMap/airQualityMap";
import { formatPollutantName } from "@/utils/formatters";
import type { MapComponentProps } from "@/types/components/airQualityMap/mapComponent";

echarts.use([
  HeatmapChart,
  ScatterChart,
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const MapComponent: React.FC<MapComponentProps> = ({
  data,
  selectedPollutant,
  onChartReady,
}) => {
  const chartOptions = useMemo(
    (): EChartsOption => ({
      //@ts-expect-error echarts tooltip type error
      tooltip: {
        trigger: "item",
        formatter: (
          params: TopLevelFormatterParams & { data: EnrichedStationDataPoint },
        ) => {
          const pointData = params.data;
          if (!pointData || !pointData.details) return "";

          const { name, details } = pointData;
          const displayValue = pointData.value[2];

          const pollutantsHtml = Object.entries(details.iaqi)
            .map(
              ([key, value]) =>
                `<tr><td>${formatPollutantName(key)}:</td><td style="text-align: right;"><strong>${value.v}</strong></td></tr>`,
            )
            .join("");

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
        ...(!data?.length && { center: [-51.9253, -14.235], zoom: 4 }),
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
          data: data || [],
          pointSize: 15,
          blurSize: 5,
        },
        {
          name: "Tooltip Trigger",
          type: "scatter",
          coordinateSystem: "gmap",
          data: data || [],
          symbolSize: 15,
          itemStyle: { color: "transparent" },
        },
      ],
    }),
    [data, selectedPollutant],
  );

  return (
    <ReactECharts
      option={chartOptions}
      style={{ height: "100%", width: "100%" }}
      onChartReady={onChartReady}
    />
  );
};

export default MapComponent;
