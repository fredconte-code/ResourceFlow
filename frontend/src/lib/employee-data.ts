export interface Employee {
  id: string;
  name: string;
  role: string;
  country: 'Canada' | 'Brazil';
  allocatedHours: number;
  availableHours: number;
  vacationDays: number;
  holidayDays: number;
  email: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  allocatedHours: number;
}

// Mock data for employees
export const employees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Senior Developer',
    country: 'Canada',
    allocatedHours: 140,
    availableHours: 150, // 37.5h/week * 4 weeks
    vacationDays: 2,
    holidayDays: 1,
    email: 'sarah.chen@company.com',
  },
  {
    id: '2',
    name: 'Marco Silva',
    role: 'Full Stack Developer',
    country: 'Brazil',
    allocatedHours: 165,
    availableHours: 176, // 44h/week * 4 weeks
    vacationDays: 1,
    holidayDays: 0,
    email: 'marco.silva@company.com',
  },
  {
    id: '3',
    name: 'Jennifer Liu',
    role: 'UI/UX Designer',
    country: 'Canada',
    allocatedHours: 120,
    availableHours: 150,
    vacationDays: 3,
    holidayDays: 1,
    email: 'jennifer.liu@company.com',
  },
  {
    id: '4',
    name: 'Carlos Rodriguez',
    role: 'DevOps Engineer',
    country: 'Brazil',
    allocatedHours: 180,
    availableHours: 176,
    vacationDays: 0,
    holidayDays: 1,
    email: 'carlos.rodriguez@company.com',
  },
  {
    id: '5',
    name: 'Emily Watson',
    role: 'Project Manager',
    country: 'Canada',
    allocatedHours: 135,
    availableHours: 150,
    vacationDays: 1,
    holidayDays: 2,
    email: 'emily.watson@company.com',
  },
  {
    id: '6',
    name: 'Rafael Santos',
    role: 'Backend Developer',
    country: 'Brazil',
    allocatedHours: 160,
    availableHours: 176,
    vacationDays: 2,
    holidayDays: 0,
    email: 'rafael.santos@company.com',
  },
  // Add 29 more mock employees
  {
    id: '7', name: 'Lucas Oliveira', role: 'Frontend Developer', country: 'Brazil', allocatedHours: 150, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'lucas.oliveira@company.com',
  },
  {
    id: '8', name: 'Sophie Tremblay', role: 'QA Engineer', country: 'Canada', allocatedHours: 130, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'sophie.tremblay@company.com',
  },
  {
    id: '9', name: 'Gabriel Costa', role: 'Backend Developer', country: 'Brazil', allocatedHours: 160, availableHours: 176, vacationDays: 2, holidayDays: 0, email: 'gabriel.costa@company.com',
  },
  {
    id: '10', name: 'Emma Gagnon', role: 'Product Owner', country: 'Canada', allocatedHours: 140, availableHours: 150, vacationDays: 1, holidayDays: 2, email: 'emma.gagnon@company.com',
  },
  {
    id: '11', name: 'Mateus Lima', role: 'DevOps Engineer', country: 'Brazil', allocatedHours: 170, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'mateus.lima@company.com',
  },
  {
    id: '12', name: 'Olivia Roy', role: 'UI Designer', country: 'Canada', allocatedHours: 120, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'olivia.roy@company.com',
  },
  {
    id: '13', name: 'Bruno Souza', role: 'Full Stack Developer', country: 'Brazil', allocatedHours: 155, availableHours: 176, vacationDays: 2, holidayDays: 0, email: 'bruno.souza@company.com',
  },
  {
    id: '14', name: 'Noah Fortin', role: 'Scrum Master', country: 'Canada', allocatedHours: 135, availableHours: 150, vacationDays: 1, holidayDays: 2, email: 'noah.fortin@company.com',
  },
  {
    id: '15', name: 'Ana Martins', role: 'QA Analyst', country: 'Brazil', allocatedHours: 145, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'ana.martins@company.com',
  },
  {
    id: '16', name: 'William Leblanc', role: 'Business Analyst', country: 'Canada', allocatedHours: 125, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'william.leblanc@company.com',
  },
  {
    id: '17', name: 'Pedro Alves', role: 'Frontend Developer', country: 'Brazil', allocatedHours: 150, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'pedro.alves@company.com',
  },
  {
    id: '18', name: 'Chloe Morin', role: 'UX Researcher', country: 'Canada', allocatedHours: 120, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'chloe.morin@company.com',
  },
  {
    id: '19', name: 'Rafael Pereira', role: 'Backend Developer', country: 'Brazil', allocatedHours: 160, availableHours: 176, vacationDays: 2, holidayDays: 0, email: 'rafael.pereira@company.com',
  },
  {
    id: '20', name: 'Liam Bouchard', role: 'Project Manager', country: 'Canada', allocatedHours: 135, availableHours: 150, vacationDays: 1, holidayDays: 2, email: 'liam.bouchard@company.com',
  },
  {
    id: '21', name: 'Mariana Ribeiro', role: 'DevOps Engineer', country: 'Brazil', allocatedHours: 170, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'mariana.ribeiro@company.com',
  },
  {
    id: '22', name: 'Aiden Lavoie', role: 'QA Engineer', country: 'Canada', allocatedHours: 130, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'aiden.lavoie@company.com',
  },
  {
    id: '23', name: 'Thiago Fernandes', role: 'Full Stack Developer', country: 'Brazil', allocatedHours: 155, availableHours: 176, vacationDays: 2, holidayDays: 0, email: 'thiago.fernandes@company.com',
  },
  {
    id: '24', name: 'Zoe Pelletier', role: 'UI Designer', country: 'Canada', allocatedHours: 120, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'zoe.pelletier@company.com',
  },
  {
    id: '25', name: 'Felipe Rocha', role: 'Frontend Developer', country: 'Brazil', allocatedHours: 150, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'felipe.rocha@company.com',
  },
  {
    id: '26', name: 'Mia Gervais', role: 'QA Analyst', country: 'Canada', allocatedHours: 145, availableHours: 150, vacationDays: 1, holidayDays: 1, email: 'mia.gervais@company.com',
  },
  {
    id: '27', name: 'Gustavo Mendes', role: 'Backend Developer', country: 'Brazil', allocatedHours: 160, availableHours: 176, vacationDays: 2, holidayDays: 0, email: 'gustavo.mendes@company.com',
  },
  {
    id: '28', name: 'Charlotte Dubois', role: 'Product Owner', country: 'Canada', allocatedHours: 140, availableHours: 150, vacationDays: 1, holidayDays: 2, email: 'charlotte.dubois@company.com',
  },
  {
    id: '29', name: 'Lucas Fernandes', role: 'DevOps Engineer', country: 'Brazil', allocatedHours: 170, availableHours: 176, vacationDays: 1, holidayDays: 1, email: 'lucas.fernandes@company.com',
  },
  {
    id: '30', name: 'Jacob Tremblay', role: 'Business Analyst', country: 'Canada', allocatedHours: 125, availableHours: 150, vacationDays: 2, holidayDays: 1, email: 'jacob.tremblay@company.com',
  },
  {
    id: '31', name: 'Isabela Lima', role: 'QA Engineer', country: 'Brazil', allocatedHours: 130, availableHours: 176, vacationDays: 2, holidayDays: 1, email: 'isabela.lima@company.com',
  },
  {
    id: '32', name: 'Nathan Gagnon', role: 'Frontend Developer', country: 'Canada', allocatedHours: 150, availableHours: 150, vacationDays: 1, holidayDays: 1, email: 'nathan.gagnon@company.com',
  },
  {
    id: '33', name: 'Bruna Souza', role: 'Backend Developer', country: 'Brazil', allocatedHours: 160, availableHours: 176, vacationDays: 2, holidayDays: 0, email: 'bruna.souza@company.com',
  },
  {
    id: '34', name: 'Émile Fortin', role: 'Scrum Master', country: 'Canada', allocatedHours: 135, availableHours: 150, vacationDays: 1, holidayDays: 2, email: 'emile.fortin@company.com',
  },
  {
    id: '35', name: 'Camila Barbosa', role: 'UI Designer', country: 'Brazil', allocatedHours: 120, availableHours: 176, vacationDays: 2, holidayDays: 1, email: 'camila.barbosa@company.com',
  },
];

