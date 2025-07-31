import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Settings, Home, Folder, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'projects', name: 'Projects', icon: Folder },
  { id: 'timeoff', name: 'Time Off', icon: Clock },
  { id: 'planner', name: 'Planner', icon: Calendar },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export const Header = ({ currentView, onViewChange }: HeaderProps) => {
  const currentMonth = new Date().toLocaleDateString('en-GB', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">ResourceFlow</h1>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex items-center space-x-2",
                    currentView === item.id && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </nav>
          
          <Badge variant="outline" className="hidden sm:flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{currentMonth}</span>
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <select
              value={currentView}
              onChange={(e) => onViewChange(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-1 text-sm"
            >
              {navigation.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};