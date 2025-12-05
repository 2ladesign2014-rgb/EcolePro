
import React, { useState } from 'react';
import { MoreHorizontal, Search, Filter, UserPlus, X, Trash2, Save, BellOff, User, Users, Phone, Mail, ArrowRightLeft, Inbox, CheckCircle, XCircle, History, ArrowRight, ExternalLink, Send, Info, Camera, Upload, Plus } from 'lucide-react';
import { Student, StudentStatus, School, SystemUser } from '../types';
import { db } from '../services/db';

interface StudentListProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  currentSchoolId: string;
  schools: School[];
  incomingTransfers: Student[];
  outgoingTransfers: Student[];
  onRefresh?: () => void;
  currentUser: SystemUser;
}

export const StudentList: React.FC<StudentListProps> = ({ 
    students, onAddStudent, onDeleteStudent, currentSchoolId, schools, incomingTransfers, outgoingTransfers, onRefresh, currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'transfers' | 'history'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  
  // Transfer Form State
  const [targetSchoolId, setTargetSchoolId] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Check specific permissions using props
  const canEnroll = db.hasPermission(currentSchoolId, currentUser.role, 'STUDENTS.enroll');
  const canTransfer = db.hasPermission(currentSchoolId, currentUser.role, 'STUDENTS.transfer');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    matricule: '',
    classGrade: '',
    average: 0,
    attendance: 100,
    status: StudentStatus.ACTIVE as StudentStatus,
    photoUrl: '',
    // Parent Info
    parentName: '',
    parentRelation: '',
    parentPhone: '',
    parentEmail: ''
  });

  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.ACTIVE: return 'bg-emerald-100 text-emerald-700';
      case StudentStatus.ABSENT: return 'bg-rose-100 text-rose-700';
      case StudentStatus.SUSPENDED: return 'bg-gray-100 text-gray-700';
      case StudentStatus.TRANSFERRED: return 'bg-purple-100 text-purple-700';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.classGrade) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      matricule: formData.matricule || `MAT-${Date.now().toString().slice(-4)}`,
      schoolId: currentSchoolId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      classGrade: formData.classGrade,
      average: Number(formData.average),
      attendance: Number(formData.attendance),
      status: formData.status,
      behaviorNotes: [],
      photoUrl: formData.photoUrl,
      parentName: formData.parentName,
      parentRelation: formData.parentRelation,
      parentEmail: formData.parentEmail,
      parentPhone: formData.parentPhone
    };

    onAddStudent(newStudent);
    setIsModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      matricule: '',
      classGrade: '',
      average: 0,
      attendance: 100,
      status: StudentStatus.ACTIVE,
      photoUrl: '',
      parentName: '',
      parentRelation: '',
      parentPhone: '',
      parentEmail: ''
    });
  };

  const handleReportAbsence = (student: Student) => {
     const reason = prompt("Motif de l'absence (ex: Maladie, Rendez-vous):", "Non justifiée");
     if (reason) {
        db.reportAbsence(student.id, new Date().toISOString(), reason);
        alert(`Absence signalée pour ${student.firstName}. Notification envoyée aux parents (${student.parentEmail || student.parentPhone || 'Contact manquant'}).`);
     }
  };

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForTransfer || !targetSchoolId || !transferDate || !transferReason) return;

    db.initiateTransfer(selectedStudentForTransfer.id, targetSchoolId, transferReason, transferNotes, transferDate);
    
    setIsTransferModalOpen(false);
    
    // Reset form
    setSelectedStudentForTransfer(null);
    setTargetSchoolId('');
    setTransferDate('');
    setTransferReason('');
    setTransferNotes('');

    alert("Demande de transfert envoyée à l'établissement cible.");
    if(onRefresh) onRefresh();
  };

  const handleCancelTransfer = (studentId: string) => {
      if (confirm("Êtes-vous sûr de vouloir annuler cette demande de transfert ?")) {
          db.cancelTransfer(studentId);
          if (onRefresh) onRefresh();
      }
  };

  const handleAcceptTransfer = (student: Student) => {
      if (confirm(`Accepter le transfert de ${student.firstName} ${student.lastName} ?`)) {
          db.completeTransfer(student.id, 'APPROVE', 'Admin Actuel');
          if(onRefresh) onRefresh();
      }
  };

  const handleRejectTransfer = (student: Student) => {
      if (confirm(`Refuser le transfert de ${student.firstName} ${student.lastName} ?`)) {
          db.completeTransfer(student.id, 'REJECT', 'Admin Actuel');
          if(onRefresh) onRefresh();
      }
  };

  const openTransferModal = (student: Student | null) => {
      setSelectedStudentForTransfer(student);
      setTargetSchoolId('');
      setTransferReason('');
      setTransferNotes('');
      setTransferDate(new Date().toISOString().split('T')[0]); // Default to today
      setIsTransferModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Gestion des Élèves & Transferts</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={14} /> Annuaire
                </button>
                {canTransfer && (
                    <>
                        <button 
                            onClick={() => setActiveTab('transfers')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'transfers' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Inbox size={14} /> Transferts Entrants
                            {incomingTransfers.length > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{incomingTransfers.length}</span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <History size={14} /> Historique Sortants
                        </button>
                    </>
                )}
            </div>
          </div>
          
          {activeTab === 'list' && (
              <div className="flex space-x-3">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un élève..." 
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                  />
                </div>
                {canTransfer && (
                    <button 
                        onClick={() => openTransferModal(null)}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-blue-100 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium transition-all"
                    >
                        <ArrowRightLeft size={18} />
                        <span>Demander Transfert</span>
                    </button>
                )}
                {canEnroll && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all active:scale-95"
                    >
                      <UserPlus size={18} />
                      <span>Nouvelle Inscription</span>
                    </button>
                )}
              </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-auto flex-1 bg-slate-50/50">
          {activeTab === 'list' ? (
              <div className="bg-white min-h-full">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Matricule</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Élève</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Classe</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Tuteur</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Moyenne</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Statut</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.matricule}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {student.photoUrl ? (
                                  <img src={student.photoUrl} alt="Photo" className="h-9 w-9 rounded-full object-cover mr-3 border border-gray-200" />
                              ) : (
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-sm">
                                    {student.firstName[0]}{student.lastName[0]}
                                  </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                                <div className="text-xs text-gray-500">ID: {student.id.slice(-4)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{student.classGrade}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-gray-900">{student.parentName}</div>
                            <div className="text-xs text-gray-500">{student.parentRelation} • {student.parentPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${student.average >= 12 ? 'text-emerald-600' : student.average >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {student.average.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${getStatusColor(student.status)}`}>
                                  {student.status}
                                </span>
                                {student.transferRequest && student.transferRequest.status === 'PENDING' && (
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[10px] text-orange-600 font-medium flex items-center gap-1">
                                            <ArrowRightLeft size={10} /> Transfert en cours...
                                        </span>
                                        {canTransfer && (
                                            <button 
                                                onClick={() => handleCancelTransfer(student.id)}
                                                className="text-[10px] text-red-500 hover:text-red-700 underline decoration-dotted"
                                            >
                                                Annuler demande
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canTransfer && (
                                  <button 
                                    onClick={() => openTransferModal(student)}
                                    className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                    title="Transférer l'élève"
                                  >
                                    <ArrowRightLeft size={18} />
                                  </button>
                              )}
                              <button 
                                onClick={() => handleReportAbsence(student)}
                                className="text-gray-400 hover:text-amber-600 p-2 rounded-full hover:bg-amber-50 transition-colors"
                                title="Signaler Absence"
                              >
                                <BellOff size={18} />
                              </button>
                              {canEnroll && (
                                  <button 
                                    onClick={() => onDeleteStudent(student.id)}
                                    className="text-gray-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
          ) : activeTab === 'transfers' ? (
              // TAB TRANSFERS ENTRANTS
              <div className="p-8 max-w-5xl mx-auto">
                  <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Demandes de transfert entrantes</h3>
                      <p className="text-sm text-gray-500">Élèves d'autres établissements souhaitant rejoindre votre école.</p>
                  </div>
                  {incomingTransfers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                          <Inbox size={48} className="mb-4 opacity-20" />
                          <p>Aucune demande de transfert entrante.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {incomingTransfers.map(student => (
                              <div key={student.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                              {student.firstName[0]}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-gray-800">{student.firstName} {student.lastName}</h4>
                                              <p className="text-xs text-gray-500 font-mono">{student.matricule}</p>
                                          </div>
                                      </div>
                                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">En Attente</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                                      <div className="bg-gray-50 p-2 rounded">
                                          <span className="block text-xs text-gray-400 uppercase">Classe Actuelle</span>
                                          <span className="font-medium">{student.classGrade}</span>
                                      </div>
                                      <div className="bg-gray-50 p-2 rounded">
                                          <span className="block text-xs text-gray-400 uppercase">Moyenne</span>
                                          <span className="font-medium">{student.average}/20</span>
                                      </div>
                                      {student.transferRequest?.reason && (
                                          <div className="col-span-2 bg-gray-50 p-2 rounded">
                                              <span className="block text-xs text-gray-400 uppercase">Motif</span>
                                              <span className="font-medium">{student.transferRequest.reason}</span>
                                          </div>
                                      )}
                                  </div>

                                  {canTransfer && (
                                      <div className="flex gap-3 border-t border-gray-100 pt-4">
                                          <button 
                                              onClick={() => handleAcceptTransfer(student)}
                                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                                          >
                                              <CheckCircle size={16} /> Accepter
                                          </button>
                                          <button 
                                              onClick={() => handleRejectTransfer(student)}
                                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                          >
                                              <XCircle size={16} /> Refuser
                                          </button>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          ) : (
             // TAB HISTORY OUTGOING
             <div className="p-8 bg-white min-h-full">
                <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Historique des Transferts Sortants</h3>
                        <p className="text-sm text-gray-500">Liste des anciens élèves ayant quitté l'établissement pour un autre.</p>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Élève</th>
                                <th className="px-6 py-3">Ancienne Classe</th>
                                <th className="px-6 py-3">Destination (Actuelle)</th>
                                <th className="px-6 py-3">Année de départ</th>
                                <th className="px-6 py-3 text-right">Dossier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {outgoingTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                        Aucun historique de transfert sortant trouvé.
                                    </td>
                                </tr>
                            ) : (
                                outgoingTransfers.map(student => {
                                    // Find current school name
                                    const currentSchoolName = schools.find(s => s.id === student.schoolId)?.name || "Autre Établissement";
                                    return (
                                        <tr key={student.id} className="hover:bg-orange-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{student.firstName} {student.lastName}</div>
                                                <div className="text-xs text-gray-500">{student.matricule}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{student.classGrade}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-blue-600 font-medium text-sm bg-blue-50 px-2 py-1 rounded-lg w-fit">
                                                    <ArrowRight size={14} /> {currentSchoolName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                {student.previousSchools && student.previousSchools.length > 0 
                                                    ? student.previousSchools[student.previousSchools.length - 1].year 
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs font-medium text-gray-500 hover:text-gray-800 underline">
                                                    Voir fiche
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
          )}
        </div>
        
        {/* Footer Pagination */}
        {activeTab === 'list' && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
              <span>Affichage de {students.length} élèves</span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-200 rounded bg-white disabled:opacity-50 hover:bg-gray-50" disabled>Précédent</button>
                <button className="px-3 py-1 border border-gray-200 rounded bg-white disabled:opacity-50 hover:bg-gray-50" disabled>Suivant</button>
              </div>
            </div>
        )}
      </div>

      {/* Modal Transfer Initiation */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-0 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Send size={20} className="text-blue-600" /> Nouvelle Demande de Transfert
                </h3>
                <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6">
                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-2 items-start">
                    <div className="mt-0.5 flex-shrink-0"><Info size={16} /></div>
                    <p>Le processus de transfert nécessite la validation de l'établissement source et de l'établissement de destination.</p>
                </div>

                <form onSubmit={handleInitiateTransfer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Élève à transférer *</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={selectedStudentForTransfer?.id || ''}
                            onChange={(e) => {
                                const s = students.find(st => st.id === e.target.value);
                                setSelectedStudentForTransfer(s || null);
                            }}
                            required
                        >
                            <option value="">Sélectionner un élève</option>
                            {students.filter(s => s.status === StudentStatus.ACTIVE).map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.firstName} {s.lastName} ({s.matricule}) - {s.classGrade}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Établissement de destination *</label>
                        <select 
                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={targetSchoolId}
                            onChange={(e) => setTargetSchoolId(e.target.value)}
                            required
                        >
                            <option value="">Sélectionner un établissement</option>
                            {schools.filter(s => s.id !== currentSchoolId).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de transfert souhaitée *</label>
                        <input 
                            type="date" 
                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motif du transfert *</label>
                        <textarea 
                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                            rows={3}
                            placeholder="Déménagement, changement de cursus, rapprochement familial..."
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes administratives (optionnel)</label>
                        <textarea 
                            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                            rows={3}
                            placeholder="Informations supplémentaires pour les deux établissements..."
                            value={transferNotes}
                            onChange={(e) => setTransferNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-2">
                        <button 
                            type="button"
                            onClick={() => setIsTransferModalOpen(false)}
                            className="px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit"
                            disabled={!selectedStudentForTransfer || !targetSchoolId || !transferDate || !transferReason}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-blue-600/20 transition-colors"
                        >
                            Envoyer la Demande
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enrollment */}
      {isModalOpen && canEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <UserPlus size={18} />
                </div>
                Nouveau dossier d'inscription
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Form Content - Same as before */}
              {/* PHOTO UPLOAD SECTION */}
              <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative group">
                      <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative">
                          {formData.photoUrl ? (
                              <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <User size={48} className="text-slate-300" />
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
                          <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white pointer-events-none">
                              <Plus size={14} strokeWidth={3} />
                          </div>
                      ) : (
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                            className="absolute bottom-1 right-1 bg-red-500 text-white p-1.5 rounded-full border-2 border-white cursor-pointer z-30"
                            title="Supprimer la photo"
                          >
                              <X size={14} strokeWidth={3} />
                          </button>
                      )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Photo d'identité</p>
              </div>

              {/* SECTION ELEVE */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center border-b border-blue-100 pb-2">
                    <User size={16} className="mr-2" /> Informations Élève
                 </h4>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono"
                        value={formData.matricule}
                        onChange={e => setFormData({...formData, matricule: e.target.value})}
                        placeholder="Auto si vide"
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        placeholder="Jean"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.classGrade}
                          onChange={e => setFormData({...formData, classGrade: e.target.value})}
                          placeholder="ex: Terminale S"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value as StudentStatus})}
                        >
                          <option value={StudentStatus.ACTIVE}>Actif</option>
                          <option value={StudentStatus.ABSENT}>Absent</option>
                          <option value={StudentStatus.SUSPENDED}>Suspendu</option>
                        </select>
                     </div>
                  </div>
              </div>

              {/* SECTION PARENT */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center border-b border-blue-100 pb-2">
                    <Users size={16} className="mr-2" /> Responsable Légal
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet du tuteur</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.parentName}
                        onChange={e => setFormData({...formData, parentName: e.target.value})}
                        placeholder="M. Parent Exemple"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lien de parenté</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.parentRelation}
                        onChange={e => setFormData({...formData, parentRelation: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Père">Père</option>
                        <option value="Mère">Mère</option>
                        <option value="Tuteur">Tuteur Légal</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                          type="tel" 
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.parentPhone}
                          onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                          placeholder="01 02 03 04 05"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optionnel)</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                          type="email" 
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.parentEmail}
                          onChange={e => setFormData({...formData, parentEmail: e.target.value})}
                          placeholder="contact@parent.com"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save size={18} />
                  Enregistrer l'inscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
