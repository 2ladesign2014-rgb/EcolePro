
import { Student, Teacher, SchoolClass, Transaction, Message, CalendarEvent, SystemUser, SchoolConfig, AuditLogEntry, Book, Loan, LibraryNotification, Resource, AppNotification, SupportTicket, UserRole, AppNotificationCategory, ViewState, StudentStatus, NotificationChannel, School, LessonLog, CanteenItem, Grade, TimeSlot } from '../types';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_CLASSES, MOCK_TRANSACTIONS, MOCK_MESSAGES, MOCK_EVENTS, MOCK_SYSTEM_USERS, DEFAULT_SCHOOL_CONFIG, MOCK_AUDIT_LOGS, MOCK_BOOKS, MOCK_LOANS, MOCK_RESOURCES, MOCK_LESSON_LOGS, DEFAULT_PERMISSIONS, MOCK_CANTEEN_ITEMS, MOCK_TIME_SLOTS, AVAILABLE_MODULES } from '../constants';

// Mock Schools Data for Initialization
const INITIAL_SCHOOLS: School[] = [
  {
    id: 'SCHOOL_01',
    name: 'Lycée d\'Excellence EcolePro',
    address: 'Plateau, Abidjan',
    type: 'SECONDAIRE',
    config: DEFAULT_SCHOOL_CONFIG,
    modules: AVAILABLE_MODULES.map(m => m.id) // Enable ALL modules for demo
  },
  {
    id: 'SCHOOL_02',
    name: 'Groupe Scolaire Les Pépites',
    address: 'Cocody, Abidjan',
    type: 'PRIMAIRE',
    config: {
        ...DEFAULT_SCHOOL_CONFIG,
        schoolName: 'Groupe Scolaire Les Pépites',
        directorName: 'M. Koné'
    },
    modules: ['FINANCE', 'STUDENTS', 'ACADEMIC', 'COMMUNICATION']
  },
  {
    id: 'SCHOOL_03',
    name: 'Collège Moderne du Savoir',
    address: 'Yopougon, Abidjan',
    type: 'SECONDAIRE',
    config: {
        ...DEFAULT_SCHOOL_CONFIG,
        schoolName: 'Collège Moderne du Savoir',
        directorName: 'Mme. Kouassi'
    },
    modules: ['STUDENTS', 'GRADES', 'FINANCE', 'TEACHERS', 'TIMETABLE', 'HOMEWORK']
  }
];

class DatabaseService {
  private get<T>(key: string, initialData: T): T {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }

  private set<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- SCHOOL MANAGEMENT (MULTI-TENANT) ---

  getSchools(): School[] {
    return this.get('schools', INITIAL_SCHOOLS);
  }

  getSchoolById(schoolId: string): School | undefined {
    return this.getSchools().find(s => s.id === schoolId);
  }

  getSchoolConfig(schoolId?: string): SchoolConfig {
    const schools = this.getSchools();
    const school = schools.find(s => s.id === schoolId) || schools[0];
    return school ? school.config : DEFAULT_SCHOOL_CONFIG;
  }

  saveSchool(school: School): void {
    const schools = this.getSchools();
    const exists = schools.find(s => s.id === school.id);
    if (exists) {
      this.set('schools', schools.map(s => s.id === school.id ? school : s));
      this.logAction('Mise à jour École', 'Super Admin', `Modification de ${school.name}`, 'INFO', school.id);
    } else {
      this.set('schools', [...schools, school]);
      this.logAction('Création École', 'Super Admin', `Nouvelle école: ${school.name}`, 'CRITICAL');
    }
  }
  
  // --- PERMISSIONS CHECKER ---
  hasPermission(schoolId: string, role: UserRole, permission: string): boolean {
      const config = this.getSchoolConfig(schoolId);
      const rolesPermissions = config.rolePermissions || DEFAULT_PERMISSIONS;
      const permissions = rolesPermissions[role] || [];
      return permissions.includes(permission);
  }

  // --- NOTIFICATION HELPERS ---

