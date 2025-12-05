import React, { useState } from 'react';
import { SchoolClass, Teacher, SystemUser } from '../types';
import { Users, MapPin, BookOpen, GraduationCap, Plus, Edit, Trash2, X, Save, LayoutGrid, List, Search, Printer, MoreVertical, ChevronRight, Home, Download } from 'lucide-react';
import { db } from '../services/db';

interface AcademicManagerProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  onRefresh: () => void;
  currentSchoolId: string;
  currentUser: SystemUser;
}

export const AcademicManager: React.FC<AcademicManagerProps> = ({ classes, teachers, onRefresh, currentSchoolId, currentUser }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SchoolClass>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Permission Check
  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'ACADEMIC.write');

  // Filter classes
  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.room && c.room.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTeacher = (id: string) => teachers.find(te => te.id === id);

  const handleOpenModal = (cls?: SchoolClass) => {
    if (cls) {
      setFormData(cls);
      setIsEditing(true);
    } else {
      const config = db.getSchoolConfig(currentSchoolId);
      setFormData({
        name: '',
        level: '6ème',
        mainTeacherId: '',
        studentCount: 0,
        room: '',
        section: '',
        capacity: 40,
        academicYear: config.academicYear || '2024-2025'
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.level) return;

    const clsData = {
      id: formData.id || `CLS-${Date.now()}`,
      schoolId: classes.length > 0 ? classes[0].schoolId : 'SCHOOL_01', // Fallback
      name: formData.name!,
      level: formData.level!,
      mainTeacherId: formData.mainTeacherId || '',
      studentCount: Number(formData.studentCount) || 0,
      room: formData.room || '',
      section: formData.section || '',
      capacity: Number(formData.capacity) || 40,
      academicYear: formData.academicYear || '2024-2025'
    } as SchoolClass;

    if (isEditing) {
      db.updateClass(clsData);
    } else {
      db.addClass(clsData);
    }
    
    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      db.deleteClass(id);
      onRefresh();
    }
  };

  const handlePrintClassList = (cls: SchoolClass) => {
      const teacher = getTeacher(cls.mainTeacherId);
      const school = db.getSchoolById(currentSchoolId);
      const printWindow = window.open('', '', 'width=800,height=600');
      if(printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Liste de Classe - ${cls.name}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .header-container { display: flex; align-items: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
                  .logo { width: 80px; height: 80px; object-fit: contain; margin-right: 20px; }
                  .school-info h1 { margin: 0; color: #1e40af; font-size: 24px; text-transform: uppercase; }
                  .school-info p { margin: 2px 0; font-size: 12px; color: #555; }
                  .title { text-align: center; margin: 30px 0; font-size: 20px; font-weight: bold; text-decoration: underline; }
                  .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; background: #f8f9fa; padding: 10px; border-radius: 5px; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                  th { background-color: #f1f5f9; }
                </style>
              </head>
              <body>
                <div class="header-container">
                  ${school?.logoUrl ? `<img src="${school.logoUrl}" class="logo" alt="Logo" />` : ''}
                  <div class="school-info">
                    <h1>${school?.name || 'Nom de l\'Établissement'}</h1>
                    <p>${school?.address || ''}</p>
                    <p>Année Scolaire ${cls.academicYear || school?.config.academicYear || '2023-2024'}</p>
                  </div>
                </div>

                <div class="title">LISTE OFFICIELLE : ${cls.name}</div>

                <div class="info">
                  <div><strong>Prof. Principal:</strong> ${teacher ? teacher.firstName + ' ' + teacher.lastName : 'Non assigné'}</div>
                  <div><strong>Salle:</strong> ${cls.room || 'N/A'}</div>
                  <div><strong>Effectif:</strong> ${cls.studentCount} / ${cls.capacity || 40} élèves</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Matricule</th>
                      <th>Nom & Prénoms</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Mock Data for Print Preview -->
                    ${Array.from({length: cls.studentCount}).map((_, i) => `
                      <tr>
                        <td>${i + 1}</td>
                        <td>MAT-${2023000 + i}</td>
                        <td>Nom de l'élève ${i + 1}</td>
                        <td>Inscrit</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <script>window.print();</script>
              </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  // Capacity simulation for the UI (Standard capacity usually 50 or 60)
  const DEFAULT_MAX_CAPACITY = 60;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
      
      {/* Breadcrumb & Title */}
      <div className="flex flex-col">
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Home size={12} className="mr-1" />
          <span>Accueil</span>
          <ChevronRight size={12} className="mx-1" />
          <span className="font-medium text-gray-800">Gestion des classes</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Gestion Académique</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Classes</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">{classes.length}</h3>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><LayoutGrid size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Élèves</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">{classes.reduce((acc, c) => acc + c.studentCount, 0)}</h3>
           </div>
           <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors"><Users size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Matières</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">12</h3>
           </div>
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors"><BookOpen size={20} /></div>
        </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Salles</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">{classes.length}</h3>
           </div>
           <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><MapPin size={20} /></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <ChevronRight size={20} strokeWidth={3} />
                Liste des classes
             </div>
             <div className="hidden md:block h-6 w-px bg-gray-300 mx-2"></div>
             <div className="text-sm text-gray-500 hidden md:block">
               Effectif total : <span className="font-bold text-gray-800">{classes.reduce((acc, c) => acc + c.studentCount, 0)} élèves</span>
             </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
               <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vue Liste"
               >
                  <List size={18} />
               </button>
               <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vue Grille"
               >
                  <LayoutGrid size={18} />
               </button>
            </div>

            {canWrite && (
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Nouvelle Classe</span>
                </button>
            )}
          </div>
        </div>

        {/* Content List/Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4 w-16 text-center">N°</th>
                      <th className="px-6 py-4">Code / Nom</th>
                      <th className="px-6 py-4">Niveau</th>
                      <th className="px-6 py-4 w-1/4">Effectif & Capacité</th>
                      <th className="px-6 py-4">Prof. Principal</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredClasses.map((cls, index) => {
                      const teacher = getTeacher(cls.mainTeacherId);
                      const capacity = cls.capacity || DEFAULT_MAX_CAPACITY;
                      const fillPercentage = Math.min((cls.studentCount / capacity) * 100, 100);
                      
                      return (
                        <tr key={cls.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="px-6 py-4 text-center text-gray-500 font-mono text-sm">
                              {index + 1}
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center">
                                 <div className="h-8 w-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mr-3">
                                    {cls.name.substring(0,2).toUpperCase()}
                                 </div>
                                 <div>
                                    <div className="font-bold text-gray-800 text-sm">{cls.name}</div>
                                    <div className="text-xs text-gray-500">Salle : {cls.room || 'Non définie'}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-600">
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                                {cls.level}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-xs font-bold text-gray-700">{cls.studentCount} élèves</span>
                                 <span className="text-[10px] font-medium text-gray-400 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                                   Max {capacity}
                                 </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                 <div 
                                    className={`h-2 rounded-full ${fillPercentage > 90 ? 'bg-red-500' : fillPercentage > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${fillPercentage}%` }}
                                 ></div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              {teacher ? (
                                 <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] mr-2 font-bold text-slate-600">
                                       {teacher.firstName[0]}{teacher.lastName[0]}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]">
                                       {teacher.firstName} {teacher.lastName}
                                    </span>
                                 </div>
                              ) : (
                                 <span className="text-xs text-gray-400 italic">Non assigné</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 <button 
                                    onClick={() => handlePrintClassList(cls)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-900 transition-colors shadow-sm"
                                 >
                                    <Printer size={12} /> Imprimer
                                 </button>
                                 {canWrite && (
                                     <>
                                         <button 
                                            onClick={() => handleOpenModal(cls)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Modifier"
                                         >
                                            <Edit size={16} />
                                         </button>
                                         <button 
                                            onClick={() => handleDelete(cls.id)}
                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                            title="Supprimer"
                                         >
                                            <Trash2 size={16} />
                                         </button>
                                     </>
                                 )}
                              </div>
                           </td>
                        </tr>
                      );
                   })}
                </tbody>
              </table>
            </div>
          ) : (
            // GRID VIEW
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => {
                 const teacher = getTeacher(cls.mainTeacherId);
                 const capacity = cls.capacity || DEFAULT_MAX_CAPACITY;
                 return (
                    <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group relative flex flex-col">
                      {canWrite && (
                          <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(cls)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(cls.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          </div>
                      )}

                      <div className="flex items-center mb-4">
                         <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {cls.name.substring(0,2).toUpperCase()}
                         </div>
                         <div className="ml-3">
                            <h3 className="font-bold text-lg text-gray-800">{cls.name}</h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{cls.level}</span>
                         </div>
                      </div>
                      
                      <div className="space-y-3 text-sm flex-1">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-gray-500 text-xs font-bold uppercase">Effectif</span>
                          <span className="font-bold text-blue-600">{cls.studentCount} <span className="text-gray-400 text-xs font-normal">/ {capacity}</span></span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin size={16} className="mr-2 text-gray-400" />
                          <span>Salle : {cls.room || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <GraduationCap size={16} className="mr-2 text-gray-400" />
                          <span className="truncate">PP: {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Non défini'}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                         <button 
                            onClick={() => handlePrintClassList(cls)}
                            className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                         >
                            <Printer size={14} /> Imprimer
                         </button>
                         <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                            <MoreVertical size={16} />
                         </button>
                      </div>
                    </div>
                 );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
               <h3 className="text-xl font-bold text-gray-900">
                 {isEditing ? 'Modifier la Classe' : 'Nouvelle classe'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
               
               <div className="grid grid-cols-2 gap-6">
                   {/* Row 1: Nom & Niveau */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la classe *</label>
                     <input 
                       type="text" 
                       required
                       placeholder="Ex: 6ème A"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.name || ''}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                     <select 
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                       value={formData.level || ''}
                       onChange={e => setFormData({...formData, level: e.target.value})}
                       required
                     >
                        <option value="">Sélectionner un niveau</option>
                        <option value="6ème">6ème</option>
                        <option value="5ème">5ème</option>
                        <option value="4ème">4ème</option>
                        <option value="3ème">3ème</option>
                        <option value="Seconde">Seconde</option>
                        <option value="Première">Première</option>
                        <option value="Terminale">Terminale</option>
                     </select>
                   </div>

                   {/* Row 2: Section & Effectif */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                     <input 
                       type="text" 
                       placeholder="A, B, C..."
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.section || ''}
                       onChange={e => setFormData({...formData, section: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Effectif maximum</label>
                     <input 
                       type="number" 
                       min="0"
                       placeholder="Ex: 40"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.capacity || ''}
                       onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                     />
                   </div>

                   {/* Row 3: Salle & Prof */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
                     <input 
                       type="text" 
                       placeholder="Ex: 101"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.room || ''}
                       onChange={e => setFormData({...formData, room: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Professeur principal</label>
                     <select 
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                       value={formData.mainTeacherId || ''}
                       onChange={e => setFormData({...formData, mainTeacherId: e.target.value})}
                     >
                        <option value="">Sélectionner un professeur</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.subject})</option>
                        ))}
                     </select>
                   </div>
                   
                   {/* Row 4: Academic Year */}
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                     <input 
                       type="text" 
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.academicYear || '2024-2025'}
                       onChange={e => setFormData({...formData, academicYear: e.target.value})}
                     />
                   </div>
               </div>

               <div className="flex justify-end space-x-3 pt-4 mt-2">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                 >
                   Annuler
                 </button>
                 <button 
                   type="submit" 
                   className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95 text-sm"
                 >
                   Créer
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};