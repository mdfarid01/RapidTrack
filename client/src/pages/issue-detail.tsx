import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  UserCircle, 
  XCircle, 
  MessageSquare,
  AlertTriangle,
  Loader2,
  History
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Issue, IssueStatus, UserRole, Activity, SLAStatus } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { SLAIndicator } from "@/components/ui/sla-indicator";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(500, "Comment is too long")
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function IssueDetail() {
  const [, params] = useRoute<{ id: string }>("/issues/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  
  const issueId = params?.id ? parseInt(params.id) : 0;

  const {
    data: issue,
    isLoading: issueLoading,
    error: issueError,
  } = useQuery<Issue>({
    queryKey: [`/api/issues/${issueId}`],
    enabled: !!issueId,
  });

  const {
    data: activities,
    isLoading: activitiesLoading,
  } = useQuery<Activity[]>({
    queryKey: [`/api/issues/${issueId}/activities`],
    enabled: !!issueId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: IssueStatus) => {
      const res = await apiRequest("PATCH", `/api/issues/${issueId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/issues/${issueId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/issues/${issueId}/activities`] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues/me"] });
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

  const escalateIssueMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("PATCH", `/api/issues/${issueId}/escalate`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/issues/${issueId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/issues/${issueId}/activities`] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues/me"] });
      toast({
        title: "Issue escalated",
        description: "The issue has been escalated to admin.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to escalate issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: "",
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const res = await apiRequest("POST", `/api/issues/${issueId}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/issues/${issueId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/issues/${issueId}/activities`] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitComment = (data: CommentFormValues) => {
    addCommentMutation.mutate(data);
  };

  const handleMarkInProgress = () => {
    updateStatusMutation.mutate(IssueStatus.IN_PROGRESS);
  };

  const handleMarkCompleted = () => {
    updateStatusMutation.mutate(IssueStatus.COMPLETED);
  };

  const handleVerify = () => {
    updateStatusMutation.mutate(IssueStatus.VERIFIED);
  };

  const handleReject = () => {
    updateStatusMutation.mutate(IssueStatus.REJECTED);
  };

  const handleEscalate = () => {
    escalateIssueMutation.mutate("Manual escalation by staff");
  };

  if (issueLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (issueError || !issue) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold">Issue not found</h1>
            <p className="text-gray-500 mt-2 mb-4">The issue you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canMarkInProgress = (
    user?.role === UserRole.DEPARTMENT || 
    user?.role === UserRole.ADMIN
  ) && issue.status === IssueStatus.OPEN;

  const canMarkCompleted = (
    user?.role === UserRole.DEPARTMENT || 
    user?.role === UserRole.ADMIN
  ) && issue.status === IssueStatus.IN_PROGRESS;

  const canVerifyOrReject = 
    user?.role === UserRole.EMPLOYEE && 
    user.id === issue.reporterId && 
    issue.status === IssueStatus.COMPLETED;

  const canEscalate = (
    user?.role === UserRole.DEPARTMENT || 
    user?.role === UserRole.ADMIN
  ) && 
  !issue.isEscalated && 
  issue.status !== IssueStatus.VERIFIED && 
  issue.status !== IssueStatus.CLOSED;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={`Issue #${issue.id}`} />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-500">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className="text-gray-500">
                    {issue.department}
                  </Badge>
                  <StatusBadge status={issue.status} />
                </div>
                <CardTitle className="text-xl">{issue.title}</CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1 text-gray-500">
                    <UserCircle className="h-4 w-4" />
                    Reporter: ID {issue.reporterId}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    Created: {format(new Date(issue.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                  <SLAIndicator status={issue.slaStatus} dueDate={issue.dueBy} />
                </CardDescription>
              </CardHeader>
              <Separator />
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-6">
                  <TabsList className="mt-4 w-full justify-start">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="comments">
                      Comments {issue.comments?.length 
                        ? `(${issue.comments.length})` 
                        : ""
                      }
                    </TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="details" className="p-6 pt-4">
                  <div className="prose max-w-none">
                    <p>{issue.description}</p>
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="p-6 pt-4">
                  {issue.comments && issue.comments.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {issue.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {comment.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">
                                  {comment.userName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(comment.timestamp), "MMM d, h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Comments Yet</h3>
                      <p className="text-gray-500 mb-4">Be the first to comment on this issue</p>
                    </div>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitComment)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Add a comment..."
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addCommentMutation.isPending}
                        >
                          {addCommentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            "Post Comment"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="history" className="p-6 pt-4">
                  {activitiesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <History className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">User ID {activity.userId}</span>{" "}
                              <span className="text-gray-500">
                                {activity.action === "created" && "created this issue"}
                                {activity.action === "updated_status" && `changed status from ${(activity.details as any).fromStatus} to ${(activity.details as any).toStatus}`}
                                {activity.action === "assigned" && "assigned this issue"}
                                {activity.action === "escalated" && "escalated this issue"}
                                {activity.action === "commented" && "commented on this issue"}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No History</h3>
                      <p className="text-gray-500">No activity has been recorded yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              <CardFooter className="flex flex-wrap gap-2 justify-end border-t p-4">
                {canMarkInProgress && (
                  <Button 
                    onClick={handleMarkInProgress}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark In Progress
                  </Button>
                )}
                
                {canMarkCompleted && (
                  <Button 
                    onClick={handleMarkCompleted}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                )}

                {canVerifyOrReject && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleReject}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      onClick={handleVerify}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify Resolution
                    </Button>
                  </>
                )}

                {canEscalate && (
                  <Button 
                    variant="destructive"
                    onClick={handleEscalate}
                    disabled={escalateIssueMutation.isPending}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Escalate
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
