
import React, { useState, useEffect } from 'react';
import { Book, Loan, LibraryNotification, SystemUser, Student } from '../types';
import { db } from '../services/db';
import { 
  BookOpen, Calendar, Bell, Search, Plus, BookMarked, 
  AlertCircle, Clock, CheckCircle, ChevronRight, X, Save, Trash2, User, AlertTriangle, Gift, Tag
} from 'lucide-react';

interface LibraryManagerProps {
  currentUser?: SystemUser;
  currentSchoolId: string;
}

const NotificationCard: React.FC<{ notif: LibraryNotification }> = ({ notif }) => {
  const icon = notif.type === 'OVERDUE' ? <AlertCircle className="text-red-500" /> : 
               notif.type === 'DUE_SOON' ? <Clock className="text-amber-500" /> : 
               <CheckCircle className="text-blue-500" />;
  
  const bgClass = notif.type === 'OVERDUE' ? 'bg-red-50 border-red-100' : 
                  notif.type === 'DUE_SOON' ? 'bg-amber-50 border-amber-100' : 
                  'bg-blue-50 border-blue-100';

  return (
    <div className={`p-4 rounded-lg border ${bgClass} flex items-start space-x-4 shadow-sm animate-in slide-in-from-right-2`}>
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <h4 className={`font-bold text-sm ${notif.type === 'OVERDUE' ? 'text-red-800' : notif.type === 'DUE_SOON' ? 'text-amber-800' : 'text-blue-800'}`}>
          {notif.title}
        </h4>
        <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
        <div className="flex justify-between items-center mt-2">
           <span className="text-xs text-gray-500">{new Date(notif.date).toLocaleDateString()}</span>
           {notif.type !== 'RESERVATION' && (
              <button className="text-xs font-medium underline hover:no-underline text-gray-600">
                Voir l'emprunt
              </button>
           )}
        </div>
      </div>
    </div>
  );
};

