import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'E-commerce Platform', startDate: '2024-01-01', endDate: '2024-06-30' },
    { id: '2', name: 'Mobile App Redesign', startDate: '2024-02-15', endDate: '2024-08-15' },
    { id: '3', name: 'API Integration', startDate: '2024-03-01', endDate: '2024-09-01' },
    { id: '4', name: 'Security Audit', startDate: '2024-04-01', endDate: '2024-07-31' },
    { id: '5', name: 'Performance Optimization', startDate: '2024-05-10', endDate: '2024-10-10' },
    { id: '6', name: 'Data Migration', startDate: '2024-06-01', endDate: '2024-12-01' },
    { id: '7', name: 'Cloud Infrastructure', startDate: '2024-07-01', endDate: '2025-01-31' },
    { id: '8', name: 'Customer Portal', startDate: '2024-08-15', endDate: '2025-02-28' },
    { id: '9', name: 'Analytics Dashboard', startDate: '2024-09-01', endDate: '2025-03-31' },
    { id: '10', name: 'HR System Upgrade', startDate: '2024-10-01', endDate: '2025-04-30' },
  ]);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    setProjects([
      ...projects,
      { id: Date.now().toString(), name: form.name, startDate: form.startDate, endDate: form.endDate },
    ]);
    setForm({ name: "", startDate: "", endDate: "" });
  };

  // Calculate min/max dates for Gantt scaling
  const allDates = projects.flatMap(p => [p.startDate, p.endDate]).filter(Boolean);
  const minDate = allDates.length ? new Date(Math.min(...allDates.map(d => new Date(d).getTime()))) : null;
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : null;

  // Helper to get percent offset/width for a project
  const getBarStyle = (start: string, end: string) => {
    if (!minDate || !maxDate) return { left: '0%', width: '0%' };
    const total = maxDate.getTime() - minDate.getTime();
    const startPct = ((new Date(start).getTime() - minDate.getTime()) / total) * 100;
    const endPct = ((new Date(end).getTime() - minDate.getTime()) / total) * 100;
    return {
      left: `${startPct}%`,
      width: `${Math.max(endPct - startPct, 2)}%`, // min width for visibility
    };
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">Projects</h2>
        <p className="text-xs text-muted-foreground">Add and manage your projects.</p>
      </div>
      <Card className="text-xs p-1">
        <CardHeader className="p-2">
          <CardTitle className="text-base">Add New Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          <div className="flex flex-col md:flex-row gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Project name" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </div>
            <Button onClick={handleAdd} className="h-9 px-4">Add</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="text-xs p-1">
        <CardHeader className="p-2">
          <CardTitle className="text-base">Project List ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          {projects.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">No projects added yet.</div>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const bar = getBarStyle(project.startDate, project.endDate);
                  return (
                    <tr key={project.id} className="border-b border-border">
                      <td className="p-2 align-top">{project.name}</td>
                      <td className="p-2 align-top w-[500px]">
                        <div className="relative h-6 w-full bg-muted rounded">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 rounded bg-primary"
                            style={{ left: bar.left, width: bar.width, minWidth: 12 }}
                            title={`${project.startDate} → ${project.endDate}`}
                          >
                          </div>
                          <div className="absolute left-0 top-full mt-1 text-[10px] text-muted-foreground">
                            {project.startDate}
                          </div>
                          <div className="absolute right-0 top-full mt-1 text-[10px] text-muted-foreground">
                            {project.endDate}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 