  private createNotification(
    title: string, 
    message: string, 
    category: AppNotificationCategory, 
    targetRoles: UserRole[], 
    link: ViewState | undefined,
    schoolId: string,
    channels: NotificationChannel[] = ['IN_APP']
  ) {
    const notifs = this.get<AppNotification[]>('notifications', []);
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      schoolId,
      title,
      message,
      category,
      date: new Date().toISOString(),
      read: false,
      actionLink: link,
      targetRoles,
      channels
    };
    
    if (channels.includes('PUSH')) console.log(`[PUSH] To ${targetRoles.join(',')}: ${title}`);
    if (channels.includes('EMAIL')) console.log(`[EMAIL] To ${targetRoles.join(',')}: ${title}`);

    this.set('notifications', [newNotif, ...notifs]);
  }

  // --- STUDENTS ---

  getStudents(schoolId?: string): Student[] {
    let students = this.get('students', MOCK_STUDENTS.map(s => ({...s, schoolId: 'SCHOOL_01'})));
    if (schoolId) {
      return students.filter(s => s.schoolId === schoolId);
    }
    return students;
  }
  
  getAllStudents(): Student[] {
      return this.get('students', MOCK_STUDENTS.map(s => ({...s, schoolId: 'SCHOOL_01'})));
  }

  getIncomingTransfers(targetSchoolId: string): Student[] {
    let students = this.get('students', MOCK_STUDENTS.map(s => ({...s, schoolId: 'SCHOOL_01'})));
    return students.filter(s => s.transferRequest?.targetSchoolId === targetSchoolId && s.transferRequest.status === 'PENDING');
  }

  getTransferredOutStudents(schoolId: string): Student[] {
    const schools = this.getSchools();
    const currentSchool = schools.find(s => s.id === schoolId);
    if (!currentSchool) return [];

    const allStudents = this.getAllStudents();
    return allStudents.filter(s => 
      s.schoolId !== schoolId && 
      s.previousSchools?.some(h => h.schoolName === currentSchool.name)
    );
  }
  
  saveStudent(student: Student): void {
    const allStudents = this.getStudents();
    const exists = allStudents.find(s => s.id === student.id);
    
    if (exists) {
      this.set('students', allStudents.map(s => s.id === student.id ? student : s));
      this.logAction('Modification Élève', 'Admin', `Mise à jour: ${student.firstName}`, 'INFO', student.schoolId);
    } else {
      this.set('students', [student, ...allStudents]);
      this.logAction('Création Élève', 'Admin', `Inscription: ${student.firstName}`, 'INFO', student.schoolId);
      
      this.createNotification(
        'Nouvelle Inscription',
        `${student.firstName} ${student.lastName} inscrit en ${student.classGrade}.`,
        'ACADEMIC',
        ['ADMIN', 'TEACHER'],
        ViewState.STUDENTS,
        student.schoolId,
        ['IN_APP']
      );
    }
  }

  initiateTransfer(studentId: string, targetSchoolId: string, reason: string = '', notes: string = '', date: string = ''): void {
    const allStudents = this.getStudents();
    const student = allStudents.find(s => s.id === studentId);
    const targetSchool = this.getSchoolById(targetSchoolId);

    if (!student || !targetSchool) return;

    student.transferRequest = {
      targetSchoolId,
      targetSchoolName: targetSchool.name,
      requestDate: new Date().toISOString(),
      transferDate: date || new Date().toISOString().split('T')[0],
      reason: reason,
      notes: notes,
      status: 'PENDING'
    };

    this.set('students', allStudents.map(s => s.id === studentId ? student : s));

    this.logAction('Demande Transfert', 'Admin', `Transfert initié pour ${student.firstName} vers ${targetSchool.name}`, 'INFO', student.schoolId);

    this.createNotification(
      'Transfert Initié',
      `Demande de transfert envoyée pour ${student.firstName} vers ${targetSchool.name}.`,
      'ADMIN',
      ['ADMIN', 'SUPER_ADMIN'],
      ViewState.STUDENTS,
      student.schoolId,
      ['IN_APP']
    );

    this.createNotification(
      'Demande de Transfert Entrante',
      `Nouvelle demande de transfert pour ${student.firstName} ${student.lastName} en provenance de votre réseau.`,
      'ADMIN',
      ['ADMIN', 'SUPER_ADMIN'],
      ViewState.STUDENTS,
      targetSchoolId,
      ['IN_APP', 'EMAIL']
    );
  }

  cancelTransfer(studentId: string): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    
    if (student && student.transferRequest && student.transferRequest.status === 'PENDING') {
      const targetId = student.transferRequest.targetSchoolId;
      student.transferRequest = undefined;
      this.set('students', students.map(s => s.id === studentId ? student : s));
      
      this.logAction('Transfert Annulé', 'Admin', `Annulation du transfert de ${student.firstName}`, 'INFO', student.schoolId);

      this.createNotification(
        'Transfert Annulé',
        `La demande de transfert pour ${student.firstName} ${student.lastName} a été annulée.`,
        'ADMIN',
        ['ADMIN'],
        ViewState.STUDENTS,
        targetId,
        ['IN_APP']
      );
    }
  }

  completeTransfer(studentId: string, action: 'APPROVE' | 'REJECT', reviewerName: string): void {
    const allStudents = this.getStudents();
    const student = allStudents.find(s => s.id === studentId);
    
    if (!student || !student.transferRequest) return;

    const oldSchoolId = student.schoolId;
    const targetSchoolId = student.transferRequest.targetSchoolId;
    const oldSchool = this.getSchoolById(oldSchoolId);

    if (action === 'APPROVE') {
      const history = student.previousSchools || [];
      if (oldSchool) {
        history.push({ schoolName: oldSchool.name, year: new Date().getFullYear().toString() });
      }

      student.schoolId = targetSchoolId;
      student.previousSchools = history;
      student.transferRequest = undefined;
      student.status = StudentStatus.ACTIVE;

      this.set('students', allStudents.map(s => s.id === studentId ? student : s));
      
      this.logAction('Transfert Accepté', reviewerName, `Arrivée de ${student.firstName} depuis ${oldSchool?.name}`, 'INFO', targetSchoolId);

      this.createNotification(
        'Transfert Finalisé',
        `${student.firstName} ${student.lastName} a été accepté par l'établissement d'accueil. Le dossier est clos.`,
        'ADMIN',
        ['ADMIN'],
        ViewState.STUDENTS,
        oldSchoolId,
        ['IN_APP', 'EMAIL']
      );

      this.createNotification(
        'Transfert Réussi',
        `Le transfert de ${student.firstName} a été validé. Bienvenue dans votre nouvel établissement !`,
        'ACADEMIC',
        ['PARENT', 'STUDENT'],
        ViewState.DASHBOARD,
        targetSchoolId,
        ['PUSH', 'EMAIL']
      );

    } else {
      student.transferRequest.status = 'REJECTED';
      const rejectedTarget = student.transferRequest.targetSchoolName;
      student.transferRequest = undefined;

      this.set('students', allStudents.map(s => s.id === studentId ? student : s));

      this.createNotification(
        'Transfert Refusé',
        `La demande de transfert vers ${rejectedTarget} a été refusée par l'établissement d'accueil.`,
        'ADMIN',
        ['ADMIN'],
        ViewState.STUDENTS,
        oldSchoolId,
        ['IN_APP']
      );
    }
  }

  deleteStudent(id: string): void {
    const students = this.getStudents();
    this.set('students', students.filter(s => s.id !== id));
  }

  reportAbsence(studentId: string, date: string, reason: string): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    student.attendance = Math.max(0, student.attendance - 1);
    student.status = StudentStatus.ABSENT; 
    this.set('students', students.map(s => s.id === studentId ? student : s));

    this.logAction('Signalement Absence', 'Enseignant', `Absence: ${student.firstName}`, 'INFO', student.schoolId);

    this.createNotification(
      'Absence Signalée',
      `L'élève ${student.firstName} ${student.lastName} est absent. Motif: ${reason}`,
      'ACADEMIC',
      ['PARENT', 'ADMIN', 'STUDENT'],
      ViewState.STUDENTS,
      student.schoolId,
      ['PUSH', 'EMAIL', 'IN_APP']
    );
  }

  // --- GRADES MANAGEMENT ---

  saveGrade(studentId: string, grade: Grade): void {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentGrades = student.grades || [];
    const existingIndex = currentGrades.findIndex(g => g.id === grade.id);
    let updatedGrades;

    if (existingIndex >= 0) {
        updatedGrades = [...currentGrades];
        updatedGrades[existingIndex] = grade;
        this.logAction('Modification Note', 'Enseignant', `Modif note de ${grade.value}/20 en ${grade.subject}`, 'INFO', student.schoolId);
    } else {
        updatedGrades = [...currentGrades, grade];
        this.logAction('Saisie Note', 'Enseignant', `Nouvelle note de ${grade.value}/20 en ${grade.subject}`, 'INFO', student.schoolId);
        
        this.createNotification(
          `Nouvelle Note : ${grade.subject}`,
          `${student.firstName} a obtenu ${grade.value}/20 (${grade.type}) en ${grade.subject}.`,
          'ACADEMIC',
          ['PARENT', 'STUDENT'],
          ViewState.GRADES,
          student.schoolId,
          ['PUSH', 'IN_APP']
        );
    }

    student.grades = updatedGrades;
    student.average = this.calculateWeightedAverage(updatedGrades);

    this.set('students', students.map(s => s.id === studentId ? student : s));
  }

  deleteGrade(studentId: string, gradeId: string): void {
      const students = this.getStudents();
      const student = students.find(s => s.id === studentId);
      if (!student || !student.grades) return;

      student.grades = student.grades.filter(g => g.id !== gradeId);
      student.average = this.calculateWeightedAverage(student.grades);

      this.set('students', students.map(s => s.id === studentId ? student : s));
      this.logAction('Suppression Note', 'Enseignant', `Suppression d'une note pour ${student.firstName}`, 'WARNING', student.schoolId);
  }

  private calculateWeightedAverage(grades: Grade[]): number {
      if (grades.length === 0) return 0;
      let totalScore = 0;
      let totalCoeff = 0;
      grades.forEach(g => {
          totalScore += g.value * g.coefficient;
          totalCoeff += g.coefficient;
      });
      if (totalCoeff === 0) return 0;
      return parseFloat((totalScore / totalCoeff).toFixed(2));
  }

  // --- TEACHERS ---
  
  getTeachers(schoolId?: string): Teacher[] {
    let teachers = this.get('teachers', MOCK_TEACHERS.map(t => ({...t, schoolId: 'SCHOOL_01'})));
    if (schoolId) return teachers.filter(t => t.schoolId === schoolId);
    return teachers;
  }

  saveTeacher(teacher: Teacher): void {
    const allTeachers = this.getTeachers();
    const exists = allTeachers.find(t => t.id === teacher.id);

    if (exists) {
        this.set('teachers', allTeachers.map(t => t.id === teacher.id ? teacher : t));
        this.logAction('Modification Personnel', 'Admin', `Mise à jour: ${teacher.firstName} ${teacher.lastName}`, 'INFO', teacher.schoolId);
    } else {
        this.set('teachers', [teacher, ...allTeachers]);
        this.logAction('Nouveau Personnel', 'Admin', `Recrutement: ${teacher.firstName} ${teacher.lastName}`, 'INFO', teacher.schoolId);
    }
  }

  deleteTeacher(id: string): void {
      const teachers = this.getTeachers();
      this.set('teachers', teachers.filter(t => t.id !== id));
  }

  // --- CLASSES ---

  getClasses(schoolId?: string): SchoolClass[] {
    let classes = this.get('classes', MOCK_CLASSES.map(c => ({...c, schoolId: 'SCHOOL_01'})));
    if (schoolId) return classes.filter(c => c.schoolId === schoolId);
    return classes;
  }

  addClass(cls: SchoolClass): void {
    const classes = this.getClasses();
    this.set('classes', [...classes, cls]);
  }

  updateClass(cls: SchoolClass): void {
    const classes = this.getClasses();
    this.set('classes', classes.map(c => c.id === cls.id ? cls : c));
  }

  deleteClass(id: string): void {
    const classes = this.getClasses();
    this.set('classes', classes.filter(c => c.id !== id));
  }

  // --- TIMETABLE ---

  getTimeSlots(schoolId?: string): TimeSlot[] {
    let slots = this.get('timeSlots', MOCK_TIME_SLOTS.map(s => ({...s, schoolId: 'SCHOOL_01'})));
    if (schoolId) return slots.filter(s => s.schoolId === schoolId);
    return slots;
  }

  saveTimeSlot(slot: TimeSlot): { success: boolean, message?: string } {
    const slots = this.getTimeSlots();
    const exists = slots.find(s => s.id === slot.id);
    
    const overlap = slots.find(s => {
        if (s.id === slot.id) return false;
        if (s.dayOfWeek !== slot.dayOfWeek) return false;
        if (s.schoolId !== slot.schoolId) return false;

        const startA = parseInt(s.startTime.replace(':', ''));
        const endA = parseInt(s.endTime.replace(':', ''));
        const startB = parseInt(slot.startTime.replace(':', ''));
        const endB = parseInt(slot.endTime.replace(':', ''));

        if (startA < endB && endA > startB) {
            if (s.teacherId === slot.teacherId) return true;
            if (s.room === slot.room) return true;
            if (s.classId === slot.classId) return true;
        }
        return false;
    });

    if (overlap) {
        return { success: false, message: "Conflit détecté : Le professeur, la salle ou la classe est déjà occupé(e) sur ce créneau." };
    }

    if (exists) {
        this.set('timeSlots', slots.map(s => s.id === slot.id ? slot : s));
    } else {
        this.set('timeSlots', [...slots, slot]);
    }
    return { success: true };
  }

  deleteTimeSlot(id: string): void {
      const slots = this.getTimeSlots();
      this.set('timeSlots', slots.filter(s => s.id !== id));
  }

  // --- LESSON LOGS ---

  getLessonLogs(schoolId?: string): LessonLog[] {
    let logs = this.get('lessonLogs', MOCK_LESSON_LOGS.map(l => ({...l, schoolId: 'SCHOOL_01'})));
    if (schoolId) return logs.filter(l => l.schoolId === schoolId);
    return logs;
  }

  addLessonLog(log: LessonLog): void {
    const logs = this.getLessonLogs();
    this.set('lessonLogs', [log, ...logs]);

    if (log.homework) {
        this.createNotification(
            `Devoir à faire: ${log.subject}`,
            `Nouveau devoir ajouté pour la classe ${log.className}. À rendre pour le ${new Date(log.dueDate || '').toLocaleDateString()}.`,
            'HOMEWORK',
            ['STUDENT', 'PARENT'],
            ViewState.HOMEWORK,
            log.schoolId,
            ['PUSH', 'IN_APP']
        );
    }
  }

  deleteLessonLog(id: string): void {
      const logs = this.getLessonLogs();
      this.set('lessonLogs', logs.filter(l => l.id !== id));
  }

  // --- FINANCE ---

  getTransactions(schoolId?: string): Transaction[] {
    let trxs = this.get('transactions', MOCK_TRANSACTIONS.map(t => ({...t, schoolId: 'SCHOOL_01'})));
    if (schoolId) return trxs.filter(t => t.schoolId === schoolId);
    return trxs;
  }

  getAllTransactions(): Transaction[] {
      return this.get('transactions', MOCK_TRANSACTIONS.map(t => ({...t, schoolId: 'SCHOOL_01'})));
  }
  
  addTransaction(trx: Transaction): void {
    const trxs = this.getTransactions();
    this.set('transactions', [trx, ...trxs]);
    
    if (trx.flow === 'IN' && trx.type !== 'Canteen') {
      this.createNotification(
        'Paiement Reçu',
        `Paiement de ${trx.amount.toLocaleString('fr-FR')} FCFA reçu pour ${trx.studentName}.`,
        'FINANCE',
        ['PARENT', 'ADMIN', 'BURSAR'],
        ViewState.FINANCE,
        trx.schoolId,
        ['EMAIL', 'IN_APP']
      );
    }
  }

  // --- CANTEEN ---
  getCanteenItems(schoolId?: string): CanteenItem[] {
      let items = this.get('canteenItems', MOCK_CANTEEN_ITEMS.map(i => ({...i, schoolId: 'SCHOOL_01'})));
      if (schoolId) return items.filter(i => i.schoolId === schoolId);
      return items;
  }

  updateCanteenStock(item: CanteenItem, isNew: boolean): void {
      const items = this.getCanteenItems();
      if (isNew) {
          this.set('canteenItems', [...items, item]);
      } else {
          this.set('canteenItems', items.map(i => i.id === item.id ? item : i));
      }
  }

  deleteCanteenItem(id: string): void {
      const items = this.getCanteenItems();
      this.set('canteenItems', items.filter(i => i.id !== id));
  }

  // --- MESSAGES ---

  getMessages(schoolId?: string): Message[] {
    let msgs = this.get('messages', MOCK_MESSAGES.map(m => ({...m, schoolId: 'SCHOOL_01'})));
    if (schoolId) return msgs.filter(m => m.schoolId === schoolId);
    return msgs;
  }
  
  sendMessage(msg: Message): void {
    const msgs = this.getMessages();
    this.set('messages', [...msgs, msg]);
    
    if (msg.isBroadcast) {
        this.createNotification(
            `Annonce: ${msg.sender}`,
            msg.content.substring(0, 50) + '...',
            'ADMIN',
            ['TEACHER', 'PARENT', 'STUDENT'],
            ViewState.COMMUNICATION,
            msg.schoolId,
            ['PUSH', 'IN_APP']
        );
    }
  }

  // --- EVENTS ---

  getEvents(schoolId?: string): CalendarEvent[] {
    let events = this.get('events', MOCK_EVENTS.map(e => ({...e, schoolId: 'SCHOOL_01'})));
    if (schoolId) return events.filter(e => e.schoolId === schoolId);
    return events;
  }

  saveEvent(event: CalendarEvent): void {
    const events = this.getEvents();
    const exists = events.find(e => e.id === event.id);
    if (exists) {
      this.set('events', events.map(e => e.id === event.id ? event : e));
    } else {
      this.set('events', [...events, event]);
    }
  }

  deleteEvent(id: string): void {
    const events = this.getEvents();
    this.set('events', events.filter(e => e.id !== id));
  }

  // --- LIBRARY ---
  getBooks(schoolId?: string): Book[] {
    let books = this.get('books', MOCK_BOOKS.map(b => ({...b, schoolId: 'SCHOOL_01'})));
    if (schoolId) return books.filter(b => b.schoolId === schoolId);
    return books;
  }

  saveBook(book: Book): void {
    const books = this.getBooks();
    const exists = books.find(b => b.id === book.id);
    if (exists) {
      this.set('books', books.map(b => b.id === book.id ? book : b));
    } else {
      this.set('books', [...books, book]);
    }
  }
  
  getLoans(schoolId?: string): Loan[] {
    let loans = this.get('loans', MOCK_LOANS.map(l => ({...l, schoolId: 'SCHOOL_01'})));
    if (schoolId) return loans.filter(l => l.schoolId === schoolId);
    return loans;
  }

  saveLoan(loan: Loan): void {
    const loans = this.getLoans();
    const existingIndex = loans.findIndex(l => l.id === loan.id);
    
    if (existingIndex >= 0) {
        const updatedLoans = [...loans];
        updatedLoans[existingIndex] = loan;
        this.set('loans', updatedLoans);

        if (loan.status === 'RETURNED') {
            const books = this.getBooks();
            this.set('books', books.map(b => b.id === loan.bookId ? {...b, status: 'AVAILABLE'} : b));
        }
    } else {
        this.set('loans', [...loans, loan]);
        const books = this.getBooks();
        this.set('books', books.map(b => b.id === loan.bookId ? {...b, status: 'BORROWED'} : b));
        
        this.createNotification(
            'Emprunt Enregistré',
            `Vous avez emprunté "${loan.bookTitle}".`,
            'ACADEMIC',
            ['STUDENT'],
            ViewState.LIBRARY,
            loan.schoolId,
            ['IN_APP']
        );
    }
  }

  reportLostBook(loanId: string): void {
     const loans = this.getLoans();
     const loan = loans.find(l => l.id === loanId);
     if (!loan) return;

     loan.status = 'OVERDUE';
     this.set('loans', loans.map(l => l.id === loanId ? loan : l));

     const books = this.getBooks();
     this.set('books', books.map(b => b.id === loan.bookId ? {...b, status: 'LOST'} : b));

     this.createNotification(
        'Livre Perdu / Non Rendu',
        `Le livre "${loan.bookTitle}" est déclaré perdu. Pénalité appliquée.`,
        'FINANCE',
        ['PARENT', 'STUDENT', 'BURSAR'],
        ViewState.FINANCE,
        loan.schoolId,
        ['EMAIL', 'IN_APP']
     );
  }

  getLibraryNotifications(schoolId?: string): LibraryNotification[] {
    const loans = this.getLoans(schoolId);
    const notifications: LibraryNotification[] = [];
    const today = new Date();

    loans.forEach(loan => {
      if (loan.status === 'RETURNED') return;

      const dueDate = new Date(loan.dueDate);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0) {
        notifications.push({
          id: `notif-overdue-${loan.id}`,
          type: 'OVERDUE',
          title: 'Retard de retour',
          message: `Le livre "${loan.bookTitle}" emprunté par ${loan.studentName} est en retard.`,
          date: new Date().toISOString(),
          read: false,
          relatedLoanId: loan.id
        });
      } else if (daysDiff >= 0 && daysDiff <= 3) {
        notifications.push({
          id: `notif-soon-${loan.id}`,
          type: 'DUE_SOON',
          title: 'Retour imminent',
          message: `Le livre "${loan.bookTitle}" doit être retourné bientôt.`,
          date: new Date().toISOString(),
          read: false,
          relatedLoanId: loan.id
        });
      }
    });
    return notifications;
  }

  // --- APP NOTIFICATIONS ---
  
  getAppNotifications(user: SystemUser, schoolId?: string): AppNotification[] {
    let persistedNotifs = this.get<AppNotification[]>('notifications', []);
    if (schoolId) {
        persistedNotifs = persistedNotifs.filter(n => n.schoolId === schoolId);
    }
    const userNotifs = persistedNotifs.filter(n => 
      n.targetRoles?.includes(user.role) || user.role === 'SUPER_ADMIN'
    );
    return userNotifs;
  }

  // --- RESOURCES ---
  getResources(schoolId?: string): Resource[] {
    let res = this.get('resources', MOCK_RESOURCES.map(r => ({...r, schoolId: 'SCHOOL_01'})));
    if (schoolId) return res.filter(r => r.schoolId === schoolId);
    return res;
  }

  addResource(resource: Resource): void {
    const resources = this.getResources();
    this.set('resources', [resource, ...resources]);
    
    this.createNotification(
        'Nouvelle Ressource',
        `Nouveau support "${resource.title}" en ${resource.subject}.`,
        'ACADEMIC',
        ['STUDENT', 'PARENT'],
        ViewState.RESOURCES,
        resource.schoolId,
        ['IN_APP']
    );
  }

  incrementResourceDownload(id: string): void {
    const resources = this.get<Resource[]>('resources', MOCK_RESOURCES.map(r => ({...r, schoolId: 'SCHOOL_01'})));
    const index = resources.findIndex(r => r.id === id);
    if (index !== -1) {
      resources[index].downloadCount = (resources[index].downloadCount || 0) + 1;
      resources[index].lastDownloadDate = new Date().toISOString();
      this.set('resources', resources);
    }
  }

  deleteResource(id: string): void {
    const resources = this.getResources();
    this.set('resources', resources.filter(r => r.id !== id));
  }

  // --- SYSTEM USERS ---
  getSystemUsers(schoolId?: string): SystemUser[] {
    let users = this.get('systemUsers', MOCK_SYSTEM_USERS.map(u => ({...u, schoolId: 'SCHOOL_01'})));
    if (schoolId) return users.filter(u => u.schoolId === schoolId);
    return users;
  }
  
  saveSystemUser(user: SystemUser): void {
    const users = this.getSystemUsers();
    const exists = users.find(u => u.id === user.id);
    if (exists) {
      this.set('systemUsers', users.map(u => u.id === user.id ? user : u));
    } else {
      this.set('systemUsers', [...users, user]);
    }
  }
  
  deleteSystemUser(id: string): void {
     const users = this.getSystemUsers();
     this.set('systemUsers', users.filter(u => u.id !== id));
  }

  // --- LOGS & SUPPORT ---
  getAuditLogs(schoolId?: string): AuditLogEntry[] {
    let logs = this.get('auditLogs', MOCK_AUDIT_LOGS.map(l => ({...l, schoolId: 'SCHOOL_01'})));
    if (schoolId) return logs.filter(l => l.schoolId === schoolId);
    return logs;
  }
  
  logAction(action: string, user: string, details: string, type: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO', schoolId?: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLogEntry = {
      id: Date.now().toString(),
      schoolId,
      timestamp: new Date().toISOString(),
      action,
      user,
      details,
      type
    };
    this.set('auditLogs', [newLog, ...logs].slice(0, 100));
  }

  createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'date' | 'status'>): void {
    const tickets = this.get<SupportTicket[]>('tickets', []);
    const newTicket = { ...ticket, id: `TICKET-${Date.now()}`, date: new Date().toISOString(), status: 'OPEN' as const };
    this.set('tickets', [newTicket, ...tickets]);
  }
  
  // --- BACKUP & RESTORE ---

  private jsonToSql(tableName: string, data: any[]): string {
      if (!data || data.length === 0) return '';
      let sql = `-- Table: ${tableName}\n`;
      data.forEach(row => {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(v => {
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
              if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
              return v;
          }).join(', ');
          sql += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
      });
      sql += '\n';
      return sql;
  }

  createBackup(format: 'JSON' | 'SQL' = 'JSON'): string {
    const backupData = {
      timestamp: new Date().toISOString(),
      schools: this.getSchools(),
      students: this.getStudents(),
      teachers: this.getTeachers(),
      classes: this.getClasses(),
      transactions: this.getTransactions(),
      messages: this.getMessages(),
      events: this.getEvents(),
      users: this.getSystemUsers(),
      books: this.getBooks(),
      loans: this.getLoans(),
      resources: this.getResources(),
      notifications: this.get('notifications', []),
      lessonLogs: this.getLessonLogs(),
      canteenItems: this.getCanteenItems(),
      timeSlots: this.getTimeSlots()
    };

    if (format === 'JSON') {
        return JSON.stringify(backupData, null, 2);
    } else {
        let sqlDump = `-- EcolePro SQL Dump\n-- Generated: ${new Date().toISOString()}\n\n`;
        sqlDump += this.jsonToSql('schools', backupData.schools);
        sqlDump += this.jsonToSql('students', backupData.students);
        sqlDump += this.jsonToSql('teachers', backupData.teachers);
        sqlDump += this.jsonToSql('classes', backupData.classes);
        sqlDump += this.jsonToSql('transactions', backupData.transactions);
        sqlDump += this.jsonToSql('messages', backupData.messages);
        sqlDump += this.jsonToSql('events', backupData.events);
        sqlDump += this.jsonToSql('system_users', backupData.users);
        sqlDump += this.jsonToSql('books', backupData.books);
        sqlDump += this.jsonToSql('loans', backupData.loans);
        sqlDump += this.jsonToSql('resources', backupData.resources);
        sqlDump += this.jsonToSql('lesson_logs', backupData.lessonLogs);
        sqlDump += this.jsonToSql('canteen_items', backupData.canteenItems);
        sqlDump += this.jsonToSql('time_slots', backupData.timeSlots);
        return sqlDump;
    }
  }
  
  restoreBackup(jsonContent: string): boolean {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.schools) throw new Error("Format de sauvegarde invalide ou manquant.");
      
      this.set('schools', data.schools);
      this.set('students', data.students);
      this.set('teachers', data.teachers);
      this.set('classes', data.classes);
      this.set('transactions', data.transactions);
      this.set('messages', data.messages);
      this.set('events', data.events);
      this.set('systemUsers', data.users);
      if(data.books) this.set('books', data.books);
      if(data.loans) this.set('loans', data.loans);
      if(data.resources) this.set('resources', data.resources);
      if(data.notifications) this.set('notifications', data.notifications);
      if(data.lessonLogs) this.set('lessonLogs', data.lessonLogs);
      if(data.canteenItems) this.set('canteenItems', data.canteenItems);
      if(data.timeSlots) this.set('timeSlots', data.timeSlots);
      
      return true;
    } catch (e) {
      console.error("Erreur de restauration:", e);
      return false;
    }
  }

  // --- FACTORY RESET ---
  resetDatabase(): void {
      localStorage.clear();
      window.location.reload();
  }
}

export const db = new DatabaseService();
