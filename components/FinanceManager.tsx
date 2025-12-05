
import React, { useState, useEffect } from 'react';
import { Transaction, Teacher, Student, SystemUser } from '../types';
import { db } from '../services/db';
import { formatCurrency } from '../constants';
import { 
  TrendingUp, TrendingDown, CreditCard, 
  Printer, Briefcase, CheckCircle, Plus, X, Filter, 
  Search, Smartphone, Banknote, FileText, CheckCircle2, User, Users, Download, Wallet, Building
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinanceManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  currentSchoolId: string;
  currentUser: SystemUser;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({ transactions, onAddTransaction, currentSchoolId, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'payroll'>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>(db.getTeachers(currentSchoolId));
  const [students, setStudents] = useState<Student[]>([]);

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Transaction Modal State
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  
  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'FINANCE.write');

  // Transaction Form State
  const [trxForm, setTrxForm] = useState({
    studentId: '',
    studentName: '', 
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Tuition', 
    paymentMethod: 'Espèces', // Default
    operator: '', // For Mobile Money
    period: 'Trimestre 1',
    reference: '',
    status: 'Paid', 
    note: ''
  });

  // Payroll Form State
  const [salaryForm, setSalaryForm] = useState({
    teacherId: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    baseSalary: 0,
    bonus: 0,
    deduction: 0,
    note: '',
    // Payment Details
    status: 'Paid',
    paymentMethod: 'Virement',
    operator: '',
    reference: ''
  });

  useEffect(() => {
      setStudents(db.getStudents(currentSchoolId));
      setTeachers(db.getTeachers(currentSchoolId));
  }, [currentSchoolId]);

  // -- LOGIC: Calculate Net Salary --
  const netSalary = (salaryForm.baseSalary || 0) + (salaryForm.bonus || 0) - (salaryForm.deduction || 0);

  // -- FILTERING LOGIC --
  const filteredTransactions = transactions.filter(t => {
      const matchCategory = filterCategory === 'All' ? true : t.type === filterCategory;
      const matchStatus = filterStatus === 'All' ? true : t.status === filterStatus;
      const matchSearch = searchTerm === '' ? true : (
          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      let matchDate = true;
      const today = new Date();
      const trxDate = new Date(t.date);
      
      if (filterDate === 'ThisMonth') {
          matchDate = trxDate.getMonth() === today.getMonth() && trxDate.getFullYear() === today.getFullYear();
      } else if (filterDate === 'LastMonth') {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          matchDate = trxDate.getMonth() === lastMonth.getMonth() && trxDate.getFullYear() === lastMonth.getFullYear();
      }

      return matchCategory && matchStatus && matchDate && matchSearch;
  });

  const salaryTransactions = transactions.filter(t => t.type === 'Salary').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateTotalIncome = () => transactions.filter(t => t.flow === 'IN').reduce((sum, t) => sum + t.amount, 0);
  const calculateTotalExpenses = () => transactions.filter(t => t.flow === 'OUT').reduce((sum, t) => sum + t.amount, 0);
  
  const incomeByCategory = {
      Tuition: transactions.filter(t => t.type === 'Tuition' && t.flow === 'IN').reduce((sum, t) => sum + t.amount, 0),
      Canteen: transactions.filter(t => t.type === 'Canteen' && t.flow === 'IN').reduce((sum, t) => sum + t.amount, 0),
      Transport: transactions.filter(t => t.type === 'Transport' && t.flow === 'IN').reduce((sum, t) => sum + t.amount, 0),
      Registration: transactions.filter(t => t.type === 'Registration' && t.flow === 'IN').reduce((sum, t) => sum + t.amount, 0),
      Exam: transactions.filter(t => t.type === 'Exam' && t.flow === 'IN').reduce((sum, t) => sum + t.amount, 0)
  };

  const pieChartData = [
      { name: 'Scolarité', value: incomeByCategory.Tuition, color: '#3b82f6' },
      { name: 'Cantine', value: incomeByCategory.Canteen, color: '#f59e0b' },
      { name: 'Transport', value: incomeByCategory.Transport, color: '#10b981' },
      { name: 'Inscription', value: incomeByCategory.Registration, color: '#6366f1' },
      { name: 'Examen', value: incomeByCategory.Exam, color: '#ec4899' },
  ].filter(d => d.value > 0);

  // --- ACTIONS ---

  const handleOpenNewPayment = () => {
      setTrxForm({
          studentId: '',
          studentName: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          type: 'Tuition',
          paymentMethod: 'Espèces',
          operator: '',
          period: 'Trimestre 1',
          reference: '',
          status: 'Paid',
          note: ''
      });
      setIsTrxModalOpen(true);
  };

  const handleOpenSalaryModal = () => {
      setSalaryForm({
          teacherId: '',
          month: new Date().toISOString().slice(0, 7),
          baseSalary: 0,
          bonus: 0,
          deduction: 0,
          note: '',
          status: 'Paid',
          paymentMethod: 'Virement',
          operator: '',
          reference: ''
      });
      setIsSalaryModalOpen(true);
  };

  const handleTeacherSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tid = e.target.value;
      const teacher = teachers.find(t => t.id === tid);
      setSalaryForm({
          ...salaryForm,
          teacherId: tid,
          baseSalary: teacher ? teacher.baseSalary : 0
      });
  };

  const handleAddTransactionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      let finalStudentName = trxForm.studentName;
      if (trxForm.studentId) {
          const s = students.find(st => st.id === trxForm.studentId);
          if (s) finalStudentName = `${s.firstName} ${s.lastName}`;
      }
      let finalRef = trxForm.reference;
      if (!finalRef && trxForm.paymentMethod !== 'Espèces') {
          finalRef = `REF-${Date.now()}`;
      }
      const paymentDetails = trxForm.paymentMethod === 'Mobile Money' && trxForm.operator 
          ? trxForm.operator 
          : undefined;

      const newTrx: Transaction = {
          id: `TRX-${Date.now()}`,
          schoolId: currentSchoolId,
          studentId: trxForm.studentId,
          studentName: finalStudentName,
          amount: parseFloat(trxForm.amount),
          type: trxForm.type,
          flow: 'IN',
          date: trxForm.date,
          status: trxForm.status,
          description: getDescForType(trxForm.type),
          paymentMethod: trxForm.paymentMethod,
          paymentDetails: paymentDetails,
          period: trxForm.period,
          reference: finalRef,
          note: trxForm.note
      };
      onAddTransaction(newTrx);
      setIsTrxModalOpen(false);
  };

  const handlePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    if(!salaryForm.teacherId) return;
    
    const teacher = teachers.find(t => t.id === salaryForm.teacherId);
    if(!teacher) return;

    const paymentDetails = salaryForm.paymentMethod === 'Mobile Money' && salaryForm.operator 
          ? salaryForm.operator 
          : undefined;

    const newTrx: Transaction = {
      id: `SAL-${Date.now()}`,
      schoolId: currentSchoolId,
      studentName: `${teacher.firstName} ${teacher.lastName}`, // Reusing field for staff name
      amount: netSalary,
      type: 'Salary',
      flow: 'OUT',
      date: new Date().toISOString(),
      status: salaryForm.status,
      paymentMethod: salaryForm.paymentMethod,
      paymentDetails: paymentDetails,
      reference: salaryForm.reference,
      description: `Salaire ${salaryForm.month} - ${teacher.lastName}`,
      note: salaryForm.note,
      salaryBreakdown: {
          base: salaryForm.baseSalary,
          bonus: salaryForm.bonus,
          deduction: salaryForm.deduction
      }
    };

    onAddTransaction(newTrx);
    alert(`Salaire de ${formatCurrency(netSalary)} enregistré pour ${teacher.firstName} ${teacher.lastName}.`);
    setIsSalaryModalOpen(false);
  };

  const getDescForType = (type: string) => {
      switch(type) {
          case 'Tuition': return 'Scolarité';
          case 'Transport': return 'Transport';
          case 'Canteen': return 'Cantine';
          case 'Registration': return 'Inscription';
          case 'Exam': return 'Examen';
          default: return type;
      }
  };

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'Tuition': return 'Scolarité';
          case 'Transport': return 'Transport';
          case 'Canteen': return 'Cantine';
          case 'Registration': return 'Inscription';
          case 'Exam': return 'Examen';
          case 'Salary': return 'Salaire';
          case 'Trip': return 'Sortie';
          case 'Material': return 'Matériel';
          default: return type;
      }
  };

  const handlePrintPayslip = (trx: Transaction) => {
      const school = db.getSchoolById(currentSchoolId);
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>Bulletin de Paie - ${trx.studentName}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { width: 60px; height: 60px; object-fit: contain; display: block; margin: 0 auto 10px; }
              .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
              .header p { margin: 5px 0; font-size: 14px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-box { border: 1px solid #ccc; padding: 15px; }
              .info-label { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #666; display: block; margin-bottom: 5px; }
              .info-value { font-size: 16px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f8f9fa; text-transform: uppercase; font-size: 12px; }
              .total-row td { border-top: 2px solid #000; font-weight: bold; font-size: 18px; }
              .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; }
              .stamp { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
              .stamp div { width: 200px; height: 100px; border: 1px dashed #ccc; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              ${school?.logoUrl ? `<img src="${school.logoUrl}" class="logo" alt="Logo" />` : ''}
              <h2 style="margin:0; font-size:16px;">${school?.name}</h2>
              <p style="font-size:12px; margin-top:0;">${school?.address}</p>
              <h1 style="margin-top:20px;">Bulletin de Paie</h1>
              <p>Période : ${new Date(trx.date).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</p>
              <p>Référence : ${trx.id}</p>
            </div>

            <div class="info-grid">
              <div class="info-box">
                <span class="info-label">Employeur</span>
                <div class="info-value">${school?.name}</div>
                <div style="font-size:12px; margin-top:5px;">${school?.address}</div>
              </div>
              <div class="info-box">
                <span class="info-label">Employé</span>
                <div class="info-value">${trx.studentName}</div>
                <div style="font-size:12px; margin-top:5px;">Personnel Enseignant</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th style="text-align:right">Base</th>
                  <th style="text-align:right">Gain (+)</th>
                  <th style="text-align:right">Retenue (-)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Salaire de Base</td>
                  <td style="text-align:right">30 Jours</td>
                  <td style="text-align:right">${(trx.salaryBreakdown?.base || trx.amount).toLocaleString('fr-FR')}</td>
                  <td style="text-align:right"></td>
                </tr>
                ${trx.salaryBreakdown?.bonus ? `
                <tr>
                  <td>Primes & Indemnités</td>
                  <td style="text-align:right">-</td>
                  <td style="text-align:right">${trx.salaryBreakdown.bonus.toLocaleString('fr-FR')}</td>
                  <td style="text-align:right"></td>
                </tr>` : ''}
                ${trx.salaryBreakdown?.deduction ? `
                <tr>
                  <td>Avances / Retenues</td>
                  <td style="text-align:right">-</td>
                  <td style="text-align:right"></td>
                  <td style="text-align:right">${trx.salaryBreakdown.deduction.toLocaleString('fr-FR')}</td>
                </tr>` : ''}
                <tr class="total-row">
                  <td colspan="2">NET À PAYER</td>
                  <td colspan="2" style="text-align:right; color: #1e40af;">${trx.amount.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-bottom: 20px; font-size: 14px;">
              <strong>Mode de règlement :</strong> ${trx.paymentMethod || 'Virement'}<br/>
              <strong>Statut :</strong> ${trx.status === 'Paid' ? 'Payé' : 'En attente'}<br/>
              <strong>Date de règlement :</strong> ${new Date(trx.date).toLocaleDateString('fr-FR')}
            </div>

            <div class="stamp">
              <div>Signature de l'employé</div>
              <div>Cachet de l'établissement</div>
            </div>

            <div class="footer">
              Ce bulletin de paie est un document officiel. Veuillez le conserver sans limitation de durée.
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  const PAYMENT_MODES = [
      { id: 'Espèces', icon: Banknote, label: 'Espèces' },
      { id: 'Mobile Money', icon: Smartphone, label: 'Mobile Money' },
      { id: 'Carte', icon: CreditCard, label: 'Carte' },
      { id: 'Chèque', icon: FileText, label: 'Chèque' },
      { id: 'Virement', icon: Building, label: 'Virement' },
  ];

  const MOBILE_OPERATORS = [
      { id: 'Orange Money', label: 'Orange Money', color: 'orange' },
      { id: 'Wave', label: 'Wave', color: 'blue' },
      { id: 'MTN Mobile Money', label: 'MTN Mobile Money', color: 'yellow' },
      { id: 'Moov Money', label: 'Moov Money', color: 'green' }
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit shrink-0">
        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Historique Transactions</button>
        <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'payroll' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Paie & Salaires</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="overflow-y-auto space-y-6 custom-scrollbar pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Recettes Totales</h3>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(calculateTotalIncome())}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Dépenses Totales</h3>
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><TrendingDown size={20} /></div>
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(calculateTotalExpenses())}</div>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-blue-100 text-sm font-medium mb-1">Trésorerie Nette</h3>
                <div className="text-3xl font-bold">{formatCurrency(calculateTotalIncome() - calculateTotalExpenses())}</div>
              </div>
              <div className="flex space-x-2 mt-4 relative z-10">
                 {canWrite && (
                     <button onClick={handleOpenNewPayment} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm py-1.5 px-3 rounded-lg text-xs font-medium flex items-center transition-colors">
                      <CreditCard size={14} className="mr-2" /> Encaisser
                    </button>
                 )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-4">Répartition des Revenus</h3>
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                           {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {/* Categories Cards */}
                {Object.entries(incomeByCategory).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                       <h4 className="font-bold text-slate-700">{getTypeLabel(key)}</h4>
                       <p className="text-xl font-bold text-blue-600">{formatCurrency(value)}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 animate-in fade-in duration-300">
          <div className="p-4 border-b border-gray-100 space-y-4 bg-gray-50/50">
              <div className="flex justify-between items-center">
                 <h3 className="font-bold text-gray-800 text-lg">Journal des Opérations</h3>
                 <div className="flex gap-2">
                    {canWrite && (
                        <button onClick={handleOpenNewPayment} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> Nouveau Paiement
                        </button>
                    )}
                 </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Rechercher..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Tiers / Élève</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3 text-right">Montant</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(trx.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{getTypeLabel(trx.type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{trx.studentName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                            {trx.paymentMethod === 'Mobile Money' && <Smartphone size={14} className="text-orange-500"/>}
                            {trx.paymentMethod === 'Espèces' && <Banknote size={14} className="text-emerald-500"/>}
                            <span>{trx.paymentMethod || '-'}</span>
                        </div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${trx.flow === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {trx.flow === 'OUT' ? '-' : '+'}{formatCurrency(trx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trx.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : trx.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {trx.status === 'Paid' ? 'Validé' : trx.status === 'Overdue' ? 'En Retard' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-blue-600"><Printer size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
          <div className="flex flex-col h-full gap-6 animate-in fade-in duration-300">
              {/* RH Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Masse Salariale (Mois)</p>
                          <h3 className="text-2xl font-bold text-gray-800">
                              {formatCurrency(salaryTransactions.filter(t => t.date.startsWith(new Date().toISOString().slice(0,7))).reduce((acc,t) => acc + t.amount, 0))}
                          </h3>
                      </div>
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={24}/></div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Employés Payés (Mois)</p>
                          <h3 className="text-2xl font-bold text-gray-800">
                              {salaryTransactions.filter(t => t.date.startsWith(new Date().toISOString().slice(0,7))).length} / {teachers.length}
                          </h3>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Users size={24}/></div>
                  </div>
              </div>

              {/* Payroll Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-gray-500"/> Historique des Salaires</h3>
                      {canWrite && (
                          <button onClick={handleOpenSalaryModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                              <Plus size={16} /> Émettre Bulletin
                          </button>
                      )}
                  </div>
                  <div className="flex-1 overflow-auto">
                      <table className="w-full text-left">
                          <thead className="bg-white text-xs uppercase text-gray-500 sticky top-0 border-b shadow-sm">
                              <tr>
                                  <th className="px-6 py-3">Employé</th>
                                  <th className="px-6 py-3">Période</th>
                                  <th className="px-6 py-3 text-right bg-gray-50">Salaire Base</th>
                                  <th className="px-6 py-3 text-right bg-gray-50">Primes</th>
                                  <th className="px-6 py-3 text-right bg-gray-50">Retenues</th>
                                  <th className="px-6 py-3 text-right font-bold bg-blue-50 text-blue-800">Net à Payer</th>
                                  <th className="px-6 py-3">Statut</th>
                                  <th className="px-6 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {salaryTransactions.map(trx => (
                                  <tr key={trx.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 font-medium text-gray-800">{trx.studentName}</td>
                                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{new Date(trx.date).toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}</td>
                                      <td className="px-6 py-4 text-right text-sm bg-gray-50/50 font-mono text-gray-600">{formatCurrency(trx.salaryBreakdown?.base || trx.amount)}</td>
                                      <td className="px-6 py-4 text-right text-sm bg-gray-50/50 font-mono text-emerald-600">+{formatCurrency(trx.salaryBreakdown?.bonus || 0)}</td>
                                      <td className="px-6 py-4 text-right text-sm bg-gray-50/50 font-mono text-rose-600">-{formatCurrency(trx.salaryBreakdown?.deduction || 0)}</td>
                                      <td className="px-6 py-4 text-right font-bold text-blue-700 bg-blue-50/30">{formatCurrency(trx.amount)}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trx.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                              {trx.status === 'Paid' ? 'Payé' : 'En attente'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => handlePrintPayslip(trx)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Imprimer Bulletin">
                                              <Printer size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {salaryTransactions.length === 0 && (
                                  <tr>
                                      <td colSpan={8} className="p-8 text-center text-gray-400 italic">Aucun historique de salaire disponible.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* NEW TRANSACTION MODAL */}
      {isTrxModalOpen && canWrite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in zoom-in-95">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                      <h3 className="text-xl font-bold text-gray-900">Nouveau paiement</h3>
                      <button onClick={() => setIsTrxModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddTransactionSubmit} className="p-8 bg-slate-50/50 max-h-[80vh] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><User size={16} className="mr-2 text-blue-600"/> Élève *</label>
                              <select className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm" value={trxForm.studentId} onChange={(e) => setTrxForm({...trxForm, studentId: e.target.value})} required>
                                  <option value="">Sélectionner un élève</option>
                                  {students.map(s => (<option key={s.id} value={s.id}>{s.firstName} {s.lastName} - {s.classGrade}</option>))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Montant (FCFA) *</label>
                              <input type="number" placeholder="Ex: 50000" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 text-lg" value={trxForm.amount} onChange={e => setTrxForm({...trxForm, amount: e.target.value})} required />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                              <input type="date" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={trxForm.date} onChange={e => setTrxForm({...trxForm, date: e.target.value})} required />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Type de paiement *</label>
                              <select className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={trxForm.type} onChange={e => setTrxForm({...trxForm, type: e.target.value})}>
                                  <option value="Tuition">Scolarité</option>
                                  <option value="Registration">Inscription</option>
                                  <option value="Transport">Transport</option>
                                  <option value="Canteen">Cantine</option>
                                  <option value="Exam">Examen</option>
                                  <option value="Material">Matériel / Tenue</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Période</label>
                              <input type="text" placeholder="Ex: Trimestre 1" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={trxForm.period} onChange={e => setTrxForm({...trxForm, period: e.target.value})} />
                          </div>
                      </div>
                      <div className="mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Mode de paiement *</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {PAYMENT_MODES.map((mode) => {
                                  const Icon = mode.icon;
                                  const isSelected = trxForm.paymentMethod === mode.id;
                                  return (
                                      <div key={mode.id} onClick={() => setTrxForm({...trxForm, paymentMethod: mode.id, operator: ''})} className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50'}`}>
                                          <Icon size={24} className="mb-2" strokeWidth={1.5} />
                                          <span className="text-xs font-bold text-center">{mode.label}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                      {trxForm.paymentMethod === 'Mobile Money' && (
                          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Opérateur</label>
                              <div className="flex flex-wrap gap-3">
                                  {MOBILE_OPERATORS.map(op => {
                                      const isSelected = trxForm.operator === op.id;
                                      let borderColor = isSelected ? (op.color === 'orange' ? 'border-orange-500 bg-orange-50 text-orange-700' : op.color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700' : op.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-green-500 bg-green-50 text-green-700') : 'border-gray-200 bg-white text-gray-700';
                                      return (
                                          <button key={op.id} type="button" onClick={() => setTrxForm({...trxForm, operator: op.id})} className={`flex-1 min-w-[120px] py-3 px-4 border rounded-lg text-sm font-bold transition-all shadow-sm ${borderColor}`}>{op.label}</button>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                      {trxForm.paymentMethod !== 'Espèces' && (
                          <div className="mb-6">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Référence Transaction (Optionnel)</label>
                              <input type="text" placeholder="Ex: ID Transaction..." className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={trxForm.reference} onChange={e => setTrxForm({...trxForm, reference: e.target.value})} />
                          </div>
                      )}
                      <div className="mb-8">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Statut du paiement</label>
                          <div className="flex gap-4">
                              <label className="flex items-center cursor-pointer">
                                  <input type="radio" name="status" value="Paid" checked={trxForm.status === 'Paid'} onChange={() => setTrxForm({...trxForm, status: 'Paid'})} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                                  <span className="ml-2 text-sm font-medium text-gray-800">Validé (Comptant)</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                  <input type="radio" name="status" value="Pending" checked={trxForm.status === 'Pending'} onChange={() => setTrxForm({...trxForm, status: 'Pending'})} className="w-5 h-5 text-amber-500 focus:ring-amber-500 border-gray-300" />
                                  <span className="ml-2 text-sm font-medium text-gray-800">En attente (À terme)</span>
                              </label>
                          </div>
                      </div>
                      <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
                          <CheckCircle2 size={24} /> Valider le Paiement
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* PAYROLL MODAL (NEW SALARY) */}
      {isSalaryModalOpen && canWrite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in zoom-in-95">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Briefcase size={20} /> Émission Bulletin de Paie</h3>
                      <button onClick={() => setIsSalaryModalOpen(false)} className="text-blue-100 hover:text-white p-1 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors"><X size={20}/></button>
                  </div>
                  <form onSubmit={handlePaySalary} className="p-6 bg-slate-50 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Left Col: Employee Info & Payment Info */}
                          <div className="space-y-5">
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-2">Informations Employé</h4>
                                  <div className="space-y-3">
                                      <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Sélectionner l'employé *</label>
                                          <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={salaryForm.teacherId} onChange={handleTeacherSelect} required>
                                              <option value="">-- Choisir --</option>
                                              {teachers.map(t => (<option key={t.id} value={t.id}>{t.firstName} {t.lastName} - {t.subject}</option>))}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Mois de paie</label>
                                          <input type="month" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})} required />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Note / Commentaire</label>
                                          <textarea className="w-full p-2.5 border border-gray-300 rounded-lg text-sm resize-none" rows={2} placeholder="Ex: Virement bancaire..." value={salaryForm.note} onChange={e => setSalaryForm({...salaryForm, note: e.target.value})} />
                                      </div>
                                  </div>
                              </div>

                              {/* New Payment Section */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-2">Informations de Paiement</h4>
                                  
                                  {/* Status */}
                                  <div className="flex gap-4 mb-4">
                                      <label className="flex items-center cursor-pointer">
                                          <input type="radio" name="salaryStatus" value="Paid" checked={salaryForm.status === 'Paid'} onChange={() => setSalaryForm({...salaryForm, status: 'Paid'})} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                                          <span className="ml-2 text-xs font-bold text-gray-700">Payé (Validé)</span>
                                      </label>
                                      <label className="flex items-center cursor-pointer">
                                          <input type="radio" name="salaryStatus" value="Pending" checked={salaryForm.status === 'Pending'} onChange={() => setSalaryForm({...salaryForm, status: 'Pending'})} className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-gray-300" />
                                          <span className="ml-2 text-xs font-bold text-gray-700">En attente</span>
                                      </label>
                                  </div>

                                  {/* Payment Method Grid */}
                                  <div className="grid grid-cols-3 gap-2 mb-4">
                                      {PAYMENT_MODES.filter(m => m.id !== 'Carte').map((mode) => { // Often salary isn't paid by Card
                                          const Icon = mode.icon;
                                          const isSelected = salaryForm.paymentMethod === mode.id;
                                          return (
                                              <div key={mode.id} onClick={() => setSalaryForm({...salaryForm, paymentMethod: mode.id, operator: ''})} className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                                                  <Icon size={18} className="mb-1" />
                                                  <span className="text-[10px] font-bold">{mode.label}</span>
                                              </div>
                                          );
                                      })}
                                  </div>

                                  {/* Mobile Money Operators */}
                                  {salaryForm.paymentMethod === 'Mobile Money' && (
                                      <div className="mb-4 animate-in fade-in">
                                          <label className="block text-xs font-bold text-gray-500 mb-2">Opérateur</label>
                                          <div className="flex flex-wrap gap-2">
                                              {MOBILE_OPERATORS.map(op => {
                                                  const isSelected = salaryForm.operator === op.id;
                                                  return (
                                                      <button key={op.id} type="button" onClick={() => setSalaryForm({...salaryForm, operator: op.id})} className={`px-3 py-1.5 border rounded text-xs font-bold transition-all ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>{op.label}</button>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  )}

                                  {/* Reference */}
                                  {(salaryForm.paymentMethod === 'Virement' || salaryForm.paymentMethod === 'Chèque' || salaryForm.paymentMethod === 'Mobile Money') && (
                                      <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Référence {salaryForm.paymentMethod}</label>
                                          <input type="text" className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="N° Virement / Chèque / ID..." value={salaryForm.reference} onChange={e => setSalaryForm({...salaryForm, reference: e.target.value})} />
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Right Col: Calculation */}
                          <div className="space-y-5">
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-2">Détails du calcul</h4>
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                          <label className="text-sm font-medium text-gray-700">Salaire de Base</label>
                                          <div className="relative w-40">
                                              <input type="number" className="w-full p-2 text-right border border-gray-300 rounded-lg font-mono bg-gray-50" value={salaryForm.baseSalary} onChange={e => setSalaryForm({...salaryForm, baseSalary: parseFloat(e.target.value) || 0})} />
                                              <span className="absolute right-12 top-2 text-gray-400 text-xs pointer-events-none">FCFA</span>
                                          </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <label className="text-sm font-medium text-gray-700 flex items-center text-emerald-600"><Plus size={14} className="mr-1"/> Primes / Bonus</label>
                                          <input type="number" className="w-40 p-2 text-right border border-emerald-200 rounded-lg font-mono focus:ring-emerald-500 outline-none" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: parseFloat(e.target.value) || 0})} placeholder="0" />
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <label className="text-sm font-medium text-gray-700 flex items-center text-rose-600"><TrendingDown size={14} className="mr-1"/> Retenues / Avances</label>
                                          <input type="number" className="w-40 p-2 text-right border border-rose-200 rounded-lg font-mono focus:ring-rose-500 outline-none" value={salaryForm.deduction} onChange={e => setSalaryForm({...salaryForm, deduction: parseFloat(e.target.value) || 0})} placeholder="0" />
                                      </div>
                                  </div>
                                  
                                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center bg-blue-50 p-4 rounded-xl">
                                      <span className="text-blue-900 font-bold text-lg">NET À PAYER</span>
                                      <span className="text-2xl font-bold text-blue-700">{formatCurrency(netSalary)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-8 flex justify-end gap-3">
                          <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white">Annuler</button>
                          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2">
                              <CheckCircle size={18} /> Valider & Enregistrer
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
