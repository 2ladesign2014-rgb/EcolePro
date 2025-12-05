
import { Student, StudentStatus, Teacher, SchoolClass, Transaction, Message, CalendarEvent, SystemUser, SchoolConfig, AuditLogEntry, Book, Loan, Resource, LessonLog, SchoolModule, PermissionId, UserRole, CanteenItem, TimeSlot } from './types';

// Helper for Currency
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('fr-FR') + ' FCFA';
};

export const AVAILABLE_MODULES: { id: SchoolModule, label: string, description: string }[] = [
  { id: 'STUDENTS', label: 'Élèves & Inscriptions', description: 'Gestion des dossiers élèves, inscriptions et transferts.' },
  { id: 'TEACHERS', label: 'Personnel & RH', description: 'Gestion des enseignants, contrats et spécialités.' },
  { id: 'ACADEMIC', label: 'Académique (Classes)', description: 'Gestion des classes, salles et professeurs principaux.' },
  { id: 'TIMETABLE', label: 'Emploi du Temps', description: 'Planification des cours, gestion des salles et horaires.' },
  { id: 'HOMEWORK', label: 'Cahier de Texte', description: 'Suivi des séances, devoirs et calendrier pédagogique.' },
  { id: 'GRADES', label: 'Gestion des Notes', description: 'Saisie des notes, calcul des moyennes et bulletins.' },
  { id: 'FINANCE', label: 'Finances & Paie', description: 'Suivi des paiements scolarité, dépenses et salaires.' },
  { id: 'LIBRARY', label: 'Bibliothèque', description: 'Gestion du fonds documentaire et des emprunts.' },
  { id: 'CANTEEN', label: 'Cantine', description: 'Gestion des stocks, approvisionnements et recettes repas.' },
  { id: 'RESOURCES', label: 'Ressources Pédagogiques', description: 'Partage de fichiers, cours et exercices.' },
  { id: 'COMMUNICATION', label: 'Messagerie', description: 'Chat interne et annonces globales.' },
  { id: 'CALENDAR', label: 'Calendrier', description: 'Emploi du temps et événements scolaires.' },
  { id: 'AI_ASSISTANT', label: 'Assistant IA', description: 'Aide à la rédaction de rapports et analyses.' },
];

