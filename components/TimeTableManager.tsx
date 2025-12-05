
import React, { useState, useEffect, useMemo } from 'react';
import { TimeSlot, SchoolClass, Teacher, SystemUser } from '../types';
import { db } from '../services/db';
import { 
  Calendar, Clock, Plus, X, Save, Filter, Trash2, Printer, 
  AlertTriangle, Users, GraduationCap, Edit
} from 'lucide-react';
import { DEFAULT_SUBJECTS } from '../constants';

interface TimeTableManagerProps {
  currentSchoolId: string;
  currentUser: SystemUser;
  classes: SchoolClass[];
  teachers: Teacher[];
}

// Official Timetable Structure Constants
const ADMIN_DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
const TIME_ROWS = [
    { start: '07:15', end: '08:10', type: 'COURSE' },
    { start: '08:10', end: '09:05', type: 'COURSE' },
    { start: '09:05', end: '10:00', type: 'COURSE' },
    { start: '10:00', end: '10:15', type: 'BREAK', label: 'RECREATION' },
    { start: '10:15', end: '11:10', type: 'COURSE' },
    { start: '11:15', end: '12:05', type: 'COURSE' }, // Adjusted to standard 11:15 often used
    { start: '12:05', end: '13:30', type: 'BREAK', label: 'APRES-MIDI (PAUSE)' },
    { start: '13:30', end: '14:25', type: 'COURSE' },
    { start: '14:25', end: '15:20', type: 'COURSE' },
    { start: '15:30', end: '16:25', type: 'COURSE' },
    { start: '16:25', end: '17:20', type: 'COURSE' },
    { start: '17:20', end: '18:15', type: 'COURSE' },
];

// Helper to normalize time for comparison
const timeToMin = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

