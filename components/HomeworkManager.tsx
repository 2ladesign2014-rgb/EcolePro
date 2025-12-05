
import React, { useState, useEffect } from 'react';
import { LessonLog, SchoolClass, Teacher, SystemUser } from '../types';
import { db } from '../services/db';
import { DEFAULT_SUBJECTS } from '../constants';
import { 
  BookOpen, Calendar, Clock, Plus, X, Save, 
  Filter, ChevronRight, AlertCircle, CheckCircle, Flag, LayoutList, ClipboardList, ShieldCheck, Trash2, Copy 
} from 'lucide-react';

interface HomeworkManagerProps {
  currentSchoolId: string;
  classes: SchoolClass[];
  teachers: Teacher[];
  currentUser: SystemUser;
}

export const HomeworkManager: React.FC<HomeworkManagerProps> = ({ 
  currentSchoolId, classes, teachers, currentUser 
}) => {
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // Form State
  const [newLog, setNewLog] = useState<Partial<LessonLog>>({
    date: new Date().toISOString().split('T')[0],
    nextSessionDate: '',
    startTime: '08:00',
    endTime: '09:00',
    validationStatus: 'DRAFT'
  });

  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'HOMEWORK.write');

  useEffect(() => {
    const allLogs = db.getLessonLogs(currentSchoolId);
    setLogs(allLogs);
    
    // Default filter for teacher/student convenience
    if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0].id);
    }

    const config = db.getSchoolConfig(currentSchoolId);
    if (config.subjects) {
        setSubjects(config.subjects);
    }
  }, [currentSchoolId, classes]);

  const filteredLogs = logs.filter(log => {
    return !selectedClass || log.classId === selectedClass;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending order

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.classId || !newLog.subject || !newLog.lessonPlan) return;

    const classObj = classes.find(c => c.id === newLog.classId);
    const teacherName = currentUser.role === 'TEACHER' 
        ? currentUser.name 
        : teachers.find(t => t.subject === newLog.subject)?.lastName || 'Enseignant';

    const logEntry: LessonLog = {
        id: `LOG-${Date.now()}`,
        schoolId: currentSchoolId,
        classId: newLog.classId,
        className: classObj?.name || 'Classe Inconnue',
        subject: newLog.subject,
        teacherName: teacherName,
        date: newLog.date!,
        nextSessionDate: newLog.nextSessionDate,
        startTime: newLog.startTime,
        endTime: newLog.endTime,
        
        lessonPlan: newLog.lessonPlan,
        pedagogicalActivities: newLog.pedagogicalActivities,

        homework: newLog.homework,
        dueDate: newLog.dueDate,
        
        evaluationDate: newLog.evaluationDate,
        evaluationAction: newLog.evaluationAction as any,

        validationStatus: newLog.validationStatus as any || 'DRAFT',
        validatedBy: newLog.validationStatus === 'VALIDATED' ? currentUser.name : undefined
    };

    db.addLessonLog(logEntry);
    setLogs(db.getLessonLogs(currentSchoolId));
    setIsModalOpen(false);
    setNewLog({
        date: new Date().toISOString().split('T')[0],
        nextSessionDate: '',
        startTime: '08:00',
        endTime: '09:00',
        subject: '',
        lessonPlan: '',
        pedagogicalActivities: '',
        homework: '',
        validationStatus: 'DRAFT'
    });
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette séance du cahier de texte ? Cette action est irréversible.")) {
        db.deleteLessonLog(id);
        setLogs(db.getLessonLogs(currentSchoolId));
    }
  };

  const handleCopyPreviousContent = () => {
    if (!newLog.classId || !newLog.subject) {
        alert("Veuillez sélectionner une classe et une matière pour rechercher la séance précédente.");
        return;
    }

    // Find latest log for this class and subject
    const previousLog = logs
        .filter(l => l.classId === newLog.classId && l.subject === newLog.subject)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (previousLog) {
        // Optional: Confirm overwrite if fields are not empty
        if ((newLog.lessonPlan || newLog.pedagogicalActivities) && !window.confirm("Des données existent déjà. Voulez-vous les remplacer par le contenu de la séance précédente ?")) {
            return;
        }

        setNewLog(prev => ({
            ...prev,
            lessonPlan: previousLog.lessonPlan,
            pedagogicalActivities: previousLog.pedagogicalActivities
        }));
    } else {
        alert("Aucune séance précédente trouvée pour cette classe et cette matière.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" size={24} />
            Cahier de Texte
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Suivi des cours, activités pédagogiques et devoirs à faire.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
             <Filter size={16} className="text-gray-400 mr-2" />
             <select 
               className="bg-transparent outline-none text-sm text-gray-700 w-full md:w-48"
               value={selectedClass}
               onChange={(e) => setSelectedClass(e.target.value)}
             >
               <option value="">Toutes les classes</option>
               {classes.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>
          
          {canWrite && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nouvelle Séance</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {filteredLogs.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Calendar size={48} className="mb-4 opacity-30" />
              <p>Aucune séance enregistrée pour cette sélection.</p>
           </div>
        ) : (
           <div className="space-y-6 max-w-4xl mx-auto">
              {filteredLogs.map(log => (
                 <div key={log.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative group">
                    {/* Status Border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.validationStatus === 'VALIDATED' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    
                    {/* Delete Button (Hover) */}
                    {canWrite && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Supprimer cette séance"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}

                    <div className="p-5">
                       <div className="flex justify-between items-start mb-4 pr-10">
                          <div>
                             <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                                   <Calendar size={12} className="mr-1" />
                                   {new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                                <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                                   <Clock size={12} className="mr-1" />
                                   {log.startTime} - {log.endTime}
                                </span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                   {log.className}
                                </span>
                                {log.validationStatus === 'VALIDATED' && (
                                    <span className="flex items-center text-emerald-600 text-xs font-medium ml-2">
                                        <ShieldCheck size={12} className="mr-1" /> Validé
                                    </span>
                                )}
                             </div>
                             <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                {log.subject}
                                <span className="text-xs font-normal text-gray-400 ml-2">par {log.teacherName}</span>
                             </h3>
                          </div>
                          {log.nextSessionDate && (
                             <div className="text-right hidden sm:block">
                                <span className="text-xs text-gray-400 block">Prochain cours</span>
                                <span className="text-xs font-bold text-blue-600">
                                   {new Date(log.nextSessionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </span>
                             </div>
                          )}
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-gray-700 text-sm leading-relaxed">
                               <h4 className="font-bold text-xs text-slate-500 uppercase mb-2 flex items-center">
                                   <LayoutList size={12} className="mr-1.5" /> Plan Détaillé
                               </h4>
                               <p className="whitespace-pre-line">{log.lessonPlan || 'Non renseigné.'}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-gray-700 text-sm leading-relaxed">
                               <h4 className="font-bold text-xs text-slate-500 uppercase mb-2 flex items-center">
                                   <ClipboardList size={12} className="mr-1.5" /> Activités Pédagogiques
                               </h4>
                               <p className="whitespace-pre-line">{log.pedagogicalActivities || 'Aucune activité spécifique.'}</p>
                           </div>
                       </div>

                       {(log.homework || log.evaluationDate) && (
                           <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-100">
                              {log.homework && (
                                  <div className="flex-1 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-3">
                                    <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-800 mb-1">Travail à faire</h4>
                                        <p className="text-sm text-gray-700">{log.homework}</p>
                                        {log.dueDate && (
                                        <div className="mt-1 text-xs text-amber-700 font-medium">
                                            Pour le : {new Date(log.dueDate).toLocaleDateString('fr-FR')}
                                        </div>
                                        )}
                                    </div>
                                  </div>
                              )}
                              
                              {log.evaluationDate && (
                                  <div className="flex-1 bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-start gap-3">
                                    <Flag className="text-rose-500 mt-0.5 shrink-0" size={18} />
                                    <div>
                                        <h4 className="text-sm font-bold text-rose-800 mb-1">Évaluation Prévue</h4>
                                        <p className="text-sm text-gray-700">
                                            Date : {new Date(log.evaluationDate).toLocaleDateString('fr-FR')}
                                        </p>
                                        {log.evaluationAction && (
                                            <span className="mt-1 inline-block px-2 py-0.5 bg-white rounded text-xs font-bold text-rose-600 border border-rose-200">
                                                {log.evaluationAction === 'SUBMIT' ? 'À RENDRE' : 'À CORRIGER'}
                                            </span>
                                        )}
                                    </div>
                                  </div>
                              )}
                           </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {/* Add Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
               <h3 className="text-lg font-bold text-gray-800">Remplir le Cahier de Texte</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1">
                 <X size={20} />
               </button>
            </div>
            <form onSubmit={handleAddLog} className="p-6 space-y-6">
               
               {/* Section 1: Contexte */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                     <select 
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newLog.classId || ''}
                        onChange={e => setNewLog({...newLog, classId: e.target.value})}
                     >
                        <option value="">Choisir...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                     <select 
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newLog.subject || ''}
                        onChange={e => setNewLog({...newLog, subject: e.target.value})}
                     >
                        <option value="">Choisir...</option>
                        {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Date du cours</label>
                     <input 
                       type="date" 
                       required
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                       value={newLog.date}
                       onChange={e => setNewLog({...newLog, date: e.target.value})}
                     />
                  </div>
                  <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Heure Début</label>
                        <input 
                          type="time" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newLog.startTime}
                          onChange={e => setNewLog({...newLog, startTime: e.target.value})}
                        />
                  </div>
                  <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Heure Fin</label>
                        <input 
                          type="time" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newLog.endTime}
                          onChange={e => setNewLog({...newLog, endTime: e.target.value})}
                        />
                  </div>
                  <div className="col-span-3 border-t border-gray-200 mt-2 pt-2">
                     <label className="block text-xs font-bold text-blue-700 mb-1">Date du prochain cours</label>
                     <input 
                       type="date" 
                       className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                       value={newLog.nextSessionDate || ''}
                       onChange={e => setNewLog({...newLog, nextSessionDate: e.target.value})}
                     />
                  </div>
               </div>

               {/* Section 2: Contenu Pédagogique */}
               <div className="space-y-4">
                   <div className="flex justify-between items-end border-b pb-1">
                        <h4 className="text-sm font-bold text-gray-800">Contenu Pédagogique</h4>
                        <button 
                            type="button"
                            onClick={handleCopyPreviousContent}
                            className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            title="Copier le plan et les activités de la dernière séance"
                        >
                            <Copy size={12} /> Copier précédente
                        </button>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan détaillé du cours</label>
                      <textarea 
                         required
                         rows={3}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                         placeholder="I. Introduction..."
                         value={newLog.lessonPlan || ''}
                         onChange={e => setNewLog({...newLog, lessonPlan: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Activités pédagogiques</label>
                      <textarea 
                         rows={2}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                         placeholder="Exercices pratiques, travail de groupe..."
                         value={newLog.pedagogicalActivities || ''}
                         onChange={e => setNewLog({...newLog, pedagogicalActivities: e.target.value})}
                      />
                   </div>
               </div>

               {/* Section 3: Devoirs et Evaluations */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-medium text-sm border-b border-amber-200 pb-1">
                         <AlertCircle size={16} /> Devoirs (Maison)
                      </div>
                      <div>
                         <textarea 
                            rows={2}
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm"
                            placeholder="Exercices à faire..."
                            value={newLog.homework || ''}
                            onChange={e => setNewLog({...newLog, homework: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-amber-700 mb-1">Pour le</label>
                         <input 
                           type="date" 
                           className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                           value={newLog.dueDate || ''}
                           onChange={e => setNewLog({...newLog, dueDate: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 font-medium text-sm border-b border-rose-200 pb-1">
                         <Flag size={16} /> Évaluation
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-rose-700 mb-1">Date prévue</label>
                         <input 
                           type="date" 
                           className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                           value={newLog.evaluationDate || ''}
                           onChange={e => setNewLog({...newLog, evaluationDate: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-rose-700 mb-1">Action requise</label>
                         <select 
                            className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                            value={newLog.evaluationAction || ''}
                            onChange={e => setNewLog({...newLog, evaluationAction: e.target.value as any})}
                         >
                            <option value="">Aucune action</option>
                            <option value="SUBMIT">Travail à rendre</option>
                            <option value="CORRECT">À corriger</option>
                         </select>
                      </div>
                   </div>
               </div>

               {/* Section 4: Validation */}
               <div className="border-t pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <input 
                          type="checkbox" 
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                          checked={newLog.validationStatus === 'VALIDATED'}
                          onChange={(e) => setNewLog({...newLog, validationStatus: e.target.checked ? 'VALIDATED' : 'DRAFT'})}
                      />
                      <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Valider cette séance</span>
                          <p className="text-xs text-gray-500">Marquer le cours comme effectué et valider le contenu.</p>
                      </div>
                  </label>
               </div>

               <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                 >
                   Annuler
                 </button>
                 <button 
                   type="submit" 
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20"
                 >
                   <Save size={18} />
                   Enregistrer
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
