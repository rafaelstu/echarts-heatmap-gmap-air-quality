import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPollutantName } from "@/utils/formatters";
import type { SummaryStatsProps } from "@/types/components/airQualityMap/summaryStats";

const SummaryStats: React.FC<SummaryStatsProps> = ({ stats, pollutant }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do filtro aplicado</CardTitle>
        <CardDescription>
          Estatísticas baseadas nos {stats.stationCount} locais filtrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            Média ({formatPollutantName(pollutant)}):
          </span>
          <span className="font-bold text-lg">{stats.average}</span>
        </div>

        <div className="flex flex-col justify-between items-start">
          <span className="text-gray-600">Melhor Qualidade (Menor):</span>
          {stats.bestStation ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger className="font-semibold max-w-[80vw] lg:max-w-80 text-green-600 truncate">
                  <span>{`${stats.bestStation.name} (${stats.bestStation.value})`}</span>
                </TooltipTrigger>
                <TooltipContent>{`${stats.bestStation.name} (${stats.bestStation.value})`}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="font-semibold">N/A</span>
          )}
        </div>

        <div className="flex flex-col justify-between items-start max-w-full">
          <span className="text-gray-600">Pior Qualidade (Maior):</span>
          {stats.worstStation ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger className="font-semibold text-red-600 truncate max-w-[80vw] lg:max-w-80">
                  <span>{`${stats.worstStation.name} (${stats.worstStation.value})`}</span>
                </TooltipTrigger>
                <TooltipContent>{`${stats.worstStation.name} (${stats.worstStation.value})`}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="font-semibold">N/A</span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Poluente Dominante:</span>
          <span className="font-semibold">{stats.mostCommonPollutant}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryStats;
