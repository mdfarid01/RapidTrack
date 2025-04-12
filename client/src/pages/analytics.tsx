import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { AlertTriangle, BarChart, Loader2, TrendingUp } from "lucide-react";
import { Department, IssueStatus } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DepartmentPerformance } from "@/components/dashboard/department-performance";

export default function Analytics() {
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery<{
    departmentPerformance: Record<Department, number>;
    overallPerformance: number;
    statusCounts: Record<IssueStatus, number>;
    openIssues: number;
    resolvedIssues: number;
    escalatedCount: number;
  }>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold">Error loading analytics</h1>
            <p className="text-gray-500 mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  // Prepare data for the charts
  const departmentPerformanceData = Object.entries(
    analytics.departmentPerformance
  ).map(([department, performance]) => ({
    name: department,
    performance,
  }));

  const statusData = Object.entries(analytics.statusCounts).map(
    ([status, count]) => ({
      name: status,
      value: count,
    })
  );

  const issueComparisonData = [
    {
      name: "Issues",
      Open: analytics.openIssues,
      Resolved: analytics.resolvedIssues,
      Escalated: analytics.escalatedCount,
    },
  ];

  // Colors for pie chart
  const COLORS = [
    "#3B82F6", // primary
    "#10B981", // success
    "#FBBF24", // warning
    "#EF4444", // danger
    "#6366F1", // secondary
    "#8B5CF6", // purple
    "#EC4899", // pink
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Analytics Dashboard" />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Overall SLA Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="text-5xl font-bold mb-1 text-primary">
                    {analytics.overallPerformance}%
                  </div>
                  <p className="text-gray-500 text-sm">Issues resolved within SLA</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Open vs. Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around items-center h-32">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">
                      {analytics.openIssues}
                    </div>
                    <div className="text-sm text-gray-500">Open</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">
                      {analytics.resolvedIssues}
                    </div>
                    <div className="text-sm text-gray-500">Resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {analytics.escalatedCount}
                    </div>
                    <div className="text-sm text-gray-500">Escalated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Issue Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusData.filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 10;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            className="text-xs"
                            fill="#666"
                          >
                            {statusData[index].name} ({value})
                          </text>
                        );
                      }}
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department SLA Performance</CardTitle>
                <CardDescription>
                  Percentage of issues resolved within SLA time by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart
                    data={departmentPerformanceData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="performance"
                      name="SLA Performance (%)"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Status Breakdown</CardTitle>
                <CardDescription>
                  Comparison of open, resolved, and escalated issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ReBarChart
                    data={issueComparisonData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Open"
                      stackId="a"
                      fill="#3B82F6"
                      radius={[4, 0, 0, 4]}
                    />
                    <Bar
                      dataKey="Resolved"
                      stackId="a"
                      fill="#10B981"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Escalated"
                      stackId="a"
                      fill="#EF4444"
                      radius={[0, 4, 4, 0]}
                    />
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detailed Department Performance</CardTitle>
                <BarChart className="h-5 w-5 text-gray-500" />
              </div>
              <CardDescription>
                Performance metrics by department with detailed breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentPerformance
                data={analytics.departmentPerformance}
                overall={analytics.overallPerformance}
                showChart={false}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
