
export type Language = 'bn' | 'en';

export interface Madrasah {
  id: string;
  name: string;
  phone?: string;
  logo_url?: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
  email?: string; // Optional field for admin view
}

export interface Class {
  id: string;
  class_name: string;
  madrasah_id: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_name: string;
  guardian_name?: string;
  roll?: number;
  guardian_phone: string;
  guardian_phone_2?: string;
  class_id: string;
  madrasah_id: string;
  created_at: string;
  classes?: Class; // Joined data
}

export interface RecentCall {
  id: string;
  student_id: string;
  guardian_phone: string;
  madrasah_id: string;
  called_at: string;
  students?: Student; // Joined data
}

export type View = 'home' | 'classes' | 'account' | 'students' | 'student-details' | 'student-form' | 'class-form' | 'admin-panel';

export interface AppState {
  currentView: View;
  selectedClassId?: string;
  selectedStudent?: Student;
  isEditing?: boolean;
}
