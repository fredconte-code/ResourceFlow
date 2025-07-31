import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SettingsProvider } from "@/context/SettingsContext";
import { HolidayProvider } from "@/context/HolidayContext";
import { TimeOffProvider } from "@/context/TimeOffContext";
import { TeamMembersProvider } from "@/context/TeamMembersContext";
import { ProjectsProvider } from "@/context/ProjectsContext";
import { AllocationsProvider } from "@/context/AllocationsContext";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);

  root.render(
    <SettingsProvider>
      <TeamMembersProvider>
        <ProjectsProvider>
          <AllocationsProvider>
            <HolidayProvider>
              <TimeOffProvider>
                <App />
              </TimeOffProvider>
            </HolidayProvider>
          </AllocationsProvider>
        </ProjectsProvider>
      </TeamMembersProvider>
    </SettingsProvider>
  );
} else {
  // Root element not found - this should not happen in a properly configured app
}
