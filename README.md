# Resource Scheduler

A modern, full-stack resource scheduling and team management application with real backend persistence.

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your machine:

### Required Software
- **Node.js** (version 18 or higher)
  - Download from: [https://nodejs.org/](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

### Optional but Recommended
- **Git** (for version control)
  - Download from: [https://git-scm.com/](https://git-scm.com/)
  - Verify installation: `git --version`
- **VS Code** or any code editor
  - Download from: [https://code.visualstudio.com/](https://code.visualstudio.com/)

### System Requirements
- **Operating System**: Windows, macOS, or Linux
- **Memory**: At least 4GB RAM
- **Storage**: At least 1GB free space
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Project Overview
Resource Scheduler helps teams manage allocations, projects, time off, and more, with a beautiful and intuitive UI. **Now with real backend persistence using SQLite database!**

---

## 🖥️ Getting Started

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```
- The backend will run at: **http://127.0.0.1:3001**
- SQLite database will be created automatically at: `backend/resource_scheduler.db`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```
- The frontend will run at: **http://localhost:8080** (or as shown in your terminal)

---

## 🌐 Accessing the App
- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend API:** [http://127.0.0.1:3001/api/hello](http://127.0.0.1:3001/api/hello)

---

## 🧪 Testing the API

To verify that the backend-frontend communication is working correctly:

```bash
# From the project root
node test-api.js
```

This will run a comprehensive test suite that:
- Tests all API endpoints (GET, POST, PUT, DELETE)
- Verifies data persistence
- Checks error handling
- Validates data integrity

---

## 🧩 Main Features

- **Resource Dashboard:** Overview of team allocation, project distribution, and capacity.
- **Team Management:** Add, edit, and remove team members with real backend persistence.
- **Project Management:** Create and manage projects with timelines and allocations.
- **Calendar View:** Visualize allocations and filter by project or team member.
- **Time Off Management:** Manage holidays and vacations with server-side storage.
- **Settings:** Configure buffer time and weekly hours per country with API persistence.
- **Data Export/Import:** Export all data to Excel and import from Excel files.

---

## 🏗️ Architecture

### Backend (Node.js + Express + SQLite)
- **Database:** SQLite with automatic table creation
- **API Endpoints:** RESTful API for all resources
- **Data Validation:** Server-side validation and error handling
- **CORS:** Enabled for frontend communication

### Frontend (React + TypeScript + Vite)
- **API Integration:** Full API communication via fetch
- **State Management:** React hooks with API synchronization
- **Error Handling:** Comprehensive error handling and user feedback
- **Loading States:** Proper loading indicators for all API operations

### Data Flow
1. **Frontend** makes API calls to **Backend**
2. **Backend** validates and stores data in **SQLite database**
3. **Backend** returns response to **Frontend**
4. **Frontend** updates UI and shows success/error messages

---

## 📊 API Endpoints

### Team Members
- `GET /api/team-members` - Get all team members
- `POST /api/team-members` - Create new team member
- `PUT /api/team-members/:id` - Update team member
- `DELETE /api/team-members/:id` - Delete team member

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Holidays
- `GET /api/holidays` - Get all holidays
- `POST /api/holidays` - Create new holiday
- `DELETE /api/holidays/:id` - Delete holiday

### Vacations
- `GET /api/vacations` - Get all vacations
- `POST /api/vacations` - Create new vacation
- `DELETE /api/vacations/:id` - Delete vacation

### Project Allocations
- `GET /api/project-allocations` - Get all allocations
- `POST /api/project-allocations` - Create new allocation
- `PUT /api/project-allocations/:id` - Update allocation
- `DELETE /api/project-allocations/:id` - Delete allocation

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

### Data Management
- `GET /api/export` - Export all data
- `POST /api/import` - Import all data

---

## 🖌️ UI/UX Conventions
- **Filters:** Project and team member filters are always visible in Calendar View.
- **Add Forms:** Only the add button is visible by default. Clicking expands the form (Team Management, Time Off).
- **Settings:** No theme toggle (theme is in the top menu). Save button animates on save.
- **Consistent Font Sizes:** All sections use unified font sizes for a professional look.
- **Loading States:** All API operations show loading indicators.
- **Error Handling:** Comprehensive error messages and retry options.

---

## 🛠️ How to Use

### Team Management
- Click **Add Team Member** to expand the form.
- Fill in details and click **Add Team Member**.
- Edit or remove members as needed.
- All data is automatically saved to the backend.

### Project Management
- Click **Add Project** to create a new project.
- Set project name, start/end dates, and color.
- Edit or delete projects as needed.
- All changes are persisted to the database.

### Time Off Management
- Click **Add Holiday** or **Add Vacation** to expand the respective form.
- Fill in details and click **Add**.
- Cancel to close the form without adding.
- All data is stored on the server.

### Calendar View
- Use the **Project** and **Team Member** filters to focus the view.
- All project allocations are shown for filtered team members.
- Data is loaded from the backend in real-time.

### Settings
- Adjust buffer and weekly hours as needed.
- Click **Save**; the button will animate to confirm changes.
- Settings are automatically saved to the backend.

### Data Export/Import
- Use **Export Data** to download all data as an Excel file.
- Use **Import Data** to restore data from a previously exported file.
- **Clear All Data** to reset the database to default values.

---

## ⚠️ Troubleshooting
- **Backend not starting:** Check if port 3001 is available, or change the port in `backend/index.js`
- **Database issues:** Delete `backend/resource_scheduler.db` to reset the database
- **API connection errors:** Ensure the backend is running before starting the frontend
- **CORS errors:** Check that the backend CORS settings match your frontend URL
- **Data not persisting:** Verify that the backend is running and accessible
- For any issues, check the browser console and terminal output.
- Make sure Node.js and npm are properly installed and in your PATH.

---

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm start
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Test the API
node test-api.js

# Test frontend (if you have testing setup)
cd frontend
npm test
```

---

## 👥 Credits & Contact
- Developed by Fred Conte and contributors.
- For questions or support, contact: [your-email@example.com]

---

Enjoy using Resource Scheduler with real backend persistence! 🚀 