import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export enum UserRole {
  EMPLOYEE = "employee",
  DEPARTMENT = "department",
  ADMIN = "admin"
}

// Issue status flow
export enum IssueStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  PENDING = "pending",
  COMPLETED = "completed",
  VERIFIED = "verified",
  REJECTED = "rejected",
  CLOSED = "closed",
  ESCALATED = "escalated"
}

// Departments
export enum Department {
  IT = "IT",
  HR = "HR",
  ADMIN = "Admin",
  FINANCE = "Finance",
  LEGAL = "Legal"
}

// SLA Priority
export enum SLAPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

// SLA Status
export enum SLAStatus {
  ON_TRACK = "on_track",
  AT_RISK = "at_risk",
  BREACHED = "breached",
  COMPLETED = "completed"
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.EMPLOYEE),
  department: text("department").$type<Department>().notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Issues table
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  department: text("department").$type<Department>().notNull(),
  status: text("status").$type<IssueStatus>().notNull().default(IssueStatus.OPEN),
  priority: text("priority").$type<SLAPriority>().notNull(),
  reporterId: integer("reporter_id").notNull(), // User who reported the issue
  assigneeId: integer("assignee_id"), // Department staff assigned to the issue
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  dueBy: timestamp("due_by"), // SLA due date
  slaStatus: text("sla_status").$type<SLAStatus>().notNull().default(SLAStatus.ON_TRACK),
  isEscalated: boolean("is_escalated").default(false),
  comments: json("comments").default([])
});

// Activities table for tracking actions on issues
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // e.g., "created", "updated", "commented", "escalated"
  details: json("details").default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assigneeId: true,
  isEscalated: true,
  slaStatus: true
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Calculate SLA times based on priority (in hours)
export const SLATimes = {
  [SLAPriority.LOW]: 48,
  [SLAPriority.MEDIUM]: 24,
  [SLAPriority.HIGH]: 8,
  [SLAPriority.CRITICAL]: 4
};

// Comment type for issue comments
export type Comment = {
  id: string;
  userId: number;
  userName: string;
  text: string;
  timestamp: Date;
};
