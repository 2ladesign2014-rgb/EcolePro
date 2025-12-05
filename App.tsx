
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { StudentList } from './components/StudentList';
import { TeachersList } from './components/TeachersList';
import { AIAssistant } from './components/AIAssistant';
import { AcademicManager } from './components/AcademicManager';
import { HomeworkManager } from './components/HomeworkManager'; 
import { GradesManager } from './components/GradesManager';
import { FinanceManager } from './components/FinanceManager';
import { CommunicationHub } from './components/CommunicationHub';
import { CalendarView } from './components/CalendarView';
import { SettingsManager } from './components/SettingsManager';
import { LibraryManager } from './components/LibraryManager'; 
import { ResourcesManager } from './components/ResourcesManager';
import { CanteenManager } from './components/CanteenManager'; 
import { TimeTableManager } from './components/TimeTableManager'; // New Import
import { ViewState, DashboardStats, Student, Teacher, SchoolClass, Transaction, Message, CalendarEvent, SystemUser, AppNotification, School } from './types';
import { db } from './services/db';
import { Bell, Wifi, WifiOff, Lock, AlertCircle, Server, X, CheckCircle, Building, ChevronDown, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [schools, setSchools] = useState<School[]>([]);

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // School Selector State (Super Admin)
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);

  // Security PIN State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);

  // Bug Report
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugDescription, setBugDescription] = useState('');

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<Student[]>([]); 
  const [outgoingTransfers, setOutgoingTransfers] = useState<Student[]>([]); // New state for outgoing
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Initialization
  useEffect(() => {
    const allSchools = db.getSchools();
    setSchools(allSchools);

    // Check for existing session
    const savedSession = localStorage.getItem('session');
    if (savedSession) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
      
      // Determine Active School
      if (user.schoolId) {
          // Normal User: Linked to specific school
          const usersSchool = allSchools.find(s => s.id === user.schoolId);
          setActiveSchool(usersSchool || allSchools[0]);
      } else if (user.role === 'SUPER_ADMIN') {
          // Super Admin: Default to first school or saved preference
          const savedSchoolId = localStorage.getItem('activeSchoolId');
          const defaultSchool = allSchools.find(s => s.id === savedSchoolId) || allSchools[0];
          setActiveSchool(defaultSchool);
      }
    }

    // Online/Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reload Data when Active School or User Changes
  useEffect(() => {
    if (activeSchool && currentUser) {
        const schoolId = activeSchool.id;
        
        // Load Data filtered by School
        setStudents(db.getStudents(schoolId));
        setIncomingTransfers(db.getIncomingTransfers(schoolId));
        setOutgoingTransfers(db.getTransferredOutStudents(schoolId)); // Fetch outgoing history
        setTeachers(db.getTeachers(schoolId));
        setClasses(db.getClasses(schoolId));
        setTransactions(db.getTransactions(schoolId));
        setMessages(db.getMessages(schoolId));
        setEvents(db.getEvents(schoolId));
        setNotifications(db.getAppNotifications(currentUser, schoolId));
        
        if (currentUser.role === 'SUPER_ADMIN') {
            localStorage.setItem('activeSchoolId', schoolId);
        }
    }
  }, [activeSchool, currentUser, currentView]); 

  const handleLogin = (user: SystemUser) => {
    setCurrentUser(user);
    localStorage.setItem('session', JSON.stringify(user));
    
    const allSchools = db.getSchools();
    setSchools(allSchools);

    if (user.schoolId) {
        const s = allSchools.find(sc => sc.id === user.schoolId);
        setActiveSchool(s || allSchools[0]);
    } else {
        // Super Admin defaults
        setActiveSchool(allSchools[0]);
    }
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSchool(null);
    localStorage.removeItem('session');
    localStorage.removeItem('activeSchoolId');
    setCurrentView(ViewState.DASHBOARD);
    setNotifications([]);
    setIsSettingsUnlocked(false); // Reset PIN access
  };

  // Wrappers to inject schoolId
  const handleAddStudent = (newStudent: Student) => {
    if (!activeSchool) return;
    db.saveStudent({ ...newStudent, schoolId: activeSchool.id });
    setStudents(db.getStudents(activeSchool.id));
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!activeSchool) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier élève ?')) {
      db.deleteStudent(studentId);
      setStudents(db.getStudents(activeSchool.id));
    }
  };

  const handleRefreshData = () => {
      if(activeSchool) {
          setStudents(db.getStudents(activeSchool.id));
          setIncomingTransfers(db.getIncomingTransfers(activeSchool.id));
          setOutgoingTransfers(db.getTransferredOutStudents(activeSchool.id));
          setEvents(db.getEvents(activeSchool.id));
      }
  };

  const handleRefreshClasses = () => {
    if (activeSchool) setClasses(db.getClasses(activeSchool.id));
  };
  
  const handleRefreshTeachers = () => {
    if (activeSchool) setTeachers(db.getTeachers(activeSchool.id));
  };

  const handleSendMessage = (msg: Message) => {
    if (!activeSchool) return;
    db.sendMessage({ ...msg, schoolId: activeSchool.id });
    setMessages(db.getMessages(activeSchool.id));
  };
  
  const handleAddTransaction = (trx: Transaction) => {
    if (!activeSchool) return;
    db.addTransaction({ ...trx, schoolId: activeSchool.id });
    setTransactions(db.getTransactions(activeSchool.id));
  };

  // Handle Settings Update to refresh ActiveSchool state immediately
  const handleForceRefresh = () => {
      const allSchools = db.getSchools();
      setSchools(allSchools);
      if (activeSchool) {
          const updated = allSchools.find(s => s.id === activeSchool.id);
          if(updated) setActiveSchool(updated);
      }
  };

  // Navigation Interceptor for PIN Protection
  const handleNavigate = (view: ViewState) => {
      if (view === ViewState.SETTINGS && !isSettingsUnlocked) {
          setPendingView(view);
          setPinInput('');
          setShowPinModal(true);
      } else {
          setCurrentView(view);
      }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const correctPin = activeSchool?.config.adminPin || '0000';
      if (pinInput === correctPin) {
          setIsSettingsUnlocked(true);
          setShowPinModal(false);
          if (pendingView) {
              setCurrentView(pendingView);
              setPendingView(null);
          }
      } else {
          alert("Code PIN incorrect.");
          setPinInput('');
      }
  };

  const submitBugReport = () => {
    if (!currentUser || !bugDescription) return;
    db.createSupportTicket({
      userId: currentUser.id,
      userName: currentUser.name,
      issue: bugDescription
    });
    alert("Signalement envoyé. Merci !");
    setBugDescription('');
    setShowBugReport(false);
  };

  const stats: DashboardStats = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    if (totalStudents === 0) {
      return { totalStudents: 0, totalTeachers, averageAttendance: 0, schoolAverage: 0 };
    }
    return {
      totalStudents,
      totalTeachers,
      averageAttendance: Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / totalStudents),
      schoolAverage: Number((students.reduce((acc, s) => acc + s.average, 0) / totalStudents).toFixed(1))
    };
  }, [students, teachers]);

  // --- View Translation Helper ---
  const getViewLabel = (view: ViewState): string => {
      switch(view) {
          case ViewState.DASHBOARD: return 'TABLEAU DE BORD';
          case ViewState.STUDENTS: return 'ÉLÈVES & INSCRIPTIONS';
          case ViewState.TEACHERS: return 'PERSONNEL';
          case ViewState.ACADEMIC: return 'ACADÉMIQUE';
          case ViewState.TIMETABLE: return 'EMPLOI DU TEMPS';
          case ViewState.HOMEWORK: return 'CAHIER DE TEXTE';
          case ViewState.GRADES: return 'NOTES & BULLETINS';
          case ViewState.FINANCE: return 'FINANCES';
          case ViewState.LIBRARY: return 'BIBLIOTHÈQUE';
          case ViewState.CANTEEN: return 'CANTINE';
          case ViewState.RESOURCES: return 'RESSOURCES PÉDAGOGIQUES';
          case ViewState.COMMUNICATION: return 'MESSAGERIE';
          case ViewState.AI_ASSISTANT: return 'ASSISTANT IA';
          case ViewState.CALENDAR: return 'CALENDRIER';
          case ViewState.SETTINGS: return 'PARAMÈTRES';
          default: return view;
      }
  };

  const renderContent = () => {
    if (!currentUser || !activeSchool) return null;
    const role = currentUser.role;

    // Permission Check using db.hasPermission for View Access
    const moduleMap: Record<string, string> = {
        [ViewState.STUDENTS]: 'STUDENTS.read',
        [ViewState.TEACHERS]: 'TEACHERS.read',
        [ViewState.ACADEMIC]: 'ACADEMIC.read',
        [ViewState.TIMETABLE]: 'TIMETABLE.read',
        [ViewState.HOMEWORK]: 'HOMEWORK.read',
        [ViewState.GRADES]: 'GRADES.read',
        [ViewState.FINANCE]: 'FINANCE.read',
        [ViewState.LIBRARY]: 'LIBRARY.read',
        [ViewState.CANTEEN]: 'CANTEEN.read',
        [ViewState.RESOURCES]: 'RESOURCES.read',
        [ViewState.COMMUNICATION]: 'COMMUNICATION.read',
        [ViewState.AI_ASSISTANT]: 'AI_ASSISTANT.read',
        [ViewState.CALENDAR]: 'CALENDAR.read',
    };

    const requiredPermission = moduleMap[currentView];
    
    // Allow DASHBOARD always, check specific permissions for others
    if (requiredPermission && !db.hasPermission(activeSchool.id, role, requiredPermission)) {
         return <div className="flex justify-center items-center h-full text-gray-400 flex-col"><Lock size={48} className="mb-4" />Accès non autorisé.</div>;
    }
    
    // SETTINGS special check
    if (currentView === ViewState.SETTINGS && !db.hasPermission(activeSchool.id, role, 'SETTINGS.write')) {
         return <div className="flex justify-center items-center h-full text-gray-400 flex-col"><Lock size={48} className="mb-4" />Accès non autorisé.</div>;
    }

    const currentSchoolId = activeSchool.id;

    switch (currentView) {
      case ViewState.DASHBOARD: return <Dashboard stats={stats} />;
      case ViewState.STUDENTS: 
          return <StudentList 
                    students={students} 
                    onAddStudent={handleAddStudent} 
                    onDeleteStudent={handleDeleteStudent} 
                    currentSchoolId={currentSchoolId} 
                    schools={schools}
                    incomingTransfers={incomingTransfers}
                    outgoingTransfers={outgoingTransfers}
                    onRefresh={handleRefreshData}
                    currentUser={currentUser}
                 />;
      case ViewState.TEACHERS: return <TeachersList teachers={teachers} currentSchoolId={currentSchoolId} onRefresh={handleRefreshTeachers} currentUser={currentUser} />;
      case ViewState.ACADEMIC: 
          return <AcademicManager 
                    classes={classes} 
                    teachers={teachers} 
                    onRefresh={handleRefreshClasses} 
                    currentSchoolId={currentSchoolId}
                    currentUser={currentUser}
                 />;
      case ViewState.TIMETABLE: return <TimeTableManager currentSchoolId={currentSchoolId} currentUser={currentUser} classes={classes} teachers={teachers} />;
      case ViewState.HOMEWORK: return <HomeworkManager currentSchoolId={currentSchoolId} classes={classes} teachers={teachers} currentUser={currentUser} />;
      case ViewState.GRADES: return <GradesManager students={students} currentSchoolId={currentSchoolId} currentUser={currentUser} />;
      case ViewState.FINANCE: return <FinanceManager transactions={transactions} onAddTransaction={handleAddTransaction} currentSchoolId={currentSchoolId} currentUser={currentUser} />;
      case ViewState.LIBRARY: return <LibraryManager currentUser={currentUser} currentSchoolId={currentSchoolId} />;
      case ViewState.CANTEEN: return <CanteenManager currentSchoolId={currentSchoolId} currentUser={currentUser} />;
      case ViewState.RESOURCES: return <ResourcesManager currentSchoolId={currentSchoolId} currentUser={currentUser} />;
      case ViewState.COMMUNICATION: return <CommunicationHub messages={messages} onSendMessage={handleSendMessage} currentUser={currentUser} currentSchoolId={currentSchoolId} />;
      case ViewState.AI_ASSISTANT: return <AIAssistant students={students} />;
      case ViewState.CALENDAR: return <CalendarView events={events} currentSchoolId={currentSchoolId} onRefresh={handleRefreshData} currentUser={currentUser} />;
      case ViewState.SETTINGS: return <SettingsManager onUpdate={handleForceRefresh} />;
      default: return <Dashboard stats={stats} />;
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        currentUser={currentUser}
        onLogout={handleLogout}
        onReportBug={() => setShowBugReport(true)}
        schoolName={activeSchool?.name}
        schoolLogoUrl={activeSchool?.logoUrl}
        enabledModules={activeSchool?.modules} // Pass activated modules to Sidebar
      />

      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto custom-scrollbar relative">
        {/* ... (Header et reste du layout inchangés, seul renderContent a été modifié ci-dessus pour passer les props) ... */}
        {/* Pour gagner de la place, je ne répète pas tout le JSX du header s'il n'a pas changé, sauf si demandé */}
        
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-center py-1 text-xs font-bold z-50">
            Mode Hors Ligne - Synchronisation en attente.
          </div>
        )}

        <header className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 sticky top-0 z-20 shadow-sm">
          <div>
            {/* School Selector for Super Admin */}
            {currentUser.role === 'SUPER_ADMIN' && activeSchool ? (
               <div className="relative mb-1">
                  <button 
                    onClick={() => setIsSchoolMenuOpen(!isSchoolMenuOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="h-8 w-8 bg-white rounded-md shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
                        {activeSchool.logoUrl ? (
                            <img src={activeSchool.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building size={16} className="text-blue-600" />
                        )}
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-slate-800 text-lg leading-tight">{activeSchool.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{activeSchool.type}</div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSchoolMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Custom Interactive Dropdown */}
                  {isSchoolMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSchoolMenuOpen(false)}></div>
                        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase">Changer d'établissement</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{schools.length} disponibles</span>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {schools.map(s => (
                                    <button 
                                      key={s.id}
                                      onClick={() => { setActiveSchool(s); setIsSchoolMenuOpen(false); }}
                                      className={`w-full flex items-start gap-3 p-2 rounded-lg transition-all ${activeSchool.id === s.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}
                                    >
                                        <div className="h-10 w-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {s.logoUrl ? (
                                                <img src={s.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <Building size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${activeSchool.id === s.id ? 'text-blue-700' : 'text-gray-800'}`}>{s.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{s.address}</div>
                                        </div>
                                        {activeSchool.id === s.id && <CheckCircle size={16} className="text-blue-600 mt-1" />}
                                    </button>
                                ))}
                            </div>

                            <div className="p-2 border-t border-gray-100 bg-gray-50">
                                <button 
                                    onClick={() => { setCurrentView(ViewState.SETTINGS); setIsSchoolMenuOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 p-2 text-sm font-bold text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                                >
                                    <Settings size={16} /> Gérer les établissements
                                </button>
                            </div>
                        </div>
                      </>
                  )}
               </div>
            ) : (
               <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                 {activeSchool?.logoUrl && <img src={activeSchool.logoUrl} alt="logo" className="h-8 w-8 object-contain" />}
                 {activeSchool?.name || 'Mon Établissement'}
               </h1>
            )}
            <div className="flex items-center text-slate-500 text-xs mt-1 space-x-2">
              <span className="font-medium text-slate-400">Module :</span>
              <span className="font-bold text-blue-600 uppercase">{getViewLabel(currentView)}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             {/* Notifications */}
             <div className="relative">
               <button 
                 onClick={() => setShowNotifications(!showNotifications)}
                 className="p-2 text-slate-400 hover:text-slate-600 relative hover:bg-gray-100 rounded-full transition-colors"
               >
                 <Bell size={20} />
                 {notifications.filter(n => !n.read).length > 0 && (
                   <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                 )}
               </button>
               {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 text-sm">Notifications</h3>
                      <button 
                        onClick={() => {setNotifications(notifications.map(n => ({...n, read: true}))); setShowNotifications(false)}}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Tout lu
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-xs">Aucune notification.</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                                    <div className="flex gap-2">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.category === 'HOMEWORK' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-800">{notif.title}</h4>
                                            <p className="text-xs text-gray-600">{notif.message}</p>
                                            <div className="flex gap-1 mt-1">
                                              {notif.channels?.includes('PUSH') && <span className="text-[8px] bg-gray-200 px-1 rounded">PUSH</span>}
                                              {notif.channels?.includes('EMAIL') && <span className="text-[8px] bg-gray-200 px-1 rounded">MAIL</span>}
                                              {notif.actionLink && <span className="text-[8px] bg-blue-100 text-blue-800 px-1 rounded font-medium cursor-pointer" onClick={() => setCurrentView(notif.actionLink!)}>VOIR</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                  </div>
               )}
             </div>

             <div className="flex items-center space-x-3 pl-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-slate-700">{currentUser.name}</div>
                  <div className="text-xs text-slate-500">{currentUser.role}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  {currentUser.name.substring(0,2).toUpperCase()}
                </div>
             </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </main>

      {/* PIN Access Modal & Bug Report */}
      {showPinModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100">
                 <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Lock size={32} className="text-amber-600" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-2">Accès Sécurisé</h3>
                 <p className="text-gray-500 text-sm mb-6">Veuillez entrer le code PIN administrateur pour accéder à la configuration.</p>
                 
                 <form onSubmit={handlePinSubmit}>
                     <input 
                       type="password" 
                       autoFocus
                       maxLength={4}
                       className="w-full text-center text-2xl tracking-[0.5em] py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none font-bold text-gray-700 mb-6"
                       value={pinInput}
                       onChange={e => setPinInput(e.target.value)}
                       placeholder="••••"
                     />
                     <div className="grid grid-cols-2 gap-3">
                         <button 
                           type="button" 
                           onClick={() => { setShowPinModal(false); setPinInput(''); }}
                           className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                         >
                           Annuler
                         </button>
                         <button 
                           type="submit" 
                           disabled={pinInput.length < 4}
                           className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           Déverrouiller
                         </button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {showBugReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Signaler un problème</h3>
            <textarea 
              className="w-full border rounded p-2 text-sm mb-4 h-32"
              placeholder="Description..."
              value={bugDescription}
              onChange={e => setBugDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBugReport(false)} className="px-4 py-2 text-gray-600">Annuler</button>
              <button onClick={submitBugReport} className="px-4 py-2 bg-red-600 text-white rounded">Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
