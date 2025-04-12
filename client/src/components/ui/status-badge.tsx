import { cn } from "@/lib/utils";
import { IssueStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case IssueStatus.OPEN:
        return "bg-blue-100 text-blue-800";
      case IssueStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case IssueStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case IssueStatus.VERIFIED:
        return "bg-blue-100 text-blue-800";
      case IssueStatus.REJECTED:
        return "bg-gray-100 text-gray-800";
      case IssueStatus.CLOSED:
        return "bg-gray-100 text-gray-800";
      case IssueStatus.ESCALATED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case IssueStatus.OPEN:
        return "Open";
      case IssueStatus.IN_PROGRESS:
        return "In Progress";
      case IssueStatus.COMPLETED:
        return "Completed";
      case IssueStatus.VERIFIED:
        return "Verified";
      case IssueStatus.REJECTED:
        return "Rejected";
      case IssueStatus.CLOSED:
        return "Closed";
      case IssueStatus.ESCALATED:
        return "Escalated";
      default:
        return status;
    }
  };

  return (
    <span
      className={cn(
        "px-2 py-1 text-xs rounded-full font-medium",
        getStatusStyles(),
        className
      )}
    >
      {getStatusLabel()}
    </span>
  );
}
