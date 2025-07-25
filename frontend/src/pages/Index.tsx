import { Header } from "@/components/Header";
import { TeamOverviewCard } from "@/components/TeamOverviewCard";
import { EmployeeCard } from "@/components/EmployeeCard";
import { ProjectAllocationChart } from "@/components/ProjectAllocationChart";
import { TeamManagement } from "@/components/TeamManagement";
import { TimeOffManagement } from "@/components/TimeOffManagement";
import { CalendarView } from "@/components/CalendarView";
import { Settings } from "@/components/Settings";
import { Projects } from "@/components/Projects";
import { employees } from "@/lib/employee-data";
import { useState } from "react";

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'team':
        return <TeamManagement />;
      case 'projects':
        return <Projects />;
      case 'timeoff':
        return <TimeOffManagement />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="space-y-8">
            {/* Page Title */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Resource Dashboard</h2>
              <p className="text-muted-foreground">
                Monitor team allocation, capacity, and project distribution across Canada and Brazil teams.
              </p>
            </div>

            {/* Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TeamOverviewCard />
              <ProjectAllocationChart />
            </div>

            {/* Employee Allocation Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Team Member Allocation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {employees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="container mx-auto px-6 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Index;