export const DETAILED_PERMISSIONS: Record<string, { id: string, label: string, desc: string }[]> = {
    STUDENTS: [
        { id: 'STUDENTS.read', label: 'Consultation Élèves', desc: 'Voir la liste et dossiers des élèves' },
        { id: 'STUDENTS.enroll', label: 'Inscription', desc: 'Droit d\'inscrire un nouvel élève' },
        { id: 'STUDENTS.transfer', label: 'Gestion Transferts', desc: 'Gérer les transferts entrants/sortants' }
    ],
    GRADES: [
        { id: 'GRADES.read', label: 'Lecture Notes', desc: 'Voir les bulletins et relevés' },
        { id: 'GRADES.write', label: 'Saisie Notes', desc: 'Ajouter et modifier les notes des élèves' }
    ],
    TIMETABLE: [
        { id: 'TIMETABLE.read', label: 'Voir Emploi du Temps', desc: 'Consulter les plannings' },
        { id: 'TIMETABLE.write', label: 'Modifier Emploi du Temps', desc: 'Créer et modifier les créneaux de cours' }
    ],
    HOMEWORK: [
        { id: 'HOMEWORK.read', label: 'Lecture Cahier de Texte', desc: 'Consulter le planning et les devoirs' },
        { id: 'HOMEWORK.write', label: 'Édition Cahier de Texte', desc: 'Saisir séances, devoirs et évaluations' }
    ],
    RESOURCES: [
        { id: 'RESOURCES.read', label: 'Accès Ressources', desc: 'Voir et télécharger les fichiers' },
        { id: 'RESOURCES.write', label: 'Ajout Ressources', desc: 'Publier des cours et exercices' }
    ],
    COMMUNICATION: [
        { id: 'COMMUNICATION.read', label: 'Lecture Messages', desc: 'Lire les messages reçus' },
        { id: 'COMMUNICATION.write', label: 'Envoi Messages', desc: 'Envoyer des messages et annonces' }
    ],
    TEACHERS: [
         { id: 'TEACHERS.read', label: 'Annuaire Personnel', desc: 'Voir la liste du personnel' },
         { id: 'TEACHERS.write', label: 'Gestion RH', desc: 'Ajouter/Modifier des enseignants' }
    ],
    ACADEMIC: [
        { id: 'ACADEMIC.read', label: 'Vue Classes', desc: 'Voir la structure pédagogique' },
        { id: 'ACADEMIC.write', label: 'Gestion Classes', desc: 'Créer classes et emploi du temps' }
    ],
    FINANCE: [
        { id: 'FINANCE.read', label: 'Vue Financière', desc: 'Voir l\'historique financier' },
        { id: 'FINANCE.write', label: 'Opérations Financières', desc: 'Saisir paiements, dépenses et salaires' }
    ],
    LIBRARY: [
         { id: 'LIBRARY.read', label: 'Catalogue', desc: 'Consulter le catalogue' },
         { id: 'LIBRARY.write', label: 'Gestion Prêts', desc: 'Gérer emprunts, retours et stock' }
    ],
    CANTEEN: [
        { id: 'CANTEEN.read', label: 'Vue Cantine', desc: 'Voir menus et stocks' },
        { id: 'CANTEEN.write', label: 'Gestion Cantine', desc: 'Gérer approvisionnements et ventes' }
    ],
    CALENDAR: [
        { id: 'CALENDAR.read', label: 'Vue Calendrier', desc: 'Voir le calendrier scolaire' },
        { id: 'CALENDAR.write', label: 'Édition Calendrier', desc: 'Ajouter des événements' }
    ],
    AI_ASSISTANT: [
        { id: 'AI_ASSISTANT.read', label: 'Utilisation IA', desc: 'Générer du contenu assisté' },
        { id: 'AI_ASSISTANT.write', label: 'Admin IA', desc: 'Configuration avancée IA' }
    ]
};

// Default Permission Matrix
export const DEFAULT_PERMISSIONS: Record<UserRole, PermissionId[]> = {
  SUPER_ADMIN: [
    'STUDENTS.read', 'STUDENTS.enroll', 'STUDENTS.transfer', 
    'TEACHERS.read', 'TEACHERS.write',
    'ACADEMIC.read', 'ACADEMIC.write', 'TIMETABLE.read', 'TIMETABLE.write',
    'HOMEWORK.read', 'HOMEWORK.write',
    'GRADES.read', 'GRADES.write', 'FINANCE.read', 'FINANCE.write',
    'LIBRARY.read', 'LIBRARY.write', 'RESOURCES.read', 'RESOURCES.write',
    'COMMUNICATION.read', 'COMMUNICATION.write', 'CALENDAR.read', 'CALENDAR.write',
    'AI_ASSISTANT.read', 'AI_ASSISTANT.write', 'SETTINGS.write',
    'CANTEEN.read', 'CANTEEN.write'
  ],
  ADMIN: [
    'STUDENTS.read', 'STUDENTS.enroll', 'STUDENTS.transfer',
    'TEACHERS.read', 'TEACHERS.write',
    'ACADEMIC.read', 'ACADEMIC.write', 'TIMETABLE.read', 'TIMETABLE.write',
    'HOMEWORK.read', 'HOMEWORK.write',
    'GRADES.read', 'GRADES.write', 'FINANCE.read', 'FINANCE.write',
    'LIBRARY.read', 'LIBRARY.write', 'RESOURCES.read', 'RESOURCES.write',
    'COMMUNICATION.read', 'COMMUNICATION.write', 'CALENDAR.read', 'CALENDAR.write',
    'AI_ASSISTANT.read', 'AI_ASSISTANT.write', 'SETTINGS.write',
    'CANTEEN.read', 'CANTEEN.write'
  ],
  TEACHER: [
    // Gestion des élèves (Consultation)
    'STUDENTS.read', 
    'ACADEMIC.read', 'TIMETABLE.read',
    // Pédagogie (Cahier de texte & Notes) - Lecture et Écriture garanties
    'HOMEWORK.read', 'HOMEWORK.write',
    'GRADES.read', 'GRADES.write',
    // Ressources & Outils
    'RESOURCES.read', 'RESOURCES.write',
    'LIBRARY.read',
    'AI_ASSISTANT.read', 'AI_ASSISTANT.write',
    // Vie Scolaire
    'COMMUNICATION.read', 'COMMUNICATION.write', 
    'CALENDAR.read',
    'CANTEEN.read'
  ],
  STUDENT: [
    // Consultation uniquement pour les notes
    'HOMEWORK.read', 'GRADES.read', 'TIMETABLE.read',
    'LIBRARY.read', 'RESOURCES.read', 
    'COMMUNICATION.read', 'COMMUNICATION.write', 'CALENDAR.read',
    'CANTEEN.read'
  ],
  PARENT: [
    // Consultation uniquement pour les notes
    'HOMEWORK.read', 'GRADES.read', 'FINANCE.read', 'TIMETABLE.read',
    'COMMUNICATION.read', 'COMMUNICATION.write', 'CALENDAR.read',
    'CANTEEN.read'
  ],
  BURSAR: [
    'STUDENTS.read', 'FINANCE.read', 'FINANCE.write', 
    'COMMUNICATION.read', 'CALENDAR.read', 'CANTEEN.read', 'CANTEEN.write'
  ],
  LIBRARIAN: [
    'STUDENTS.read', 'TEACHERS.read', 
    'LIBRARY.read', 'LIBRARY.write',
    'COMMUNICATION.read', 'COMMUNICATION.write', 
    'CALENDAR.read', 'FINANCE.read'
  ]
};

