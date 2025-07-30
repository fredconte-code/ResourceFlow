# Resource Scheduler

A modern, full-stack resource scheduling and team management application with real backend persistence, beautiful UI, and comprehensive project management capabilities.

![Resource Scheduler](https://img.shields.io/badge/Node.js-18+-green) ![Resource Scheduler](https://img.shields.io/badge/React-18+-blue) ![Resource Scheduler](https://img.shields.io/badge/TypeScript-5+-blue) ![Resource Scheduler](https://img.shields.io/badge/SQLite-Database-green)

---

## 🎯 Overview

Resource Scheduler is a comprehensive team and project management tool that helps organizations:

- **Manage team allocations** across multiple projects
- **Track time off** including holidays and vacations
- **Visualize resource capacity** with interactive charts
- **Export/import data** for backup and migration
- **Configure settings** per country and team preferences

Built with modern technologies including React, TypeScript, Node.js, and SQLite for reliable data persistence.

---

## ✨ Key Features

### 🏢 Team Management
- Add, edit, and remove team members
- Track individual capacity and availability
- Real-time team overview with capacity charts

### 📊 Project Management
- Create and manage multiple projects
- Set project timelines and color coding
- Track project allocations and resource distribution

### 📅 Calendar & Scheduling
- Interactive calendar view with drag & drop
- Filter by project, team member, or allocation type
- Visual representation of team schedules

### 🏖️ Time Off Management
- Manage holidays and vacations
- Country-specific holiday configurations
- Vacation tracking with approval workflows

### ⚙️ Settings & Configuration
- Buffer time configuration
- Weekly hours per country
- Theme and UI preferences

### 📈 Analytics & Reporting
- Team capacity charts
- Project distribution analytics
- Resource utilization reports

### 💾 Data Management
- Export all data to Excel format
- Import data from Excel files
- Backup and restore functionality

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
   cd Resource\ Scheduler
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
   - Frontend: [http://localhost:8080](http://localhost:8080)
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

# Restart the application
npm run restart

# Stop the application
npm run stop

# Install all dependencies
npm run install:all
```

---

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Database**: SQLite with automatic schema creation
- **API**: RESTful endpoints with JSON responses
- **Validation**: Server-side data validation
- **CORS**: Enabled for cross-origin requests

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **UI Library**: Shadcn/ui components
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks with API integration
- **Charts**: Recharts for data visualization

### Data Flow
1. **Frontend** makes API calls to **Backend**
2. **Backend** validates and stores data in **SQLite database**
3. **Backend** returns response to **Frontend**
4. **Frontend** updates UI and shows feedback

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
- **Colors**: BRP brand colors with consistent theming
- **Typography**: Unified font sizes and weights
- **Spacing**: Consistent padding and margins
- **Components**: Reusable Shadcn/ui components

### User Experience
- **Loading States**: All API operations show loading indicators
- **Error Handling**: Comprehensive error messages with retry options
- **Confirmation Dialogs**: Delete operations require confirmation
- **Toast Notifications**: Success/error feedback using BRP yellow theme
- **Responsive Design**: Works on desktop and mobile devices

### Navigation
- **Sidebar Navigation**: Easy access to all sections
- **Breadcrumbs**: Clear navigation hierarchy
- **Search & Filters**: Quick data filtering capabilities

---

## 🧪 Testing

### API Testing
```bash
# Run comprehensive API tests
node test-api.js
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual Testing
- Use the provided test checklist in `manual-test-checklist.md`
- Test all CRUD operations for each module
- Verify data persistence across application restarts

---

## 🔧 Development

### Project Structure
```
Resource Scheduler/
├── backend/                 # Node.js API server
│   ├── index.js            # Main server file
│   ├── package.json        # Backend dependencies
│   └── resource_scheduler.db # SQLite database
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
- **Port conflicts**: Check if ports 3001 (backend) or 8080 (frontend) are in use
- **Node.js version**: Ensure you have Node.js 18+ installed
- **Dependencies**: Run `./start install` to install all dependencies

#### Database Issues
- **Reset database**: Delete `backend/resource_scheduler.db` and restart
- **Corrupted data**: Use the export/import feature to backup and restore

#### API Connection Errors
- **Backend not running**: Ensure backend is started before frontend
- **CORS issues**: Check browser console for CORS errors
- **Network issues**: Verify localhost connectivity

#### Frontend Issues
- **Build errors**: Check for TypeScript or dependency issues
- **UI not loading**: Clear browser cache and restart
- **Component errors**: Check browser console for React errors

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
- **TypeScript**: Use strict typing for all new code
- **ESLint**: Follow the configured linting rules
- **Prettier**: Use consistent code formatting
- **Testing**: Add tests for new features

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

---

## 🎉 Acknowledgments

- **Shadcn/ui** for the beautiful component library
- **Vite** for the fast development experience
- **SQLite** for reliable data persistence
- **React** community for the excellent ecosystem

---

**Ready to streamline your resource management? Start the application with `./start` and begin organizing your team's schedule today!** 🚀 