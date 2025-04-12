import { Department } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface DepartmentPerformanceProps {
  data?: Record<Department, number>;
  overall?: number;
  isLoading?: boolean;
  showChart?: boolean;
}

export function DepartmentPerformance({
  data,
  overall,
  isLoading = false,
  showChart = true,
}: DepartmentPerformanceProps) {
  const getStatusColor = (value: number) => {
    if (value >= 90) return "bg-success";
    if (value >= 75) return "bg-success";
    if (value >= 60) return "bg-warning";
    return "bg-destructive";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full mt-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Performance Data
        </h3>
        <p className="text-gray-500">
          Department performance data is not available.
        </p>
      </div>
    );
  }

  const chartData = Object.entries(data).map(([dept, value]) => ({
    name: dept,
    value,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Department SLA Performance</h3>
      </div>
      <div className="p-4">
        {showChart && (
          <div className="mb-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Performance %" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(data).map(([dept, value]) => (
            <div key={dept}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{dept}</span>
                <span className="text-sm text-gray-500">{value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getStatusColor(value)} rounded-full h-2`}
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {overall !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Performance</span>
              <span className="text-sm font-semibold">{overall}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className={`${getStatusColor(overall)} rounded-full h-2`}
                style={{ width: `${overall}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
