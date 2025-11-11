import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SummaryStatsSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do filtro aplicado</CardTitle>

        <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-muted rounded-md animate-pulse" />
          <div className="h-7 w-16 bg-muted rounded-md animate-pulse" />
        </div>

        <div className="flex flex-col justify-between items-start gap-2">
          <div className="h-4 w-36 bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded-md animate-pulse" />
        </div>

        <div className="flex flex-col justify-between items-start gap-2">
          <div className="h-4 w-36 bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded-md animate-pulse" />
        </div>

        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded-md animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryStatsSkeleton;
