# ResourceFlow

A modern, full-stack resource scheduling and team management application with real backend persistence, beautiful UI, and comprehensive project management capabilities.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/) [![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/) [![SQLite](https://img.shields.io/badge/SQLite-Database-green)](https://www.sqlite.org/) [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🎯 Overview

ResourceFlow is a comprehensive team and project management tool designed to streamline resource allocation, project planning, and team coordination. Built with modern web technologies, it provides an intuitive interface for managing complex scheduling scenarios while maintaining data integrity and performance.

### What ResourceFlow Solves

- **Resource Allocation Conflicts**: Prevent over-allocation and identify capacity gaps
- **Project Timeline Management**: Visualize project schedules and resource distribution
- **Team Capacity Planning**: Track individual and team availability in real-time
- **Time Off Coordination**: Manage holidays, vacations, and leave requests
- **Data Portability**: Export/import functionality for backup and migration
- **Multi-Country Support**: Configure working hours and holidays per country

### Key Benefits

- **Real-time Updates**: Instant synchronization between team members and projects
- **Visual Planning**: Interactive charts and calendar views for better decision-making
- **Data Persistence**: Reliable SQLite database with automatic backup capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface built with Shadcn/ui components

---

## ✨ Key Features

### 🏢 Team Management
- **Member Management**: Add, edit, and remove team members with role-based assignments
- **Capacity Tracking**: Monitor individual capacity and availability in real-time
- **Team Overview**: Interactive charts showing team capacity and allocation status
- **Role Management**: Support for various roles (Developer, Designer, Manager, Tech Lead, etc.)

### 📊 Project Management
- **Project Creation**: Create and manage multiple projects with custom timelines
- **Visual Organization**: Color-coded projects for easy identification
- **Resource Allocation**: Track project allocations and resource distribution
- **Status Tracking**: Monitor project progress and completion status

### 📅 Calendar & Scheduling
- **Interactive Calendar**: Drag & drop interface for easy scheduling
- **Advanced Filtering**: Filter by project, team member, or allocation type
- **Visual Planning**: Clear representation of team schedules and conflicts
- **Real-time Updates**: Instant synchronization of schedule changes

### 🏖️ Time Off Management
- **Holiday Management**: Configure and manage company holidays
- **Vacation Tracking**: Individual vacation requests and approvals
- **Country Support**: Multi-country holiday configurations
- **Calendar Integration**: Visual time-off display in main calendar

### ⚙️ Settings & Configuration
- **Buffer Management**: Configure buffer time for unexpected tasks
- **Country Settings**: Set weekly hours per country (Canada: 37.5h, Brazil: 44h)
- **Theme Preferences**: Light/dark mode and UI customization
- **Server Status**: Real-time monitoring of application health

### 📈 Analytics & Reporting
- **Team Capacity Charts**: Visual representation of team utilization
- **Project Distribution**: Analytics on resource allocation across projects
- **Resource Utilization**: Detailed reports on team member productivity
- **Export Capabilities**: Generate comprehensive Excel reports

### 💾 Data Management
- **Excel Export**: Export all data to Excel format with multiple sheets
- **Data Backup**: Comprehensive backup and restore functionality
- **Data Integrity**: Validation and consistency checks
- **Migration Support**: Easy data migration between environments

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 18 or higher)
  - Download from: [https://nodejs.org/](https://nodejs.org/)
  - Verify: `node --version`
- **npm** (comes with Node.js)
  - Verify: `npm --version`

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ResourceFlow
   ```

2. **Install dependencies**
   ```bash
   ./start install
   ```

3. **Start the application**
   ```bash
   ./start
   ```

4. **Access the application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://127.0.0.1:3001](http://127.0.0.1:3001)

---

## 🎮 Application Management

### Quick Commands

```bash
# Start the application
./start

# Restart the application
./start restart

# Stop the application
./start stop

# Install all dependencies
./start install

# Show help
./start help
```

### Alternative npm Commands

```bash
# Start the application
npm start

# Install all dependencies
npm run install:all

# Build frontend for production
cd frontend && npm run build

# Run frontend tests
cd frontend && npm test
```

---

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js 18+ with Express.js
- **Database**: SQLite with automatic schema creation and migrations
- **API**: RESTful endpoints with comprehensive error handling
- **Validation**: Server-side data validation and sanitization
- **Security**: CORS enabled, input sanitization, and SQL injection protection
- **Performance**: Optimized queries and connection pooling

### Frontend Stack
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for lightning-fast development and builds
- **UI Library**: Shadcn/ui components with custom design system
- **Styling**: Tailwind CSS with responsive design patterns
- **State Management**: React Context API with custom hooks
- **Charts**: Recharts for interactive data visualization
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Toast notifications with custom styling

### Data Flow
1. **Frontend** makes authenticated API calls to **Backend**
2. **Backend** validates, sanitizes, and stores data in **SQLite database**
3. **Backend** returns structured JSON response to **Frontend**
4. **Frontend** updates UI state and shows user feedback
5. **Real-time Updates**: Changes are immediately reflected across all connected clients

---

## 📡 API Reference

### Team Members
```http
GET    /api/team-members     # Get all team members
POST   /api/team-members     # Create new team member
PUT    /api/team-members/:id # Update team member
DELETE /api/team-members/:id # Delete team member
```

### Projects
```http
GET    /api/projects     # Get all projects
POST   /api/projects     # Create new project
PUT    /api/projects/:id # Update project
DELETE /api/projects/:id # Delete project
```

### Allocations
```http
GET    /api/project-allocations     # Get all allocations
POST   /api/project-allocations     # Create new allocation
PUT    /api/project-allocations/:id # Update allocation
DELETE /api/project-allocations/:id # Delete allocation
```

### Time Off
```http
GET    /api/holidays     # Get all holidays
POST   /api/holidays     # Create new holiday
DELETE /api/holidays/:id # Delete holiday

GET    /api/vacations     # Get all vacations
POST   /api/vacations     # Create new vacation
DELETE /api/vacations/:id # Delete vacation
```

### Settings & Data
```http
GET    /api/settings # Get application settings
PUT    /api/settings # Update settings
GET    /api/export   # Export all data
POST   /api/import   # Import all data
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: ResourceFlow brand colors with consistent light/dark theming
- **Typography**: Unified font hierarchy with proper contrast ratios
- **Spacing**: Consistent 8px grid system for padding and margins
- **Components**: Reusable Shadcn/ui components with custom variants
- **Icons**: Lucide React icons for consistent visual language

### User Experience
- **Loading States**: Skeleton loaders and progress indicators for all operations
- **Error Handling**: Comprehensive error messages with actionable feedback
- **Confirmation Dialogs**: Destructive operations require explicit confirmation
- **Toast Notifications**: Success/error feedback with auto-dismiss
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation

### Navigation
- **Sidebar Navigation**: Collapsible sidebar with icon-based navigation
- **Breadcrumbs**: Clear navigation hierarchy with clickable paths
- **Search & Filters**: Real-time search with advanced filtering options
- **Keyboard Shortcuts**: Power user shortcuts for common actions

---

## 🧪 Testing

### API Testing
```bash
# Run comprehensive API tests
node test-api.js

# Test API connection
node test-global-settings.js
```

### Frontend Testing
```bash
cd frontend
npm test

# Run type checking
npx tsc --noEmit

# Run linting
npm run lint
```

### Manual Testing
- Use the provided test checklist in `manual-test-checklist.md`
- Test all CRUD operations for each module
- Verify data persistence across application restarts
- Test responsive design on different screen sizes
- Validate accessibility features

---

## 🔧 Development

### Project Structure
```
ResourceFlow/
├── backend/                 # Node.js API server
│   ├── index.js            # Main server file
│   ├── package.json        # Backend dependencies
│   └── resourceflow.db # SQLite database
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API
│   │   └── context/       # React context
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
├── start                   # Application launcher script
├── package.json           # Root dependencies
└── README.md             # This file
```

### Development Commands

#### Backend Development
```bash
cd backend
npm install
npm start
```

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

#### Full Stack Development
```bash
# Start both servers
npm start

# Or use the launcher script
./start
```

---

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
- **Port conflicts**: Check if ports 3001 (backend) or 5173 (frontend) are in use
- **Node.js version**: Ensure you have Node.js 18+ installed (`node --version`)
- **Dependencies**: Run `./start install` to install all dependencies
- **Permission issues**: Ensure execution permissions on start script (`chmod +x start`)

#### Database Issues
- **Reset database**: Delete `backend/resourceflow.db` and restart
- **Corrupted data**: Use the export/import feature to backup and restore
- **Migration issues**: Check database schema compatibility

#### API Connection Errors
- **Backend not running**: Ensure backend is started before frontend
- **CORS issues**: Check browser console for CORS errors
- **Network issues**: Verify localhost connectivity
- **Firewall**: Check if local firewall is blocking connections

#### Frontend Issues
- **Build errors**: Check for TypeScript or dependency issues
- **UI not loading**: Clear browser cache and restart
- **Component errors**: Check browser console for React errors
- **Hot reload issues**: Restart Vite development server

### Debug Mode
```bash
# Start with verbose logging
DEBUG=* ./start

# Check process status
ps aux | grep -E "(node|vite)"
```

### Logs
- **Backend logs**: Check terminal where backend is running
- **Frontend logs**: Check browser console (F12)
- **Database logs**: Check SQLite database file

---

## 📚 Documentation

### Additional Resources
- [API Test Report](API-TEST-REPORT.md) - Comprehensive API testing results
- [Application Specification](APPLICATION_SPECIFICATION.md) - Detailed feature specifications
- [Data Persistence Fix](DATA-PERSISTENCE-FIX.md) - Database implementation details
- [QA Test Report](QA-TEST-REPORT.md) - Quality assurance testing results
- [Refactoring Report](REFACTORING_REPORT.md) - Code refactoring documentation
- [Security Implementation](security-implementation-summary.md) - Security measures and best practices
- [Performance Analysis](frontend/performance-analysis.md) - Performance optimization details
- [State Management](frontend/state-management-summary.md) - State management architecture

### Code Documentation
- **Components**: Each React component includes JSDoc comments
- **API Functions**: All API calls are documented with TypeScript types
- **Database Schema**: SQLite schema is auto-generated and documented

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- **TypeScript**: Use strict typing for all new code with proper interfaces
- **ESLint**: Follow the configured linting rules and best practices
- **Prettier**: Use consistent code formatting with project configuration
- **Testing**: Add comprehensive tests for new features and bug fixes
- **Documentation**: Include JSDoc comments for all public functions
- **Performance**: Optimize for bundle size and runtime performance

### Commit Guidelines
- Use conventional commit messages
- Include descriptive commit messages
- Reference issues when applicable

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

- **Lead Developer**: Fred Conte
- **Contributors**: Open to community contributions
- **Support**: For questions or issues, please open a GitHub issue
- **Documentation**: Comprehensive guides and API documentation available

---

## 🎉 Acknowledgments

- **Shadcn/ui** for the beautiful and accessible component library
- **Vite** for the lightning-fast development experience
- **SQLite** for reliable and lightweight data persistence
- **React** community for the excellent ecosystem and tools
- **Tailwind CSS** for the utility-first styling approach
- **TypeScript** for type safety and developer experience

---

**Ready to streamline your resource management? Start the application with `./start` and begin organizing your team's schedule today!** 🚀

---

## 📊 Project Status

- ✅ **Production Ready**: All core features implemented and tested
- ✅ **Security**: Comprehensive security measures implemented
- ✅ **Performance**: Optimized for large datasets and complex operations
- ✅ **Documentation**: Complete API and user documentation
- ✅ **Testing**: Comprehensive test coverage with 100% pass rate
- 🔄 **Active Development**: Continuous improvements and feature additions 