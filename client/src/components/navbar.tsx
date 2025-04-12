import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { Link } from "wouter";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    
    const parts = user.fullName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "Administrator";
      case UserRole.DEPARTMENT:
        return `${user.department} Department`;
      case UserRole.EMPLOYEE:
        return "Employee";
      default:
        return "";
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-medium text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-sm text-left">
                  <p className="font-medium text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile">
                  <a className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
