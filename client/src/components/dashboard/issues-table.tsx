import React, { useState } from "react";
import { Issue, IssueStatus, Department, UserRole } from "@shared/schema";
import { StatusBadge } from "@/components/ui/status-badge";
import { SLAIndicator } from "@/components/ui/sla-indicator";
import { format } from "date-fns";
import { MoreHorizontal, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/use-auth";

interface IssuesTableProps {
  issues: Issue[];
  onStatusChange?: (issueId: number, status: IssueStatus) => void;
  limit?: number;
}

export function IssuesTable({ issues, onStatusChange, limit = 5 }: IssuesTableProps) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || issue.department === departmentFilter;
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#${issue.id}`.includes(searchQuery);
    
    return matchesStatus && matchesDepartment && matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredIssues.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + limit);
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`px-6 py-3 border-b-2 font-medium ${
              statusFilter === "all"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setStatusFilter("all")}
          >
            All Issues
          </button>
          <button
            className={`px-6 py-3 border-b-2 font-medium ${
              statusFilter === IssueStatus.OPEN
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setStatusFilter(IssueStatus.OPEN)}
          >
            Open
          </button>
          <button
            className={`px-6 py-3 border-b-2 font-medium ${
              statusFilter === IssueStatus.IN_PROGRESS
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setStatusFilter(IssueStatus.IN_PROGRESS)}
          >
            In Progress
          </button>
        </nav>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-2 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={IssueStatus.OPEN}>Open</SelectItem>
                <SelectItem value={IssueStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={IssueStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={IssueStatus.VERIFIED}>Verified</SelectItem>
                <SelectItem value={IssueStatus.REJECTED}>Rejected</SelectItem>
                <SelectItem value={IssueStatus.CLOSED}>Closed</SelectItem>
                <SelectItem value={IssueStatus.ESCALATED}>Escalated</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value={Department.IT}>IT</SelectItem>
                <SelectItem value={Department.HR}>HR</SelectItem>
                <SelectItem value={Department.ADMIN}>Admin</SelectItem>
                <SelectItem value={Department.FINANCE}>Finance</SelectItem>
                <SelectItem value={Department.LEGAL}>Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search issues..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b border-gray-200">Issue ID</th>
                <th className="px-4 py-3 border-b border-gray-200">Title</th>
                <th className="px-4 py-3 border-b border-gray-200">Department</th>
                <th className="px-4 py-3 border-b border-gray-200">Status</th>
                <th className="px-4 py-3 border-b border-gray-200">SLA</th>
                <th className="px-4 py-3 border-b border-gray-200">Created</th>
                <th className="px-4 py-3 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No issues found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      #{issue.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{issue.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {issue.description.length > 80
                          ? `${issue.description.substring(0, 80)}...`
                          : issue.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{issue.department}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <SLAIndicator
                        status={issue.slaStatus}
                        dueDate={issue.dueBy}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {issue.createdAt ? format(new Date(issue.createdAt), "MMM d, h:mm a") : "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link href={`/issues/${issue.id}`}>
                              <a className="w-full">View Details</a>
                            </Link>
                          </DropdownMenuItem>
                          {/* DEPARTMENT STAFF OPTIONS */}
                          {onStatusChange && user?.role === UserRole.DEPARTMENT && (
                            <>
                              {issue.status === IssueStatus.OPEN && (
                                <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.IN_PROGRESS)}>
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {issue.status === IssueStatus.IN_PROGRESS && (
                                <>
                                  <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.PENDING)}>
                                    Mark as Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.COMPLETED)}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {issue.status === IssueStatus.PENDING && (
                                <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.IN_PROGRESS)}>
                                  Resume Work
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          {/* EMPLOYEE OPTIONS */}
                          {onStatusChange && user?.role === UserRole.EMPLOYEE && (
                            <>
                              {/* Verification options for completed issues */}
                              {issue.status === IssueStatus.COMPLETED && issue.reporterId === user.id && (
                                <>
                                  <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.VERIFIED)}>
                                    Verify Resolution
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.REJECTED)}>
                                    Reject Resolution
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Escalation option */}
                              {!issue.isEscalated && 
                               issue.status !== IssueStatus.VERIFIED && 
                               issue.status !== IssueStatus.CLOSED && 
                               issue.reporterId === user.id && (
                                <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.ESCALATED)}>
                                  Escalate Issue
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          
                          {/* ADMIN OPTIONS */}
                          {onStatusChange && user?.role === UserRole.ADMIN && (
                            <>
                              {issue.status === IssueStatus.OPEN && (
                                <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.IN_PROGRESS)}>
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {issue.status === IssueStatus.IN_PROGRESS && (
                                <>
                                  <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.PENDING)}>
                                    Mark as Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.COMPLETED)}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {issue.status === IssueStatus.PENDING && (
                                <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.IN_PROGRESS)}>
                                  Resume Work
                                </DropdownMenuItem>
                              )}
                              {!issue.isEscalated && issue.status !== IssueStatus.VERIFIED && issue.status !== IssueStatus.CLOSED && (
                                <DropdownMenuItem onClick={() => onStatusChange(issue.id, IssueStatus.ESCALATED)}>
                                  Escalate Issue
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredIssues.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(startIndex + limit, filteredIssues.length)}
              </span>{" "}
              of <span className="font-medium">{filteredIssues.length}</span> results
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum <= totalPages) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    }}
                    className={(currentPage === totalPages || totalPages === 0) ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
