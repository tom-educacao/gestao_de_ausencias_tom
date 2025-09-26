export interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  unit?: string;
  contractType?: string;
  course?: string;
  teachingPeriod?: string;
}

export interface Department {
  id: string;
  name: string;
  disciplinaId: string;
}

export interface Substitute {
  id: string;
  name: string;
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AbsenceReason = 
  | 'Sick Leave'
  | 'Personal Leave'
  | 'Professional Development'
  | 'Conference'
  | 'Family Emergency'
  | 'Demissao'
  | 'Other';

export type AbsenceDuration = 'Full Day' | 'Partial Day';

export interface Absence {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  departmentName: string;
  disciplinaId: string;
  substitute_total_classes?: string;
  unit?: string;
  contractType?: string;
  course?: string;
  teachingPeriod?: string;
  date: string;
  reason: AbsenceReason;
  notes?: string;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  substituteTeacherName2?: string;
  substituteTeacherName3?: string;
  substituteContent: string;
  duration: AbsenceDuration;
  startTime?: string;
  endTime?: string;
  classes?: string;
  leaveId?: string;
  hasSubstitute?: string;
  substituteType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'teacher';
}

export interface Leave {
  id: string;
  teacherId: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  reason: string;
  documentUrl?: string;
  status: 'active' | 'inactive' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationType = 'single' | 'link_to_leave' | 'create_leave';