export const TimeTableManager: React.FC<TimeTableManagerProps> = ({ 
  currentSchoolId, currentUser, classes, teachers 
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [viewType, setViewType] = useState<'CLASS' | 'TEACHER'>('TEACHER'); // Default to Teacher for this view
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<TimeSlot>>({
    dayOfWeek: 'Lundi',
    startTime: '08:00',
    endTime: '09:00',
    color: '#ffffff'
  });
  
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // Permissions
  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'TIMETABLE.write');

  useEffect(() => {
    setTimeSlots(db.getTimeSlots(currentSchoolId));
    const config = db.getSchoolConfig(currentSchoolId);
    if (config.subjects) setSubjects(config.subjects);

    if (currentUser.role === 'TEACHER') {
        setViewType('TEACHER');
        const teacher = teachers.find(t => t.email === currentUser.email);
        if (teacher) setSelectedEntityId(teacher.id);
        else if (teachers.length > 0) setSelectedEntityId(teachers[0].id);
    } else {
        if (teachers.length > 0) setSelectedEntityId(teachers[0].id);
    }
  }, [currentSchoolId, currentUser]);

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.classId || !newSlot.teacherId || !newSlot.subject || !newSlot.startTime || !newSlot.endTime) return;

    const slotToSave: TimeSlot = {
        id: newSlot.id || `TS-${Date.now()}`,
        schoolId: currentSchoolId,
        classId: newSlot.classId,
        teacherId: newSlot.teacherId,
        subject: newSlot.subject,
        dayOfWeek: newSlot.dayOfWeek as any,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        room: newSlot.room || 'Non définie',
        color: newSlot.color
    };

    const result = db.saveTimeSlot(slotToSave);
    if (result.success) {
        setTimeSlots(db.getTimeSlots(currentSchoolId));
        setIsModalOpen(false);
        setNewSlot(prev => ({ ...prev, id: undefined })); 
    } else {
        alert(result.message);
    }
  };

  const handleDeleteSlot = (id: string) => {
      if (confirm("Supprimer ce créneau ?")) {
          db.deleteTimeSlot(id);
          setTimeSlots(db.getTimeSlots(currentSchoolId));
      }
  };

  const handlePrint = () => {
      const printContents = document.getElementById('printable-timetable')?.innerHTML;
      
      if (printContents) {
          const printWindow = window.open('', '', 'width=1100,height=900');
          if (printWindow) {
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Emploi du Temps - ${viewType === 'TEACHER' ? 'Professeur' : 'Classe'}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4 landscape; margin: 10mm; }
                        body { font-family: 'Arial', sans-serif; -webkit-print-color-adjust: exact; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #000; padding: 4px; font-size: 11px; text-align: center; }
                        .header-box { border: 1px solid #000; padding: 10px; margin-bottom: 10px; }
                    </style>
                  </head>
                  <body>
                    ${printContents}
                    <script>window.print();</script>
                  </body>
                </html>
              `);
              printWindow.document.close();
          }
      }
  };

  // --- RENDER HELPERS FOR OFFICIAL TABLE ---

  const getSlotForCell = (day: string, startStr: string, endStr: string) => {
      // Simplified match: check if slot starts at or falls within
      return timeSlots.find(slot => {
          // Match Entity
          if (viewType === 'TEACHER' && slot.teacherId !== selectedEntityId) return false;
          if (viewType === 'CLASS' && slot.classId !== selectedEntityId) return false;
          
          // Match Day (Case insensitive)
          if (slot.dayOfWeek.toUpperCase() !== day.toUpperCase()) return false;

          const slotStart = timeToMin(slot.startTime);
          const rowStart = timeToMin(startStr);
          // Strict match for the grid start
          return Math.abs(slotStart - rowStart) < 5; 
      });
  };

  const teacherStats = useMemo(() => {
      if (viewType !== 'TEACHER' || !selectedEntityId) return { totalHours: 0, recap: [] };
      
      const teacherSlots = timeSlots.filter(s => s.teacherId === selectedEntityId);
      const classMap: Record<string, { count: number, subject: string, hours: number }> = {};
      let totalHours = 0;

      teacherSlots.forEach(slot => {
          const cls = classes.find(c => c.id === slot.classId);
          const className = cls ? cls.name : 'Inconnu';
          const effectif = cls ? cls.studentCount : 0;
          
          // Calculate duration in hours (approx)
          const duration = (timeToMin(slot.endTime) - timeToMin(slot.startTime)) / 60;
          totalHours += duration;

          if (!classMap[className]) {
              classMap[className] = { count: effectif, subject: slot.subject, hours: 0 };
          }
          classMap[className].hours += duration;
      });

      return {
          totalHours: Math.round(totalHours), // Rounding for display simplicity
          recap: Object.entries(classMap).map(([name, data]) => ({ name, ...data }))
      };
  }, [timeSlots, selectedEntityId, viewType, classes]);

  const classStats = useMemo(() => {
      if (viewType !== 'CLASS' || !selectedEntityId) return { totalHours: 0, recap: [] };

      const classSlots = timeSlots.filter(s => s.classId === selectedEntityId);
      const subjectMap: Record<string, { teacher: string, hours: number }> = {};
      let totalHours = 0;

      classSlots.forEach(slot => {
          const teacher = teachers.find(t => t.id === slot.teacherId);
          const teacherName = teacher ? `${teacher.lastName} ${teacher.firstName}` : 'Non assigné';
          
          const duration = (timeToMin(slot.endTime) - timeToMin(slot.startTime)) / 60;
          totalHours += duration;

          if (!subjectMap[slot.subject]) {
              subjectMap[slot.subject] = { teacher: teacherName, hours: 0 };
          }
          subjectMap[slot.subject].hours += duration;
      });

      return {
          totalHours: Math.round(totalHours),
          recap: Object.entries(subjectMap).map(([subject, data]) => ({ subject, ...data }))
      };
  }, [timeSlots, selectedEntityId, viewType, teachers]);

  const selectedTeacher = teachers.find(t => t.id === selectedEntityId);
  const selectedClass = classes.find(c => c.id === selectedEntityId);
  
  // Fetch School Data for Header
  const school = db.getSchoolById(currentSchoolId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
        {/* Controls Header (Screen Only) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="text-blue-600" /> Emploi du Temps Officiel
                </h2>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => { setViewType('TEACHER'); if(teachers.length > 0) setSelectedEntityId(teachers[0].id); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors ${viewType === 'TEACHER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        <GraduationCap size={14} /> Par Professeur
                    </button>
                    <button 
                        onClick={() => { setViewType('CLASS'); if(classes.length > 0) setSelectedEntityId(classes[0].id); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors ${viewType === 'CLASS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        <Users size={14} /> Par Classe
                    </button>
                </div>

                <select 
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                >
                    {viewType === 'CLASS' 
                        ? classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        : teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)
                    }
                </select>

                <button onClick={handlePrint} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors">
                    <Printer size={18} />
                </button>

                {canWrite && (
                    <button 
                        onClick={() => {
                            setNewSlot(prev => ({
                                ...prev,
                                classId: viewType === 'CLASS' ? selectedEntityId : '',
                                teacherId: viewType === 'TEACHER' ? selectedEntityId : ''
                            }));
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> Ajouter
                    </button>
                )}
            </div>
        </div>

        {/* MAIN PRINTABLE AREA */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto p-8" id="printable-timetable">
            
            {/* School Header for Print */}
            <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
                <div className="flex items-center gap-6">
                    {school?.logoUrl && <img src={school.logoUrl} className="h-20 w-20 object-contain" alt="Logo" />}
                    <div>
                        <div className="font-extrabold text-2xl uppercase tracking-tight">{school?.name}</div>
                        <div className="text-sm font-medium">{school?.address}</div>
                        <div className="text-xs text-gray-600">{school?.config.email}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-xl">ANNÉE SCOLAIRE {school?.config.academicYear}</div>
                    <div className="text-sm uppercase font-bold tracking-widest mt-1">
                        {viewType === 'TEACHER' ? 'FICHE DE SERVICE' : 'PLANNING HEBDOMADAIRE'}
                    </div>
                </div>
            </div>

            {viewType === 'TEACHER' && selectedTeacher ? (
                <div className="max-w-5xl mx-auto text-black">
                    {/* Header Administratif */}
                    <div className="border border-black mb-4 p-4 flex justify-between items-start font-sans text-sm">
                        <div className="w-2/3">
                            <div className="font-bold text-center border-b border-black pb-2 mb-2 text-lg uppercase">
                                Emploi du Temps Professeur
                            </div>
                            <div className="font-bold text-lg mb-2 uppercase">
                                M. {selectedTeacher.lastName} {selectedTeacher.firstName} ({(selectedTeacher.subject || '').toUpperCase()})
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div className="border border-black px-2 py-1"><strong>Matricule :</strong> {selectedTeacher.matricule}</div>
                                <div className="border border-black px-2 py-1"><strong>Sexe :</strong> {selectedTeacher.sex || 'M'}</div>
                                <div className="border border-black px-2 py-1"><strong>Bivalent :</strong> {selectedTeacher.isBivalent ? 'Oui' : 'Non'}</div>
                                <div className="border border-black px-2 py-1"><strong>Contact :</strong> {selectedTeacher.phone}</div>
                                <div className="border border-black px-2 py-1 col-span-2"><strong>Emploi :</strong> {selectedTeacher.employmentLabel || 'Professeur de Lycée'}</div>
                                <div className="border border-black px-2 py-1 col-span-2"><strong>E-mail :</strong> {selectedTeacher.email}</div>
                                <div className="border border-black px-2 py-1 col-span-2"><strong>Ancienneté :</strong> {selectedTeacher.yearsExperience || 0} ans</div>
                            </div>
                        </div>
                        <div className="w-32 h-32 border border-black bg-gray-100 flex items-center justify-center">
                            {selectedTeacher.photoUrl ? (
                                <img src={selectedTeacher.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                                <Users size={48} className="text-gray-300" />
                            )}
                        </div>
                    </div>

                    {/* Grille Horaire */}
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="w-24 py-2">HORAIRES</th>
                                {ADMIN_DAYS.map(d => <th key={d} className="w-1/5">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {TIME_ROWS.map((row, idx) => {
                                if (row.type === 'BREAK') {
                                    return (
                                        <tr key={idx} className="bg-gray-100">
                                            <td className="border border-black py-1 font-mono">{row.start} - {row.end}</td>
                                            <td colSpan={5} className="border border-black py-1 font-bold text-center uppercase tracking-widest text-gray-600">
                                                {row.label}
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={idx}>
                                        <td className="border border-black py-2 font-mono bg-white">{row.start} - {row.end}</td>
                                        {ADMIN_DAYS.map(day => {
                                            const slot = getSlotForCell(day, row.start, row.end);
                                            const slotClass = classes.find(c => c.id === slot?.classId);
                                            return (
                                                <td key={day} className="border border-black relative h-10 hover:bg-blue-50 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        if(canWrite) {
                                                            if(slot) {
                                                                if(confirm("Modifier ou supprimer ce créneau ?")) {
                                                                    setNewSlot(slot); setIsModalOpen(true);
                                                                }
                                                            } else {
                                                                setNewSlot({ dayOfWeek: day as any, startTime: row.start, endTime: row.end, teacherId: selectedEntityId });
                                                                setIsModalOpen(true);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {slot && (
                                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                                            <span className="font-bold text-[11px] text-black uppercase">{slotClass?.name}</span>
                                                            <span className="text-[9px] text-gray-600 font-semibold">{slot.subject}</span>
                                                            {slot.room && <span className="text-[8px] text-green-700">({slot.room})</span>}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Tableau Récapitulatif */}
                    <div className="mt-4">
                        <div className="text-center font-bold text-xs uppercase mb-1">Tableau Récapitulatif</div>
                        <table className="w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr className="bg-white">
                                    <th className="text-left px-2 w-32">CLASSES</th>
                                    {teacherStats.recap.map((r, i) => <th key={i}>{r.name}</th>)}
                                    <th className="w-20 border-l-2 border-black">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="font-bold px-2">EFFECTIFS</td>
                                    {teacherStats.recap.map((r, i) => <td key={i}>{r.count}</td>)}
                                    <td className="border-l-2 border-black"></td>
                                </tr>
                                <tr>
                                    <td className="font-bold px-2">DISCIPLINES</td>
                                    {teacherStats.recap.map((r, i) => <td key={i}>{r.subject}</td>)}
                                    <td className="border-l-2 border-black"></td>
                                </tr>
                                <tr>
                                    <td className="font-bold px-2">HEURES D'ENSEIG.</td>
                                    {teacherStats.recap.map((r, i) => <td key={i}>{Math.round(r.hours)}H</td>)}
                                    <td className="border-l-2 border-black font-bold">{teacherStats.totalHours}H</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Administratif */}
                    <div className="mt-4 border border-black text-xs">
                        <div className="border-b border-black p-1 font-bold">COMPLÉMENT DE SERVICE</div>
                        <div className="flex">
                            <div className="w-1/4 border-r border-black p-2 font-bold flex items-center">DÉCHARGES</div>
                            <div className="flex-1 grid grid-cols-5 text-center">
                                <div className="border-r border-black border-b p-1 bg-gray-100">PP</div>
                                <div className="border-r border-black border-b p-1 bg-gray-100">CE</div>
                                <div className="border-r border-black border-b p-1 bg-gray-100">LABO</div>
                                <div className="border-r border-black border-b p-1 bg-gray-100">BIB/CDI</div>
                                <div className="border-b p-1 bg-gray-100">UP</div>
                                
                                {/* Values (Mocked or Calculated if logic exists) */}
                                <div className="border-r border-black p-1"></div>
                                <div className="border-r border-black p-1">1H</div>
                                <div className="border-r border-black p-1"></div>
                                <div className="border-r border-black p-1"></div>
                                <div className="p-1"></div>
                            </div>
                            <div className="w-20 border-l border-black flex items-center justify-center font-bold">1H</div>
                        </div>
                        <div className="border-t border-black p-1 flex justify-between">
                            <span>AUGMENTATION DE SERVICE (CLASSE MOINS DE 20 ÉLÈVES)</span>
                        </div>
                        <div className="border-t border-black flex">
                            <div className="flex-1 p-1 text-right pr-4 font-bold">TOTAL</div>
                            <div className="w-20 border-l border-black p-1 text-center font-bold">{teacherStats.totalHours + 1}H</div>
                        </div>
                        <div className="border-t border-black flex">
                            <div className="flex-1 p-1 text-right pr-4">MAXIMUM DE SERVICE</div>
                            <div className="w-20 border-l border-black p-1 text-center">21H</div>
                        </div>
                        <div className="border-t border-black flex">
                            <div className="flex-1 p-1 text-right pr-4">HEURES SUPPLÉMENTAIRES</div>
                            <div className="w-20 border-l border-black p-1 text-center"></div>
                        </div>
                    </div>

                </div>
            ) : viewType === 'CLASS' && selectedClass ? (
                <div className="max-w-5xl mx-auto text-black">
                    {/* Header Administratif Classe */}
                    <div className="border border-black mb-4 p-4 font-sans text-sm">
                        <div className="flex justify-between items-center border-b border-black pb-2 mb-4">
                            <div className="font-bold text-xl uppercase tracking-wider">Emploi du Temps Élèves</div>
                            <div className="text-right">
                                <div className="font-bold text-lg">CLASSE : {selectedClass.name}</div>
                                <div className="text-xs text-gray-600">Année Scolaire 2023-2024</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs border border-black p-2">
                            <div>
                                <span className="font-bold block mb-1">Professeur Principal :</span>
                                {teachers.find(t => t.id === selectedClass.mainTeacherId)?.firstName || ''} {teachers.find(t => t.id === selectedClass.mainTeacherId)?.lastName || 'Non Défini'}
                            </div>
                            <div className="text-center border-l border-r border-black">
                                <span className="font-bold block mb-1">Salle Principale :</span>
                                {selectedClass.room || 'Non définie'}
                            </div>
                            <div className="text-right">
                                <span className="font-bold block mb-1">Effectif :</span>
                                {selectedClass.studentCount} Élèves
                            </div>
                        </div>
                    </div>

                    {/* Grille Horaire Classe */}
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="w-24 py-2">HORAIRES</th>
                                {ADMIN_DAYS.map(d => <th key={d} className="w-1/5">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {TIME_ROWS.map((row, idx) => {
                                if (row.type === 'BREAK') {
                                    return (
                                        <tr key={idx} className="bg-gray-100">
                                            <td className="border border-black py-1 font-mono">{row.start} - {row.end}</td>
                                            <td colSpan={5} className="border border-black py-1 font-bold text-center uppercase tracking-widest text-gray-600">
                                                {row.label}
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={idx}>
                                        <td className="border border-black py-2 font-mono bg-white">{row.start} - {row.end}</td>
                                        {ADMIN_DAYS.map(day => {
                                            const slot = getSlotForCell(day, row.start, row.end);
                                            const slotTeacher = teachers.find(t => t.id === slot?.teacherId);
                                            return (
                                                <td key={day} className="border border-black relative h-10 hover:bg-blue-50 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                        if(canWrite) {
                                                            if(slot) {
                                                                if(confirm("Modifier ou supprimer ce créneau ?")) {
                                                                    setNewSlot(slot); setIsModalOpen(true);
                                                                }
                                                            } else {
                                                                setNewSlot({ dayOfWeek: day as any, startTime: row.start, endTime: row.end, classId: selectedEntityId });
                                                                setIsModalOpen(true);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {slot && (
                                                        <div className="flex flex-col items-center justify-center h-full text-center p-1">
                                                            <span className="font-bold text-[10px] text-black uppercase block mb-0.5">{slot.subject}</span>
                                                            <span className="text-[9px] text-gray-600 italic block leading-tight">
                                                                {slotTeacher ? `M. ${slotTeacher.lastName}` : 'Prof. Inconnu'}
                                                            </span>
                                                            {slot.room && slot.room !== selectedClass.room && (
                                                                <span className="text-[8px] text-green-700 font-bold mt-0.5 block">({slot.room})</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Tableau Récapitulatif Classe */}
                    <div className="mt-6 flex gap-6 items-start">
                        <div className="flex-1">
                            <div className="font-bold text-xs uppercase mb-1 border-b border-black pb-1">Répartition par Discipline</div>
                            <table className="w-full border-collapse border border-black text-xs">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="text-left px-2 py-1">Discipline</th>
                                        <th className="text-left px-2 py-1">Professeur</th>
                                        <th className="text-center px-2 py-1">Volume Hebdo.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStats.recap.map((stat, i) => (
                                        <tr key={i}>
                                            <td className="border border-black px-2 py-1 font-medium">{stat.subject}</td>
                                            <td className="border border-black px-2 py-1 text-gray-600 italic">{stat.teacher}</td>
                                            <td className="border border-black px-2 py-1 text-center font-bold">{Math.round(stat.hours)}H</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="border border-black px-2 py-1" colSpan={2}>TOTAL GÉNÉRAL</td>
                                        <td className="border border-black px-2 py-1 text-center">{classStats.totalHours}H</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="w-64 border border-black p-2 text-xs">
                            <div className="font-bold mb-8 text-center underline">Signatures</div>
                            
                            <div className="mb-12">
                                <span className="block font-bold mb-10">Le Chef d'Établissement</span>
                            </div>
                            
                            <div className="mb-8">
                                <span className="block font-bold mb-8">Le Professeur Principal</span>
                            </div>

                            <div className="text-[10px] text-center italic text-gray-500 mt-4">
                                Document généré le {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Sélectionnez une vue ou une entité pour afficher l'emploi du temps.</p>
                </div>
            )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Gestion Créneau</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSaveSlot} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Classe</label>
                                <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={newSlot.classId}
                                    onChange={e => setNewSlot({...newSlot, classId: e.target.value})}
                                    required
                                >
                                    <option value="">Choisir...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Professeur</label>
                                <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={newSlot.teacherId}
                                    onChange={e => setNewSlot({...newSlot, teacherId: e.target.value})}
                                    required
                                >
                                    <option value="">Choisir...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Matière</label>
                            <select 
                                className="w-full p-2 border rounded text-sm"
                                value={newSlot.subject}
                                onChange={e => setNewSlot({...newSlot, subject: e.target.value})}
                                required
                            >
                                <option value="">Choisir...</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Jour</label>
                                <select 
                                    className="w-full p-2 border rounded text-sm"
                                    value={newSlot.dayOfWeek}
                                    onChange={e => setNewSlot({...newSlot, dayOfWeek: e.target.value as any})}
                                >
                                    {ADMIN_DAYS.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Début</label>
                                <input type="time" className="w-full p-2 border rounded text-sm" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Fin</label>
                                <input type="time" className="w-full p-2 border rounded text-sm" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Salle</label>
                                <input type="text" className="w-full p-2 border rounded text-sm" placeholder="ex: B202" value={newSlot.room} onChange={e => setNewSlot({...newSlot, room: e.target.value})} required />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100">
                            {newSlot.id && (
                                <button type="button" onClick={() => { handleDeleteSlot(newSlot.id!); setIsModalOpen(false); }} className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium mr-auto">Supprimer</button>
                            )}
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm font-medium">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
