import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";

export const Settings = () => {
  const { theme, setTheme, buffer, setBuffer, canadaHours, setCanadaHours, brazilHours, setBrazilHours } = useSettings();
  // Local state for form fields
  const [localTheme, setLocalTheme] = useState(theme);
  const [localBuffer, setLocalBuffer] = useState(buffer);
  const [localCanadaHours, setLocalCanadaHours] = useState(canadaHours === 44 ? 37.5 : canadaHours);
  const [localBrazilHours, setLocalBrazilHours] = useState(brazilHours);

  const handleSave = () => {
    setTheme(localTheme);
    setBuffer(localBuffer);
    setCanadaHours(localCanadaHours);
    setBrazilHours(localBrazilHours);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Change global parameters for your workspace.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="theme-toggle">Dark Mode</Label>
            <Switch
              id="theme-toggle"
              checked={localTheme === "dark"}
              onCheckedChange={(checked) => setLocalTheme(checked ? "dark" : "light")}
            />
            <span className="text-xs text-muted-foreground">{localTheme === "dark" ? "Dark" : "Light"} Mode</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Buffer Time (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              type="number"
              min={0}
              max={100}
              value={localBuffer}
              onChange={e => setLocalBuffer(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="canada-hours">Canada</Label>
              <Input
                id="canada-hours"
                type="number"
                min={0}
                value={localCanadaHours}
                onChange={e => setLocalCanadaHours(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-muted-foreground">hours/week</span>
            </div>
            <div className="flex items-center space-x-4">
              <Label htmlFor="brazil-hours">Brazil</Label>
              <Input
                id="brazil-hours"
                type="number"
                min={0}
                value={localBrazilHours}
                onChange={e => setLocalBrazilHours(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-muted-foreground">hours/week</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}; 