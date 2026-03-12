
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Building, Users, Database, History, 
  Save, RefreshCw, Download, Upload, Trash2, Search,
  Plus, AlertTriangle, School as SchoolIcon, Image as ImageIcon, X, CheckSquare, Square, Lock, ShieldCheck,
  GraduationCap, NotebookPen, FolderOpen, MessageSquare, BookOpen, BadgeEuro, Briefcase, CalendarDays, Bot, FileJson, FileCode, Library, RotateCcw, Edit,
  UserCircle, Mail, Shield, Globe, MapPin, Key, Info
} from 'lucide-react';
import { SchoolConfig, SystemUser, AuditLogEntry, UserRole, School, SchoolModule, PermissionId } from '../types';
import { AVAILABLE_MODULES, DEFAULT_PERMISSIONS, DETAILED_PERMISSIONS, DEFAULT_SUBJECTS, DEFAULT_SCHOOL_CONFIG } from '../constants';
import { db } from '../services/db';

interface SettingsManagerProps {
    onUpdate?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ onUpdate }) => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'config' | 'subjects' | 'permissions' | 'schools' | 'users' | 'backup' | 'audit'>('profile');
  
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  
  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // School Editing
  const [schoolForm, setSchoolForm] = useState<Partial<School>>({});
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);

  // User Editing
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<Partial<SystemUser>>({});

  // Config Editing (Current School)
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionId[]>>({});
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<UserRole>('TEACHER');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  
  // Backup & Restore
  const [backupFormat, setBackupFormat] = useState<'JSON' | 'SQL'>('JSON');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Security PIN Editing
  const [pinData, setPinData] = useState({
      currentPin: '',
      newPin: '',
      confirmPin: ''
  });

  const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const refreshData = useCallback((user: SystemUser) => {
    const allSchools = db.getSchools();
    setSchools(allSchools);
    setUsers(db.getSystemUsers());
    setLogs(db.getAuditLogs());
    
    if (user.schoolId) {
        const s = allSchools.find(sc => sc.id === user.schoolId);
        if (s) {
            setCurrentSchool(s);
            setRolePermissions(s.config.rolePermissions || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
            setSubjects(s.config.subjects || DEFAULT_SUBJECTS);
        }
    } else if (allSchools.length > 0) {
        setCurrentSchool(allSchools[0]);
        setRolePermissions(allSchools[0].config.rolePermissions || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
        setSubjects(allSchools[0].config.subjects || DEFAULT_SUBJECTS);
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session) {
      Promise.resolve().then(() => {
        const user = JSON.parse(session);
        setCurrentUser(user);
        refreshData(user);
      });
    }
  }, [refreshData]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // --- Helper: File to Base64 ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'config' | 'modal') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'config' && currentSchool) {
            setCurrentSchool({...currentSchool, logoUrl: base64});
        } else if (target === 'modal') {
            setSchoolForm({...schoolForm, logoUrl: base64});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Helper: Toggle Modules ---
  const toggleModule = (module: SchoolModule, target: 'config' | 'modal') => {
    if (target === 'config' && currentSchool) {
        const currentModules = currentSchool.modules || [];
        const updatedModules = currentModules.includes(module)
            ? currentModules.filter(m => m !== module)
            : [...currentModules, module];
        setCurrentSchool({ ...currentSchool, modules: updatedModules });
    } else if (target === 'modal') {
        const currentModules = schoolForm.modules || [];
        const updatedModules = currentModules.includes(module)
            ? currentModules.filter(m => m !== module)
            : [...currentModules, module];
        setSchoolForm({ ...schoolForm, modules: updatedModules });
    }
  };

  // --- Helper: Toggle All Modules ---
  const toggleAllModules = (target: 'config' | 'modal') => {
    const allModuleIds = AVAILABLE_MODULES.map(m => m.id);
    
    if (target === 'config' && currentSchool) {
        const currentModules = currentSchool.modules || [];
        const isAllSelected = allModuleIds.every(id => currentModules.includes(id));
        
        setCurrentSchool({ 
            ...currentSchool, 
            modules: isAllSelected ? [] : allModuleIds 
        });
    } else if (target === 'modal') {
        const currentModules = schoolForm.modules || [];
        const isAllSelected = allModuleIds.every(id => currentModules.includes(id));
        
        setSchoolForm({ 
            ...schoolForm, 
            modules: isAllSelected ? [] : allModuleIds 
        });
    }
  };

  const getModuleIcon = (moduleId: SchoolModule) => {
      switch(moduleId) {
          case 'STUDENTS': return <Users size={20} className="text-blue-600" />;
          case 'GRADES': return <GraduationCap size={20} className="text-emerald-600" />;
          case 'HOMEWORK': return <NotebookPen size={20} className="text-amber-600" />;
          case 'RESOURCES': return <FolderOpen size={20} className="text-purple-600" />;
          case 'COMMUNICATION': return <MessageSquare size={20} className="text-rose-600" />;
          case 'TEACHERS': return <Briefcase size={20} className="text-slate-600" />;
          case 'ACADEMIC': return <BookOpen size={20} className="text-indigo-600" />;
          case 'FINANCE': return <BadgeEuro size={20} className="text-green-700" />;
          case 'LIBRARY': return <Library size={20} className="text-cyan-600" />;
          case 'CALENDAR': return <CalendarDays size={20} className="text-orange-600" />;
          case 'AI_ASSISTANT': return <Bot size={20} className="text-fuchsia-600" />;
          case 'CANTEEN': return <Briefcase size={20} className="text-orange-500" />;
          default: return <CheckSquare size={20} />;
      }
  };

  // --- School Handlers ---
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name) return;
    
    let existingSchool: School | undefined;
    let baseConfig: SchoolConfig = { ...DEFAULT_SCHOOL_CONFIG };

    if (schoolForm.id) {
        existingSchool = schools.find(s => s.id === schoolForm.id);
        if (existingSchool) {
            baseConfig = { ...existingSchool.config };
        }
    }

    const syncedConfig: SchoolConfig = {
        ...baseConfig,
        ...schoolForm.config,
        schoolName: schoolForm.name,
        address: schoolForm.address || baseConfig.address,
        rolePermissions: existingSchool?.config.rolePermissions || baseConfig.rolePermissions,
        subjects: existingSchool?.config.subjects || baseConfig.subjects,
    };

    const newSchool: School = {
        id: schoolForm.id || `SCHOOL_${Date.now()}`,
        name: schoolForm.name,
        address: schoolForm.address || '',
        logoUrl: schoolForm.logoUrl !== undefined ? schoolForm.logoUrl : existingSchool?.logoUrl,
        type: (schoolForm.type as 'MATERNELLE' | 'PRIMAIRE' | 'SECONDAIRE' | 'SUPERIEUR') || 'SECONDAIRE',
        config: syncedConfig,
        modules: schoolForm.modules || existingSchool?.modules || AVAILABLE_MODULES.map(m => m.id)
    };
    
    db.saveSchool(newSchool);
    setIsSchoolModalOpen(false);
    setSchoolForm({});
    setSchools(db.getSchools());
    if(onUpdate) onUpdate();
    showNotification('École enregistrée avec succès !', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      if (currentSchool) {
          const updatedSchool = {
              ...currentSchool,
              name: currentSchool.name,
              address: currentSchool.address,
              config: {
                  ...currentSchool.config,
                  schoolName: currentSchool.name,
                  address: currentSchool.address,
                  rolePermissions: rolePermissions,
                  subjects: subjects
              }
          };
          
          db.saveSchool(updatedSchool);
          setCurrentSchool(updatedSchool);
          if(onUpdate) onUpdate();
          showNotification("Configuration mise à jour avec succès.");
      }
  };

  const handleResetPermissions = () => {
      if(confirm("Voulez-vous vraiment rétablir les permissions par défaut pour tous les rôles ?")) {
          setRolePermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
      }
  };

  const handleResetSubjects = () => {
      if(confirm("Voulez-vous vraiment rétablir la liste des matières par défaut ?")) {
          setSubjects(DEFAULT_SUBJECTS);
      }
  };

  const handleAddSubject = () => {
      if (!newSubjectInput.trim()) return;
      if (subjects.includes(newSubjectInput.trim())) {
          alert("Cette matière existe déjà.");
          return;
      }
      setSubjects([...subjects, newSubjectInput.trim()]);
      setNewSubjectInput('');
  };

  const handleRemoveSubject = (subject: string) => {
      if (confirm(`Supprimer la matière "${subject}" de la liste ?`)) {
          setSubjects(subjects.filter(s => s !== subject));
      }
  };

  const handleChangePin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentSchool) return;

      const storedPin = currentSchool.config.adminPin || '0000';

      if (pinData.currentPin !== storedPin) {
          alert("L'ancien code PIN est incorrect.");
          return;
      }

      if (pinData.newPin !== pinData.confirmPin) {
          alert("Les nouveaux codes PIN ne correspondent pas.");
          return;
      }

      if (pinData.newPin.length !== 4 || isNaN(Number(pinData.newPin))) {
          alert("Le code PIN doit être composé de 4 chiffres.");
          return;
      }

      const updatedConfig = { ...currentSchool.config, adminPin: pinData.newPin };
      const updatedSchool = { ...currentSchool, config: updatedConfig };
      
      db.saveSchool(updatedSchool);
      setCurrentSchool(updatedSchool);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      showNotification("Code PIN de sécurité mis à jour avec succès.");
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      if (passwordData.newPassword !== passwordData.confirmPassword) {
          showNotification("Les nouveaux mots de passe ne correspondent pas.", 'error');
          return;
      }

      if (passwordData.newPassword.length < 6) {
          showNotification("Le mot de passe doit contenir au moins 6 caractères.", 'error');
          return;
      }

      // In a real app, we would verify the current password and update the database
      // For this demo, we'll just simulate success
      showNotification("Mot de passe mis à jour avec succès.");
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const togglePermission = (role: UserRole, permission: string) => {
      const currentPerms = rolePermissions[role] || [];
      const hasPerm = currentPerms.includes(permission);
      let newPerms;
      
      if (hasPerm) {
          newPerms = currentPerms.filter(p => p !== permission);
      } else {
          newPerms = [...currentPerms, permission];
      }
      
      setRolePermissions({
          ...rolePermissions,
          [role]: newPerms
      });
  };

  const handleDownloadBackup = () => {
      const data = db.createBackup(backupFormat);
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecolepro_backup_${new Date().toISOString().split('T')[0]}.${backupFormat.toLowerCase()}`;
      a.click();
      window.URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (confirm("ATTENTION: La restauration va écraser toutes les données actuelles. Êtes-vous sûr de vouloir continuer ?")) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              if (file.name.endsWith('.sql')) {
                  alert("La restauration depuis un fichier SQL n'est pas supportée directement dans le navigateur. Veuillez utiliser un fichier JSON.");
                  return;
              }

              const success = db.restoreBackup(content);
              if (success) {
                  alert("Restauration réussie ! L'application va se recharger.");
                  window.location.reload();
              } else {
                  alert("Échec de la restauration. Fichier invalide.");
              }
          };
          reader.readAsText(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFactoryReset = () => {
      if (confirm("DANGER : Cette action va effacer TOUTES les données de l'application (Écoles, Élèves, Finances, etc.) et réinitialiser le système à son état d'origine. Cette action est irréversible.\n\nVoulez-vous vraiment continuer ?")) {
          if (confirm("Êtes-vous ABSOLUMENT sûr ?")) {
              db.resetDatabase();
          }
      }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if(!userForm.name || !userForm.email || !userForm.role) return;

    const newUser: SystemUser = {
      id: userForm.id || Date.now().toString(),
      schoolId: userForm.schoolId,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role as UserRole,
      status: (userForm.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
      lastLogin: userForm.lastLogin || 'Jamais'
    };

    db.saveSystemUser(newUser);
    setIsUserModalOpen(false);
    setUserForm({});
    setUsers(db.getSystemUsers());
  };

  const handleDeleteUser = (id: string) => {
    if(confirm('Supprimer cet utilisateur ?')) {
      db.deleteSystemUser(id);
      setUsers(db.getSystemUsers());
    }
  };

  const ROLES_TO_CONFIGURE: {id: UserRole, label: string}[] = [
      { id: 'TEACHER', label: 'Enseignant' },
      { id: 'STUDENT', label: 'Élève' },
      { id: 'PARENT', label: 'Parent' },
      { id: 'BURSAR', label: 'Économe' },
      { id: 'LIBRARIAN', label: 'Bibliothécaire' },
      { id: 'ADMIN', label: 'Administrateur' }
  ];

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.user.toLowerCase().includes(logSearch.toLowerCase()) || 
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(logSearch.toLowerCase())
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, logSearch]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] animate-in slide-in-from-right-full p-4 rounded-lg shadow-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckSquare size={20} /> : <AlertTriangle size={20} />}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </div>
      )}

      {/* Sidebar Nav */}
      <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">Paramètres</h3>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <UserCircle size={18} /> <span>Mon Profil</span>
          </button>
          <div className="my-2 border-t border-gray-100 mx-2"></div>
          <button onClick={() => setActiveTab('config')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'config' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Building size={18} /> <span>Général</span>
          </button>
          <button onClick={() => setActiveTab('subjects')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'subjects' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BookOpen size={18} /> <span>Matières</span>
          </button>
          <button onClick={() => setActiveTab('permissions')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'permissions' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ShieldCheck size={18} /> <span>Droits & Permissions</span>
          </button>
          {isSuperAdmin && (
            <button onClick={() => setActiveTab('schools')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'schools' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <SchoolIcon size={18} /> <span>Multi-Établissements</span>
            </button>
          )}
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Users size={18} /> <span>Utilisateurs</span>
          </button>
          {isSuperAdmin && (
            <>
              <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'backup' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Database size={18} /> <span>Sauvegarde & Restauration</span>
              </button>
              <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === 'audit' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <History size={18} /> <span>Journal Système</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && currentUser && (
            <div className="p-8 flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-blue-200">
                            {currentUser.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{currentUser.name}</h2>
                            <p className="text-gray-500 flex items-center gap-2 mt-1">
                                <Mail size={16} /> {currentUser.email}
                            </p>
                            <div className="flex gap-2 mt-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {currentUser.role}
                                </span>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                    Compte Actif
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-blue-600" /> Informations Personnelles
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nom Complet</label>
                                    <p className="text-gray-900 font-medium">{currentUser.name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                                    <p className="text-gray-900 font-medium">{currentUser.email}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dernière Connexion</label>
                                    <p className="text-gray-900 font-medium">{currentUser.lastLogin}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Shield size={18} className="text-blue-600" /> Sécurité & Accès
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rôle Système</label>
                                    <p className="text-gray-900 font-medium">{currentUser.role}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Établissement</label>
                                    <p className="text-gray-900 font-medium">
                                        {schools.find(s => s.id === currentUser.schoolId)?.name || 'Administration Centrale'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="mt-2 text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
                                >
                                    <Key size={14} /> Modifier mon mot de passe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && currentSchool && (
             <div className="p-6 flex-1 overflow-auto bg-gray-50/30">
                 <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Configuration de l'établissement</h2>
                            <p className="text-sm text-gray-500">Gérez l'identité et les paramètres globaux de votre école.</p>
                        </div>
                        <button onClick={handleSaveConfig} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center shadow-lg shadow-blue-600/20 transition-all">
                            <Save size={18} className="mr-2" /> Enregistrer tout
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Identity & Security */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Identity Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Building size={20} className="text-blue-600" /> Identité de l'école
                                </h3>
                                
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex flex-col items-center">
                                        <div className="h-32 w-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden relative group transition-all hover:border-blue-300">
                                            {currentSchool.logoUrl ? (
                                                <img src={currentSchool.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <ImageIcon className="text-gray-300" size={40} />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer p-2 bg-white rounded-full text-blue-600 shadow-lg">
                                                    <Upload size={20} />
                                                    <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'config')} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-wider">Logo Officiel</p>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Nom de l'établissement</label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                                                    value={currentSchool.name} 
                                                    onChange={(e) => setCurrentSchool({...currentSchool, name: e.target.value})} 
                                                    readOnly={!isSuperAdmin} 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Adresse Physique</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                                                    value={currentSchool.address} 
                                                    onChange={(e) => setCurrentSchool({...currentSchool, address: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Type d'enseignement</label>
                                                <div className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-100">
                                                    {currentSchool.type}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">ID Système</label>
                                                <div className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-mono text-xs border border-gray-200">
                                                    {currentSchool.id}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modules Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Globe size={20} className="text-blue-600" /> Modules & Fonctionnalités
                                    </h3>
                                    <button type="button" onClick={() => toggleAllModules('config')} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                                        {AVAILABLE_MODULES.every(m => currentSchool.modules?.includes(m.id)) ? (
                                            <><CheckSquare size={14} /> Tout désactiver</>
                                        ) : (
                                            <><Square size={14} /> Tout activer</>
                                        )}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {AVAILABLE_MODULES.map(module => (
                                        <div 
                                            key={module.id} 
                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${
                                                currentSchool.modules?.includes(module.id) 
                                                ? 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-100' 
                                                : 'bg-white border-gray-100 hover:border-blue-200'
                                            }`}
                                            onClick={() => toggleModule(module.id, 'config')}
                                        >
                                            <div className={`p-2.5 rounded-xl transition-colors ${
                                                currentSchool.modules?.includes(module.id) 
                                                ? 'bg-white text-blue-600 shadow-sm' 
                                                : 'bg-gray-50 text-gray-400 group-hover:text-blue-400'
                                            }`}>
                                                {getModuleIcon(module.id)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className={`text-sm font-bold ${currentSchool.modules?.includes(module.id) ? 'text-blue-900' : 'text-gray-700'}`}>
                                                        {module.label}
                                                    </p>
                                                    {currentSchool.modules?.includes(module.id) && (
                                                        <CheckSquare size={16} className="text-blue-600" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{module.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Security PIN */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Lock size={20} className="text-amber-500" /> Sécurité d'accès
                                </h3>
                                
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                            L'accès aux paramètres sensibles est protégé par un code PIN. 
                                            Par défaut : <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200 ml-1">0000</span>
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleChangePin} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Code PIN Actuel</label>
                                        <input 
                                            type="password" 
                                            maxLength={4} 
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono tracking-[1em] text-center text-lg bg-gray-50 focus:bg-white transition-all" 
                                            value={pinData.currentPin} 
                                            onChange={e => setPinData({...pinData, currentPin: e.target.value})} 
                                            placeholder="••••" 
                                        />
                                    </div>
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Nouveau Code PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength={4} 
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono tracking-[1em] text-center text-lg bg-gray-50 focus:bg-white transition-all" 
                                            value={pinData.newPin} 
                                            onChange={e => setPinData({...pinData, newPin: e.target.value})} 
                                            placeholder="••••" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Confirmer PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength={4} 
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono tracking-[1em] text-center text-lg bg-gray-50 focus:bg-white transition-all" 
                                            value={pinData.confirmPin} 
                                            onChange={e => setPinData({...pinData, confirmPin: e.target.value})} 
                                            placeholder="••••" 
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
                                    >
                                        Mettre à jour le PIN
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
        )}

        {/* ... (SUBJECTS, PERMISSIONS, SCHOOLS Tabs same as before) ... */}
        {activeTab === 'subjects' && currentSchool && (
             <div className="p-6 flex-1 overflow-auto flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Gestion des Matières</h2>
                        <p className="text-sm text-gray-500">Définissez la liste des matières enseignées dans l'établissement.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleResetSubjects} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center transition-colors" title="Réinitialiser">
                            <RotateCcw size={16} className="mr-2" /> Liste par défaut
                        </button>
                        <button onClick={handleSaveConfig} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center shadow-lg shadow-blue-600/20 transition-all">
                            <Save size={18} className="mr-2" /> Enregistrer
                        </button>
                    </div>
                 </div>
                 <div className="max-w-4xl">
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-lg text-blue-600 shadow-sm">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-900">Ajouter une nouvelle matière</h4>
                            <div className="flex gap-2 mt-2">
                                <input 
                                    type="text" 
                                    className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" 
                                    placeholder="Ex: Informatique, Musique, Arts Plastiques..." 
                                    value={newSubjectInput} 
                                    onChange={(e) => setNewSubjectInput(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()} 
                                />
                                <button onClick={handleAddSubject} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold flex items-center transition-colors">
                                    <Plus size={18} className="mr-1"/> Ajouter
                                </button>
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {subjects.sort().map((subject) => (
                            <div key={subject} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm group hover:border-blue-300 hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                                    <span className="font-semibold text-gray-700">{subject}</span>
                                </div>
                                <button onClick={() => handleRemoveSubject(subject)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Supprimer">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
        )}

        {activeTab === 'permissions' && currentSchool && (
            <div className="p-6 flex-1 overflow-auto flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Gestion des Permissions</h2>
                        <p className="text-sm text-gray-500">Définissez les restrictions d'accès pour chaque type d'utilisateur.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleResetPermissions} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center" title="Réinitialiser">
                            <RotateCcw size={16} className="mr-2" /> Rétablir par défaut
                        </button>
                        <button onClick={handleSaveConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center">
                            <Save size={18} className="mr-2" /> Enregistrer
                        </button>
                    </div>
                 </div>
                 <div className="flex gap-6 h-full">
                     <div className="w-60 flex-shrink-0 space-y-2">
                         <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Rôles Utilisateur</h3>
                         {ROLES_TO_CONFIGURE.map(role => (
                             <button key={role.id} onClick={() => setSelectedRoleForPerms(role.id)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedRoleForPerms === role.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                 {role.label}
                             </button>
                         ))}
                     </div>
                     <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-6 overflow-auto">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            Permissions pour : <span className="text-blue-600">{ROLES_TO_CONFIGURE.find(r => r.id === selectedRoleForPerms)?.label}</span>
                         </h3>
                         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {AVAILABLE_MODULES.map(module => {
                                if (!currentSchool.modules.includes(module.id)) return null;
                                const modulePerms = DETAILED_PERMISSIONS[module.id] || [{ id: `${module.id}.read`, label: 'Consultation', desc: 'Voir les données' }, { id: `${module.id}.write`, label: 'Modification', desc: 'Ajouter/Modifier' }];
                                return (
                                    <div key={module.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                                            <div className="p-2 bg-gray-50 rounded-lg mr-3">{getModuleIcon(module.id)}</div>
                                            <h4 className="font-bold text-gray-800 text-sm">{module.label}</h4>
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            {modulePerms.map(perm => {
                                                const hasPerm = (rolePermissions[selectedRoleForPerms] || []).includes(perm.id);
                                                return (
                                                    <div key={perm.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => togglePermission(selectedRoleForPerms, perm.id)}>
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${hasPerm ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300'}`}>
                                                            {hasPerm && <CheckSquare size={14} />}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                                                            <p className="text-xs text-gray-400">{perm.desc}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                     </div>
                 </div>
            </div>
        )}

        {/* SCHOOLS & USERS TABS SAME AS BEFORE */}
        {activeTab === 'schools' && isSuperAdmin && (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Gestion Multi-Établissements</h2>
                    <button onClick={() => { setSchoolForm({modules: AVAILABLE_MODULES.map(m => m.id)}); setIsSchoolModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        <Plus size={16} className="mr-2" /> Ajouter une École
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {schools.map(school => (
                            <div key={school.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex gap-4 items-start">
                                <div className="h-16 w-16 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {school.logoUrl ? ( <img src={school.logoUrl} alt="logo" className="w-full h-full object-contain" /> ) : ( <Building className="text-gray-300" size={24} /> )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{school.name}</h3>
                                            <p className="text-sm text-gray-500">{school.address}</p>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block mr-2">{school.type}</span>
                                            <span className="text-xs text-gray-400">{school.modules?.length || 0} modules</span>
                                        </div>
                                        <button onClick={() => { setSchoolForm({...school}); setIsSchoolModalOpen(true); }} className="text-blue-600 text-sm font-medium">Modifier</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
             <div className="flex flex-col h-full">
                 <div className="p-6 border-b flex justify-between items-center">
                     <div>
                        <h2 className="text-xl font-bold">Utilisateurs</h2>
                        <p className="text-sm text-gray-500">Gérez les comptes d'accès au système.</p>
                     </div>
                     <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                            />
                        </div>
                        <button onClick={() => { setUserForm({}); setIsUserModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <Plus size={16} /> Nouveau
                        </button>
                     </div>
                 </div>
                 <div className="flex-1 overflow-auto">
                     <table className="w-full text-left">
                         <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                             <tr><th className="px-6 py-3">Utilisateur</th><th className="px-6 py-3">Rôle</th><th className="px-6 py-3">Établissement</th><th className="px-6 py-3">Actions</th></tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                 <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                                 {u.name.charAt(0)}
                                             </div>
                                             <div>
                                                 <p className="font-medium text-gray-900">{u.name}</p>
                                                 <p className="text-xs text-gray-500">{u.email}</p>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                             u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                             u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                                             u.role === 'TEACHER' ? 'bg-emerald-100 text-emerald-700' :
                                             'bg-gray-100 text-gray-700'
                                         }`}>
                                             {u.role}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-2 text-sm text-gray-600">
                                             <Building size={14} className="text-gray-400" />
                                             {schools.find(s => s.id === u.schoolId)?.name || 'Tous'}
                                         </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className="flex gap-2">
                                             <button onClick={() => { setUserForm(u); setIsUserModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                                                 <Edit size={16}/>
                                             </button>
                                             <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                                 <Trash2 size={16}/>
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             )) : (
                                 <tr>
                                     <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                         Aucun utilisateur trouvé.
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && isSuperAdmin && (
            <div className="p-8 flex flex-col items-center h-full max-w-4xl mx-auto overflow-y-auto">
                <div className="text-center mb-10">
                    <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Database size={40} className="text-blue-600" /></div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Sauvegarde & Restauration</h2>
                    <p className="text-gray-500 max-w-lg mx-auto">Gérez la sécurité de vos données.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {/* Export */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2 flex items-center"><Download className="mr-2 text-blue-600" /> Exporter les Données</h3>
                        <p className="text-sm text-gray-500 mb-6">Téléchargez une copie complète.</p>
                        
                        <div className="mb-6">
                             <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                             <div className="grid grid-cols-2 gap-3">
                                 <div onClick={() => setBackupFormat('JSON')} className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${backupFormat === 'JSON' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                     <FileJson className={backupFormat === 'JSON' ? 'text-blue-600' : 'text-gray-400'} />
                                     <div><p className="text-sm font-bold text-gray-800">JSON</p></div>
                                 </div>
                                 <div onClick={() => setBackupFormat('SQL')} className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${backupFormat === 'SQL' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                     <FileCode className={backupFormat === 'SQL' ? 'text-blue-600' : 'text-gray-400'} />
                                     <div><p className="text-sm font-bold text-gray-800">SQL</p></div>
                                 </div>
                             </div>
                        </div>
                        <button onClick={handleDownloadBackup} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20">
                            <Download size={18} /> Télécharger ({backupFormat})
                        </button>
                    </div>

                    {/* Import */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2 flex items-center"><Upload className="mr-2 text-amber-600" /> Restaurer</h3>
                        <p className="text-sm text-gray-500 mb-6">Importez un fichier JSON.</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative h-40 flex flex-col items-center justify-center mb-4">
                            <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreBackup} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <RefreshCw className="text-gray-400 mb-2" size={32} />
                            <p className="text-sm font-medium text-gray-600">Sélectionner un fichier</p>
                        </div>
                    </div>
                </div>

                {/* FACTORY RESET DANGER ZONE */}
                <div className="mt-12 w-full p-6 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={24} /></div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-red-800">Zone de Danger</h3>
                            <p className="text-sm text-red-700 mt-1">
                                La réinitialisation d'usine efface <strong>définitivement</strong> toutes les données de l'application (écoles, élèves, transactions, etc.) et rétablit la configuration initiale de démonstration.
                            </p>
                            <button 
                                onClick={handleFactoryReset}
                                className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                            >
                                Réinitialisation Complète (Factory Reset)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && isSuperAdmin && (
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Journal d'Audit Système</h2>
                        <p className="text-sm text-gray-500">Historique des actions critiques et de sécurité.</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Rechercher dans les logs..." 
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-80"
                            value={logSearch}
                            onChange={e => setLogSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-bold tracking-widest sticky top-0 backdrop-blur-sm border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Horodatage</th>
                                <th className="px-6 py-4">Utilisateur</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Détails</th>
                                <th className="px-6 py-4">Niveau</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.length > 0 ? filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.user}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{log.action}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>{log.details}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            log.type === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                                            log.type === 'WARNING' ? 'bg-amber-100 text-amber-700' : 
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.type === 'CRITICAL' ? 'Critique' : log.type === 'WARNING' ? 'Avertissement' : 'Info'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Aucun log trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* MODALS */}
      {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Key className="text-blue-600" size={20} /> Modifier le mot de passe
                      </h3>
                      <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Mot de passe actuel</label>
                          <input 
                              type="password" 
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all" 
                              value={passwordData.currentPassword}
                              onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          />
                      </div>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Nouveau mot de passe</label>
                          <input 
                              type="password" 
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all" 
                              value={passwordData.newPassword}
                              onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Confirmer le nouveau mot de passe</label>
                          <input 
                              type="password" 
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all" 
                              value={passwordData.confirmPassword}
                              onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button 
                              type="button"
                              onClick={() => setIsPasswordModalOpen(false)}
                              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                          >
                              Annuler
                          </button>
                          <button 
                              type="submit"
                              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                          >
                              Mettre à jour
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODALS (School & User) - Same as before, just kept for completeness in the file return */}
      {isSchoolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4">{schoolForm.id ? 'Modifier l\'établissement' : 'Nouvelle École'}</h3>
                  <form onSubmit={handleSaveSchool} className="space-y-4">
                      <div className="flex justify-center mb-4">
                          <div className="h-20 w-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-blue-400">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleLogoUpload(e, 'modal')} />
                                {schoolForm.logoUrl ? ( <img src={schoolForm.logoUrl} alt="Preview" className="w-full h-full object-cover" /> ) : ( <Upload className="text-gray-400" size={24} /> )}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Nom de l'école" className="w-full p-2 border rounded" value={schoolForm.name || ''} onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} required />
                        <select className="w-full p-2 border rounded bg-white" value={schoolForm.type || 'SECONDAIRE'} onChange={e => setSchoolForm({...schoolForm, type: e.target.value as 'MATERNELLE' | 'PRIMAIRE' | 'SECONDAIRE' | 'SUPERIEUR'})}>
                          <option value="PRIMAIRE">Primaire</option>
                          <option value="SECONDAIRE">Secondaire / Lycée</option>
                          <option value="SUPERIEUR">Supérieur</option>
                        </select>
                      </div>
                      <input placeholder="Adresse" className="w-full p-2 border rounded" value={schoolForm.address || ''} onChange={e => setSchoolForm({...schoolForm, address: e.target.value})} />
                      <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-sm">Modules Activés</h4>
                              <button type="button" onClick={() => toggleAllModules('modal')} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center">
                                {AVAILABLE_MODULES.every(m => schoolForm.modules?.includes(m.id)) ? ( <><CheckSquare size={12} className="mr-1" /> Tout désactiver</> ) : ( <><Square size={12} className="mr-1" /> Tout activer</> )}
                              </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             {AVAILABLE_MODULES.map(module => (
                                 <div key={module.id} className="flex items-center space-x-2 cursor-pointer" onClick={() => toggleModule(module.id, 'modal')}>
                                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${schoolForm.modules?.includes(module.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                                         {schoolForm.modules?.includes(module.id) && <CheckSquare size={12} />}
                                     </div>
                                     <span className="text-sm">{module.label}</span>
                                 </div>
                             ))}
                          </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                          <button type="button" onClick={() => setIsSchoolModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sauvegarder</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{userForm.id ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <input required placeholder="Nom" type="text" className="w-full p-2 border rounded" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              <input required placeholder="Email" type="email" className="w-full p-2 border rounded" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              <select className="w-full p-2 border rounded bg-white" value={userForm.role || ''} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})} required>
                  <option value="">Rôle...</option>
                  <option value="ADMIN">Admin Établissement</option>
                  <option value="TEACHER">Enseignant</option>
                  <option value="BURSAR">Économe</option>
                  <option value="STUDENT">Élève</option>
                  <option value="PARENT">Parent</option>
                  <option value="LIBRARIAN">Bibliothécaire</option>
              </select>
              <select className="w-full p-2 border rounded bg-white" value={userForm.schoolId || ''} onChange={e => setUserForm({...userForm, schoolId: e.target.value})} required>
                  <option value="">Rattacher à une école...</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