export const DEFAULT_SUBJECTS = [
    'Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 
    'Histoire-Géo', 'SVT', 'Philosophie', 'EPS', 
    'Espagnol', 'Allemand', 'Arts Plastiques', 'Musique', 'Informatique'
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    matricule: '2023-001',
    schoolId: 'SCHOOL_01',
    firstName: 'Jean',
    lastName: 'Dupont',
    classGrade: 'Terminale C',
    average: 14.5,
    grades: [
        { id: 'g1', subject: 'Mathématiques', value: 16, coefficient: 4, type: 'Devoir', date: '2023-10-15' },
        { id: 'g2', subject: 'Physique-Chimie', value: 14, coefficient: 3, type: 'Interro', date: '2023-10-20' }
    ],
    status: StudentStatus.ACTIVE,
    attendance: 95,
    behaviorNotes: ['Bonne participation'],
    parentName: 'M. Dupont',
    parentRelation: 'Père',
    parentPhone: '0102030405'
  },
  {
    id: '2',
    matricule: '2023-002',
    schoolId: 'SCHOOL_01',
    firstName: 'Alice',
    lastName: 'Koffi',
    classGrade: 'Terminale C',
    average: 16.0,
    grades: [],
    status: StudentStatus.ACTIVE,
    attendance: 98,
    behaviorNotes: [],
    parentName: 'Mme. Koffi',
    parentRelation: 'Mère',
    parentPhone: '0708091011'
  }
];

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 'T1',
    matricule: '839633V',
    schoolId: 'SCHOOL_01',
    firstName: 'Landry',
    lastName: 'IRIE BI BOHI',
    specialty: 'Sciences Exactes',
    subject: 'Mathématiques',
    email: 'irie.landry@ecolepro.ci',
    phone: '0171511950',
    contractType: 'CDI',
    status: 'Actif',
    joinDate: '2020-09-01',
    baseSalary: 250000,
    sex: 'M',
    isBivalent: true,
    employmentLabel: 'Professeur de Collège',
    yearsExperience: 5
  },
  {
    id: 'T2',
    matricule: 'T2021002',
    schoolId: 'SCHOOL_01',
    firstName: 'Sophie',
    lastName: 'Durand',
    specialty: 'Lettres',
    subject: 'Français',
    email: 'sophie.durand@ecolepro.ci',
    phone: '0504030201',
    contractType: 'CDI',
    status: 'Actif',
    joinDate: '2021-09-01',
    baseSalary: 240000,
    sex: 'F',
    isBivalent: false,
    employmentLabel: 'Professeur Certifié',
    yearsExperience: 8
  }
];

