import { useEffect, useState } from "react";
import { Activity, Issue } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Check, 
  CircleAlert, 
  Clock, 
  MessagesSquare, 
  Plus, 
  UserCircle2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItemProps {
  activity: Activity;
  issues: Issue[];
}

function ActivityItem({ activity, issues }: ActivityItemProps) {
  const issue = issues.find(i => i.id === activity.issueId);
  const issueTitle = issue ? issue.title : `Issue #${activity.issueId}`;
  
  const getActivityIcon = () => {
    switch (activity.action) {
      case "created":
        return <Plus className="text-primary" />;
      case "updated_status":
        return <Check className="text-success" />;
      case "assigned":
        return <UserCircle2 className="text-primary" />;
      case "escalated":
        return <AlertTriangle className="text-danger" />;
      case "commented":
        return <MessagesSquare className="text-secondary" />;
      default:
        return <Clock className="text-primary" />;
    }
  };
  
  const getActivityDescription = () => {
    const details = activity.details as any;
    
    switch (activity.action) {
      case "created":
        return `created a new issue: ${issueTitle}`;
      case "updated_status":
        return `updated status of ${issueTitle} from ${details.fromStatus} to ${details.toStatus}`;
      case "assigned":
        return `assigned issue ${issueTitle}`;
      case "escalated":
        return `escalated issue ${issueTitle} due to ${details.reason}`;
      case "commented":
        return `commented on issue ${issueTitle}`;
      default:
        return `performed action on ${issueTitle}`;
    }
  };
  
  const getTimestamp = () => {
    try {
      return formatDistanceToNow(new Date(activity.createdAt!), {
        addSuffix: true,
      });
    } catch (error) {
      return "recently";
    }
  };
  
  return (
    <div className="flex space-x-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          {getActivityIcon()}
        </div>
      </div>
      <div>
        <p className="text-sm">
          <span className="font-medium">User {activity.userId}</span>{" "}
          <span className="text-gray-500">{getActivityDescription()}</span>
        </p>
        <p className="text-xs text-gray-500">{getTimestamp()}</p>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
  });
  
  const { data: issues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues/me"],
  });
  
  const isLoading = activitiesLoading || issuesLoading;
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!activities || !issues || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-8 text-center">
          <CircleAlert className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Recent Activity</h3>
          <p className="text-gray-500 mb-4">There is no recent activity to display.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => (
            <ActivityItem 
              key={activity.id} 
              activity={activity} 
              issues={issues} 
            />
          ))}
        </div>
        {activities.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="link" className="text-primary text-sm">
              View all activity
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
