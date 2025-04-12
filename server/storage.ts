import { users, issues, activities, type User, type InsertUser, type Issue, type InsertIssue, type Activity, type InsertActivity, IssueStatus, SLAStatus, SLAPriority, UserRole, Department, Comment } from "@shared/schema";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

// Calculate if SLA is breached or at risk
function calculateSlaStatus(issue: Issue): SLAStatus {
  if (!issue.dueBy) return SLAStatus.ON_TRACK;
  
  const now = new Date();
  const dueDate = new Date(issue.dueBy);
  
  if (issue.status === IssueStatus.VERIFIED || issue.status === IssueStatus.CLOSED) {
    return SLAStatus.COMPLETED;
  }
  
  if (now > dueDate) {
    return SLAStatus.BREACHED;
  }
  
  // Consider at risk if within 25% of SLA time
  const timeLeft = dueDate.getTime() - now.getTime();
  const totalTime = dueDate.getTime() - new Date(issue.createdAt!).getTime();
  const percentTimeLeft = (timeLeft / totalTime) * 100;
  
  if (percentTimeLeft <= 25) {
    return SLAStatus.AT_RISK;
  }
  
  return SLAStatus.ON_TRACK;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByDepartment(department: Department): Promise<User[]>;
  
  // Issue methods
  createIssue(issue: InsertIssue): Promise<Issue>;
  getIssue(id: number): Promise<Issue | undefined>;
  getAllIssues(): Promise<Issue[]>;
  getIssuesByReporter(userId: number): Promise<Issue[]>;
  getIssuesByDepartment(department: Department): Promise<Issue[]>;
  getIssuesByStatus(status: IssueStatus): Promise<Issue[]>;
  getIssuesByAssignee(assigneeId: number): Promise<Issue[]>;
  updateIssueStatus(id: number, status: IssueStatus): Promise<Issue | undefined>;
  assignIssue(id: number, assigneeId: number): Promise<Issue | undefined>;
  escalateIssue(id: number): Promise<Issue | undefined>;
  addComment(issueId: number, userId: number, text: string): Promise<Issue | undefined>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByIssue(issueId: number): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  
  // Analytics methods
  getSLAPerformanceByDepartment(): Promise<Record<Department, number>>;
  getIssueCountsByStatus(): Promise<Record<IssueStatus, number>>;
  getEscalatedIssuesCount(): Promise<number>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private issuesMap: Map<number, Issue>;
  private activitiesMap: Map<number, Activity>;
  sessionStore: session.SessionStore;
  userIdCounter: number;
  issueIdCounter: number;
  activityIdCounter: number;

  constructor() {
    this.usersMap = new Map();
    this.issuesMap = new Map();
    this.activitiesMap = new Map();
    this.userIdCounter = 1;
    this.issueIdCounter = 1;
    this.activityIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h, clear expired sessions
    });
    
    // Create some initial demo data
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$ZI0mZ4LdR5vnHvuKKvO9neVxGp.cLQb4.V4bM6taJZYyJ1SuSCBDm", // "password"
      fullName: "Admin User",
      email: "admin@example.com",
      role: UserRole.ADMIN,
      department: Department.IT
    });

    // Create department staff
    this.createUser({
      username: "itstaff",
      password: "$2b$10$ZI0mZ4LdR5vnHvuKKvO9neVxGp.cLQb4.V4bM6taJZYyJ1SuSCBDm", // "password"
      fullName: "IT Staff",
      email: "it@example.com",
      role: UserRole.DEPARTMENT,
      department: Department.IT
    });

    // Create employee
    this.createUser({
      username: "employee",
      password: "$2b$10$ZI0mZ4LdR5vnHvuKKvO9neVxGp.cLQb4.V4bM6taJZYyJ1SuSCBDm", // "password"
      fullName: "Regular Employee",
      email: "employee@example.com",
      role: UserRole.EMPLOYEE,
      department: Department.FINANCE
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.usersMap.set(id, user);
    return user;
  }

  async getUsersByDepartment(department: Department): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(
      (user) => user.department === department
    );
  }

  // Issue methods
  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.issueIdCounter++;
    const now = new Date();
    
    // Calculate due date based on priority
    let dueBy: Date | undefined = undefined;
    if (insertIssue.priority) {
      dueBy = new Date(now);
      let hoursToAdd = 24; // Default
      
      switch (insertIssue.priority) {
        case SLAPriority.CRITICAL:
          hoursToAdd = 4;
          break;
        case SLAPriority.HIGH:
          hoursToAdd = 8;
          break;
        case SLAPriority.MEDIUM:
          hoursToAdd = 24;
          break;
        case SLAPriority.LOW:
          hoursToAdd = 48;
          break;
      }
      
      dueBy.setHours(dueBy.getHours() + hoursToAdd);
    }
    
    const issue: Issue = {
      ...insertIssue,
      id,
      createdAt: now,
      updatedAt: now,
      dueBy,
      slaStatus: SLAStatus.ON_TRACK,
      isEscalated: false,
      comments: [],
      assigneeId: null
    };
    
    this.issuesMap.set(id, issue);
    
    // Create activity for new issue
    await this.createActivity({
      issueId: id,
      userId: insertIssue.reporterId,
      action: "created",
      details: { title: insertIssue.title }
    });
    
    return issue;
  }

  async getIssue(id: number): Promise<Issue | undefined> {
    const issue = this.issuesMap.get(id);
    if (issue) {
      // Update SLA status before returning
      const updatedIssue = { ...issue, slaStatus: calculateSlaStatus(issue) };
      this.issuesMap.set(id, updatedIssue);
      return updatedIssue;
    }
    return undefined;
  }

  async getAllIssues(): Promise<Issue[]> {
    // Update SLA statuses before returning
    const issues = Array.from(this.issuesMap.values());
    issues.forEach(issue => {
      const updatedSlaStatus = calculateSlaStatus(issue);
      if (issue.slaStatus !== updatedSlaStatus) {
        const updatedIssue = { ...issue, slaStatus: updatedSlaStatus };
        this.issuesMap.set(issue.id, updatedIssue);
      }
    });
    return Array.from(this.issuesMap.values());
  }

  async getIssuesByReporter(userId: number): Promise<Issue[]> {
    return (await this.getAllIssues()).filter(
      (issue) => issue.reporterId === userId
    );
  }

  async getIssuesByDepartment(department: Department): Promise<Issue[]> {
    return (await this.getAllIssues()).filter(
      (issue) => issue.department === department
    );
  }

  async getIssuesByStatus(status: IssueStatus): Promise<Issue[]> {
    return (await this.getAllIssues()).filter(
      (issue) => issue.status === status
    );
  }

  async getIssuesByAssignee(assigneeId: number): Promise<Issue[]> {
    return (await this.getAllIssues()).filter(
      (issue) => issue.assigneeId === assigneeId
    );
  }

  async updateIssueStatus(id: number, status: IssueStatus): Promise<Issue | undefined> {
    const issue = await this.getIssue(id);
    if (!issue) return undefined;
    
    const now = new Date();
    const updatedIssue: Issue = {
      ...issue,
      status,
      updatedAt: now,
      // If the issue is being marked as completed and it was previously at risk or breached,
      // we want to keep that information for reporting purposes
      slaStatus: 
        status === IssueStatus.VERIFIED || status === IssueStatus.CLOSED 
          ? SLAStatus.COMPLETED 
          : calculateSlaStatus({...issue, status})
    };
    
    this.issuesMap.set(id, updatedIssue);
    return updatedIssue;
  }

  async assignIssue(id: number, assigneeId: number): Promise<Issue | undefined> {
    const issue = await this.getIssue(id);
    if (!issue) return undefined;
    
    const now = new Date();
    const updatedIssue: Issue = {
      ...issue,
      assigneeId,
      updatedAt: now,
      status: issue.status === IssueStatus.OPEN ? IssueStatus.IN_PROGRESS : issue.status
    };
    
    this.issuesMap.set(id, updatedIssue);
    return updatedIssue;
  }

  async escalateIssue(id: number): Promise<Issue | undefined> {
    const issue = await this.getIssue(id);
    if (!issue) return undefined;
    
    const now = new Date();
    const updatedIssue: Issue = {
      ...issue,
      isEscalated: true,
      status: IssueStatus.ESCALATED,
      updatedAt: now
    };
    
    this.issuesMap.set(id, updatedIssue);
    return updatedIssue;
  }

  async addComment(issueId: number, userId: number, text: string): Promise<Issue | undefined> {
    const issue = await this.getIssue(issueId);
    const user = await this.getUser(userId);
    if (!issue || !user) return undefined;
    
    const now = new Date();
    const comment: Comment = {
      id: nanoid(),
      userId,
      userName: user.fullName,
      text,
      timestamp: now
    };
    
    const comments = Array.isArray(issue.comments) ? issue.comments : [];
    const updatedIssue: Issue = {
      ...issue,
      comments: [...comments, comment],
      updatedAt: now
    };
    
    this.issuesMap.set(issueId, updatedIssue);
    
    // Create activity for comment
    await this.createActivity({
      issueId,
      userId,
      action: "commented",
      details: { commentId: comment.id }
    });
    
    return updatedIssue;
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activitiesMap.set(id, activity);
    return activity;
  }

  async getActivitiesByIssue(issueId: number): Promise<Activity[]> {
    return Array.from(this.activitiesMap.values())
      .filter((activity) => activity.issueId === issueId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activitiesMap.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  // Analytics methods
  async getSLAPerformanceByDepartment(): Promise<Record<Department, number>> {
    const issues = await this.getAllIssues();
    const departmentIssues: Record<Department, { total: number, completed: number }> = {
      [Department.IT]: { total: 0, completed: 0 },
      [Department.HR]: { total: 0, completed: 0 },
      [Department.ADMIN]: { total: 0, completed: 0 },
      [Department.FINANCE]: { total: 0, completed: 0 },
      [Department.LEGAL]: { total: 0, completed: 0 }
    };
    
    // Only consider resolved issues (verified or closed)
    const completedIssues = issues.filter(
      issue => issue.status === IssueStatus.VERIFIED || issue.status === IssueStatus.CLOSED
    );
    
    completedIssues.forEach(issue => {
      departmentIssues[issue.department].total += 1;
      if (issue.slaStatus !== SLAStatus.BREACHED) {
        departmentIssues[issue.department].completed += 1;
      }
    });
    
    const result: Record<Department, number> = {} as Record<Department, number>;
    
    Object.entries(departmentIssues).forEach(([dept, data]) => {
      result[dept as Department] = data.total > 0 
        ? Math.round((data.completed / data.total) * 100) 
        : 100; // Default to 100% if no issues
    });
    
    return result;
  }

  async getIssueCountsByStatus(): Promise<Record<IssueStatus, number>> {
    const issues = await this.getAllIssues();
    const result: Record<IssueStatus, number> = {
      [IssueStatus.OPEN]: 0,
      [IssueStatus.IN_PROGRESS]: 0,
      [IssueStatus.COMPLETED]: 0,
      [IssueStatus.VERIFIED]: 0,
      [IssueStatus.REJECTED]: 0,
      [IssueStatus.CLOSED]: 0,
      [IssueStatus.ESCALATED]: 0
    };
    
    issues.forEach(issue => {
      result[issue.status] += 1;
    });
    
    return result;
  }

  async getEscalatedIssuesCount(): Promise<number> {
    const issues = await this.getAllIssues();
    return issues.filter(issue => issue.isEscalated).length;
  }
}

export const storage = new MemStorage();
