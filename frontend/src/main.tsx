import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SettingsProvider } from "@/context/SettingsContext";
import { HolidayProvider } from "@/context/HolidayContext";

console.log('main.tsx loading...');

const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log('React root created');
  
  root.render(
    <SettingsProvider>
      <HolidayProvider>
        <App />
      </HolidayProvider>
    </SettingsProvider>
  );
  console.log('React app rendered');
} else {
  console.error('Root element not found!');
}