export const MOCK_CLASSES: SchoolClass[] = [
  { id: 'C1', schoolId: 'SCHOOL_01', name: 'Terminale C', level: 'Terminale', mainTeacherId: 'T1', studentCount: 35, room: 'Bat A - 101' },
  { id: 'C2', schoolId: 'SCHOOL_01', name: 'Première D', level: 'Première', mainTeacherId: 'T2', studentCount: 40, room: 'Bat A - 102' },
  { id: 'C3', schoolId: 'SCHOOL_01', name: 'Seconde C', level: 'Seconde', mainTeacherId: '', studentCount: 45, room: 'Bat B - 201' }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-001',
    schoolId: 'SCHOOL_01',
    studentId: '1',
    studentName: 'Jean Dupont',
    amount: 50000,
    type: 'Tuition',
    flow: 'IN',
    date: new Date().toISOString(),
    status: 'Paid',
    description: 'Scolarité Trimestre 1'
  },
  {
    id: 'TRX-002',
    schoolId: 'SCHOOL_01',
    amount: 25000,
    type: 'Material',
    flow: 'OUT',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'Paid',
    description: 'Achat Fournitures Bureau'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'M1',
    schoolId: 'SCHOOL_01',
    sender: 'Administration',
    content: 'Bienvenue sur la nouvelle plateforme !',
    timestamp: '10:00',
    read: false,
    isMe: false,
    isBroadcast: true
  }
];

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'E1',
    schoolId: 'SCHOOL_01',
    title: 'Conseil de Classe Tle C',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '18:00',
    category: 'PEDAGOGIC',
    status: 'PLANNED',
    location: 'Salle des Profs',
    description: 'Bilan du premier trimestre.'
  },
  {
    id: 'E2',
    schoolId: 'SCHOOL_01',
    title: 'Sortie Pédagogique Musée',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '14:00',
    category: 'EXTRA_CURRICULAR',
    status: 'PLANNED',
    location: 'Musée des Civilisations',
    description: 'Sortie pour les classes de 3ème.'
  }
];

export const MOCK_SYSTEM_USERS: SystemUser[] = [
    { id: 'USER_ADMIN', name: 'Admin Principal', email: 'admin@ecole.com', role: 'ADMIN', lastLogin: '2024-03-10', status: 'ACTIVE', schoolId: 'SCHOOL_01' },
    { id: 'USER_TEACHER', name: 'Prof. Test', email: 'prof@ecole.com', role: 'TEACHER', lastLogin: '2024-03-11', status: 'ACTIVE', schoolId: 'SCHOOL_01' }
];

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
    schoolName: 'Mon École',
    address: 'Abidjan, Côte d\'Ivoire',
    phone: '+225 07 00 00 00',
    email: 'contact@ecole.ci',
    academicYear: '2024-2025',
    directorName: 'M. le Directeur',
    adminPin: '0000',
    rolePermissions: DEFAULT_PERMISSIONS,
    subjects: DEFAULT_SUBJECTS
};

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
    { id: 'LOG1', schoolId: 'SCHOOL_01', action: 'Connexion', user: 'Admin Principal', timestamp: new Date().toISOString(), details: 'Connexion réussie', type: 'INFO' }
];

