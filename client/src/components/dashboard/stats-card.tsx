import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  change?: {
    value: string;
    positive?: boolean;
  };
  tooltip?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  change,
  tooltip,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-4", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        </div>
        <div className={cn("p-2 rounded-md", iconBgColor)}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-2 text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn({
                    "text-green-600": change.positive,
                    "text-red-600": !change.positive,
                  })}
                >
                  {change.positive ? "↑" : "↓"} {change.value}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip || (change.positive ? "Increased" : "Decreased")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
