import { useState } from "react";
import { Header } from "@/components/Header";
import { TeamManagement } from "@/components/TeamManagement";
import { Projects } from "@/components/Projects";
import { Settings } from "@/components/Settings";
import { CalendarView } from "@/components/CalendarView";

const Index = () => {
  console.log('Index component rendering...');
  
  const [currentView, setCurrentView] = useState('dashboard');
  
  const renderCurrentView = () => {
    switch (currentView) {
      case 'team':
        return <TeamManagement />;
      case 'projects':
        return <Projects />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="space-y-6">
            <h1>Dashboard</h1>
            <p>Welcome to Resource Scheduler!</p>
            <p>Navigation is working - try clicking the tabs above.</p>
          </div>
        );
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