export const MOCK_BOOKS: Book[] = [
    { id: 'B1', schoolId: 'SCHOOL_01', title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', isbn: '978-0156012195', category: 'Roman', status: 'AVAILABLE', provenance: 'ACHAT' },
    { id: 'B2', schoolId: 'SCHOOL_01', title: 'Maths Tle C', author: 'Collection CIAM', isbn: '978-2841295671', category: 'Manuel Scolaire', status: 'BORROWED', provenance: 'ACHAT' }
];

export const MOCK_LOANS: Loan[] = [
    { id: 'L1', schoolId: 'SCHOOL_01', bookId: 'B2', bookTitle: 'Maths Tle C', studentName: 'Jean Dupont', borrowDate: '2024-03-01', dueDate: '2024-03-15', status: 'ACTIVE' }
];

export const MOCK_RESOURCES: Resource[] = [
    { id: 'R1', schoolId: 'SCHOOL_01', title: 'Cours Chapitre 1 : Nombres Complexes', description: 'Introduction aux nombres complexes, forme algébrique.', subject: 'Mathématiques', level: 'Terminale', type: 'COURSE', authorName: 'M. Dubois', uploadDate: '2024-02-15', size: '2.4 MB', downloadCount: 12 },
    { id: 'R2', schoolId: 'SCHOOL_01', title: 'Exercices Probabilités', description: 'Série d\'exercices corrigés sur les probabilités conditionnelles.', subject: 'Mathématiques', level: 'Terminale', type: 'EXERCISE', authorName: 'M. Dubois', uploadDate: '2024-02-20', size: '1.1 MB', downloadCount: 8 }
];

export const MOCK_LESSON_LOGS: LessonLog[] = [
    {
        id: 'LOG_001',
        schoolId: 'SCHOOL_01',
        classId: 'C1',
        className: 'Terminale C',
        subject: 'Mathématiques',
        teacherName: 'M. IRIE BI BOHI',
        date: new Date().toISOString(),
        startTime: '08:00',
        endTime: '10:00',
        lessonPlan: 'Chapitre 3: Les Nombres Complexes.\nI. Forme Algébrique\nII. Conjugué',
        pedagogicalActivities: 'Résolution exercices 1 et 2 page 45.',
        homework: 'Exercice 3 page 45 à faire.',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        validationStatus: 'VALIDATED',
        validatedBy: 'M. IRIE BI BOHI'
    }
];

export const MOCK_CANTEEN_ITEMS: CanteenItem[] = [
    { id: 'CI1', schoolId: 'SCHOOL_01', name: 'Riz Parfum', category: 'CEREALE', quantity: 50, unit: 'kg', unitPrice: 500, minThreshold: 10, lastRestockDate: '2024-03-01' },
    { id: 'CI2', schoolId: 'SCHOOL_01', name: 'Huile Dinor', category: 'EPICERIE', quantity: 5, unit: 'L', unitPrice: 1200, minThreshold: 10, lastRestockDate: '2024-02-20' }
];

export const MOCK_TIME_SLOTS: TimeSlot[] = [
    { id: 'TS1', schoolId: 'SCHOOL_01', classId: 'C1', teacherId: 'T1', subject: 'Mathématiques', dayOfWeek: 'Lundi', startTime: '09:05', endTime: '10:00', room: 'Bat A - 101' },
    { id: 'TS2', schoolId: 'SCHOOL_01', classId: 'C1', teacherId: 'T1', subject: 'Mathématiques', dayOfWeek: 'Lundi', startTime: '10:15', endTime: '11:10', room: 'Bat A - 101' },
    { id: 'TS3', schoolId: 'SCHOOL_01', classId: 'C1', teacherId: 'T1', subject: 'Mathématiques', dayOfWeek: 'Lundi', startTime: '11:15', endTime: '12:05', room: 'Bat A - 101' },
    { id: 'TS4', schoolId: 'SCHOOL_01', classId: 'C1', teacherId: 'T1', subject: 'Mathématiques', dayOfWeek: 'Lundi', startTime: '14:25', endTime: '15:20', room: 'Bat A - 101' },
    { id: 'TS5', schoolId: 'SCHOOL_01', classId: 'C1', teacherId: 'T1', subject: 'Mathématiques', dayOfWeek: 'Lundi', startTime: '15:30', endTime: '16:25', room: 'Bat A - 101' }
];

export const PERFORMANCE_DATA = [
  { name: 'Maths', score: 14.2 },
  { name: 'Français', score: 12.5 },
  { name: 'Anglais', score: 13.8 },
  { name: 'Hist-Géo', score: 11.9 },
  { name: 'Physique', score: 10.5 },
  { name: 'SVT', score: 13.2 },
];

export const ATTENDANCE_DATA = [
  { name: 'Présent', value: 85, fill: '#10b981' },
  { name: 'Absent', value: 10, fill: '#f43f5e' },
  { name: 'Retard', value: 5, fill: '#f59e0b' },
];