export const projects: Project[] = [
  { id: '1', name: 'E-commerce Platform', color: '#3b82f6', allocatedHours: 320 },
  { id: '2', name: 'Mobile App Redesign', color: '#10b981', allocatedHours: 240 },
  { id: '3', name: 'API Integration', color: '#f59e0b', allocatedHours: 180 },
  { id: '4', name: 'Security Audit', color: '#ef4444', allocatedHours: 120 },
  { id: '5', name: 'Performance Optimization', color: '#8b5cf6', allocatedHours: 100 },
  { id: '6', name: 'Data Migration', color: '#eab308', allocatedHours: 150 },
  { id: '7', name: 'Cloud Infrastructure', color: '#0ea5e9', allocatedHours: 200 },
  { id: '8', name: 'Customer Portal', color: '#f472b6', allocatedHours: 170 },
  { id: '9', name: 'Analytics Dashboard', color: '#22d3ee', allocatedHours: 130 },
  { id: '10', name: 'HR System Upgrade', color: '#facc15', allocatedHours: 110 },
  { id: '11', name: 'Inventory Management', color: '#a3e635', allocatedHours: 160 },
  { id: '12', name: 'Marketing Automation', color: '#f87171', allocatedHours: 140 },
  { id: '13', name: 'Mobile Payments', color: '#38bdf8', allocatedHours: 120 },
  { id: '14', name: 'Partner API', color: '#fbbf24', allocatedHours: 90 },
  { id: '15', name: 'Internal Tools', color: '#818cf8', allocatedHours: 80 },
  { id: '16', name: 'Compliance Suite', color: '#f472b6', allocatedHours: 60 },
];

