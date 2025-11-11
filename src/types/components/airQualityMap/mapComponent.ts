import type { EChartsType } from "echarts";
import type { EnrichedStationDataPoint } from "./airQualityMap";

export interface MapComponentProps {
  data: EnrichedStationDataPoint[];
  selectedPollutant: string;
  onChartReady: (instance: EChartsType) => void;
}
