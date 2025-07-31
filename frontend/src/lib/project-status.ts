import { Check, Activity, Pause, X } from "lucide-react";
import { ProjectStatus } from "./api";

// Project Status Configuration
export const PROJECT_STATUSES: Record<ProjectStatus, {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = {
  active: {
    label: 'Active',
    color: '#10b981', // Green
    icon: Activity,
    description: 'Project is currently in progress'
  },
  on_hold: {
    label: 'On Hold',
    color: '#f59e0b', // Yellow/Orange
    icon: Pause,
    description: 'Project is temporarily paused'
  },
  finished: {
    label: 'Finished',
    color: '#10b981', // Green
    icon: Check,
    description: 'Project has been completed'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444', // Red
    icon: X,
    description: 'Project has been cancelled'
  }
};

// Get status configuration
export const getProjectStatusConfig = (status: ProjectStatus) => {
  return PROJECT_STATUSES[status];
};

// Get status label
export const getProjectStatusLabel = (status: ProjectStatus): string => {
  return PROJECT_STATUSES[status].label;
};

// Get status color
export const getProjectStatusColor = (status: ProjectStatus): string => {
  return PROJECT_STATUSES[status].color;
};

// Get status icon
export const getProjectStatusIcon = (status: ProjectStatus) => {
  return PROJECT_STATUSES[status].icon;
};

// Get status description
export const getProjectStatusDescription = (status: ProjectStatus): string => {
  return PROJECT_STATUSES[status].description;
};

// Validate status
export const isValidProjectStatus = (status: string): status is ProjectStatus => {
  return Object.keys(PROJECT_STATUSES).includes(status);
};

// Get all status options for dropdowns
export const getProjectStatusOptions = () => {
  return Object.entries(PROJECT_STATUSES).map(([value, config]) => ({
    value: value as ProjectStatus,
    label: config.label,
    color: config.color,
    icon: config.icon
  }));
};

// Default status
export const DEFAULT_PROJECT_STATUS: ProjectStatus = 'active'; 