// Utility functions
export const calculateAvailableHours = (employee: Employee): number => {
  const weeklyHours = employee.country === 'Canada' ? 37.5 : 44;
  const monthlyHours = weeklyHours * 4; // Assuming 4 weeks per month
  const vacationHours = employee.vacationDays * (weeklyHours / 5); // Assuming 5 working days per week
  const holidayHours = employee.holidayDays * (weeklyHours / 5);
  
  return monthlyHours - vacationHours - holidayHours;
};

export const calculateAllocationPercentage = (employee: Employee): number => {
  const availableHours = calculateAvailableHours(employee);
  return Math.round((employee.allocatedHours / availableHours) * 100);
};

export const getAllocationStatus = (percentage: number): 'low' | 'optimal' | 'high' | 'over' => {
  if (percentage < 70) return 'low';
  if (percentage <= 90) return 'optimal';
  if (percentage <= 100) return 'high';
  return 'over';
};

export const getTeamStats = () => {
  const totalEmployees = employees.length;
  const canadianEmployees = employees.filter(emp => emp.country === 'Canada').length;
  const brazilianEmployees = employees.filter(emp => emp.country === 'Brazil').length;
  
  const totalAllocated = employees.reduce((sum, emp) => sum + emp.allocatedHours, 0);
  const totalAvailable = employees.reduce((sum, emp) => sum + calculateAvailableHours(emp), 0);
  const overallAllocation = Math.round((totalAllocated / totalAvailable) * 100);
  
  const allocationByStatus = employees.reduce((acc, emp) => {
    const percentage = calculateAllocationPercentage(emp);
    const status = getAllocationStatus(percentage);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalEmployees,
    canadianEmployees,
    brazilianEmployees,
    totalAllocated,
    totalAvailable,
    overallAllocation,
    allocationByStatus,
  };
};