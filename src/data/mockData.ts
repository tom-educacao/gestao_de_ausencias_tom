import { Teacher, Department, Absence, User } from '../types';
import { format, subDays, addDays } from 'date-fns';

// Generate random date within the last 6 months
const getRandomDate = () => {
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 180); // Up to 6 months ago
  return format(subDays(today, daysAgo), 'yyyy-MM-dd');
};

// Generate random time
const getRandomTime = () => {
  const hours = Math.floor(Math.random() * 8) + 8; // 8 AM to 4 PM
  const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Units
const units = ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];

// Contract types
const contractTypes = ['CLT', 'QPM'];

// Courses
const courses = ['Secondary Education', 'Final Years', 'Others'];

// Teaching periods
const teachingPeriods = ['Morning', 'Afternoon', 'Evening'];

// Departments
export const departments: Department[] = [
  { id: 'd1', name: 'Matemática' },
  { id: 'd2', name: 'Ciência' },
  { id: 'd3', name: 'Inglês' },
  { id: 'd4', name: 'História' },
  { id: 'd5', name: 'Computer Science' },
  { id: 'd6', name: 'Educação Física' },
  { id: 'd7', name: 'Artes' },
  { id: 'd8', name: 'Foreign Languages' },
];

// Teachers
export const teachers: Teacher[] = [
  { id: 't1', name: 'John Smith', department: 'd1', email: 'john.smith@school.edu', unit: 'Centro', contractType: 'CLT', course: 'Secondary Education', teachingPeriod: 'Morning' },
  { id: 't2', name: 'Sarah Johnson', department: 'd1', email: 'sarah.johnson@school.edu', unit: 'Norte', contractType: 'QPM', course: 'Final Years', teachingPeriod: 'Afternoon' },
  { id: 't3', name: 'Michael Brown', department: 'd2', email: 'michael.brown@school.edu', unit: 'Sul', contractType: 'CLT', course: 'Others', teachingPeriod: 'Evening' },
  { id: 't4', name: 'Emily Davis', department: 'd2', email: 'emily.davis@school.edu', unit: 'Leste', contractType: 'QPM', course: 'Secondary Education', teachingPeriod: 'Morning' },
  { id: 't5', name: 'David Wilson', department: 'd3', email: 'david.wilson@school.edu', unit: 'Oeste', contractType: 'CLT', course: 'Final Years', teachingPeriod: 'Afternoon' },
  { id: 't6', name: 'Jennifer Taylor', department: 'd3', email: 'jennifer.taylor@school.edu', unit: 'Centro', contractType: 'QPM', course: 'Others', teachingPeriod: 'Evening' },
  { id: 't7', name: 'Robert Martinez', department: 'd4', email: 'robert.martinez@school.edu', unit: 'Norte', contractType: 'CLT', course: 'Secondary Education', teachingPeriod: 'Morning' },
  { id: 't8', name: 'Lisa Anderson', department: 'd4', email: 'lisa.anderson@school.edu', unit: 'Sul', contractType: 'QPM', course: 'Final Years', teachingPeriod: 'Afternoon' },
  { id: 't9', name: 'James Thomas', department: 'd5', email: 'james.thomas@school.edu', unit: 'Leste', contractType: 'CLT', course: 'Others', teachingPeriod: 'Evening' },
  { id: 't10', name: 'Patricia White', department: 'd5', email: 'patricia.white@school.edu', unit: 'Oeste', contractType: 'QPM', course: 'Secondary Education', teachingPeriod: 'Morning' },
  { id: 't11', name: 'Richard Harris', department: 'd6', email: 'richard.harris@school.edu', unit: 'Centro', contractType: 'CLT', course: 'Final Years', teachingPeriod: 'Afternoon' },
  { id: 't12', name: 'Elizabeth Clark', department: 'd6', email: 'elizabeth.clark@school.edu', unit: 'Norte', contractType: 'QPM', course: 'Others', teachingPeriod: 'Evening' },
  { id: 't13', name: 'Charles Lewis', department: 'd7', email: 'charles.lewis@school.edu', unit: 'Sul', contractType: 'CLT', course: 'Secondary Education', teachingPeriod: 'Morning' },
  { id: 't14', name: 'Margaret Lee', department: 'd7', email: 'margaret.lee@school.edu', unit: 'Leste', contractType: 'QPM', course: 'Final Years', teachingPeriod: 'Afternoon' },
  { id: 't15', name: 'Thomas Walker', department: 'd8', email: 'thomas.walker@school.edu', unit: 'Oeste', contractType: 'CLT', course: 'Others', teachingPeriod: 'Evening' },
  { id: 't16', name: 'Nancy Hall', department: 'd8', email: 'nancy.hall@school.edu', unit: 'Centro', contractType: 'QPM', course: 'Secondary Education', teachingPeriod: 'Morning' },
];

// Reasons for absence
const absenceReasons: string[] = [
  'Sick Leave',
  'Personal Leave',
  'Professional Development',
  'Conference',
  'Family Emergency',
  'Other',
];

// Generate mock absences
export const generateMockAbsences = (count: number): Absence[] => {
  const absences: Absence[] = [];
  
  for (let i = 0; i < count; i++) {
    const teacher = teachers[Math.floor(Math.random() * teachers.length)];
    const department = departments.find(d => d.id === teacher.department)!;
    const substituteIndex = Math.floor(Math.random() * (teachers.length + 3)) - 3; // Sometimes no substitute
    const substitute = substituteIndex >= 0 && substituteIndex < teachers.length ? teachers[substituteIndex] : undefined;
    const duration = Math.random() > 0.7 ? 'Partial Day' : 'Full Day';
    const date = getRandomDate();
    
    absences.push({
      id: `a${i + 1}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      departmentId: department.id,
      departmentName: department.name,
      unit: teacher.unit,
      contractType: teacher.contractType,
      course: teacher.course,
      teachingPeriod: teacher.teachingPeriod,
      date,
      reason: absenceReasons[Math.floor(Math.random() * absenceReasons.length)] as any,
      notes: Math.random() > 0.7 ? 'Additional notes about this absence' : undefined,
      substituteTeacherId: substitute?.id,
      substituteTeacherName: substitute?.name,
      duration,
      startTime: duration === 'Partial Day' ? getRandomTime() : undefined,
      endTime: duration === 'Partial Day' ? getRandomTime() : undefined,
      createdAt: format(subDays(new Date(date), Math.floor(Math.random() * 7) + 1), 'yyyy-MM-dd'),
      updatedAt: format(new Date(date), 'yyyy-MM-dd'),
    });
  }
  
  return absences;
};

// Generate 100 mock absences
export const absences: Absence[] = generateMockAbsences(100);

// Users
export const users: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@school.edu', role: 'admin' },
  { id: 'u2', name: 'Coordinator User', email: 'coordinator@school.edu', role: 'coordinator' },
  ...teachers.map(teacher => ({
    id: teacher.id.replace('t', 'u'),
    name: teacher.name,
    email: teacher.email,
    role: 'teacher' as const,
  })),
];

// Current user (for demo purposes)
export const currentUser: User = users[1]; // Coordinator