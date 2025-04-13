import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { UserRole, Department } from "@shared/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold">Please log in to view your profile</h1>
          </div>
        </div>
      </div>
    );
  }
  
  const roleColor = {
    [UserRole.EMPLOYEE]: "bg-blue-500",
    [UserRole.DEPARTMENT]: "bg-green-500",
    [UserRole.ADMIN]: "bg-purple-500",
  }[user.role] || "bg-gray-500";
  
  const createdAt = user.createdAt 
    ? format(new Date(user.createdAt), "MMMM d, yyyy")
    : "Unknown";
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="My Profile" />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col items-center gap-4 sm:flex-row">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg bg-primary text-white">
                    {getInitials(user.fullName || user.username)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <CardTitle className="text-2xl">{user.fullName}</CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span>@{user.username}</span>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 sm:mt-0 ${roleColor} text-white`}
                    >
                      {user.role}
                    </Badge>
                    {user.role === UserRole.DEPARTMENT && (
                      <Badge variant="outline" className="mt-2 sm:mt-0">
                        {user.department} Department
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Username</Label>
                    <div className="mt-1 text-lg">{user.username}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                    <div className="mt-1 text-lg">{user.fullName}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <div className="mt-1 text-lg">{user.email || "Not provided"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <div className="mt-1 text-lg capitalize">{user.role}</div>
                  </div>
                  {user.role === UserRole.DEPARTMENT && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Department</Label>
                      <div className="mt-1 text-lg">{user.department}</div>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Account Created</Label>
                    <div className="mt-1 text-lg">{createdAt}</div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Account Activity</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="text-2xl font-bold text-primary">12</div>
                      <div className="text-sm text-gray-500">Issues Reported</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="text-2xl font-bold text-green-500">8</div>
                      <div className="text-sm text-gray-500">Issues Resolved</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="text-2xl font-bold text-amber-500">4</div>
                      <div className="text-sm text-gray-500">Issues Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-6">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
                <Button>
                  Change Password
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}