export const LibraryManager: React.FC<LibraryManagerProps> = ({ currentUser, currentSchoolId }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans' | 'notifications'>('catalog');
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [notifications, setNotifications] = useState<LibraryNotification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Modal States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  
  // Form States
  const [newBook, setNewBook] = useState<Partial<Book>>({ status: 'AVAILABLE', provenance: 'ACHAT' });
  const [newLoan, setNewLoan] = useState({ studentId: '', bookId: '', dueDate: '' });

  useEffect(() => {
    refreshLibraryData();
  }, []);

  const refreshLibraryData = () => {
    setBooks(db.getBooks());
    setLoans(db.getLoans());
    setNotifications(db.getLibraryNotifications());
    setStudents(db.getStudents());
  };

  const canWrite = db.hasPermission(currentSchoolId, currentUser?.role || 'STUDENT', 'LIBRARY.write');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'BORROWED': return 'bg-amber-100 text-amber-700';
      case 'RESERVED': return 'bg-blue-100 text-blue-700';
      case 'LOST': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBookStatusLabel = (status: string) => {
      switch(status) {
          case 'AVAILABLE': return 'Disponible';
          case 'BORROWED': return 'Emprunté';
          case 'RESERVED': return 'Réservé';
          case 'LOST': return 'Perdu';
          default: return status;
      }
  };

  // --- Handlers ---

  const handleAddBook = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBook.title || !newBook.author) return;
      const book: Book = {
          id: `B${Date.now()}`,
          schoolId: currentSchoolId,
          title: newBook.title,
          author: newBook.author,
          isbn: newBook.isbn || 'N/A',
          category: newBook.category || 'Général',
          status: 'AVAILABLE',
          provenance: newBook.provenance || 'ACHAT'
      };
      db.saveBook(book);
      setIsBookModalOpen(false);
      setNewBook({ status: 'AVAILABLE', provenance: 'ACHAT' });
      refreshLibraryData();
  };

  const handleIssueLoan = (e: React.FormEvent) => {
      e.preventDefault();
      const student = students.find(s => s.id === newLoan.studentId);
      const book = books.find(b => b.id === newLoan.bookId);
      
      if (!student || !book) return;

      const loan: Loan = {
          id: `L-${Date.now()}`,
          schoolId: currentSchoolId,
          bookId: book.id,
          bookTitle: book.title,
          studentName: `${student.firstName} ${student.lastName}`,
          borrowDate: new Date().toISOString().split('T')[0],
          dueDate: newLoan.dueDate,
          status: 'ACTIVE'
      };

      db.saveLoan(loan);
      setIsLoanModalOpen(false);
      setNewLoan({ studentId: '', bookId: '', dueDate: '' });
      refreshLibraryData();
      alert(`Emprunt enregistré pour ${student.firstName}.`);
  };

  const handleReturnBook = (loan: Loan) => {
      if (confirm(`Confirmer le retour de "${loan.bookTitle}" ?`)) {
          const updatedLoan: Loan = { ...loan, status: 'RETURNED', returnDate: new Date().toISOString() };
          db.saveLoan(updatedLoan);
          refreshLibraryData();
      }
  };

  const handleReportLost = (loan: Loan) => {
      if (confirm(`SIGNALER COMME PERDU ?\n\nCela va déclencher une procédure de facturation auprès de l'économe pour l'élève ${loan.studentName}.`)) {
          db.reportLostBook(loan.id);
          refreshLibraryData();
          alert("Livre déclaré perdu. L'économe et les parents ont été notifiés.");
      }
  };

  const simulateReservation = () => {
     const newNotif: LibraryNotification = {
         id: `res-${Date.now()}`,
         type: 'RESERVATION',
         title: 'Réservation disponible',
         message: 'Le livre "Le Petit Prince" que vous aviez réservé est maintenant disponible au retrait.',
         date: new Date().toISOString(),
         read: false
     };
     setNotifications([newNotif, ...notifications]);
     alert('Simulation: Notification de réservation envoyée.');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center">
            <BookOpen className="mr-2 text-blue-600" size={20} />
            Bibliothèque
          </h3>
          {canWrite && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">Mode Gestion</span>}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'catalog' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <div className="flex items-center"><Search size={18} className="mr-3" /> Catalogue</div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button 
            onClick={() => setActiveTab('loans')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'loans' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <div className="flex items-center"><Calendar size={18} className="mr-3" /> Emprunts & Retours</div>
            {loans.filter(l => l.status === 'OVERDUE').length > 0 && (
               <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                 {loans.filter(l => l.status === 'OVERDUE').length}
               </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
             <div className="flex items-center"><Bell size={18} className="mr-3" /> Notifications</div>
             {notifications.length > 0 && (
               <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                 {notifications.length}
               </span>
             )}
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
             {!canWrite && (
               <button 
                  onClick={simulateReservation}
                  className="w-full py-2 border border-blue-200 text-blue-600 rounded bg-white hover:bg-blue-50 text-xs font-medium"
               >
                   Simuler "Réservation Prête"
               </button>
             )}
             {canWrite && (
                 <button 
                    onClick={() => setIsLoanModalOpen(true)}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium flex items-center justify-center"
                 >
                    <Plus size={14} className="mr-1" /> Nouvel Emprunt
                 </button>
             )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        
        {/* TAB: CATALOG */}
        {activeTab === 'catalog' && (
            <div className="flex flex-col h-full">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Fonds Documentaire</h2>
                      <p className="text-xs text-gray-500">Gestion des ouvrages, achats et dons</p>
                    </div>
                    <div className="flex space-x-2">
                        <input type="text" placeholder="ISBN, Titre, Auteur..." className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
                        {canWrite && (
                            <button 
                                onClick={() => setIsBookModalOpen(true)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center"
                            >
                                <Plus size={16} className="mr-1" /> Réception Ouvrage
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Titre / Auteur</th>
                                <th className="px-6 py-3">Catégorie</th>
                                <th className="px-6 py-3">Provenance</th>
                                <th className="px-6 py-3">ISBN</th>
                                <th className="px-6 py-3">Statut</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {books.map(book => (
                                <tr key={book.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{book.title}</div>
                                        <div className="text-xs text-gray-500">{book.author}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{book.category}</td>
                                    <td className="px-6 py-4">
                                        {book.provenance === 'DON' ? (
                                          <span className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit font-medium">
                                            <Gift size={12} className="mr-1" /> Dons & Legs
                                          </span>
                                        ) : (
                                          <span className="flex items-center text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full w-fit font-medium">
                                            <Tag size={12} className="mr-1" /> Achat
                                          </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{book.isbn}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(book.status)}`}>
                                            {getBookStatusLabel(book.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {canWrite ? (
                                            <button className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                        ) : (
                                            <button className="text-gray-400 hover:text-blue-600"><BookMarked size={18} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* TAB: LOANS */}
        {activeTab === 'loans' && (
             <div className="flex flex-col h-full">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Suivi des Emprunts</h2>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Élève</th>
                                <th className="px-6 py-3">Livre</th>
                                <th className="px-6 py-3">Sortie</th>
                                <th className="px-6 py-3">Retour Prévu</th>
                                <th className="px-6 py-3">État</th>
                                {canWrite && <th className="px-6 py-3 text-right">Gestion</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loans.map(loan => (
                                <tr key={loan.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{loan.studentName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{loan.bookTitle}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(loan.borrowDate).toLocaleDateString()}</td>
                                    <td className={`px-6 py-4 text-sm font-bold ${loan.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-600'}`}>
                                        {new Date(loan.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : loan.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                             {loan.status === 'OVERDUE' ? 'RETARD' : loan.status === 'ACTIVE' ? 'EN COURS' : 'RENDU'}
                                         </span>
                                    </td>
                                    {canWrite && (
                                        <td className="px-6 py-4 text-right">
                                            {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                                                <div className="flex justify-end space-x-2">
                                                    <button 
                                                        onClick={() => handleReturnBook(loan)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded" 
                                                        title="Confirmer le retour"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReportLost(loan)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded" 
                                                        title="Signaler comme perdu (Facturation)"
                                                    >
                                                        <AlertTriangle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
            <div className="flex flex-col h-full">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Bell className="mr-2 text-amber-500" size={24} />
                        Centre de Notifications
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Alertes de retards, rappels d'échéances et suivi des réservations.
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">Aucune notification pour le moment.</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <NotificationCard key={notif.id} notif={notif} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* Add Book Modal */}
      {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Réception Nouvel Article</h3>
                      <button onClick={() => setIsBookModalOpen(false)}><X className="text-gray-400" /></button>
                  </div>
                  <form onSubmit={handleAddBook} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                              <input 
                                  className="w-full p-2 border rounded text-sm" 
                                  placeholder="Titre de l'ouvrage" 
                                  value={newBook.title || ''} 
                                  onChange={e => setNewBook({...newBook, title: e.target.value})} 
                                  required 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Auteur</label>
                              <input 
                                  className="w-full p-2 border rounded text-sm" 
                                  placeholder="Nom de l'auteur" 
                                  value={newBook.author || ''} 
                                  onChange={e => setNewBook({...newBook, author: e.target.value})} 
                                  required 
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Provenance (Origine)</label>
                          <select 
                              className="w-full p-2 border rounded bg-white text-sm"
                              value={newBook.provenance}
                              onChange={e => setNewBook({...newBook, provenance: e.target.value as any})}
                          >
                              <option value="ACHAT">Achat (Budget École)</option>
                              <option value="DON">Dons et Legs</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                            <select 
                                className="w-full p-2 border rounded bg-white text-sm"
                                value={newBook.category}
                                onChange={e => setNewBook({...newBook, category: e.target.value})}
                            >
                                <option value="Général">Général</option>
                                <option value="Roman">Roman</option>
                                <option value="Manuel Scolaire">Manuel Scolaire</option>
                                <option value="Science-Fiction">Science-Fiction</option>
                                <option value="Jeunesse">Jeunesse</option>
                            </select>
                         </div>
                         <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">ISBN</label>
                             <input 
                                className="w-full p-2 border rounded text-sm" 
                                placeholder="Code ISBN" 
                                value={newBook.isbn || ''} 
                                onChange={e => setNewBook({...newBook, isbn: e.target.value})} 
                            />
                         </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
                          <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Enregistrer Réception</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Issue Loan Modal */}
      {isLoanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Nouvel Emprunt</h3>
                      <button onClick={() => setIsLoanModalOpen(false)}><X className="text-gray-400" /></button>
                  </div>
                  <form onSubmit={handleIssueLoan} className="space-y-3">
                      <div>
                          <label className="block text-sm font-medium mb-1">Élève</label>
                          <select 
                              className="w-full p-2 border rounded bg-white"
                              value={newLoan.studentId}
                              onChange={e => setNewLoan({...newLoan, studentId: e.target.value})}
                              required
                          >
                              <option value="">Choisir un élève...</option>
                              {students.map(s => (
                                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.classGrade})</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Livre Disponible</label>
                          <select 
                              className="w-full p-2 border rounded bg-white"
                              value={newLoan.bookId}
                              onChange={e => setNewLoan({...newLoan, bookId: e.target.value})}
                              required
                          >
                              <option value="">Choisir un livre...</option>
                              {books.filter(b => b.status === 'AVAILABLE').map(b => (
                                  <option key={b.id} value={b.id}>{b.title} - {b.author}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Date de retour prévue</label>
                          <input 
                              type="date"
                              className="w-full p-2 border rounded"
                              value={newLoan.dueDate}
                              onChange={e => setNewLoan({...newLoan, dueDate: e.target.value})}
                              required
                          />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                          <button type="button" onClick={() => setIsLoanModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider l'emprunt</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
