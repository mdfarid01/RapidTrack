import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { Department, SLAPriority, insertIssueSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

const formSchema = insertIssueSchema.extend({
  department: z.string().min(1, "Department is required"),
  priority: z.string().min(1, "Priority is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitIssue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      department: Department.IT,
      priority: SLAPriority.MEDIUM,
      reporterId: user?.id || 0,
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/issues", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      toast({
        title: "Issue created",
        description: `Issue #${data.id} has been created successfully.`,
      });
      navigate(`/issues/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // Make sure reporterId is set to the current user's ID
    createIssueMutation.mutate({
      ...data,
      reporterId: user?.id || 0,
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Submit New Issue" />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Submit New Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief summary of the issue"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide detailed information about the issue"
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include any relevant details that will help resolve your issue
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={Department.IT}>IT</SelectItem>
                                <SelectItem value={Department.HR}>HR</SelectItem>
                                <SelectItem value={Department.ADMIN}>Admin</SelectItem>
                                <SelectItem value={Department.FINANCE}>Finance</SelectItem>
                                <SelectItem value={Department.LEGAL}>Legal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the department that should handle this issue
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={SLAPriority.LOW}>
                                  Low (48 hours)
                                </SelectItem>
                                <SelectItem value={SLAPriority.MEDIUM}>
                                  Medium (24 hours)
                                </SelectItem>
                                <SelectItem value={SLAPriority.HIGH}>
                                  High (8 hours)
                                </SelectItem>
                                <SelectItem value={SLAPriority.CRITICAL}>
                                  Critical (4 hours)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This will determine the SLA response time
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {createIssueMutation.isError && (
                      <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-destructive">
                            Error submitting issue
                          </p>
                          <p className="text-sm text-destructive/80">
                            {createIssueMutation.error.message}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createIssueMutation.isPending}
                      >
                        {createIssueMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Issue"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
