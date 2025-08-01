import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Download, Trash2, AlertTriangle, Database, AlertCircle, Wifi, WifiOff, Server, CircleCheck, CircleX, CircleAlert, Code } from "lucide-react";
import * as ExcelJS from 'exceljs';
import { settingsApi, dataApi, Settings as ApiSettings, testApiConnection } from "@/lib/api";
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
  const loadSettings = useCallback(async () => {
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
  }, [setBuffer, setCanadaHours, setBrazilHours, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
      const workbook = new ExcelJS.Workbook();
      
      // Helper function to add data to worksheet
      const addDataToWorksheet = (worksheet: ExcelJS.Worksheet, data: any[], sheetName: string) => {
        if (data && data.length > 0) {
          // Add headers
          const headers = Object.keys(data[0]);
          headers.forEach((header, index) => {
            const cell = worksheet.getCell(1, index + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
          });
          
          // Add data rows
          data.forEach((row, rowIndex) => {
            headers.forEach((header, colIndex) => {
              const cell = worksheet.getCell(rowIndex + 2, colIndex + 1);
              cell.value = row[header];
            });
          });
          
          // Auto-fit columns
          headers.forEach((_, index) => {
            worksheet.getColumn(index + 1).width = 15;
          });
        }
      };
      
      // Add Team Members sheet
      if (data.teamMembers && data.teamMembers.length > 0) {
        const teamMembersSheet = workbook.addWorksheet('Team Members');
        addDataToWorksheet(teamMembersSheet, data.teamMembers, 'Team Members');
      }
      
      // Add Projects sheet
      if (data.projects && data.projects.length > 0) {
        const projectsSheet = workbook.addWorksheet('Projects');
        addDataToWorksheet(projectsSheet, data.projects, 'Projects');
      }
      
      // Add Holidays sheet
      if (data.holidays && data.holidays.length > 0) {
        const holidaysSheet = workbook.addWorksheet('Holidays');
        addDataToWorksheet(holidaysSheet, data.holidays, 'Holidays');
      }
      
      // Add Time Off sheet
      if (data.vacations && data.vacations.length > 0) {
        const vacationsSheet = workbook.addWorksheet('Time Off');
        addDataToWorksheet(vacationsSheet, data.vacations, 'Time Off');
      }
      
      // Add Project Allocations sheet
      if (data.projectAllocations && data.projectAllocations.length > 0) {
        const allocationsSheet = workbook.addWorksheet('Project Allocations');
        addDataToWorksheet(allocationsSheet, data.projectAllocations, 'Project Allocations');
      }
      
      // Add Settings sheet
      if (data.settings) {
        const settingsSheet = workbook.addWorksheet('Settings');
        const settingsArray = Object.entries(data.settings).map(([key, value]) => ({ key, value }));
        addDataToWorksheet(settingsSheet, settingsArray, 'Settings');
      }
      
      // Generate and download file
      const fileName = `resourceflow-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Create download link
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Core data exported to ${fileName} (Dashboard data excluded)`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export data.",
        variant: "destructive"
      });
    }
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
          Configure your ResourceFlow settings
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
              <strong>Export data to Excel:</strong> Download core data (team members, projects, allocations, etc.) as an Excel file for backup or analysis. Dashboard statistics are excluded.
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
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
            <Server className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              <strong>Server Status:</strong> {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
            {serverStatus === 'online' ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : serverStatus === 'offline' ? (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            )}
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
            <AccordionItem value="calculations">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span>How Calculations Work</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  {/* Employee Capacity Calculations */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-3">👤 Employee Capacity Calculations</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      How the app calculates each employee's available working hours
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Monthly Hours</span>
                        <span className="text-blue-600 dark:text-blue-400">= Total Days in Month × Daily Hours</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Daily Hours</span>
                        <span className="text-blue-600 dark:text-blue-400">= Weekly Hours ÷ 5 (Canada: 7.5h/day, Brazil: 8.8h/day)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Available Hours</span>
                        <span className="text-blue-600 dark:text-blue-400">= Monthly Hours - Buffer - Holidays - Vacations - Weekends</span>
                      </div>
                    </div>
                  </div>

                  {/* Buffer Time System */}
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 className="text-green-800 dark:text-green-200 font-semibold mb-3">🛡️ Buffer Time System</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      How the buffer percentage reserves time for unexpected tasks
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">Buffer Hours</span>
                        <span className="text-green-600 dark:text-green-400">= (Total Monthly Hours × Buffer %) ÷ 100</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">Purpose</span>
                        <span className="text-green-600 dark:text-green-400">Reserves time for meetings, emergencies, and unplanned work</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">Typical Range</span>
                        <span className="text-green-600 dark:text-green-400">15-25% (configurable in settings above)</span>
                      </div>
                    </div>
                  </div>

                  {/* Holiday and Vacation Deductions */}
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="text-purple-800 dark:text-purple-200 font-semibold mb-3">🏖️ Holiday and Vacation Deductions</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                      How time off affects capacity calculations
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">Holidays</span>
                        <span className="text-purple-600 dark:text-purple-400">Only count if they fall on working days (not weekends)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">Vacations</span>
                        <span className="text-purple-600 dark:text-purple-400">Count only working days within the vacation period</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">Country-Specific</span>
                        <span className="text-purple-600 dark:text-purple-400">Holidays can apply to Canada, Brazil, or both countries</span>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Percentage Calculation */}
                  <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <h4 className="text-orange-800 dark:text-orange-200 font-semibold mb-3">📊 Allocation Percentage Calculation</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                      How the app determines if an employee is overallocated
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">Formula</span>
                        <span className="text-orange-600 dark:text-orange-400">= (Allocated Hours ÷ Available Hours) × 100</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">Available Hours</span>
                        <span className="text-orange-600 dark:text-orange-400">Total capacity minus buffer, holidays, vacations, and weekends</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">Overallocation</span>
                        <span className="text-orange-600 dark:text-orange-400">Percentage can exceed 100% to show overbooking</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Allocation Tracking */}
                  <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                    <h4 className="text-cyan-800 dark:text-cyan-200 font-semibold mb-3">📋 Project Allocation Tracking</h4>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-3">
                      How project hours are calculated and tracked
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">Daily Allocations</span>
                        <span className="text-cyan-600 dark:text-cyan-400">Hours assigned per working day</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">Date Range</span>
                        <span className="text-cyan-600 dark:text-cyan-400">Allocations span from start date to end date</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">Working Days Only</span>
                        <span className="text-cyan-600 dark:text-cyan-400">Excludes weekends and holidays automatically</span>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Statistics */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                    <h4 className="text-indigo-800 dark:text-indigo-200 font-semibold mb-3">📈 Dashboard Statistics</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                      How team-wide metrics are calculated
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">Total Capacity</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Sum of all employees' available hours</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">Utilization Rate</span>
                        <span className="text-indigo-600 dark:text-indigo-400">= (Total Allocated Hours ÷ Total Available Hours) × 100</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded">Overallocation Count</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Number of employees exceeding 100% allocation</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar View Logic */}
                  <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                    <h4 className="text-pink-800 dark:text-pink-200 font-semibold mb-3">📅 Calendar View Logic</h4>
                    <p className="text-sm text-pink-700 dark:text-pink-300 mb-3">
                      How the planner displays allocation information
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-pink-100 dark:bg-pink-900 px-2 py-1 rounded">Cell Colors</span>
                        <span className="text-pink-600 dark:text-pink-400">Based on allocation percentage (green/yellow/red)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-pink-100 dark:bg-pink-900 px-2 py-1 rounded">Weekend Handling</span>
                        <span className="text-pink-600 dark:text-pink-400">Special indicators for weekend allocations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-pink-100 dark:bg-pink-900 px-2 py-1 rounded">Drag & Drop</span>
                        <span className="text-pink-600 dark:text-pink-400">Real-time recalculation when moving allocations</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Persistence */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                    <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-3">💾 Data Persistence</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      How settings and data are stored
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Server Storage</span>
                        <span className="text-gray-600 dark:text-gray-400">All data stored on backend database</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Real-time Sync</span>
                        <span className="text-gray-600 dark:text-gray-400">Changes immediately saved to server</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Export/Import</span>
                        <span className="text-gray-600 dark:text-gray-400">Excel format for backup and analysis</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      These calculations ensure accurate resource planning and capacity management across your team.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>



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