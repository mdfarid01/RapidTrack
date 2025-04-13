# IssuePulse - Internal Issue Tracking System

A role-based internal issue tracking system designed for efficient team collaboration and service level agreement (SLA) management, with robust administrative controls and detailed issue lifecycle management.

## Features

- **Role-Based Access Control**: Three distinct user roles with appropriate permissions:
  - **Employees**: Can create, view, and verify/reject resolved issues
  - **Department Staff**: Can manage issue lifecycles within their department
  - **Administrators**: Have full access with escalation management and department reassignment capabilities

- **Issue Lifecycle Management**: 
  - Complete workflow: Open → In Progress → Pending → Completed → Verified/Rejected → Closed
  - Escalation mechanism with SLA breach tracking
  - Department reassignment for complex issues

- **SLA Monitoring**: 
  - Visual indicators for SLA status (on track, at risk, breached)
  - Time-based escalation triggers
  - Performance analytics by department

- **Responsive Interface**:
  - Clean, modern UI built with React and Tailwind CSS
  - Role-adaptive dashboard displays
  - Action menus tailored to user permissions

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **State Management**: React Query, React Hook Form
- **Backend**: Express.js
- **Data Storage**: In-memory storage with TypeScript schemas
- **Authentication**: Passport.js with session management

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the application: `npm run dev`
4. Access the application at `http://localhost:5000`

## Default Users

- **Employee**: Username: `employee`, Password: `password`
- **Department Staff**: Username: `itstaff`, Password: `password`
- **Admin**: Username: `admin`, Password: `password`

## License

[MIT License](LICENSE)