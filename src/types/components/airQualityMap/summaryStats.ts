export interface StationStat {
  name: string;
  value: number;
}

export interface SummaryStatsData {
  average: string;
  stationCount: number;
  bestStation: StationStat | null;
  worstStation: StationStat | null;
  mostCommonPollutant: string;
}

export interface SummaryStatsProps {
  stats: SummaryStatsData;
  pollutant: string;
}
