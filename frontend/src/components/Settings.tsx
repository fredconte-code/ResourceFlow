import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Download, Upload, Trash2, AlertTriangle, Database, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { employees as allEmployees } from "@/lib/employee-data";
import { checkDataConsistency } from "@/lib/employee-data";
import { settingsApi, dataApi, Settings as ApiSettings } from "@/lib/api";

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
        XLSX.utils.book_append_sheet(workbook, vacationsSheet, 'Vacations');
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
      
      // Download file
      const fileName = `resource-scheduler-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Export Successful",
        description: `Data exported to ${fileName}`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export data.",
        variant: "destructive"
      });
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
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const importData: any = {};
          
          // Process each sheet
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length > 0) {
              if (sheetName === 'Settings') {
                // Convert settings array back to object
                const settingsObj: any = {};
                jsonData.forEach((item: any) => {
                  settingsObj[item.key] = item.value;
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your resource scheduler settings
        </p>
      </div>

      {/* Settings Cards Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Hours Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buffer">Buffer Time (%)</Label>
                <Input
                  id="buffer"
                  type="number"
                  value={localBuffer}
                  onChange={(e) => setLocalBuffer(Number(e.target.value))}
                  placeholder="10"
                />
                <p className="text-sm text-muted-foreground">
                  Percentage of time reserved for unexpected tasks
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="canadaHours">Canada Weekly Hours</Label>
                <Input
                  id="canadaHours"
                  type="number"
                  step="0.5"
                  value={localCanadaHours}
                  onChange={(e) => setLocalCanadaHours(Number(e.target.value))}
                  placeholder="37.5"
                />
                <p className="text-sm text-muted-foreground">
                  Standard working hours per week for Canadian employees
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brazilHours">Brazil Weekly Hours</Label>
                <Input
                  id="brazilHours"
                  type="number"
                  step="0.5"
                  value={localBrazilHours}
                  onChange={(e) => setLocalBrazilHours(Number(e.target.value))}
                  placeholder="44"
                />
                <p className="text-sm text-muted-foreground">
                  Standard working hours per week for Brazilian employees
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className={saving ? "bg-blue-600 hover:bg-blue-700" : ""}
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
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export data to CSV
            </Button>
            
            <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import data from CSV
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowClearDataDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Export data to CSV:</strong> Download all your data (team members, projects, time off, and allocations) as a CSV file for backup or analysis purposes.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Import data from CSV:</strong> Coming soon! This feature will allow you to restore your data from a previously exported CSV file.
            </p>
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Clear All Data:</strong> ⚠️ <strong>DESTRUCTIVE ACTION!</strong> This will permanently delete ALL your data including team members, projects, time off, allocations, and settings. This action cannot be undone. Make sure to export your data first as a backup.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Data is now stored on the server. Export your data regularly as a backup.
            </span>
          </div>
        </CardContent>
      </Card>
      </div>

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