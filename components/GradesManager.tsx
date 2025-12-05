
import React, { useState, useEffect, useMemo } from 'react';
import { Student, SystemUser, Grade, School, Teacher } from '../types';
import { Search, Printer, Plus, X, CheckSquare, ArrowRight, RefreshCw, FileSpreadsheet, Lock, FileText, Layers } from 'lucide-react';
import { db } from '../services/db';
import { DEFAULT_SUBJECTS } from '../constants';

interface GradesManagerProps {
  students: Student[];
  currentSchoolId: string;
  currentUser?: SystemUser;
}

// Defines how subjects are grouped in the report card
const SUBJECT_GROUPS: Record<string, string[]> = {
  'SCIENCES': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Informatique', 'Sciences', 'Technologie'],
  'LETTRES': ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Philosophie', 'Histoire-Géo', 'Littérature', 'Arabe', 'Latin'],
  'AUTRES': ['EPS', 'Conduite', 'Arts Plastiques', 'Musique', 'TICE', 'ECM']
};

export const GradesManager: React.FC<GradesManagerProps> = ({ students, currentSchoolId, currentUser }) => {
  // UI State for Tabs
  const [activeTab, setActiveTab] = useState('NOTES');
  
  // Filter State
  const [selectedPeriod, setSelectedPeriod] = useState('1er Trimestre');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Mathématiques');
  
  // Logic State
  const [roundingMode, setRoundingMode] = useState<'NON' | '0.25' | '0.50' | 'ENTIER'>('NON');
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  
  // Grade Form (Quick Add)
  const [gradeForm, setGradeForm] = useState<Partial<Grade> & { studentId: string }>({
    studentId: '',
    subject: selectedSubject,
    type: 'Devoir',
    coefficient: 1,
    value: undefined
  });

  const canWrite = currentUser ? db.hasPermission(currentSchoolId, currentUser.role, 'GRADES.write') : false;

  // Initialize
  useEffect(() => {
      setLocalStudents(students);
      
      // Set default class if available
      const uniqueClasses = Array.from(new Set(students.map(s => s.classGrade))).sort();
      if (uniqueClasses.length > 0 && !selectedClass) {
          setSelectedClass(uniqueClasses[0]);
      }
  }, [students, currentSchoolId]);

  // --- Computed Data ---
  const uniqueClasses = Array.from(new Set(students.map(s => s.classGrade))).sort();
  const schoolSubjects = db.getSchoolConfig(currentSchoolId).subjects || DEFAULT_SUBJECTS;

  // Filter Students by Class
  const classStudents = useMemo(() => {
      return localStudents.filter(s => s.classGrade === selectedClass);
  }, [localStudents, selectedClass]);

  // Calculate Averages and Ranks for the CURRENT VIEW (Single Subject)
  const processedStudents = useMemo(() => {
      return classStudents.map(student => {
          // Get grades for selected subject
          const subjectGrades = (student.grades || []).filter(g => g.subject === selectedSubject);
          
          // Weighted Average Calculation
          let totalPoints = 0;
          let totalCoef = 0;
          subjectGrades.forEach(g => {
              totalPoints += g.value * g.coefficient;
              totalCoef += g.coefficient;
          });

          let rawAverage = totalCoef > 0 ? totalPoints / totalCoef : 0;

          // Apply Bonus Average (Input from UI)
          const bonusData = student.subjectBonuses?.[selectedSubject] || { averageBonus: 0, pointBonus: 0 };
          rawAverage += (bonusData.averageBonus || 0);
          
          if (totalCoef > 0) {
             rawAverage += (bonusData.pointBonus / totalCoef);
          }

          // Rounding
          let finalAverage = rawAverage;
          if (roundingMode === '0.25') finalAverage = Math.ceil(rawAverage * 4) / 4;
          if (roundingMode === '0.50') finalAverage = Math.ceil(rawAverage * 2) / 2;
          if (roundingMode === 'ENTIER') finalAverage = Math.ceil(rawAverage);

          return {
              ...student,
              calculatedAverage: finalAverage,
              bonusData
          };
      }).sort((a, b) => b.calculatedAverage - a.calculatedAverage); // Sort by avg for rank
  }, [classStudents, selectedSubject, roundingMode, localStudents]);

  // Filter for "NON CLASSÉ" tab
  const visibleStudents = useMemo(() => {
      if (activeTab === 'NON CLASSÉ') {
          return processedStudents.filter(s => s.calculatedAverage < 10);
      }
      return processedStudents;
  }, [activeTab, processedStudents]);

  // --- Handlers ---

  const handleBonusChange = (studentId: string, field: 'averageBonus' | 'pointBonus', value: string) => {
      const numValue = parseFloat(value) || 0;
      const updatedStudents = localStudents.map(s => {
          if (s.id === studentId) {
              const currentBonuses = s.subjectBonuses || {};
              const subjectBonus = currentBonuses[selectedSubject] || { averageBonus: 0, pointBonus: 0 };
              
              return {
                  ...s,
                  subjectBonuses: {
                      ...currentBonuses,
                      [selectedSubject]: {
                          ...subjectBonus,
                          [field]: numValue
                      }
                  }
              };
          }
          return s;
      });
      setLocalStudents(updatedStudents);
  };

  const handleSaveBonuses = () => {
      localStudents.forEach(s => db.saveStudent(s));
      alert("Bonus et modifications enregistrés avec succès.");
  };

  const handleRefreshAverage = () => {
      setLocalStudents([...db.getStudents(currentSchoolId)]);
      alert("Moyennes actualisées depuis la base de données.");
  };

  const getAppreciation = (note: number) => {
      if (note >= 18) return "Excellent";
      if (note >= 16) return "Très Bien";
      if (note >= 14) return "Bien";
      if (note >= 12) return "Assez Bien";
      if (note >= 10) return "Passable";
      if (note >= 8) return "Faible";
      if (note >= 5) return "Très Faible";
      return "Nul";
  };

  const getSubjectGroup = (subject: string) => {
      for (const [group, subjects] of Object.entries(SUBJECT_GROUPS)) {
          if (subjects.includes(subject)) return group;
      }
      return 'AUTRES'; // Default
  };

  // --- SHARED CALCULATION LOGIC ---
  const calculateClassStats = (studentsList: Student[]) => {
      // 1. Subject Rankings
      const subjectRankings: Record<string, string[]> = {};
      const subjectStats: Record<string, {min: number, max: number, avg: number}> = {};

      schoolSubjects.forEach(subj => {
          const studentsInSubj = studentsList.map(s => {
              const grades = (s.grades || []).filter(g => g.subject === subj);
              let pts = 0, coef = 0;
              grades.forEach(g => { pts += g.value * g.coefficient; coef += g.coefficient; });
              return { id: s.id, avg: coef > 0 ? pts / coef : 0 };
          }).sort((a, b) => b.avg - a.avg);
          
          subjectRankings[subj] = studentsInSubj.map(s => s.id);
          
          const avgs = studentsInSubj.map(s => s.avg).filter(a => a > 0);
          if (avgs.length > 0) {
              subjectStats[subj] = {
                  min: Math.min(...avgs),
                  max: Math.max(...avgs),
                  avg: avgs.reduce((a, b) => a + b, 0) / avgs.length
              };
          } else {
              subjectStats[subj] = { min: 0, max: 0, avg: 0 };
          }
      });

      // 2. Global Rankings
      const globalRankings = studentsList.map(s => {
          let totalPts = 0, totalCoef = 0;
          schoolSubjects.forEach(subj => {
              const grades = (s.grades || []).filter(g => g.subject === subj);
              let pts = 0, coef = 0;
              const defaultCoef = grades.length > 0 ? grades[0].coefficient : 2; // Basic assumption
              
              grades.forEach(g => { pts += g.value * g.coefficient; coef += g.coefficient; });
              
              const avg = coef > 0 ? pts / coef : 0;
              // Standard weight logic: Average * Subject Coefficient
              // Simplified: If no grade, assumes 0. 
              if(grades.length > 0 || coef > 0) {
                  totalPts += avg * defaultCoef;
                  totalCoef += defaultCoef;
              }
          });
          return { id: s.id, avg: totalCoef > 0 ? totalPts / totalCoef : 0 };
      }).sort((a, b) => b.avg - a.avg);

      const classGlobalStats = {
          min: globalRankings.length > 0 ? globalRankings[globalRankings.length - 1].avg : 0,
          max: globalRankings.length > 0 ? globalRankings[0].avg : 0,
          avg: globalRankings.reduce((acc, curr) => acc + curr.avg, 0) / (globalRankings.length || 1)
      };

      return { subjectRankings, subjectStats, globalRankings, classGlobalStats };
  };

  // --- HTML GENERATOR FOR ONE STUDENT ---
  const generateBulletinHtml = (
      student: Student, 
      school: School | undefined, 
      teachers: Teacher[], 
      stats: any
  ) => {
      const { subjectRankings, subjectStats, globalRankings, classGlobalStats } = stats;

      // Rows Data
      const rowsByCategory: Record<string, any[]> = { 'LETTRES': [], 'SCIENCES': [], 'AUTRES': [] };
      let grandTotalPoints = 0;
      let grandTotalCoef = 0;

      schoolSubjects.forEach((subj: string) => {
          const grades = (student.grades || []).filter(g => g.subject === subj);
          const teacher = teachers.find(t => t.subject === subj);
          const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '';

          let pts = 0, coef = 0;
          const defaultCoef = grades.length > 0 ? grades[0].coefficient : 2;
          grades.forEach(g => { pts += g.value * g.coefficient; coef += g.coefficient; });
          const avg = coef > 0 ? pts / coef : 0;
          
          const subjectCoef = defaultCoef;
          const subjectPoints = avg * subjectCoef;

          if (coef > 0 || grades.length > 0) {
              grandTotalPoints += subjectPoints;
              grandTotalCoef += subjectCoef;
          }

          const notesString = grades.map(g => g.value.toString().replace('.', ',')).join(' ; ');
          const rank = subjectRankings[subj].findIndex((id: string) => id === student.id) + 1;
          const rankSuffix = rank === 1 ? 'er' : 'ème';

          const rowData = {
              subject: subj,
              notes: notesString,
              avg: avg,
              coef: subjectCoef,
              points: subjectPoints,
              rank: rank > 0 ? `${rank}${rankSuffix}` : '-',
              appreciation: getAppreciation(avg),
              teacher: teacherName
          };

          const group = getSubjectGroup(subj);
          rowsByCategory[group].push(rowData);
      });

      const globalAvg = grandTotalCoef > 0 ? grandTotalPoints / grandTotalCoef : 0;
      const studentGlobalRank = globalRankings.findIndex((s: any) => s.id === student.id) + 1;

      const generateGroupRows = (groupName: string, label: string) => {
          const rows = rowsByCategory[groupName];
          if (rows.length === 0) return '';

          const groupCoef = rows.reduce((acc, r) => acc + r.coef, 0);
          const groupPoints = rows.reduce((acc, r) => acc + r.points, 0);
          const groupAvg = groupCoef > 0 ? groupPoints / groupCoef : 0;

          let html = '';
          rows.forEach(row => {
              html += `
                <tr>
                    <td class="col-left" style="padding-left: 5px;">${row.subject}<br/><span style="font-size:9px;color:#555;">${row.notes}</span></td>
                    <td class="bold">${row.avg.toFixed(2).replace('.', ',')}</td>
                    <td>${row.coef}</td>
                    <td>${row.points.toFixed(2).replace('.', ',')}</td>
                    <td>${row.rank}</td>
                    <td class="col-left text-small italic">${row.appreciation}</td>
                    <td class="col-left" style="font-size:10px;">${row.teacher}</td>
                    <td style="vertical-align:bottom;">
                        <div style="border-bottom: 1px dotted #999; height: 15px; width: 80%; margin: 0 auto;"></div>
                    </td>
                </tr>
              `;
          });
          html += `
            <tr class="row-summary">
                <td class="col-left bold">BILAN ${label}</td>
                <td class="bold">${groupAvg.toFixed(2).replace('.', ',')}</td>
                <td class="bold">${groupCoef}</td>
                <td class="bold">${groupPoints.toFixed(2).replace('.', ',')}</td>
                <td colspan="4"></td>
            </tr>
          `;
          return html;
      };

      return `
            <div class="bulletin-page">
                <div class="header-container">
                    <div class="school-brand">
                        <img src="${school?.logoUrl || ''}" class="school-logo" alt="Logo" />
                        <div style="font-weight:bold; font-size:14px;">${school?.name}</div>
                        <div>${school?.address}</div>
                        <div>Année Scolaire: 2023-2024</div>
                    </div>
                    <div class="bulletin-title">
                        <h1>Bulletin de Notes</h1>
                        <h2>${selectedPeriod}</h2>
                    </div>
                    <div class="meta-info">
                        <div><strong>Code:</strong> ${school?.id.slice(-4)}</div>
                        <div><strong>Statut:</strong> Privé</div>
                        <div><strong>Directeur:</strong> ${school?.config.directorName}</div>
                    </div>
                </div>

                <div class="student-box">
                    <div class="student-details">
                        <span class="student-name">${student.firstName} ${student.lastName}</span>
                        <div style="display:flex; gap: 40px;">
                            <div>
                                <div><span class="label">Matricule:</span> ${student.matricule}</div>
                                <div><span class="label">Classe:</span> ${student.classGrade}</div>
                                <div><span class="label">Effectif:</span> ${classStudents.length}</div>
                            </div>
                            <div>
                                <div><span class="label">Né(e) le:</span> 14/10/2008</div>
                                <div><span class="label">Nationalité:</span> Ivoirienne</div>
                                <div><span class="label">Redoublant:</span> Non</div>
                            </div>
                        </div>
                    </div>
                    <img src="${student.photoUrl || 'https://via.placeholder.com/150'}" class="student-photo" alt="Photo" />
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width:18%">Discipline</th>
                            <th style="width:7%">Moy./20</th>
                            <th style="width:5%">Coef.</th>
                            <th style="width:7%">Moy Coef</th>
                            <th style="width:5%">Rang</th>
                            <th style="width:18%">Appréciation</th>
                            <th style="width:20%">PROFESSEUR</th>
                            <th style="width:20%">ÉMARGEMENT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateGroupRows('LETTRES', 'LETTRES')}
                        ${generateGroupRows('SCIENCES', 'SCIENCES')}
                        ${generateGroupRows('AUTRES', 'AUTRES')}
                        
                        <tr style="border-top: 2px solid #000;">
                            <td class="col-left bold" style="font-size: 14px;">TOTAUX GÉNÉRAUX</td>
                            <td></td>
                            <td class="bold" style="font-size: 14px;">${grandTotalCoef}</td>
                            <td class="bold" style="font-size: 14px;">${grandTotalPoints.toFixed(2).replace('.', ',')}</td>
                            <td colspan="4"></td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer-section">
                    <div class="footer-col">
                        <span class="footer-header">Assiduité</span>
                        <div style="margin-top: 10px;">
                            <div>Absences: <span class="bold">${20 - student.attendance}h</span></div>
                            <div>Justifiées: <span class="bold">0h</span></div>
                            <div>Retards: <span class="bold">2</span></div>
                        </div>
                    </div>
                    <div class="footer-col">
                        <span class="footer-header">Moyenne Trimestrielle</span>
                        <div style="text-align: center; margin-top: 5px;">
                            <div style="font-size: 24px; font-weight: 900;">${globalAvg.toFixed(2).replace('.', ',')} / 20</div>
                            <div style="margin-top: 5px;">Rang: <span class="bold" style="font-size: 16px;">${studentGlobalRank}${studentGlobalRank === 1 ? 'er' : 'ème'}</span> / ${classStudents.length}</div>
                            <div style="margin-top: 5px; font-style: italic;">Mention: ${getAppreciation(globalAvg)}</div>
                        </div>
                    </div>
                    <div class="footer-col">
                        <span class="footer-header">Résultats de la classe</span>
                        <div style="display: flex; justify-content: space-between; padding: 0 10px; margin-top: 10px;">
                            <span>Moyenne Classe:</span> <span class="bold">${classGlobalStats.avg.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0 10px;">
                            <span>Plus basse:</span> <span class="bold">${classGlobalStats.min.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0 10px;">
                            <span>Plus élevée:</span> <span class="bold">${classGlobalStats.max.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="signatures">
                    <div class="sig-box" style="text-align:left;">
                        <span class="sig-title" style="text-align:center">Mentions du Conseil</span>
                        <div style="padding:5px; font-style:italic; font-family: cursive; color: #444;">
                            Travail sérieux. Continuez ainsi. <br/>
                            Tableau d'Honneur.
                        </div>
                    </div>
                    <div class="sig-box">
                        <span class="sig-title">Professeur Principal</span>
                        <div style="margin-top:30px; font-family: cursive;">${teachers[0]?.firstName} ${teachers[0]?.lastName}</div>
                    </div>
                    <div class="sig-box">
                        <span class="sig-title">Le Directeur des Études</span>
                        <div class="stamp-placeholder">CACHET<br/>ÉTABLISSEMENT</div>
                    </div>
                </div>
                
                <div style="text-align: center; font-size: 10px; margin-top: 10px; color: #666;">
                    En cas de perte, aucun duplicata ne sera délivré.
                </div>
            </div>
      `;
  };

  // --- PRINT CSS ---
  const PRINT_STYLES = `
    <style>
        body { font-family: 'Arial Narrow', Arial, sans-serif; background: #fff; color: #000; max-width: 210mm; margin: 0 auto; }
        .bulletin-page { padding: 20px; height: 100vh; box-sizing: border-box; position: relative; }
        .header-container { display: flex; justify-content: space-between; border: 2px solid #000; padding: 10px; margin-bottom: 10px; }
        .school-brand { width: 40%; font-size: 12px; text-align: center; }
        .school-logo { width: 60px; height: 60px; background: #eee; margin: 0 auto 5px; display: block; object-fit: contain; }
        .bulletin-title { width: 30%; text-align: center; display: flex; flex-direction: column; justify-content: center; border-left: 1px solid #000; border-right: 1px solid #000; }
        .bulletin-title h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; line-height: 1; }
        .bulletin-title h2 { margin: 5px 0 0; font-size: 16px; font-weight: bold; }
        .meta-info { width: 25%; font-size: 12px; padding-left: 10px; display: flex; flex-direction: column; justify-content: center; }
        
        .student-box { border: 2px solid #000; padding: 10px; margin-bottom: 15px; display: flex; position: relative; }
        .student-details { flex: 1; font-size: 14px; line-height: 1.4; }
        .student-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .student-photo { width: 80px; height: 100px; border: 1px solid #ccc; position: absolute; right: 10px; top: 10px; background: #f0f0f0; }
        .label { font-weight: bold; margin-right: 5px; }

        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
        th, td { border: 1px solid #000; padding: 4px 6px; text-align: center; }
        th { background-color: #fff; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; }
        .col-left { text-align: left; }
        .row-summary { background-color: #f0f0f0; font-weight: bold; }
        .text-small { font-size: 10px; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }

        .footer-section { display: flex; border: 2px solid #000; margin-bottom: 10px; }
        .footer-col { border-right: 1px solid #000; padding: 5px; flex: 1; font-size: 12px; }
        .footer-col:last-child { border-right: none; }
        .footer-header { text-align: center; font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; display: block; background: #eee; }
        
        .signatures { display: flex; justify-content: space-between; border: 2px solid #000; height: 120px; }
        .sig-box { flex: 1; border-right: 1px solid #000; padding: 5px; text-align: center; font-size: 12px; position: relative; }
        .sig-box:last-child { border-right: none; }
        .sig-title { font-weight: bold; text-decoration: underline; display: block; margin-bottom: 40px; }
        
        .stamp-placeholder { position: absolute; bottom: 10px; right: 10px; width: 80px; height: 80px; border: 2px dotted #ccc; border-radius: 50%; transform: rotate(-15deg); color: #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; }

        @media print {
            body { -webkit-print-color-adjust: exact; margin: 0; }
            .bulletin-page { page-break-after: always; height: 100vh; }
            .bulletin-page:last-child { page-break-after: auto; }
        }
    </style>
  `;

  // --- PRINT HANDLERS ---

  const handlePrintBulletin = (studentId: string) => {
      const student = localStudents.find(s => s.id === studentId);
      if (!student) return;

      const school = db.getSchoolById(currentSchoolId);
      const teachers = db.getTeachers(currentSchoolId);
      const stats = calculateClassStats(classStudents);

      const htmlBody = generateBulletinHtml(student, school, teachers, stats);

      const printWindow = window.open('', '', 'width=1000,height=900');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bulletin - ${student.firstName} ${student.lastName}</title>
            ${PRINT_STYLES}
        </head>
        <body>
            ${htmlBody}
            <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
  };

  const handleBulkPrint = () => {
      if (visibleStudents.length === 0) return;

      const school = db.getSchoolById(currentSchoolId);
      const teachers = db.getTeachers(currentSchoolId);
      const stats = calculateClassStats(classStudents); // Calc once for all

      // Generate HTML for ALL students
      let allBulletinsHtml = '';
      visibleStudents.forEach(student => {
          allBulletinsHtml += generateBulletinHtml(student, school, teachers, stats);
      });

      const printWindow = window.open('', '', 'width=1000,height=900');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bulletins - ${selectedClass}</title>
            ${PRINT_STYLES}
        </head>
        <body>
            ${allBulletinsHtml}
            <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
  };

  const handleSaveGrade = (e: React.FormEvent) => {
      e.preventDefault();
      if(gradeForm.studentId && gradeForm.value !== undefined) {
          db.saveGrade(gradeForm.studentId, {
              id: `G-${Date.now()}`,
              subject: selectedSubject,
              value: Number(gradeForm.value),
              coefficient: Number(gradeForm.coefficient),
              type: gradeForm.type || 'Devoir',
              date: new Date().toISOString()
          });
          setIsGradeModalOpen(false);
          setLocalStudents(db.getStudents(currentSchoolId)); // Refresh
      }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] flex flex-col font-sans">
      {/* Header Title */}
      <div className="px-8 pt-6 pb-2">
          <h1 className="text-3xl font-light text-slate-600 flex items-center gap-2">
              Gestion des notes
          </h1>
      </div>

      {/* Top Tabs */}
      <div className="px-8 border-b border-gray-200 flex gap-1 overflow-x-auto">
          {['NOTES', 'NON CLASSÉ', 'VUE ANNUELLE', 'VERROUILLER', 'CONDUITE'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wide transition-colors relative whitespace-nowrap
                    ${activeTab === tab ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                `}
              >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-amber-400 rotate-45"></div>}
              </button>
          ))}
      </div>

      <div className="p-8 flex-1 bg-slate-50">
          {activeTab === 'NOTES' || activeTab === 'NON CLASSÉ' ? (
            <>
              {/* Section Title */}
              <h2 className="text-xl font-bold text-blue-900 flex items-center mb-6">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-900 flex items-center justify-center mr-2">
                      <ArrowRight size={12} strokeWidth={3}/>
                  </div>
                  Saisie des notes & Bulletins {activeTab === 'NON CLASSÉ' && <span className="ml-2 text-red-500">(Élèves en difficulté)</span>}
              </h2>

              {/* Filter Box */}
              <div className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-lg relative mb-6 shadow-sm">
                  <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-bold text-amber-500 border-b-2 border-amber-400">
                      Faire la selection
                  </span>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs text-gray-500 font-semibold uppercase">Période :</label>
                          <select 
                            className="w-full border border-gray-300 p-2 text-sm rounded bg-white"
                            value={selectedPeriod}
                            onChange={e => setSelectedPeriod(e.target.value)}
                          >
                              <option>1er Trimestre</option>
                              <option>2ème Trimestre</option>
                              <option>3ème Trimestre</option>
                          </select>
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs text-gray-500 font-semibold uppercase">Classe :</label>
                          <select 
                            className="w-full border border-gray-300 p-2 text-sm rounded bg-white"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                          >
                              <option value="">-- Choisir --</option>
                              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs text-gray-500 font-semibold uppercase">Matière (Saisie) :</label>
                          <select 
                            className="w-full border border-gray-300 p-2 text-sm rounded bg-white"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                          >
                              {schoolSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      <button onClick={handleRefreshAverage} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-bold rounded shadow-sm flex items-center h-[38px]">
                          <CheckSquare size={16} className="mr-2" /> Actualiser
                      </button>
                  </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap justify-end items-center gap-3 mb-6">
                  {canWrite && (
                      <div className="flex items-center gap-4 mr-auto text-xs font-bold text-gray-600">
                          <span>ARRONDIR :</span>
                          {['NON', '0.25', '0.50', 'ENTIER'].map((opt) => (
                              <label key={opt} className="flex items-center cursor-pointer hover:text-blue-600">
                                  <input 
                                    type="radio" 
                                    name="rounding" 
                                    className="mr-1" 
                                    checked={roundingMode === opt}
                                    onChange={() => setRoundingMode(opt as any)}
                                  />
                                  {opt}
                              </label>
                          ))}
                      </div>
                  )}

                  {selectedClass && visibleStudents.length > 0 && (
                      <button 
                        onClick={handleBulkPrint} 
                        className="bg-slate-800 text-white px-4 py-2 text-xs font-bold rounded hover:bg-slate-900 flex items-center shadow-md border border-slate-900"
                      >
                          <Layers size={14} className="mr-2" /> Imprimer Tout ({visibleStudents.length})
                      </button>
                  )}

                  <button className="bg-gray-100 text-gray-700 px-4 py-2 text-xs font-bold rounded hover:bg-gray-200 flex items-center border border-gray-300">
                      <FileSpreadsheet size={14} className="mr-2" /> Exporter Excel
                  </button>
                  
                  {canWrite && (
                      <button onClick={() => setIsGradeModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold rounded hover:bg-emerald-700 flex items-center shadow-sm">
                          <Plus size={14} className="mr-2" /> Saisir Note
                      </button>
                  )}
              </div>

              {/* Table Section */}
              <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-gray-800 text-white text-xs uppercase font-bold">
                              <th className="px-4 py-3 border-r border-gray-600 w-12 text-center">N°</th>
                              <th className="px-4 py-3 border-r border-gray-600 w-32">Matricule</th>
                              <th className="px-4 py-3 border-r border-gray-600">Nom et Prénoms</th>
                              <th className="px-4 py-3 border-r border-gray-600 text-center w-32 bg-gray-700">Moy. Matière</th>
                              <th className="px-4 py-3 border-r border-gray-600 text-center w-24 bg-gray-700">Bonus Moy</th>
                              <th className="px-4 py-3 border-r border-gray-600 text-center w-24 bg-gray-700">Bonus Pts</th>
                              <th className="px-4 py-3 text-center w-16 bg-blue-900">Rang</th>
                              <th className="px-4 py-3 text-center w-24">Bulletin</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-gray-700">
                          {visibleStudents.length === 0 ? (
                              <tr>
                                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic bg-gray-50">
                                      {selectedClass ? "Aucun élève trouvé." : "Veuillez sélectionner une classe."}
                                  </td>
                              </tr>
                          ) : (
                              visibleStudents.map((student, index) => (
                                  <tr key={student.id} className="hover:bg-blue-50 border-b border-gray-200 transition-colors">
                                      <td className="px-4 py-2 text-center border-r border-gray-200">{index + 1}</td>
                                      <td className="px-4 py-2 font-mono border-r border-gray-200 text-gray-500">{student.matricule}</td>
                                      <td className="px-4 py-2 border-r border-gray-200 font-medium">{student.lastName} {student.firstName}</td>
                                      <td className={`px-4 py-2 text-center border-r border-gray-200 font-bold ${student.calculatedAverage < 10 ? 'text-red-600' : 'text-gray-800'}`}>
                                          {student.calculatedAverage > 0 ? student.calculatedAverage.toFixed(2) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-center border-r border-gray-200 bg-gray-50">
                                          {canWrite ? (
                                              <input 
                                                type="number" 
                                                className="w-16 p-1 border border-gray-300 text-center text-xs rounded" 
                                                value={student.bonusData?.averageBonus || 0}
                                                onChange={(e) => handleBonusChange(student.id, 'averageBonus', e.target.value)}
                                              />
                                          ) : (
                                              <span className="text-gray-500">{student.bonusData?.averageBonus || 0}</span>
                                          )}
                                      </td>
                                      <td className="px-4 py-2 text-center border-r border-gray-200 bg-gray-50">
                                          {canWrite ? (
                                              <input 
                                                type="number" 
                                                className="w-16 p-1 border border-gray-300 text-center text-xs rounded"
                                                value={student.bonusData?.pointBonus || 0}
                                                onChange={(e) => handleBonusChange(student.id, 'pointBonus', e.target.value)}
                                              />
                                          ) : (
                                              <span className="text-gray-500">{student.bonusData?.pointBonus || 0}</span>
                                          )}
                                      </td>
                                      <td className="px-4 py-2 text-center font-bold text-blue-700 border-r border-gray-200 bg-blue-50">
                                          {student.calculatedAverage > 0 ? `${index + 1}${index === 0 ? 'er' : 'e'}` : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                          <button 
                                            onClick={() => handlePrintBulletin(student.id)}
                                            className="bg-slate-700 text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
                                            title="Imprimer Bulletin Individuel"
                                          >
                                              <Printer size={14} />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
              
              {canWrite && (
                  <div className="flex justify-end mt-4">
                      <button 
                        onClick={handleSaveBonuses}
                        className="bg-orange-500 text-white px-6 py-2 text-sm font-bold rounded hover:bg-orange-600 uppercase shadow-md flex items-center"
                      >
                          <CheckSquare size={16} className="mr-2" /> Valider / Sauvegarder
                      </button>
                  </div>
              )}
            </>
          ) : activeTab === 'VUE ANNUELLE' ? (
              <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold text-gray-700">Récapitulatif Annuel</h3>
                  <p>Cette vue affichera la moyenne des 3 trimestres pour chaque élève.</p>
              </div>
          ) : (
              <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500">
                  <Lock size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold text-gray-700">Module Verrouillé</h3>
                  <p>Fonctionnalité disponible pour l'administrateur uniquement.</p>
              </div>
          )}
      </div>

      {/* Add Grade Modal */}
      {isGradeModalOpen && canWrite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-lg font-bold text-gray-800">Ajout rapide de note</h3>
                      <button onClick={() => setIsGradeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleSaveGrade} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Matière : <span className="font-bold text-blue-600">{selectedSubject}</span></label>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Élève</label>
                          <select 
                            className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white"
                            value={gradeForm.studentId}
                            onChange={e => setGradeForm({...gradeForm, studentId: e.target.value})}
                            required
                          >
                              <option value="">Sélectionner...</option>
                              {classStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Note (/20)</label>
                              <input 
                                type="number" 
                                step="0.25" 
                                max="20" 
                                min="0" 
                                className="w-full p-2 border border-gray-300 rounded font-bold"
                                value={gradeForm.value !== undefined ? gradeForm.value : ''}
                                onChange={e => setGradeForm({...gradeForm, value: e.target.value as any})}
                                required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Coef.</label>
                              <input 
                                type="number" 
                                min="1"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={gradeForm.coefficient}
                                onChange={e => setGradeForm({...gradeForm, coefficient: Number(e.target.value)})}
                              />
                          </div>
                      </div>
                      <div className="flex justify-end pt-4">
                          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-emerald-700">
                              Enregistrer Note
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
