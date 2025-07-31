import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TeamManagement } from "@/components/TeamManagement";
import { Projects } from "@/components/Projects";
import { TimeOffManagement } from "@/components/TimeOffManagement";
import { Settings } from "@/components/Settings";
import { PlannerView } from "@/components/PlannerView";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {

  
  // Initialize currentView from localStorage or default to 'dashboard'
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('currentView');
    return savedView || 'dashboard';
  });
  
  // Save currentView to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);
  
  const renderCurrentView = () => {
    switch (currentView) {
      case 'team':
        return <TeamManagement />;
      case 'projects':
        return <Projects />;
      case 'timeoff':
        return <TimeOffManagement />;
      case 'planner':
        return <PlannerView />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="container mx-auto px-4 py-6">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Index;
