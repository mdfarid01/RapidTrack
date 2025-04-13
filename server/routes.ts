import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertIssueSchema, insertActivitySchema, IssueStatus, UserRole, Department, SLAPriority, SLAStatus } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  const { requireRole } = app.locals;
  
  // Get all issues
  app.get("/api/issues", requireRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const issues = await storage.getAllIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });
  
  // Get issues for current user
  app.get("/api/issues/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const user = req.user;
      let issues;
      
      switch (user.role) {
        case UserRole.EMPLOYEE:
          issues = await storage.getIssuesByReporter(user.id);
          break;
        case UserRole.DEPARTMENT:
          issues = await storage.getIssuesByDepartment(user.department);
          break;
        case UserRole.ADMIN:
          // For admins, only show escalated issues or issues with breached SLA
          const allIssues = await storage.getAllIssues();
          issues = allIssues.filter(issue => 
            issue.isEscalated || 
            issue.slaStatus === SLAStatus.BREACHED || 
            issue.slaStatus === SLAStatus.AT_RISK
          );
          break;
        default:
          issues = [];
      }
      
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });
  
  // Get issues by department
  app.get("/api/issues/department/:department", requireRole([UserRole.DEPARTMENT, UserRole.ADMIN]), async (req, res) => {
    try {
      const department = req.params.department as Department;
      const issues = await storage.getIssuesByDepartment(department);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department issues" });
    }
  });
  
  // Get a specific issue
  app.get("/api/issues/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const id = parseInt(req.params.id);
      const issue = await storage.getIssue(id);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Check access permissions
      const user = req.user;
      
      if (user.role === UserRole.EMPLOYEE && issue.reporterId !== user.id) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      if (user.role === UserRole.DEPARTMENT && issue.department !== user.department) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });
  
  // Create a new issue
  app.post("/api/issues", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const issueData = insertIssueSchema.parse({
        ...req.body,
        reporterId: req.user.id
      });
      
      const issue = await storage.createIssue(issueData);
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid issue data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create issue" });
    }
  });
  
  // Update issue status
  app.patch("/api/issues/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Validate status transitions based on role
      const user = req.user;
      
      if (user.role === UserRole.EMPLOYEE) {
        // Employees can only verify or reject completed issues they reported
        if (issue.reporterId !== user.id) {
          return res.status(403).json({ message: "Access forbidden" });
        }
        
        if (issue.status !== IssueStatus.COMPLETED || 
            (status !== IssueStatus.VERIFIED && status !== IssueStatus.REJECTED)) {
          return res.status(400).json({ message: "Invalid status transition" });
        }
      } else if (user.role === UserRole.DEPARTMENT) {
        // Department staff can update issues in their department to in progress, pending, or completed
        if (issue.department !== user.department) {
          return res.status(403).json({ message: "Access forbidden" });
        }
        
        // Allow department staff to make valid status transitions
        if (status === IssueStatus.IN_PROGRESS && issue.status === IssueStatus.OPEN) {
          // Open -> In Progress (valid)
        } else if (status === IssueStatus.PENDING && issue.status === IssueStatus.IN_PROGRESS) {
          // In Progress -> Pending (valid)
        } else if (status === IssueStatus.COMPLETED && 
                  (issue.status === IssueStatus.IN_PROGRESS || issue.status === IssueStatus.PENDING)) {
          // In Progress/Pending -> Completed (valid)
        } else {
          return res.status(400).json({ message: "Invalid status transition" });
        }
      }
      
      const updatedIssue = await storage.updateIssueStatus(id, status);
      
      // Create activity record
      await storage.createActivity({
        issueId: id,
        userId: user.id,
        action: "updated_status",
        details: { 
          fromStatus: issue.status,
          toStatus: status
        }
      });
      
      res.json(updatedIssue);
    } catch (error) {
      res.status(500).json({ message: "Failed to update issue status" });
    }
  });
  
  // Assign an issue
  app.patch("/api/issues/:id/assign", requireRole([UserRole.DEPARTMENT, UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { assigneeId } = req.body;
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Department staff can only assign issues in their department
      if (req.user.role === UserRole.DEPARTMENT && issue.department !== req.user.department) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      const updatedIssue = await storage.assignIssue(id, assigneeId);
      
      // Create activity record
      await storage.createActivity({
        issueId: id,
        userId: req.user.id,
        action: "assigned",
        details: { assigneeId }
      });
      
      res.json(updatedIssue);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign issue" });
    }
  });
  
  // Escalate an issue
  app.patch("/api/issues/:id/escalate", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Check permissions based on role
      if (user.role === UserRole.EMPLOYEE) {
        // Employees can only escalate issues they reported
        if (issue.reporterId !== user.id) {
          return res.status(403).json({ message: "Access forbidden" });
        }
        
        // Only allow escalation if not already escalated
        if (issue.isEscalated) {
          return res.status(400).json({ message: "Issue is already escalated" });
        }
        
        // Only allow escalation if issue is not verified or closed
        if (issue.status === IssueStatus.VERIFIED || issue.status === IssueStatus.CLOSED) {
          return res.status(400).json({ message: "Cannot escalate verified or closed issues" });
        }
        
        // For testing purposes, allow escalation without time restrictions
        // In production, we'd check SLA or time-based conditions
      } else if (user.role === UserRole.DEPARTMENT) {
        // Department staff can only escalate issues in their department
        if (issue.department !== user.department) {
          return res.status(403).json({ message: "Access forbidden" });
        }
      } 
      // Admins can escalate any issue
      
      const updatedIssue = await storage.escalateIssue(id);
      
      // Create activity record
      await storage.createActivity({
        issueId: id,
        userId: user.id,
        action: "escalated",
        details: { reason: req.body.reason || "Manual escalation" }
      });
      
      res.json(updatedIssue);
    } catch (error) {
      res.status(500).json({ message: "Failed to escalate issue" });
    }
  });
  
  // Add a comment to an issue
  app.post("/api/issues/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const id = parseInt(req.params.id);
      const { text } = req.body;
      
      if (!text || typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({ message: "Comment text is required" });
      }
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Check access permissions
      const user = req.user;
      
      if (user.role === UserRole.EMPLOYEE && issue.reporterId !== user.id) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      if (user.role === UserRole.DEPARTMENT && issue.department !== user.department) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      const updatedIssue = await storage.addComment(id, user.id, text);
      res.json(updatedIssue);
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  // Get activities for an issue
  app.get("/api/issues/:id/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const id = parseInt(req.params.id);
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Check access permissions
      const user = req.user;
      
      if (user.role === UserRole.EMPLOYEE && issue.reporterId !== user.id) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      if (user.role === UserRole.DEPARTMENT && issue.department !== user.department) {
        return res.status(403).json({ message: "Access forbidden" });
      }
      
      const activities = await storage.getActivitiesByIssue(id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  // Get recent activities
  app.get("/api/activities/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
    
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      
      // Filter activities based on user role and permissions
      const user = req.user;
      let filteredActivities = activities;
      
      if (user.role === UserRole.EMPLOYEE) {
        // Employees can only see activities for issues they reported
        const userIssues = await storage.getIssuesByReporter(user.id);
        const userIssueIds = userIssues.map(issue => issue.id);
        filteredActivities = activities.filter(activity => userIssueIds.includes(activity.issueId));
      } else if (user.role === UserRole.DEPARTMENT) {
        // Department staff can only see activities for issues in their department
        const departmentIssues = await storage.getIssuesByDepartment(user.department);
        const departmentIssueIds = departmentIssues.map(issue => issue.id);
        filteredActivities = activities.filter(activity => departmentIssueIds.includes(activity.issueId));
      }
      
      res.json(filteredActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });
  
  // Reassign issue to another department (admin only)
  app.patch("/api/issues/:id/reassign-department", requireRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { department } = req.body;
      
      if (!department || !Object.values(Department).includes(department)) {
        return res.status(400).json({ message: "Valid department is required" });
      }
      
      const issue = await storage.getIssue(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      if (issue.department === department) {
        return res.status(400).json({ message: "Issue is already assigned to this department" });
      }
      
      // Update the issue's department
      const updatedIssue = await storage.updateIssueDepartment(id, department);
      
      // Create activity record
      await storage.createActivity({
        issueId: id,
        userId: req.user.id,
        action: "department_changed",
        details: { 
          fromDepartment: issue.department,
          toDepartment: department 
        }
      });
      
      res.json(updatedIssue);
    } catch (error) {
      res.status(500).json({ message: "Failed to reassign department" });
    }
  });
  
  // Get analytics data
  app.get("/api/analytics", requireRole([UserRole.ADMIN, UserRole.DEPARTMENT]), async (req, res) => {
    try {
      const slaPerformance = await storage.getSLAPerformanceByDepartment();
      const statusCounts = await storage.getIssueCountsByStatus();
      const escalatedCount = await storage.getEscalatedIssuesCount();
      
      // Calculate overall SLA performance
      const departments = Object.keys(slaPerformance) as Department[];
      const overallPerformance = departments.reduce((acc, dept) => acc + slaPerformance[dept], 0) / departments.length;
      
      // Calculate total open issues
      const openIssues = statusCounts[IssueStatus.OPEN] + 
                         statusCounts[IssueStatus.IN_PROGRESS] + 
                         statusCounts[IssueStatus.ESCALATED];
      
      // Calculate total resolved issues
      const resolvedIssues = statusCounts[IssueStatus.VERIFIED] + 
                             statusCounts[IssueStatus.CLOSED];
      
      res.json({
        departmentPerformance: slaPerformance,
        overallPerformance: Math.round(overallPerformance),
        statusCounts,
        openIssues,
        resolvedIssues,
        escalatedCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });
  
  // Note: No need to add a separate endpoint for activities as we handle the display
  // text directly in the frontend

  // Create http server
  const httpServer = createServer(app);
  
  return httpServer;
}
