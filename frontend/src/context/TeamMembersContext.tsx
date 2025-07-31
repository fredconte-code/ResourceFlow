import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { teamMembersApi, TeamMember } from '@/lib/api';

interface TeamMembersContextType {
  members: TeamMember[];
  setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  refreshMembers: () => Promise<void>;
  loading: boolean;
  error: string | null;
  addMember: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  updateMember: (id: number, member: Partial<TeamMember>) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
}

const TeamMembersContext = createContext<TeamMembersContextType | undefined>(undefined);

export const useTeamMembers = () => {
  const context = useContext(TeamMembersContext);
  if (context === undefined) {
    throw new Error('useTeamMembers must be used within a TeamMembersProvider');
  }
  return context;
};

interface TeamMembersProviderProps {
  children: ReactNode;
}

export const TeamMembersProvider: React.FC<TeamMembersProviderProps> = ({ children }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamMembersApi.getAll();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
      console.error('Error loading team members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (member: Omit<TeamMember, 'id'>) => {
    try {
      const newMember = await teamMembersApi.create(member);
      setMembers(prev => [...prev, newMember]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add team member');
    }
  }, []);

  const updateMember = useCallback(async (id: number, member: Partial<TeamMember>) => {
    try {
      const updatedMember = await teamMembersApi.update(id, member);
      setMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update team member');
    }
  }, []);

  const deleteMember = useCallback(async (id: number) => {
    try {
      await teamMembersApi.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete team member');
    }
  }, []);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  const value: TeamMembersContextType = {
    members,
    setMembers,
    refreshMembers,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember
  };

  return (
    <TeamMembersContext.Provider value={value}>
      {children}
    </TeamMembersContext.Provider>
  );
}; 