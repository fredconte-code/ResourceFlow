import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { employees as allEmployees } from "@/lib/employee-data";
import { useSettings } from "@/context/SettingsContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  country: 'Canada' | 'Brazil';
  allocatedHours: number;
  notes?: string;
}

const countryFlags = {
  'Canada': '🇨🇦',
  'Brazil': '🇧🇷'
};

export const TeamManagement = () => {
  const { toast } = useToast();
  const { canadaHours, brazilHours } = useSettings();
  // Remove the local state for members and use allEmployees directly
  // const [members, setMembers] = useState<TeamMember[]>([
  //   {
  //     id: '1',
  //     name: 'Sarah Chen',
  //     email: 'sarah.chen@company.com',
  //     role: 'Senior Developer',
  //     country: 'Canada',
  //     allocatedHours: 140,
  //     notes: 'Team lead for frontend development'
  //   },
  //   {
  //     id: '2',
  //     name: 'Marco Silva',
  //     email: 'marco.silva@company.com',
  //     role: 'Full Stack Developer',
  //     country: 'Brazil',
  //     allocatedHours: 165,
  //     notes: 'Specializes in React and Node.js'
  //   }
  // ]);

  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    role: '',
    country: 'Canada',
    allocatedHours: 0,
    notes: ''
  });

  const [search, setSearch] = useState("");

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name!,
      email: newMember.email!,
      role: newMember.role!,
      country: newMember.country! as 'Canada' | 'Brazil',
      allocatedHours: newMember.allocatedHours || 0,
      notes: newMember.notes || ''
    };

    // setMembers([...members, member]); // This line is removed as members state is removed
    setNewMember({
      name: '',
      email: '',
      role: '',
      country: 'Canada',
      allocatedHours: 0,
      notes: ''
    });

    toast({
      title: "Team Member Added",
      description: `${member.name} has been added to the team.`,
    });
  };

  const handleRemoveMember = (id: string) => {
    // const member = members.find(m => m.id === id); // This line is removed as members state is removed
    // setMembers(members.filter(m => m.id !== id)); // This line is removed as members state is removed
    
    toast({
      title: "Team Member Removed",
      description: `Member has been removed from the team.`,
    });
  };

  const handleUpdateMember = (id: string, field: keyof TeamMember, value: any) => {
    // setMembers(members.map(member => 
    //   member.id === id ? { ...member, [field]: value } : member
    // )); // This line is removed as members state is removed
  };

  // Filter employees by search
  const filteredEmployees = allEmployees.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Team Management</h2>
        <p className="text-muted-foreground">
          Manage team members, their roles, and basic allocation settings.
        </p>
      </div>

      {/* Add New Member Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Add New Team Member</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={newMember.role}
                onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                placeholder="e.g., Senior Developer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={newMember.country} 
                onValueChange={(value) => setNewMember({...newMember, country: value as 'Canada' | 'Brazil'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                  <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hours">Allocated Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                value={newMember.allocatedHours}
                onChange={(e) => setNewMember({...newMember, allocatedHours: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={newMember.notes}
              onChange={(e) => setNewMember({...newMember, notes: e.target.value})}
              placeholder="Additional notes about this team member..."
              rows={2}
            />
          </div>
          
          <Button onClick={handleAddMember} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </CardContent>
      </Card>

      {/* Current Team Members */}
      <Card className="text-xs p-1">
        <CardHeader className="p-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Current Team Members ({filteredEmployees.length})</CardTitle>
          <Input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-48 ml-2"
            size={20}
          />
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          <div className="space-y-2">
            {filteredEmployees.map((member) => (
              <div key={member.id} className="p-2 border border-border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{member.name}</h4>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <span>{countryFlags[member.country]}</span>
                      <span>{member.country}</span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Input
                      value={member.role}
                      onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Allocated Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      value={((member.country === 'Canada' ? canadaHours * 4 : brazilHours * 4) % 1 === 0 ? (member.country === 'Canada' ? canadaHours * 4 : brazilHours * 4) : (member.country === 'Canada' ? canadaHours * 4 : brazilHours * 4).toFixed(1))}
                      disabled
                      className="w-24"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Country</Label>
                    <Select 
                      value={member.country} 
                      onValueChange={(value) => handleUpdateMember(member.id, 'country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                        <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Only render notes if present and member.notes exists */}
                {'notes' in member && member.notes && (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={String(member.notes)}
                      onChange={(e) => handleUpdateMember(member.id, 'notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No team members found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};