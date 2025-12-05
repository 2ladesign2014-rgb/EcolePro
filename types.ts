

export enum StudentStatus {
  ACTIVE = 'Actif',
  ABSENT = 'Absent',
  SUSPENDED = 'Suspendu',
  TRANSFERRED = 'Transféré'
}

export type SchoolModule = 
  | 'STUDENTS' 
  | 'TEACHERS' 
  | 'ACADEMIC' 
  | 'HOMEWORK' 
  | 'GRADES' 
  | 'FINANCE' 
  | 'LIBRARY' 
  | 'RESOURCES' 
  | 'COMMUNICATION' 
  | 'CALENDAR' 
  | 'AI_ASSISTANT'
  | 'CANTEEN'
  | 'TIMETABLE'; // New Module

// Format: module.action (ex: grades.read, grades.write)
export type PermissionId = string; 

export interface School {
  id: string;
  name: string;
  address: string;
  logoUrl?: string; // Pour la personnalisation
  type: 'PRIMAIRE' | 'SECONDAIRE' | 'SUPERIEUR';
  config: SchoolConfig;
  modules: SchoolModule[]; // Liste des modules activés globalement pour l'école
}

export interface TransferRequest {
  targetSchoolId: string;
  targetSchoolName: string;
  requestDate: string;
  transferDate?: string; // Date souhaitée du transfert
  reason?: string; // Motif du transfert
  notes?: string; // Notes administratives
  status: 'PENDING' | 'REJECTED';
}

export interface Grade {
  id: string;
  subject: string;
  value: number;
  coefficient: number;
  type: string; // Devoir, Exam, DM
  date: string;
  isBonus?: boolean; // Option Bonus
  appreciation?: string;
}

export interface Student {
  id: string;
  matricule: string; // Identifiant unique scolaire
  schoolId: string; // Link to School
  firstName: string;
  lastName: string;
  email?: string; // Email de l'élève pour accès système
  classGrade: string; 
  average: number;
  grades?: Grade[]; // Historique des notes
  subjectBonuses?: Record<string, { averageBonus: number, pointBonus: number }>; // Bonus specific par matière
  status: StudentStatus;
  attendance: number; 
  behaviorNotes: string[];
  
  // Informations Parent/Tuteur
  parentName: string;
  parentRelation: string; // Père, Mère, Tuteur, Oncle...
  parentEmail?: string;
  parentPhone: string;

  // Transferts
  transferRequest?: TransferRequest;
  previousSchools?: { schoolName: string; year: string }[];
  
  // Bulletin
  photoUrl?: string;
}

export interface Teacher {
  id: string;
  matricule: string; 
  schoolId: string; 
  firstName: string;
  lastName: string;
  specialty: string; 
  subject: string; // Matières enseignées
  email: string;
  phone: string;
  contractType: 'CDI' | 'CDD' | 'Vacataire';
  status: 'Actif' | 'Inactif' | 'En congé'; 
  joinDate: string;
  baseSalary: number;
  
  // Admin Fields for Official Timetable
  sex?: 'M' | 'F';
  isBivalent?: boolean; // Bivalent: Oui/Non
  employmentLabel?: string; // e.g., "Professeur de Lycée"
  yearsExperience?: number;
  photoUrl?: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string; // Link to School
  name: string; 
  level: string; 
  mainTeacherId: string;
  studentCount: number;
  room: string;
  // Nouveaux champs demandés
  section?: string;
  capacity?: number; // Effectif maximum
  academicYear?: string;
}

export interface TimeSlot {
  id: string;
  schoolId: string;
  classId: string;
  teacherId: string;
  subject: string;
  dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  startTime: string; // Format "HH:MM" ex: "08:00"
  endTime: string;   // Format "HH:MM" ex: "10:00"
  room: string;
  color?: string; // Pour l'affichage
}

export interface Transaction {
  id: string;
  schoolId: string; // Link to School
  studentId?: string; 
  studentName?: string; 
  amount: number;
  // Updated types to allow flexible strings for the new categories
  type: string; 
  flow: 'IN' | 'OUT'; 
  date: string;
  // Updated status to allow 'Annulé', 'Remboursé' etc.
  status: string; 
  description?: string;
  // New fields for detailed payment info
  paymentMethod?: string; // Espèces, Mobile Money, Virement, Chèque
  paymentDetails?: string; // Orange CI, Banque X, N° Chèque...
  period?: string; // Trimestre 1, Octobre, etc.
  reference?: string; // Référence unique du reçu
  note?: string; // Remarque ou commentaire
  // Specific for Payroll
  salaryBreakdown?: {
    base: number;
    bonus: number;
    deduction: number;
  };
}

export interface Message {
  id: string;
  schoolId: string; // Link to School (messages are siloed)
  sender: string;
  senderRole?: UserRole; 
  content: string;
  timestamp: string;
  read: boolean;
  isMe: boolean;
  isBroadcast?: boolean; 
}

