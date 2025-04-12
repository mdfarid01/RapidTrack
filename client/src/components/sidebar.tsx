import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Bug, ChevronDown, ChevronUp, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ href, icon, children, active }: SidebarItemProps) {
  const [location] = useLocation();
  const isActive = active || location === href;

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center space-x-2 py-2 px-2 rounded text-gray-300 hover:bg-gray-700 transition-colors",
          isActive && "bg-primary bg-opacity-20 text-white"
        )}
      >
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SidebarSection({ title, children, defaultOpen = true }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="text-xs uppercase text-gray-400">{title}</p>
        {isOpen ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </div>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const sidebarContent = (
    <>
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-primary" />
          <span className="text-xl font-semibold text-white">RapidTrack</span>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="overflow-y-auto">
        <SidebarSection title="Main">
          <nav className="space-y-1">
            <SidebarItem href="/dashboard" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>}>
              Dashboard
            </SidebarItem>
            <SidebarItem href="/issues/me" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>}>
              My Issues
            </SidebarItem>
            <SidebarItem href="/notifications" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>}>
              Notifications
            </SidebarItem>
          </nav>
        </SidebarSection>

        {user?.role === UserRole.EMPLOYEE && (
          <SidebarSection title="Employee">
            <nav className="space-y-1">
              <SidebarItem href="/issues/new" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>}>
                Submit New Issue
              </SidebarItem>
              <SidebarItem href="/issues/history" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}>
                Issue History
              </SidebarItem>
            </nav>
          </SidebarSection>
        )}

        {user?.role === UserRole.DEPARTMENT && (
          <SidebarSection title="Department">
            <nav className="space-y-1">
              <SidebarItem href="/issues/assigned" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>}>
                Assigned Issues
              </SidebarItem>
              <SidebarItem href="/team/workload" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}>
                Team Workload
              </SidebarItem>
            </nav>
          </SidebarSection>
        )}

        {user?.role === UserRole.ADMIN && (
          <SidebarSection title="Admin">
            <nav className="space-y-1">
              <SidebarItem href="/admin/escalations" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}>
                Escalations
              </SidebarItem>
              <SidebarItem href="/admin/analytics" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}>
                Analytics
              </SidebarItem>
              <SidebarItem href="/admin/settings" icon={<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>}>
                Settings
              </SidebarItem>
            </nav>
          </SidebarSection>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 bg-gray-900 text-white flex-shrink-0 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (conditional rendering) */}
      {isMobile && (
        <>
          <div className="md:hidden flex items-center p-4 bg-gray-900 text-white">
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center ml-2 space-x-2">
              <Bug className="h-5 w-5 text-primary" />
              <span className="text-xl font-semibold">RapidTrack</span>
            </div>
          </div>

          {isSidebarOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={toggleSidebar}
              />
              <aside className="fixed top-0 left-0 w-64 bg-gray-900 text-white h-screen z-50 flex flex-col">
                {sidebarContent}
              </aside>
            </>
          )}
        </>
      )}
    </>
  );
}
