import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import SubmitIssue from "@/pages/submit-issue";
import IssueDetail from "@/pages/issue-detail";
import Analytics from "@/pages/analytics";
import { UserRole } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/issues/me" component={Dashboard} />
      <ProtectedRoute path="/issues/new" component={SubmitIssue} />
      <ProtectedRoute path="/issues/:id" component={IssueDetail} />
      <ProtectedRoute 
        path="/admin/analytics" 
        component={Analytics} 
        allowedRoles={[UserRole.ADMIN, UserRole.DEPARTMENT]} 
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
