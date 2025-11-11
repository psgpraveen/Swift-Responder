"use client";

import {
  Sparkles,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface AIInsightsProps {
  ambulanceScore?: {
    score: number;
    reason: string;
    equipmentMatch: number;
    distanceScore: number;
  };
  etaPrediction?: {
    predictedETA: number;
    confidence: number;
    adjustmentFactors: string[];
  };
  routeOptimization?: {
    confidenceScore: number;
    riskFactors: string[];
    reasoning: string;
  };
}

export function AIInsights({
  ambulanceScore,
  etaPrediction,
  routeOptimization,
}: AIInsightsProps) {
  if (!ambulanceScore && !etaPrediction && !routeOptimization) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <div className="bg-purple-500/20 p-1.5 sm:p-2 rounded-lg">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
          </div>
          AI Insights
          <Badge
            variant="outline"
            className="ml-auto border-purple-500/50 text-purple-400 text-[10px] sm:text-xs">
            <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1" />
            Powered by Gemini
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Ambulance Selection Score */}
        {ambulanceScore && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Ambulance Match Score
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant={
                        ambulanceScore.score >= 80 ? "default" : "secondary"
                      }
                      className={
                        ambulanceScore.score >= 80
                          ? "bg-green-600 hover:bg-green-700"
                          : ambulanceScore.score >= 60
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }>
                      {ambulanceScore.score}/100
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{ambulanceScore.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Progress value={ambulanceScore.score} className="h-1.5 sm:h-2" />
            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                Equipment: {ambulanceScore.equipmentMatch.toFixed(0)}%
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />
                Distance: {ambulanceScore.distanceScore.toFixed(1)}/10
              </div>
            </div>
          </div>
        )}

        {/* ETA Prediction */}
        {etaPrediction && (
          <div className="space-y-2 border-t pt-3 sm:pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                AI-Enhanced ETA
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs ${
                  etaPrediction.confidence >= 80
                    ? "border-green-500 text-green-500"
                    : etaPrediction.confidence >= 60
                    ? "border-yellow-500 text-yellow-500"
                    : "border-orange-500 text-orange-500"
                }`}>
                {etaPrediction.confidence}% confidence
              </Badge>
            </div>
            {etaPrediction.adjustmentFactors.length > 0 && (
              <div className="space-y-1">
                {etaPrediction.adjustmentFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Route Optimization */}
        {routeOptimization && (
          <div className="space-y-2 border-t pt-3 sm:pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">
                Route Analysis
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] sm:text-xs ${
                  routeOptimization.confidenceScore >= 80
                    ? "border-green-500 text-green-500"
                    : "border-yellow-500 text-yellow-500"
                }`}>
                {routeOptimization.confidenceScore}% optimal
              </Badge>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
              {routeOptimization.reasoning}
            </p>
            {routeOptimization.riskFactors.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-medium text-orange-400">
                  Risk Factors:
                </span>
                {routeOptimization.riskFactors.map((risk, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-orange-400/80">
                    <span className="mt-0.5">⚠️</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Note */}
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-md p-2 sm:p-3 mt-2 sm:mt-3">
          <p className="text-[9px] sm:text-xs text-purple-400/80 leading-relaxed">
            🤖 AI continuously analyzes traffic, weather, equipment needs, and
            historical data to optimize emergency response.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