export type EventCategory = 'PEDAGOGIC' | 'EXTRA_CURRICULAR' | 'ADMINISTRATIVE' | 'EXAM' | 'HOLIDAY' | 'MEETING';
export type EventStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export interface CalendarEvent {
  id: string;
  schoolId: string; // Link to School
  title: string;
  description?: string;
  location?: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  category: EventCategory;
  status: EventStatus;
  organizer?: string; // Nom de l'organisateur
}

// Cahier de Texte / Lesson Log
export interface LessonLog {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subject: string;
  teacherName: string;
  
  // Dates
  date: string; // Date du cours
  startTime?: string;
  endTime?: string;
  nextSessionDate?: string; // Prochain cours

  // Contenu Pédagogique
  lessonPlan?: string; // Plan détaillé
  pedagogicalActivities?: string; // Activités réalisées
  
  // Devoirs (Legacy but kept for simpler homeworks)
  homework?: string; 
  dueDate?: string; 

  // Évaluations
  evaluationDate?: string;
  evaluationAction?: 'SUBMIT' | 'CORRECT'; // À rendre / À corriger

  // Validation
  validationStatus: 'DRAFT' | 'VALIDATED';
  validatedBy?: string;

  attachments?: string[];
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  averageAttendance: number;
  schoolAverage: number;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'BURSAR' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'LIBRARIAN';

export interface AuthSession {
  user: SystemUser;
  token: string;
}

export interface SystemUser {
  id: string;
  schoolId?: string; // Optional for SUPER_ADMIN, required for others
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
}

export interface SchoolConfig {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  directorName: string;
  adminPin?: string; // Code PIN pour l'accès aux paramètres
  rolePermissions?: Record<string, PermissionId[]>; // Map Role -> List of Permissions
  subjects?: string[]; // Liste dynamique des matières
}

export interface AuditLogEntry {
  id: string;
  schoolId?: string; // Can be null if system-wide
  action: string;
  user: string;
  timestamp: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
}

// Library Types
export type BookStatus = 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'LOST';

export interface Book {
  id: string;
  schoolId: string; // Link to School
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: BookStatus;
  coverUrl?: string;
  provenance?: 'ACHAT' | 'DON'; // Nouvelle propriété pour la réception
}

export interface Loan {
  id: string;
  schoolId: string; // Link to School
  bookId: string;
  bookTitle: string;
  studentName: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

export type NotificationType = 'OVERDUE' | 'DUE_SOON' | 'RESERVATION';

export interface LibraryNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  relatedLoanId?: string;
}

// Canteen / Cantine Types
export type FoodCategory = 'VIANDE' | 'LEGUME' | 'CEREALE' | 'EPICERIE' | 'BOISSON' | 'AUTRE';

export interface CanteenItem {
  id: string;
  schoolId: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string; // kg, litre, piece, etc.
  unitPrice?: number; // Prix moyen unitaire
  minThreshold: number; // Seuil d'alerte
  lastRestockDate?: string;
}

export interface CanteenTransaction {
  id: string;
  schoolId: string;
  date: string;
  type: 'SALE' | 'RESTOCK'; // Vente (Recette) ou Approvisionnement (Dépense)
  itemId?: string; // Link to CanteenItem if restock
  description: string;
  quantity?: number; // For stock movement
  amount: number; // Financial value
}

// Notification Channels
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'IN_APP';

export type AppNotificationCategory = 'ACADEMIC' | 'FINANCE' | 'ADMIN' | 'SYSTEM' | 'HOMEWORK';

export interface AppNotification {
  id: string;
  schoolId: string; // Link to School
  category: AppNotificationCategory;
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionLink?: ViewState; 
  targetRoles?: UserRole[]; 
  channels?: NotificationChannel[]; 
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  issue: string;
  status: 'OPEN' | 'RESOLVED';
  date: string;
}

// Pedagogical Resources Types
export type ResourceType = 'COURSE' | 'EXERCISE' | 'VIDEO' | 'DOCUMENT';

export interface Resource {
  id: string;
  schoolId: string; // Link to School
  title: string;
  description: string;
  subject: string;
  level: string;
  type: ResourceType;
  authorName: string;
  uploadDate: string;
  size: string; 
  downloadCount: number;
  lastDownloadDate?: string; // Date du dernier téléchargement
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  ACADEMIC = 'ACADEMIC',
  TIMETABLE = 'TIMETABLE', // New view
  HOMEWORK = 'HOMEWORK',
  GRADES = 'GRADES',
  FINANCE = 'FINANCE',
  LIBRARY = 'LIBRARY',
  CANTEEN = 'CANTEEN',
  RESOURCES = 'RESOURCES',
  COMMUNICATION = 'COMMUNICATION',
  AI_ASSISTANT = 'AI_ASSISTANT',
  CALENDAR = 'CALENDAR',
  SETTINGS = 'SETTINGS'
}