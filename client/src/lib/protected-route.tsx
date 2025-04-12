import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@shared/schema";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if the user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  return <Route path={path}><Component /></Route>;
}
