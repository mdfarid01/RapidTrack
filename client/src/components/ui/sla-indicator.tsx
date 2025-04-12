import { cn } from "@/lib/utils";
import { SLAStatus } from "@shared/schema";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Clock, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SLAIndicatorProps {
  status: SLAStatus;
  dueDate?: Date | string | null;
  className?: string;
  showText?: boolean;
}

export function SLAIndicator({ status, dueDate, className, showText = true }: SLAIndicatorProps) {
  const getStatusStyles = () => {
    switch (status) {
      case SLAStatus.ON_TRACK:
        return "text-green-600";
      case SLAStatus.AT_RISK:
        return "text-yellow-600";
      case SLAStatus.BREACHED:
        return "text-red-600";
      case SLAStatus.COMPLETED:
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case SLAStatus.ON_TRACK:
        return <Clock className="w-4 h-4" />;
      case SLAStatus.AT_RISK:
        return <AlertTriangle className="w-4 h-4" />;
      case SLAStatus.BREACHED:
        return <AlertCircle className="w-4 h-4" />;
      case SLAStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    if (!dueDate) {
      return status === SLAStatus.COMPLETED ? "Completed" : "No SLA";
    }

    const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    switch (status) {
      case SLAStatus.ON_TRACK:
        return formatDistanceToNow(dueDateObj, { addSuffix: true });
      case SLAStatus.AT_RISK:
        return formatDistanceToNow(dueDateObj, { addSuffix: true });
      case SLAStatus.BREACHED:
        return "Overdue";
      case SLAStatus.COMPLETED:
        return "Completed";
      default:
        return formatDistanceToNow(dueDateObj, { addSuffix: true });
    }
  };

  if (!dueDate && status !== SLAStatus.COMPLETED) {
    return null;
  }

  const dueDateObj = dueDate ? (typeof dueDate === 'string' ? new Date(dueDate) : dueDate) : null;
  const tooltipText = dueDateObj 
    ? `Due: ${format(dueDateObj, "MMM d, yyyy h:mm a")}`
    : status === SLAStatus.COMPLETED 
      ? "Completed within SLA" 
      : "No SLA set";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center", className)}>
            <span className={cn("w-2 h-2 rounded-full mr-1", {
              "bg-green-500": status === SLAStatus.ON_TRACK,
              "bg-yellow-500": status === SLAStatus.AT_RISK,
              "bg-red-500": status === SLAStatus.BREACHED,
              "bg-blue-500": status === SLAStatus.COMPLETED,
              "bg-gray-500": !status
            })} />
            {showText && (
              <span className={cn("text-sm", getStatusStyles())}>
                {getStatusText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
