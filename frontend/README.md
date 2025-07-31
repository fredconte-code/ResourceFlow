# ResourceFlow Frontend

## Overview

ResourceFlow is a comprehensive resource management application built with modern web technologies. This frontend provides an intuitive interface for managing team members, projects, allocations, and time-off requests.

## Features

- **Dashboard**: Real-time overview of team capacity and project status
- **Team Management**: Add, edit, and manage team members with country-specific settings
- **Project Management**: Create and track projects with visual allocation charts
- **Planner**: Interactive calendar view for resource allocation and scheduling
- **Time Off Management**: Handle vacation requests and holiday configurations
- **Settings**: Configure working hours, buffer settings, and system preferences

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- ResourceFlow backend server running

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The application runs on `http://localhost:5173` by default.

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API
├── pages/              # Page components
└── main.tsx           # Application entry point
```

## Key Components

- **Dashboard**: Main overview with charts and metrics
- **TeamManagement**: Team member CRUD operations
- **Projects**: Project management with allocation charts
- **PlannerView**: Interactive calendar for resource planning
- **TimeOffManagement**: Vacation and holiday management
- **Settings**: Application configuration

## API Integration

The frontend communicates with the ResourceFlow backend API for:
- Team member data
- Project information
- Allocation management
- Time-off requests
- System settings

## Styling

The application uses Tailwind CSS with a custom design system:
- Consistent color palette
- Responsive design
- Dark/light theme support
- Accessible components

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the established naming conventions
4. Test your changes thoroughly
5. Update documentation as needed

## License

This project is part of the ResourceFlow application suite.
