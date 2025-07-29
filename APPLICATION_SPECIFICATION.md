# BRP ResourceFlow – Application Specification (MVP)

## 🎯 Project Overview
**ResourceFlow** is a full-stack resource scheduling and team management app for BRP Motorsports. It enables efficient management of team members, projects, time off, and allocations, with real-time synchronization and a UI inspired by Resource Guru, following BRP's design language.

### Core Purpose
- Centralized resource planning.
- Real-time project allocation tracking.
- Time-off management with conflict detection.
- Professional UI adhering to BRP branding.

---

## 🏗 Technical Architecture

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite3 (migration path to PostgreSQL for production)
- **API**: RESTful JSON endpoints with pagination and filtering.
- **CORS**: Enabled for frontend.
- **Port**: 3001.

### Frontend
- **Framework**: React 18 + TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with BRP design tokens.
- **UI Components**: Shadcn/UI (Radix primitives).
- **State Management**: React Query (@tanstack/react-query).
- **Routing**: React Router DOM.
- **Charts**: Recharts.
- **Date Handling**: date-fns.
- **Excel Export**: xlsx library.
- **Port**: 8080.

### Design System
- **Colors**: Dark greys, white backgrounds, yellow accents.
- **Layout**: Responsive grid system.
- **Typography**: Consistent font hierarchy.
- **Components**: Modern, accessible UI with **Pragmatic Drag and Drop (PDD)** for allocation.

---

## 📊 Database Schema
*(Same as original spec, with all foreign keys and constraints enforced.)*

---

## 🔌 API Endpoints
- Full CRUD for Team Members, Projects, Holidays, Vacations, Allocations, and Settings.
- Filtering, pagination, and bulk operations supported.
- `GET /api/export` and `POST /api/import` for Excel data management.

---

## Key Business Rules
1. **Allocation & Hours**
   - Hours per week derived from settings table by country.
   - Allocations **may exceed available weekly hours**, but **overtime must be visually represented** in the Planner (e.g., color-coded bars).
2. **Conflict Detection**
   - Employees **can have multiple concurrent project allocations**.
   - **Total allocated hours across all projects** are compared to available weekly hours, factoring in:
     - country-specific working hours,
     - holidays, and
     - approved vacations.
   - Visual indicators highlight overload conditions.
   - Vacations and holidays automatically block availability.
3. **Time Off**
   - No approval workflow.
   - Past dates disallowed except by admin override.
   - Recurring holidays supported.
4. **Consistency**
   - Single calculation source for available hours.
   - Synchronization between Planner and Time-Off modules in real time.

---

## Frontend Modules

### Team Management
- Add, edit, delete, and view team members.
- Cards with role, country, and allocation status.
- Filters and search.

### Project Management
- CRUD operations for projects.
- Timeline visualization.
- Color-coded identification.

### Time Off Management
- Manage holidays (add, edit, delete, recurring).
- Manage employee vacations and sick leaves.
- Conflict detection for overlapping periods and over-allocation.
- Date range pickers and searchable employee selection.

### Planner
- **Resource Guru-inspired timeline** with:
  - Rows for team members.
  - Horizontal allocation bars for projects.
  - **Pragmatic Drag and Drop** for:
    - Assigning employees to projects.
    - Dragging allocations horizontally to adjust dates.
    - Stretching/shrinking ends of bars to change start/end dates.
- Real-time indicators for:
  - Conflicts (overlaps).
  - Overtime (color-coded alerts).
  - Time-off periods blocking availability.

### Settings
- Configure hours/week per country and buffer time.
- Manage data export/import.
- Two-column responsive layout.

### Dashboard
- Team overview cards.
- Project allocation and capacity charts.
- Key metrics visualization.

---

## UI/UX Patterns
- **Navigation**: Tab-based with breadcrumbs.
- **Forms**: Real-time validation, loading states, and confirmation dialogs.
- **Accessibility**: Keyboard-friendly PDD, focus indicators, and screen reader support.
- **Feedback**: Toast notifications for success and errors.
- **Design Consistency**: BRP dark/white/yellow theme, modern grid, and clear hierarchy.

---

## Security
- Basic authentication layer (JWT/session) to protect APIs.
- Server and client-side validation, SQL injection protection, and XSS sanitization.

---

## Testing
- Unit and integration tests for API endpoints.
- E2E tests for CRUD workflows and allocations.
- Data integrity tests for allocations and time-off conflicts.

---

## Future Enhancements (Post-MVP)
- Full calendar view for allocations.
- Advanced filtering and reporting.
- Notifications (email/SMS).
- Real-time updates via WebSocket.
- Mobile app (React Native).

---

