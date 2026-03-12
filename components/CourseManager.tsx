import React, { useState } from 'react';
import { Course, Teacher, SystemUser } from '../types';
import { BookOpen, Plus, Edit, Trash2, X, Search, Home, ChevronRight, Hash, Clock, User, Layers } from 'lucide-react';
import { db } from '../services/db';
import { DEFAULT_SUBJECTS } from '../constants';

interface CourseManagerProps {
  courses: Course[];
  teachers: Teacher[];
  onRefresh: () => void;
  currentSchoolId: string;
  currentUser: SystemUser;
}

export const CourseManager: React.FC<CourseManagerProps> = ({ courses, teachers, onRefresh, currentSchoolId, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Permission Check
  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'COURSES.write');

  // Filter courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.level.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject === '' || c.subject === filterSubject;
    const matchesLevel = filterLevel === '' || c.level === filterLevel;

    return matchesSearch && matchesSubject && matchesLevel;
  });

  const getTeacher = (id?: string) => teachers.find(te => te.id === id);

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setFormData(course);
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        subject: '',
        level: '',
        coefficient: 1,
        hoursPerWeek: 2,
        teacherId: ''
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.subject || !formData.level) return;

    const courseData = {
      id: formData.id || `CRS-${Date.now()}`,
      schoolId: currentSchoolId,
      name: formData.name!,
      code: formData.code!,
      description: formData.description || '',
      subject: formData.subject!,
      level: formData.level!,
      coefficient: Number(formData.coefficient) || 1,
      hoursPerWeek: Number(formData.hoursPerWeek) || 2,
      teacherId: formData.teacherId || ''
    } as Course;

    db.saveCourse(courseData);
    
    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      db.deleteCourse(id);
      onRefresh();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
      
      {/* Breadcrumb & Title */}
      <div className="flex flex-col">
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Home size={12} className="mr-1" />
          <span>Accueil</span>
          <ChevronRight size={12} className="mx-1" />
          <span className="font-medium text-gray-800">Gestion des cours</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Catalogue des Cours</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Cours</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">{courses.length}</h3>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><BookOpen size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Matières Uniques</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">{new Set(courses.map(c => c.subject)).size}</h3>
           </div>
           <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors"><Layers size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
           <div>
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Volume Horaire Hebdo</p>
             <h3 className="font-bold text-2xl text-gray-800 mt-1">{courses.reduce((acc, c) => acc + c.hoursPerWeek, 0)}h</h3>
           </div>
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Clock size={20} /></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <ChevronRight size={20} strokeWidth={3} />
                Liste des cours
             </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <select 
                className="bg-transparent text-xs font-medium text-gray-600 outline-none px-2 py-1"
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
              >
                <option value="">Toutes les matières</option>
                {DEFAULT_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select 
                className="bg-transparent text-xs font-medium text-gray-600 outline-none px-2 py-1 border-l border-gray-300"
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
              >
                <option value="">Tous les niveaux</option>
                <option value="6ème">6ème</option>
                <option value="5ème">5ème</option>
                <option value="4ème">4ème</option>
                <option value="3ème">3ème</option>
                <option value="Seconde">Seconde</option>
                <option value="Première">Première</option>
                <option value="Terminale">Terminale</option>
              </select>
            </div>

            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un cours..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {canWrite && (
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Nouveau Cours</span>
                </button>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const teacher = getTeacher(course.teacherId);
              return (
                <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group relative flex flex-col">
                  {canWrite && (
                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(course)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(course.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {course.code.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <h3 className="font-bold text-lg text-gray-800 truncate">{course.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{course.code}</span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{course.level}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1 italic">
                    {course.description || "Aucune description fournie."}
                  </p>

                  <div className="space-y-2 text-sm border-t border-gray-50 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-500">
                        <Hash size={14} className="mr-2" />
                        <span>Coefficient</span>
                      </div>
                      <span className="font-bold text-gray-800">{course.coefficient}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-500">
                        <Clock size={14} className="mr-2" />
                        <span>Volume Hebdo</span>
                      </div>
                      <span className="font-bold text-gray-800">{course.hoursPerWeek}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-500">
                        <User size={14} className="mr-2" />
                        <span>Enseignant</span>
                      </div>
                      <span className="font-medium text-gray-700 truncate max-w-[120px]">
                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Non assigné'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
               <h3 className="text-xl font-bold text-gray-900">
                 {isEditing ? 'Modifier le Cours' : 'Nouveau Cours'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
               
               <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Nom du cours *</label>
                     <input 
                       type="text" 
                       required
                       placeholder="Ex: Mathématiques Avancées"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.name || ''}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                     />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Code du cours *</label>
                     <input 
                       type="text" 
                       required
                       placeholder="Ex: MATH-TLE-C"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.code || ''}
                       onChange={e => setFormData({...formData, code: e.target.value})}
                     />
                   </div>

                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                     <textarea 
                       placeholder="Description du contenu du cours..."
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"
                       value={formData.description || ''}
                       onChange={e => setFormData({...formData, description: e.target.value})}
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                     <select 
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                       value={formData.subject || ''}
                       onChange={e => setFormData({...formData, subject: e.target.value})}
                       required
                     >
                        <option value="">Sélectionner une matière</option>
                        {DEFAULT_SUBJECTS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                     </select>
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

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
                     <input 
                       type="number" 
                       min="1"
                       step="0.5"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.coefficient || 1}
                       onChange={e => setFormData({...formData, coefficient: parseFloat(e.target.value)})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Heures par semaine</label>
                     <input 
                       type="number" 
                       min="1"
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                       value={formData.hoursPerWeek || 2}
                       onChange={e => setFormData({...formData, hoursPerWeek: parseInt(e.target.value)})}
                     />
                   </div>

                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant par défaut</label>
                     <select 
                       className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                       value={formData.teacherId || ''}
                       onChange={e => setFormData({...formData, teacherId: e.target.value})}
                     >
                        <option value="">Sélectionner un enseignant</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.subject})</option>
                        ))}
                     </select>
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
                   {isEditing ? 'Enregistrer' : 'Créer le cours'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
