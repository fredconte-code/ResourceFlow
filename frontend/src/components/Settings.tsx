import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Download, Upload, Trash2, AlertTriangle, Database, AlertCircle, Wifi, WifiOff, Server, CircleCheck, CircleX, CircleAlert, Code } from "lucide-react";
import * as XLSX from 'xlsx';
import { employees as allEmployees, getCurrentEmployeesSync } from "@/lib/employee-data";
import { checkDataConsistency } from "@/lib/employee-data";
import { getProjectsSync } from "@/lib/project-data";
import { settingsApi, dataApi, Settings as ApiSettings, testApiConnection, ExportData, holidaysApi, vacationsApi, projectAllocationsApi } from "@/lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const Settings = () => {
  const { toast } = useToast();
  const { buffer, setBuffer, canadaHours, setCanadaHours, brazilHours, setBrazilHours } = useSettings();
  
  // Local state for form fields - sync with context values
  const [localBuffer, setLocalBuffer] = useState(buffer);
  const [localCanadaHours, setLocalCanadaHours] = useState(canadaHours);
  const [localBrazilHours, setLocalBrazilHours] = useState(brazilHours);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  


  // Server status state
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check server status
  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const isOnline = await testApiConnection();
      setServerStatus(isOnline ? 'online' : 'offline');
      setLastChecked(new Date());
    } catch (error) {
      setServerStatus('offline');
      setLastChecked(new Date());
    }
  };

  // Check server status on component mount and every 30 seconds
  useEffect(() => {
    checkServerStatus();
    
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Load settings from API
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getAll();
      
      // Update context with API data
      setBuffer(Number(data.buffer));
      setCanadaHours(Number(data.canadaHours));
      setBrazilHours(Number(data.brazilHours));
      
      // Update local state
      setLocalBuffer(Number(data.buffer));
      setLocalCanadaHours(Number(data.canadaHours));
      setLocalBrazilHours(Number(data.brazilHours));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync local state with context values when they change
  useEffect(() => {
    setLocalBuffer(buffer);
  }, [buffer]);

  useEffect(() => {
    setLocalCanadaHours(canadaHours);
  }, [canadaHours]);

  useEffect(() => {
    setLocalBrazilHours(brazilHours);
  }, [brazilHours]);



  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showClearDataWarning, setShowClearDataWarning] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Add a small delay to make the animation visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await settingsApi.update({
        buffer: localBuffer,
        canadaHours: localCanadaHours,
        brazilHours: localBrazilHours
      });
      
      // Update context
      setBuffer(localBuffer);
      setCanadaHours(localCanadaHours);
      setBrazilHours(localBrazilHours);
      
      // Dispatch custom event to notify other components about settings change
      window.dispatchEvent(new CustomEvent('settingsUpdate'));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await dataApi.export();
      
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to sheets
      if (data.teamMembers && data.teamMembers.length > 0) {
        const teamMembersSheet = XLSX.utils.json_to_sheet(data.teamMembers);
        XLSX.utils.book_append_sheet(workbook, teamMembersSheet, 'Team Members');
      }
      
      if (data.projects && data.projects.length > 0) {
        const projectsSheet = XLSX.utils.json_to_sheet(data.projects);
        XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');
      }
      
      if (data.holidays && data.holidays.length > 0) {
        const holidaysSheet = XLSX.utils.json_to_sheet(data.holidays);
        XLSX.utils.book_append_sheet(workbook, holidaysSheet, 'Holidays');
      }
      
      if (data.vacations && data.vacations.length > 0) {
        const vacationsSheet = XLSX.utils.json_to_sheet(data.vacations);
        XLSX.utils.book_append_sheet(workbook, vacationsSheet, 'Time Off');
      }
      
      if (data.projectAllocations && data.projectAllocations.length > 0) {
        const allocationsSheet = XLSX.utils.json_to_sheet(data.projectAllocations);
        XLSX.utils.book_append_sheet(workbook, allocationsSheet, 'Project Allocations');
      }
      
      if (data.settings) {
        const settingsArray = Object.entries(data.settings).map(([key, value]) => ({ key, value }));
        const settingsSheet = XLSX.utils.json_to_sheet(settingsArray);
        XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');
      }

      // Add Dashboard Statistics Sheet
      const dashboardStats = await generateDashboardStats();
      if (dashboardStats) {
        const statsSheet = XLSX.utils.json_to_sheet(dashboardStats);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Dashboard Statistics');
      }

      // Add Team Allocation Breakdown Sheet
      const teamAllocationData = await generateTeamAllocationData();
      if (teamAllocationData && teamAllocationData.length > 0) {
        const allocationSheet = XLSX.utils.json_to_sheet(teamAllocationData);
        XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Team Allocation Breakdown');
      }

      // Add Project Metrics Sheet
      const projectMetrics = await generateProjectMetrics();
      if (projectMetrics && projectMetrics.length > 0) {
        const metricsSheet = XLSX.utils.json_to_sheet(projectMetrics);
        XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Project Metrics');
      }

      // Add Resource Utilization Sheet
      const resourceUtilization = await generateResourceUtilization();
      if (resourceUtilization && resourceUtilization.length > 0) {
        const utilizationSheet = XLSX.utils.json_to_sheet(resourceUtilization);
        XLSX.utils.book_append_sheet(workbook, utilizationSheet, 'Resource Utilization');
      }

      // Add Monthly Summary Sheet
      const monthlySummary = await generateMonthlySummary();
      if (monthlySummary) {
        const summarySheet = XLSX.utils.json_to_sheet(monthlySummary);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Monthly Summary');
      }
      
      // Download file
      const fileName = `resource-scheduler-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Export Successful",
        description: `Complete data exported to ${fileName}`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export data.",
        variant: "destructive"
      });
    }
  };

  // Helper function to generate dashboard statistics
  const generateDashboardStats = async () => {
    try {
      const [employees, projects, holidays, vacations, allocations] = await Promise.all([
        getCurrentEmployeesSync(),
        getProjectsSync(),
        holidaysApi.getAll(),
        vacationsApi.getAll(),
        projectAllocationsApi.getAll()
      ]);

      const canadaEmployees = employees.filter(emp => emp.country === 'Canada').length;
      const brazilEmployees = employees.filter(emp => emp.country === 'Brazil').length;
      
      const ongoingProjects = projects.length; // All projects are considered ongoing since status is not available
      const completedProjects = 0; // No completed projects since status is not available

      const currentDate = new Date();
      const upcomingVacations = vacations.filter(vacation => 
        new Date(vacation.start_date) > currentDate
      ).length;

      return [
        { metric: 'Total Employees', value: employees.length },
        { metric: 'Canada Employees', value: canadaEmployees },
        { metric: 'Brazil Employees', value: brazilEmployees },
        { metric: 'Total Projects', value: projects.length },
        { metric: 'Ongoing Projects', value: ongoingProjects },
        { metric: 'Completed Projects', value: completedProjects },
        { metric: 'Active Allocations', value: allocations.length },
        { metric: 'Total Holidays', value: holidays.length },
        { metric: 'Total Time Off', value: vacations.length },
        { metric: 'Upcoming Time Off', value: upcomingVacations },
        { metric: 'Export Date', value: new Date().toISOString() }
      ];
    } catch (error) {
      console.error('Error generating dashboard stats:', error);
      return null;
    }
  };

  // Helper function to generate team allocation breakdown
  const generateTeamAllocationData = async () => {
    try {
      const [employees, allocations, holidays, vacations] = await Promise.all([
        getCurrentEmployeesSync(),
        projectAllocationsApi.getAll(),
        holidaysApi.getAll(),
        vacationsApi.getAll()
      ]);

      const currentDate = new Date();
      const { buffer } = useSettings();

      return employees.map(employee => {
        // Calculate allocation data for current month
        const employeeAllocations = allocations.filter(a => a.employeeId === employee.id.toString());
        const allocatedHours = employeeAllocations.reduce((sum, a) => {
          const start = new Date(a.startDate);
          const end = new Date(a.endDate);
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          if (start.getMonth() === currentMonth && start.getFullYear() === currentYear) {
            return sum + (a.hoursPerDay || 8);
          }
          return sum;
        }, 0);

        // Calculate available hours
        const weeklyHours = employee.country === 'Canada' ? canadaHours : brazilHours;
        const monthlyHours = weeklyHours * 4; // 4 weeks
        const bufferHours = (monthlyHours * buffer) / 100;
        const availableHours = monthlyHours - bufferHours;

        // Calculate days off
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        let totalDaysOff = 0;
        
        // Count holidays
        holidays.forEach(holiday => {
          const holidayDate = new Date(holiday.date);
          if (holidayDate >= monthStart && holidayDate <= monthEnd) {
            if (holiday.country === 'Both' || holiday.country === employee.country) {
              if (holidayDate.getDay() !== 0 && holidayDate.getDay() !== 6) { // Not weekend
                totalDaysOff += 1;
              }
            }
          }
        });

        // Count vacations
        vacations.forEach(vacation => {
          if (vacation.employee_id === employee.id.toString()) {
            const vacationStart = new Date(vacation.start_date);
            const vacationEnd = new Date(vacation.end_date);
            
            if (vacationEnd >= monthStart && vacationStart <= monthEnd) {
              const effectiveStart = vacationStart < monthStart ? monthStart : vacationStart;
              const effectiveEnd = vacationEnd > monthEnd ? monthEnd : vacationEnd;
              
              let workingDays = 0;
              let currentDate = new Date(effectiveStart);
              while (currentDate <= effectiveEnd) {
                if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Not weekend
                  workingDays += 1;
                }
                currentDate.setDate(currentDate.getDate() + 1);
              }
              
              totalDaysOff += workingDays;
            }
          }
        });

        const allocationPercentage = availableHours > 0 ? Math.round((allocatedHours / availableHours) * 100) : 0;

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          role: employee.role,
          country: employee.country,
          allocatedHours: allocatedHours,
          availableHours: Math.round(availableHours * 10) / 10,
          allocationPercentage: allocationPercentage,
          totalDaysOff: totalDaysOff,
          weeklyHours: weeklyHours,
          monthlyHours: monthlyHours,
          bufferHours: Math.round(bufferHours * 10) / 10,
          activeAllocations: employeeAllocations.length
        };
      });
    } catch (error) {
      console.error('Error generating team allocation data:', error);
      return null;
    }
  };

  // Helper function to generate project metrics
  const generateProjectMetrics = async () => {
    try {
      const [projects, allocations] = await Promise.all([
        getProjectsSync(),
        projectAllocationsApi.getAll()
      ]);

      return projects.map(project => {
        const projectAllocations = allocations.filter(a => a.projectId === project.id.toString());
        const totalAllocatedHours = projectAllocations.reduce((sum, a) => {
          const start = new Date(a.startDate);
          const end = new Date(a.endDate);
          const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + (daysDiff * (a.hoursPerDay || 8));
        }, 0);

        const uniqueEmployees = new Set(projectAllocations.map(a => a.employeeId)).size;
        const projectDuration = project.startDate && project.endDate 
          ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          status: 'Active', // Default status since it's not available in the interface
          startDate: project.startDate,
          endDate: project.endDate,
          duration: projectDuration,
          totalAllocatedHours: totalAllocatedHours,
          uniqueEmployees: uniqueEmployees,
          color: project.color,
          averageHoursPerDay: projectDuration > 0 ? Math.round((totalAllocatedHours / projectDuration) * 10) / 10 : 0
        };
      });
    } catch (error) {
      console.error('Error generating project metrics:', error);
      return null;
    }
  };

  // Helper function to generate resource utilization
  const generateResourceUtilization = async () => {
    try {
      const [employees, allocations] = await Promise.all([
        getCurrentEmployeesSync(),
        projectAllocationsApi.getAll()
      ]);

      const currentDate = new Date();
      const { buffer } = useSettings();

      return employees.map(employee => {
        const employeeAllocations = allocations.filter(a => a.employeeId === employee.id.toString());
        
        // Calculate current month utilization
        const currentMonthAllocations = employeeAllocations.filter(a => {
          const start = new Date(a.startDate);
          const end = new Date(a.endDate);
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          return (start.getMonth() === currentMonth && start.getFullYear() === currentYear) ||
                 (end.getMonth() === currentMonth && end.getFullYear() === currentYear) ||
                 (start <= new Date(currentYear, currentMonth, 1) && end >= new Date(currentYear, currentMonth + 1, 0));
        });

        const allocatedHours = currentMonthAllocations.reduce((sum, a) => {
          const start = new Date(a.startDate);
          const end = new Date(a.endDate);
          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const effectiveStart = start < monthStart ? monthStart : start;
          const effectiveEnd = end > monthEnd ? monthEnd : end;
          
          const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + (daysDiff * (a.hoursPerDay || 8));
        }, 0);

        const weeklyHours = employee.country === 'Canada' ? canadaHours : brazilHours;
        const monthlyHours = weeklyHours * 4;
        const bufferHours = (monthlyHours * buffer) / 100;
        const availableHours = monthlyHours - bufferHours;
        const utilizationPercentage = availableHours > 0 ? Math.round((allocatedHours / availableHours) * 100) : 0;

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          country: employee.country,
          allocatedHours: Math.round(allocatedHours * 10) / 10,
          availableHours: Math.round(availableHours * 10) / 10,
          utilizationPercentage: utilizationPercentage,
          bufferHours: Math.round(bufferHours * 10) / 10,
          totalMonthlyHours: monthlyHours,
          weeklyHours: weeklyHours,
          activeProjects: currentMonthAllocations.length,
          overallocation: utilizationPercentage > 100
        };
      });
    } catch (error) {
      console.error('Error generating resource utilization:', error);
      return null;
    }
  };

  // Helper function to generate monthly summary
  const generateMonthlySummary = async () => {
    try {
      const [employees, projects, allocations, holidays, vacations] = await Promise.all([
        getCurrentEmployeesSync(),
        getProjectsSync(),
        projectAllocationsApi.getAll(),
        holidaysApi.getAll(),
        vacationsApi.getAll()
      ]);

      const currentDate = new Date();
      const { buffer } = useSettings();

      // Calculate totals
      const totalEmployees = employees.length;
      const canadaEmployees = employees.filter(emp => emp.country === 'Canada').length;
      const brazilEmployees = employees.filter(emp => emp.country === 'Brazil').length;
      
      const totalProjects = projects.length;
      const activeProjects = projects.length; // All projects are considered active since status is not available
      const completedProjects = 0; // No completed projects since status is not available

      const totalAllocations = allocations.length;
      const activeAllocations = allocations.filter(a => {
        const end = new Date(a.endDate);
        return end >= currentDate;
      }).length;

      const totalHolidays = holidays.length;
      const totalVacations = vacations.length;

      // Calculate capacity
      const canadaCapacity = canadaEmployees * canadaHours * 4; // 4 weeks
      const brazilCapacity = brazilEmployees * brazilHours * 4;
      const totalCapacity = canadaCapacity + brazilCapacity;
      const bufferCapacity = (totalCapacity * buffer) / 100;
      const availableCapacity = totalCapacity - bufferCapacity;

      return [
        { category: 'Team Overview', metric: 'Total Employees', value: totalEmployees },
        { category: 'Team Overview', metric: 'Canada Employees', value: canadaEmployees },
        { category: 'Team Overview', metric: 'Brazil Employees', value: brazilEmployees },
        { category: 'Projects', metric: 'Total Projects', value: totalProjects },
        { category: 'Projects', metric: 'Active Projects', value: activeProjects },
        { category: 'Projects', metric: 'Completed Projects', value: completedProjects },
        { category: 'Allocations', metric: 'Total Allocations', value: totalAllocations },
        { category: 'Allocations', metric: 'Active Allocations', value: activeAllocations },
        { category: 'Time Off', metric: 'Total Holidays', value: totalHolidays },
        { category: 'Time Off', metric: 'Total Time Off', value: totalVacations },
        { category: 'Capacity', metric: 'Total Capacity (hours)', value: Math.round(totalCapacity) },
        { category: 'Capacity', metric: 'Available Capacity (hours)', value: Math.round(availableCapacity) },
        { category: 'Capacity', metric: 'Buffer Capacity (hours)', value: Math.round(bufferCapacity) },
        { category: 'Settings', metric: 'Buffer Percentage', value: `${buffer}%` },
        { category: 'Settings', metric: 'Canada Weekly Hours', value: canadaHours },
        { category: 'Settings', metric: 'Brazil Weekly Hours', value: brazilHours },
        { category: 'Export Info', metric: 'Export Date', value: new Date().toISOString() },
        { category: 'Export Info', metric: 'Export Month', value: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
      ];
    } catch (error) {
      console.error('Error generating monthly summary:', error);
      return null;
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setShowImportDialog(true);
  };

  const handleImportConfirm = async () => {
    if (!selectedFile) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target?.result as string, { type: 'binary' });
          const importData: ExportData = {
            teamMembers: [],
            projects: [],
            holidays: [],
            vacations: [],
            projectAllocations: [],
            settings: { buffer: 10, canadaHours: 37.5, brazilHours: 44 }
          };
          
          // Process each sheet
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length > 0) {
              if (sheetName === 'Settings') {
                // Convert settings array back to object
                const settingsObj: { buffer: number; canadaHours: number; brazilHours: number } = {
                  buffer: 10,
                  canadaHours: 37.5,
                  brazilHours: 44
                };
                jsonData.forEach((item: { key: string; value: unknown }) => {
                  if (item.key === 'buffer' && typeof item.value === 'number') {
                    settingsObj.buffer = item.value;
                  } else if (item.key === 'canadaHours' && typeof item.value === 'number') {
                    settingsObj.canadaHours = item.value;
                  } else if (item.key === 'brazilHours' && typeof item.value === 'number') {
                    settingsObj.brazilHours = item.value;
                  }
                });
                importData.settings = settingsObj;
              } else {
                importData[sheetName.toLowerCase().replace(/\s+/g, '')] = jsonData;
              }
            }
          });
          
          // Import data to API
          await dataApi.import(importData);
          
          // Reload settings
          await loadSettings();
          
          toast({
            title: "Import Successful",
            description: "Data imported successfully.",
          });
          
          // Dispatch events to refresh other components
          window.dispatchEvent(new CustomEvent('teamUpdate'));
          window.dispatchEvent(new CustomEvent('projectsUpdate'));
          window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
          
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Error processing file. Please check the file format.",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsBinaryString(selectedFile);
      setShowImportDialog(false);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import data.",
        variant: "destructive"
      });
    }
  };

  const handleImportCancel = () => {
    setShowImportDialog(false);
    setSelectedFile(null);
  };

  const handleClearData = async () => {
    try {
      // Clear all data by importing empty data
      await dataApi.import({
        teamMembers: [],
        projects: [],
        holidays: [],
        vacations: [],
        projectAllocations: [],
        settings: { buffer: 10, canadaHours: 37.5, brazilHours: 44 }
      });
      
      // Reload settings
      await loadSettings();
      
      toast({
        title: "Data Cleared",
        description: "All data has been cleared successfully.",
      });
      
      // Dispatch events to refresh other components
      window.dispatchEvent(new CustomEvent('teamUpdate'));
      window.dispatchEvent(new CustomEvent('projectsUpdate'));
      window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
      
      setShowClearDataDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadSettings}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Configure your resource scheduler settings
        </p>
      </div>

      {/* Settings Cards Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Working Hours Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="buffer">Buffer Time (%)</Label>
                <Input
                  id="buffer"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={localBuffer || ''}
                  onChange={(e) => setLocalBuffer(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  Percentage of time reserved for unexpected tasks. Average usage is 15-25%.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="canadaHours">Canada Max. Working Hours / Week</Label>
                <Input
                  id="canadaHours"
                  type="number"
                  step="0.5"
                  value={localCanadaHours || ''}
                  onChange={(e) => setLocalCanadaHours(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="37.5"
                />
                <p className="text-sm text-muted-foreground">
                  Standard working hours per week for Canadian employees (default: 37.5h)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brazilHours">Brazil Max. Working Hours / Week</Label>
                <Input
                  id="brazilHours"
                  type="number"
                  step="0.5"
                  value={localBrazilHours || ''}
                  onChange={(e) => setLocalBrazilHours(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="44"
                />
                <p className="text-sm text-muted-foreground">
                  Standard working hours per week for Brazilian employees (default: 44h)
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export data to Excel
              </Button>
              
              <Button variant="outline" disabled>
                <Upload className="mr-2 h-4 w-4" />
                Import data from CSV
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowClearDataWarning(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Export data to Excel:</strong> Download comprehensive data including team members, projects, time off, allocations, dashboard statistics, team allocation breakdowns, project metrics, resource utilization, and monthly summaries as an Excel file for backup or analysis purposes.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Import data from CSV:</strong> Coming soon! This feature will allow you to restore your data from a previously exported CSV file.
            </p>
            {showClearDataWarning && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Clear All Data:</strong> ⚠️ <strong>DESTRUCTIVE ACTION!</strong> This will permanently delete ALL your data including team members, projects, time off, allocations, and settings. This action cannot be undone. Make sure to export your data first as a backup.
                </p>
                <div className="flex gap-2 ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowClearDataWarning(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setShowClearDataWarning(false);
                      setShowClearDataDialog(true);
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Data is now stored on the server. Export your data regularly as a backup.
            </span>
          </div>

          {/* Server Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium">Server Status</span>
              </div>
                              <div className="flex items-center gap-2">
                  {serverStatus === 'online' ? (
                    <CircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : serverStatus === 'offline' ? (
                    <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CircleAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                  )}
                  <span className={`text-sm font-medium ${
                    serverStatus === 'online' 
                      ? 'text-green-700 dark:text-green-400' 
                      : serverStatus === 'offline' 
                      ? 'text-red-700 dark:text-red-400' 
                      : 'text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                  </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
              {lastChecked && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkServerStatus}
                disabled={serverStatus === 'checking'}
              >
                {serverStatus === 'checking' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Under the Hood Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Under the Hood</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="variables">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span>Application Variables</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-gray-700 pb-2">
                      <h3 className="text-blue-400 font-semibold"># Resource Scheduler - Application Variables</h3>
                      <p className="text-gray-400 text-xs mt-1">Documentation of all application variables and their scope</p>
                    </div>

                                         {/* Global Variables Section */}
                     <div>
                       <h4 className="text-green-400 font-semibold mb-3">## 🌍 Global Variables</h4>
                       <p className="text-gray-400 text-xs mb-3">Variables that affect the entire application</p>
                       
                       <div className="space-y-2">
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-green-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">buffer</span> = <span className="text-orange-400">number</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-green-600">Global</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Buffer time percentage (0-100%) for unexpected tasks</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-green-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">canadaHours</span> = <span className="text-orange-400">number</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-green-600">Global</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Maximum working hours per week for Canadian employees (default: 37.5)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-green-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">brazilHours</span> = <span className="text-orange-400">number</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-green-600">Global</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Maximum working hours per week for Brazilian employees (default: 44)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-green-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">theme</span> = <span className="text-orange-400">'light' | 'dark' | 'system'</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-green-600">Global</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Application theme setting</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-green-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">holidays</span> = <span className="text-orange-400">ApiHoliday[]</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-green-600">Global</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Global holiday data from HolidayContext (id, name, date, country)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-green-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">refreshHolidays</span> = <span className="text-orange-400">() =&gt; Promise&lt;void&gt;</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-green-600">Global</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Function to refresh global holiday data from API</p>
                         </div>
                       </div>
                     </div>
                     {/* Inserted: Monthly Hours Calculation Explanation */}
                     <div className="bg-gray-800 rounded p-3 border-l-4 border-yellow-500 my-4">
                       <h4 className="text-yellow-300 font-semibold mb-2">How Total Monthly Hours Are Calculated</h4>
                                               <p className="text-gray-200 text-xs mb-2">
                          <strong>Total monthly hours</strong> for each employee are calculated as:
                        </p>
                        <ul className="list-disc pl-6 text-gray-200 text-xs mb-2">
                          <li><strong>Daily Hours</strong>: Weekly hours ÷ 5 (Canada: 7.5h/day, Brazil: 8.8h/day)</li>
                          <li><strong>Total Days in Month</strong>: Actual calendar days in the month (28-31 days)</li>
                          <li><strong>Formula</strong>: <code>monthlyHours = totalDaysInMonth × dailyHours</code></li>
                        </ul>
                        <p className="text-gray-200 text-xs mb-2">
                          For example, a Canadian employee in a 30-day month: <code>30 × 7.5 = 225 hours/month</code>.<br/>
                          This represents total calendar hours (including weekends), which are then deducted separately.
                        </p>
                        <p className="text-gray-400 text-xs">
                          This approach provides accurate monthly capacity by accounting for the actual number of days in each month.
                        </p>
                     </div>

                                         {/* Local Variables Section */}
                     <div>
                       <h4 className="text-purple-400 font-semibold mb-3">## 🏠 Local Variables</h4>
                       <p className="text-gray-400 text-xs mb-3">Component-specific state variables</p>
                       
                       <div className="space-y-2">
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">currentDate</span> = <span className="text-orange-400">Date</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Currently selected date in calendar view</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">heatmapMode</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Heatmap visualization mode state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">dragItem</span> = <span className="text-orange-400">Project | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Currently dragged project item</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">resizingAllocation</span> = <span className="text-orange-400">Allocation | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Allocation being resized in calendar</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">editDialogOpen</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Edit allocation dialog visibility state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">serverStatus</span> = <span className="text-orange-400">'online' | 'offline' | 'checking'</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Backend server connection status</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">loading</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Component loading state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">error</span> = <span className="text-orange-400">string | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Error state for API operations</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">saving</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Save operation in progress state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">showImportDialog</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Import dialog visibility state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">showClearDataDialog</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Clear data confirmation dialog state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">selectedFile</span> = <span className="text-orange-400">File | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Selected file for import operation</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">lastChecked</span> = <span className="text-orange-400">Date | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Last server status check timestamp</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">dragOverCell</span> = <span className="text-orange-400">{'{employeeId: string, date: Date}'} | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Calendar cell being dragged over</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">draggingAllocation</span> = <span className="text-orange-400">Allocation | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Allocation being dragged in calendar</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">editingAllocation</span> = <span className="text-orange-400">ProjectAllocation | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Allocation being edited in dialog</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">editStartDate</span> = <span className="text-orange-400">Date | undefined</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Start date in edit allocation dialog</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">editEndDate</span> = <span className="text-orange-400">Date | undefined</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// End date in edit allocation dialog</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">startDatePickerOpen</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Start date picker visibility state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">endDatePickerOpen</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// End date picker visibility state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">deleteDialogOpen</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Delete confirmation dialog state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">deletingAllocation</span> = <span className="text-orange-400">ProjectAllocation | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Allocation being deleted</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">overallocationDialogOpen</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Overallocation warning dialog state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">overallocationData</span> = <span className="text-orange-400">OverallocationData | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Overallocation warning data</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">dragStartPosition</span> = <span className="text-orange-400">{'{x: number, y: number}'} | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Mouse position when drag started</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">doubleClickTimeout</span> = <span className="text-orange-400">NodeJS.Timeout | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Timeout for double-click detection</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">isDoubleClicking</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Double-click detection state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">dragOverProjectsBox</span> = <span className="text-orange-400">boolean</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Projects box drag over state</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-purple-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">draggingAllocationFromTimeline</span> = <span className="text-orange-400">ProjectAllocation | null</span>
                               <Badge variant="outline" className="ml-2 text-xs border-purple-500 text-purple-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Allocation being dragged from timeline</p>
                         </div>
                       </div>
                     </div>

                                         {/* Context Variables Section */}
                     <div>
                       <h4 className="text-blue-400 font-semibold mb-3">## 🔄 Context Variables</h4>
                       <p className="text-gray-400 text-xs mb-3">React Context providers and state management</p>
                       
                       <div className="space-y-2">
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-blue-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">SettingsContext</span> = <span className="text-orange-400">createContext</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-blue-600">Context</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Global settings context (buffer, working hours, theme)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-blue-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">HolidayContext</span> = <span className="text-orange-400">createContext</span>
                               <Badge variant="secondary" className="ml-2 text-xs bg-blue-600">Context</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Global holiday context (holidays array, refreshHolidays function)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-blue-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">useSettings</span> = <span className="text-orange-400">() =&gt; SettingsContextType</span>
                               <Badge variant="outline" className="ml-2 text-xs border-blue-500 text-blue-400">Hook</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Hook to access settings context</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-blue-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">useHolidays</span> = <span className="text-orange-400">() =&gt; HolidayContextType</span>
                               <Badge variant="outline" className="ml-2 text-xs border-blue-500 text-blue-400">Hook</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Hook to access holiday context</p>
                         </div>
                       </div>
                     </div>

                                         {/* Data Variables Section */}
                     <div>
                       <h4 className="text-cyan-400 font-semibold mb-3">## 📊 Data Variables</h4>
                       <p className="text-gray-400 text-xs mb-3">Application data arrays and objects</p>
                       
                       <div className="space-y-2">
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">employees</span> = <span className="text-orange-400">Employee[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of team member data</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">projects</span> = <span className="text-orange-400">Project[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of project data</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">allocations</span> = <span className="text-orange-400">ProjectAllocation[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of project allocation data</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">holidays</span> = <span className="text-orange-400">HolidayItem[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of holiday data (TimeOffManagement component)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">vacations</span> = <span className="text-orange-400">Vacation[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of vacation data</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">members</span> = <span className="text-orange-400">TeamMember[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of team member data (TeamManagement)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">projectAllocations</span> = <span className="text-orange-400">ProjectAllocation[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of project allocations (EmployeeCard)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">employeeProjectNames</span> = <span className="text-orange-400">string[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of project names for employee</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">stats</span> = <span className="text-orange-400">TeamStats</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Team statistics object</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">weeklyData</span> = <span className="text-orange-400">WeeklyData[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Weekly capacity data for charts</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">monthlyTrends</span> = <span className="text-orange-400">MonthlyTrend[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Monthly trend data for charts</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">performanceMetrics</span> = <span className="text-orange-400">PerformanceMetric[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Team performance metrics array</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">globalHolidays</span> = <span className="text-orange-400">ApiHoliday[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Global holidays from HolidayContext (TimeOffManagement)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">vacations</span> = <span className="text-orange-400">VacationItem[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of vacation data (TimeOffManagement component)</p>
                         </div>
                         
                         <div className="bg-gray-800 rounded p-2 border-l-4 border-cyan-500">
                           <div className="flex items-start justify-between">
                             <div>
                               <span className="text-yellow-400">const</span> <span className="text-blue-400">employees</span> = <span className="text-orange-400">Employee[]</span>
                               <Badge variant="outline" className="ml-2 text-xs border-cyan-500 text-cyan-400">Local</Badge>
                             </div>
                           </div>
                           <p className="text-gray-300 text-xs mt-1 ml-4">// Array of employee data (TimeOffManagement component)</p>
                         </div>
                       </div>
                     </div>

                    {/* Footer */}
                    <div className="border-t border-gray-700 pt-2 mt-6">
                      <p className="text-gray-400 text-xs">Last updated: {new Date().toLocaleDateString()} - Holiday calculation fixes & global state management</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to import data from "{selectedFile?.name}"? This will replace your current data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleImportCancel}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all data? This action cannot be undone and will remove all team members, projects, holidays, vacations, and allocations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 