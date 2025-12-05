
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Search, Filter, UserPlus, Mail, Phone, Briefcase, X, Camera, Plus, Trash2, Edit } from 'lucide-react';
import { Teacher, SystemUser } from '../types';
import { db } from '../services/db';
import { DEFAULT_SUBJECTS } from '../constants';

interface TeachersListProps {
  teachers: Teacher[];
  currentSchoolId: string;
  onRefresh?: () => void;
  currentUser: SystemUser;
}

export const TeachersList: React.FC<TeachersListProps> = ({ teachers, currentSchoolId, onRefresh, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [formData, setFormData] = useState<Partial<Teacher>>({
    status: 'Actif',
    contractType: 'CDI',
    baseSalary: 0,
    photoUrl: ''
  });

  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'TEACHERS.write');

  useEffect(() => {
      const config = db.getSchoolConfig(currentSchoolId);
      if (config.subjects) {
          setSubjects(config.subjects);
      }
  }, [currentSchoolId]);

  const filteredTeachers = teachers.filter(t => 
    t.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Actif': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'En congé': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Inactif': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id: string) => {
      if (confirm("Supprimer ce professeur ?")) {
          db.deleteTeacher(id);
          if (onRefresh) onRefresh();
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.lastName || !formData.firstName || !formData.email) return;

    const newTeacher: Teacher = {
        id: `T-${Date.now()}`,
        schoolId: currentSchoolId,
        matricule: formData.matricule || `PROF${new Date().getFullYear()}${Math.floor(Math.random() * 1000)}`,
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        email: formData.email!,
        phone: formData.phone || '',
        specialty: formData.specialty || '',
        subject: formData.subject || '',
        status: (formData.status as any) || 'Actif',
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
        contractType: (formData.contractType as any) || 'CDI',
        baseSalary: Number(formData.baseSalary) || 0,
        photoUrl: formData.photoUrl
    };

    db.saveTeacher(newTeacher);
    setIsModalOpen(false);
    setFormData({ status: 'Actif', contractType: 'CDI', baseSalary: 0, photoUrl: '' });
    
    if (onRefresh) {
        onRefresh();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestion du Personnel</h2>
            <p className="text-xs text-gray-500 mt-1">Enseignants et personnel administratif</p>
          </div>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher (Nom, Matricule...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64 transition-shadow"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
              <Filter size={18} />
              <span>Filtres</span>
            </button>
            {canWrite && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all active:scale-95"
                >
                  <UserPlus size={18} />
                  <span>Ajouter</span>
                </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Enseignant</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Matière / Spécialité</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {teacher.photoUrl ? (
                          <img src={teacher.photoUrl} alt="Prof" className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200" />
                      ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm mr-3 border-2 border-white shadow-sm">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                        <div className="text-xs text-gray-500 font-mono">{teacher.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <div className="flex items-center text-sm text-gray-900 font-medium">
                        <Briefcase size={14} className="mr-2 text-gray-400" />
                        {teacher.subject}
                      </div>
                      <div className="text-xs text-gray-500 pl-6">{teacher.specialty}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail size={12} className="mr-2 text-gray-400" />
                        {teacher.email}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone size={12} className="mr-2 text-gray-400" />
                        {teacher.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(teacher.status)}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canWrite ? (
                        <div className="flex justify-end gap-2">
                            <button className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(teacher.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">Lecture seule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Professor Modal */}
      {isModalOpen && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Nouveau professeur</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative">
                          {formData.photoUrl ? (
                              <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <Briefcase size={40} className="text-slate-300" />
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Camera className="text-white" size={24} />
                          </div>
                      </div>
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          title="Modifier la photo"
                      />
                      {!formData.photoUrl ? (
                          <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white pointer-events-none">
                              <Plus size={14} strokeWidth={3} />
                          </div>
                      ) : (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                            className="absolute bottom-0 right-0 bg-red-500 text-white p-1.5 rounded-full border-2 border-white cursor-pointer z-30"
                            title="Supprimer la photo"
                          >
                              <X size={14} strokeWidth={3} />
                          </button>
                      )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Photo de profil</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    placeholder="Ex: PROF2024001"
                    value={formData.matricule || ''}
                    onChange={e => setFormData({...formData, matricule: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="En congé">En congé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    placeholder="Nom de famille"
                    value={formData.lastName || ''}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    placeholder="Prénom"
                    value={formData.firstName || ''}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    placeholder="professeur@example.com"
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    placeholder="+237 6XX XX XX XX"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    value={formData.specialty || ''}
                    onChange={e => setFormData({...formData, specialty: e.target.value})}
                  >
                    <option value="">Choisir une spécialité</option>
                    <option value="Sciences Exactes">Sciences Exactes</option>
                    <option value="Lettres Modernes">Lettres Modernes</option>
                    <option value="Sciences Humaines">Sciences Humaines</option>
                    <option value="Langues Vivantes">Langues Vivantes</option>
                    <option value="Sport">Sport</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                    value={formData.joinDate || ''}
                    onChange={e => setFormData({...formData, joinDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matière enseignée</label>
                    <select 
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
                        value={formData.subject || ''}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                    >
                        <option value="">Ajouter une matière</option>
                        {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salaire de base (FCFA)</label>
                    <input 
                        type="number" 
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm font-mono"
                        placeholder="0"
                        value={formData.baseSalary || ''}
                        onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value)})}
                    />
                </div>
              </div>

              <div className="flex justify-end items-center space-x-4 pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-fuchsia-600 text-white font-medium hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-600/20 transition-all active:scale-95 text-sm"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
