import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Ticket, 
  Plus,
  Loader2
} from "lucide-react";
import { IssueStatus, Department, Issue, SLAStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { IssuesTable } from "@/components/dashboard/issues-table";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DepartmentPerformance } from "@/components/dashboard/department-performance";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: issues,
    isLoading: issuesLoading,
    error: issuesError,
  } = useQuery<Issue[]>({
    queryKey: ["/api/issues/me"],
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery<{
    departmentPerformance: Record<Department, number>;
    overallPerformance: number;
    statusCounts: Record<IssueStatus, number>;
    openIssues: number;
    resolvedIssues: number;
    escalatedCount: number;
  }>({
    queryKey: ["/api/analytics"],
    enabled: user?.role !== "employee",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: IssueStatus }) => {
      const res = await apiRequest("PATCH", `/api/issues/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      toast({
        title: "Status updated",
        description: "The issue status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (issueId: number, status: IssueStatus) => {
    updateStatusMutation.mutate({ id: issueId, status });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (issuesLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (issuesError) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold">Error loading dashboard</h1>
            <p className="text-gray-500 mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  const openIssuesCount = issues?.filter(
    (issue) =>
      issue.status === IssueStatus.OPEN || issue.status === IssueStatus.IN_PROGRESS
  ).length || 0;

  const completedIssuesCount = issues?.filter(
    (issue) =>
      issue.status === IssueStatus.VERIFIED || issue.status === IssueStatus.CLOSED
  ).length || 0;

  const slaOnTrackCount = issues?.filter(
    (issue) => issue.slaStatus === SLAStatus.ON_TRACK
  ).length || 0;

  const withinSLAPercentage = issues && issues.length > 0
    ? Math.round((slaOnTrackCount / issues.length) * 100)
    : 100;

  const escalatedCount = issues?.filter((issue) => issue.isEscalated).length || 0;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Dashboard" />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {getGreeting()}, {user?.fullName}
                </h2>
                <p className="text-sm text-gray-500">
                  Here's what's happening with your issues today.
                </p>
              </div>
              <Link href="/issues/new">
                <Button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>New Issue</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Open Issues"
              value={openIssuesCount}
              icon={<Ticket className="h-5 w-5 text-primary" />}
              iconBgColor="bg-primary/10"
              change={{
                value: "2 new today",
                positive: false,
              }}
              tooltip="Total number of open and in-progress issues"
            />

            <StatsCard
              title="Within SLA"
              value={`${withinSLAPercentage}%`}
              icon={<Clock className="h-5 w-5 text-success" />}
              iconBgColor="bg-success/10"
              change={{
                value: "2% from last week",
                positive: true,
              }}
              tooltip="Percentage of issues within SLA timeframe"
            />

            <StatsCard
              title="Escalations"
              value={escalatedCount}
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
              iconBgColor="bg-destructive/10"
              change={{
                value: "1 from last week",
                positive: false,
              }}
              tooltip="Number of escalated issues requiring attention"
            />

            <StatsCard
              title="Resolved Issues"
              value={completedIssuesCount}
              icon={<CheckCircle2 className="h-5 w-5 text-secondary" />}
              iconBgColor="bg-secondary/10"
              change={{
                value: "8 this week",
                positive: true,
              }}
              tooltip="Number of verified and closed issues"
            />
          </div>

          {/* Issues Table */}
          <div className="mb-6">
            <IssuesTable 
              issues={issues || []} 
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Recent Activity and SLA Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
            <div>
              <DepartmentPerformance 
                data={analytics?.departmentPerformance} 
                overall={analytics?.overallPerformance}
                isLoading={analyticsLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
