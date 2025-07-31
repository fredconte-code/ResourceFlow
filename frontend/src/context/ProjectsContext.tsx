import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { projectsApi, Project } from '@/lib/api';

interface ProjectsContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  refreshProjects: () => Promise<void>;
  loading: boolean;
  error: string | null;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: number, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

interface ProjectsProviderProps {
  children: ReactNode;
}

export const ProjectsProvider: React.FC<ProjectsProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProject = useCallback(async (project: Omit<Project, 'id'>) => {
    try {
      const newProject = await projectsApi.create(project);
      setProjects(prev => [...prev, newProject]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add project');
    }
  }, []);

  const updateProject = useCallback(async (id: number, project: Partial<Project>) => {
    try {
      const updatedProject = await projectsApi.update(id, project);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update project');
    }
  }, []);

  const deleteProject = useCallback(async (id: number) => {
    try {
      await projectsApi.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete project');
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const value: ProjectsContextType = {
    projects,
    setProjects,
    refreshProjects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}; 