
import React from 'react';
import { 
  LayoutDashboard, Users, Bot, Settings, LogOut, GraduationCap,
  Briefcase, BookOpen, BadgeEuro, Library, MessageSquare,
  CalendarDays, FolderOpen, Bug, NotebookPen, Utensils, Clock
} from 'lucide-react';
import { ViewState, SystemUser, UserRole, SchoolModule } from '../types';
import { db } from '../services/db';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  currentUser: SystemUser;
  onLogout: () => void;
  onReportBug?: () => void; 
  schoolName?: string;
  schoolLogoUrl?: string;
  enabledModules?: SchoolModule[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onNavigate, currentUser, onLogout, onReportBug, schoolName, schoolLogoUrl, enabledModules = []
}) => {
  
  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Administrateur';
      case 'BURSAR': return 'Économe';
      case 'TEACHER': return 'Enseignant';
      case 'STUDENT': return 'Élève';
      case 'PARENT': return 'Parent';
      case 'LIBRARIAN': return 'Bibliothécaire';
      default: return 'Utilisateur';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  interface MenuItem {
      id: ViewState;
      label: string;
      icon: React.ElementType;
      module?: SchoolModule;
  }

  const allMenuItems: MenuItem[] = [
    { id: ViewState.DASHBOARD, label: 'Tableau de bord', icon: LayoutDashboard }, // Pas de module = Accès par défaut
    { id: ViewState.STUDENTS, label: 'Élèves & Inscriptions', icon: Users, module: 'STUDENTS' },
    { id: ViewState.TEACHERS, label: 'Personnel & RH', icon: Briefcase, module: 'TEACHERS' },
    { id: ViewState.ACADEMIC, label: 'Académique', icon: BookOpen, module: 'ACADEMIC' }, 
    { id: ViewState.TIMETABLE, label: 'Emploi du Temps', icon: Clock, module: 'TIMETABLE' },
    { id: ViewState.HOMEWORK, label: 'Cahier de Texte', icon: NotebookPen, module: 'HOMEWORK' },
    { id: ViewState.CALENDAR, label: 'Calendrier', icon: CalendarDays, module: 'CALENDAR' },
    { id: ViewState.GRADES, label: 'Notes & Bulletins', icon: GraduationCap, module: 'GRADES' },
    { id: ViewState.FINANCE, label: 'Finances', icon: BadgeEuro, module: 'FINANCE' },
    { id: ViewState.CANTEEN, label: 'Cantine', icon: Utensils, module: 'CANTEEN' },
    { id: ViewState.LIBRARY, label: 'Bibliothèque', icon: Library, module: 'LIBRARY' },
    { id: ViewState.RESOURCES, label: 'Ressources Pédago.', icon: FolderOpen, module: 'RESOURCES' },
    { id: ViewState.COMMUNICATION, label: 'Communication', icon: MessageSquare, module: 'COMMUNICATION' },
    { id: ViewState.AI_ASSISTANT, label: 'Assistant IA', icon: Bot, module: 'AI_ASSISTANT' },
    { id: ViewState.SETTINGS, label: 'Configuration', icon: Settings, module: 'SETTINGS' as any }, // Module système spécial
  ];

  // Filtrage dynamique des éléments du menu
  const visibleItems = allMenuItems.filter(item => {
    // 1. Si aucun module n'est lié (ex: Dashboard), on affiche par défaut (sauf règle contraire)
    if (!item.module) return true;

    const schoolId = currentUser.schoolId || '';

    // 2. Vérifier si le module est activé pour l'école (sauf SETTINGS qui est système)
    if (item.module !== 'SETTINGS' as any) {
        if (!enabledModules.includes(item.module)) {
            return false; // Module désactivé pour cet établissement
        }
    }

    // 3. Vérifier les permissions de l'utilisateur (RBAC)
    // Pour SETTINGS, on vérifie le droit d'écriture (administration).
    // Pour les autres modules, on vérifie le droit de lecture (.read).
    const permissionToCheck = item.module === 'SETTINGS' as any 
        ? 'SETTINGS.write' 
        : `${item.module}.read`;

    return db.hasPermission(schoolId, currentUser.role, permissionToCheck);
  });

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen shadow-xl fixed left-0 top-0 z-20 transition-all duration-300">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
        {/* App Logo */}
        <div className="bg-white p-1 rounded-lg shadow-lg shadow-blue-900/50 h-10 w-10 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {schoolLogoUrl ? (
            <img src={schoolLogoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 95C20 85 10 55 10 30L50 5V95Z" fill="#1e40af" />
              <path d="M50 95C80 85 90 55 90 30L50 5V95Z" fill="#d97706" />
              <text x="50" y="62" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="-2">EP</text>
            </svg>
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm leading-tight tracking-tight truncate">
            {schoolName || (
              <>
                <span className="text-white">Ecole</span>
                <span className="text-amber-500">Pro</span>
              </>
            )}
          </h1>
          <p className="text-[10px] text-slate-400 font-light truncate">Gestion Scolaire v3.0</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md border border-slate-600">
            {getInitials(currentUser.name)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-slate-200 truncate">{currentUser.name}</div>
            <div className="text-[10px] text-blue-400 uppercase font-semibold">{getRoleLabel(currentUser.role)}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
              currentView === item.id
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {currentView === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full"></div>
            )}
            <item.icon size={18} className={`transition-colors ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-2">
        <button 
          onClick={onReportBug}
          className="flex items-center space-x-3 text-slate-500 hover:text-amber-400 w-full px-4 py-2 transition-colors hover:bg-slate-800/50 rounded-lg text-xs"
        >
          <Bug size={16} />
          <span className="font-medium">Signaler un problème</span>
        </button>

        <button 
          onClick={onLogout}
          className="flex items-center space-x-3 text-slate-400 hover:text-red-400 w-full px-4 py-2 transition-colors hover:bg-slate-800 rounded-lg"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};
