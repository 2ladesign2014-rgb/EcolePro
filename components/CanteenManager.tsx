
import React, { useState, useEffect } from 'react';
import { CanteenItem, Transaction, FoodCategory, SystemUser } from '../types';
import { db } from '../services/db';
import { formatCurrency } from '../constants';
import { 
  Utensils, TrendingUp, ShoppingCart, Package, Plus, Save, Trash2, 
  BarChart3, Calendar, Filter, Download, Beef, Carrot, Coffee, CircleDollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CanteenManagerProps {
  currentSchoolId: string;
  currentUser: SystemUser;
}

export const CanteenManager: React.FC<CanteenManagerProps> = ({ currentSchoolId, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'sales' | 'reports'>('dashboard');
  const [items, setItems] = useState<CanteenItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Forms
  const [itemForm, setItemForm] = useState<Partial<CanteenItem>>({ category: 'VIANDE', unit: 'kg' });
  const [restockForm, setRestockForm] = useState({ itemId: '', quantity: 0, totalCost: 0 });
  const [saleForm, setSaleForm] = useState({ amount: 0, mealCount: 0, description: 'Vente tickets repas' });

  const [reportFilter, setReportFilter] = useState<'DAY' | 'MONTH' | 'YEAR'>('MONTH');

  useEffect(() => {
      refreshData();
  }, [currentSchoolId]);

  const refreshData = () => {
      setItems(db.getCanteenItems(currentSchoolId));
      const allTrx = db.getTransactions(currentSchoolId);
      // Filter transactions related to Canteen (Expenses for stock or Sales)
      // Note: We identify them by type='Canteen' or specific description logic if needed
      setTransactions(allTrx.filter(t => t.type === 'Canteen'));
  };

  const canWrite = db.hasPermission(currentSchoolId, currentUser.role, 'CANTEEN.write');

  // --- Stock Management ---
  const handleSaveItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!itemForm.name || !itemForm.unit) return;

      const newItem: CanteenItem = {
          id: itemForm.id || `CI-${Date.now()}`,
          schoolId: currentSchoolId,
          name: itemForm.name,
          category: itemForm.category || 'AUTRE',
          quantity: Number(itemForm.quantity) || 0,
          unit: itemForm.unit,
          unitPrice: Number(itemForm.unitPrice) || 0,
          minThreshold: Number(itemForm.minThreshold) || 5,
          lastRestockDate: itemForm.lastRestockDate
      };

      db.updateCanteenStock(newItem, !itemForm.id);
      setIsItemModalOpen(false);
      setItemForm({ category: 'VIANDE', unit: 'kg' });
      refreshData();
  };

  const handleDeleteItem = (id: string) => {
      if (confirm("Supprimer cet ingrédient du stock ?")) {
          db.deleteCanteenItem(id);
          refreshData();
      }
  };

  const handleRestock = (e: React.FormEvent) => {
      e.preventDefault();
      const item = items.find(i => i.id === restockForm.itemId);
      if (!item) return;

      // 1. Update Stock
      const updatedItem = { 
          ...item, 
          quantity: item.quantity + Number(restockForm.quantity),
          lastRestockDate: new Date().toISOString()
      };
      db.updateCanteenStock(updatedItem, false);

      // 2. Create Expense Transaction
      const expenseTrx: Transaction = {
          id: `EXP-${Date.now()}`,
          schoolId: currentSchoolId,
          amount: Number(restockForm.totalCost),
          type: 'Canteen', // Specific type
          flow: 'OUT',
          date: new Date().toISOString(),
          status: 'Paid',
          description: `Approvisionnement: ${item.name} (+${restockForm.quantity}${item.unit})`,
          studentName: 'Cantine' // Placeholder
      };
      db.addTransaction(expenseTrx);

      setIsRestockModalOpen(false);
      setRestockForm({ itemId: '', quantity: 0, totalCost: 0 });
      refreshData();
      alert("Stock mis à jour et dépense enregistrée.");
  };

  // --- Sales Management ---
  const handleAddSale = (e: React.FormEvent) => {
      e.preventDefault();
      if (!saleForm.amount) return;

      const saleTrx: Transaction = {
          id: `SALE-${Date.now()}`,
          schoolId: currentSchoolId,
          amount: Number(saleForm.amount),
          type: 'Canteen',
          flow: 'IN',
          date: new Date().toISOString(),
          status: 'Paid',
          description: `${saleForm.description} (${saleForm.mealCount} repas)`,
          studentName: 'Cantine'
      };
      db.addTransaction(saleTrx);
      
      setIsSaleModalOpen(false);
      setSaleForm({ amount: 0, mealCount: 0, description: 'Vente tickets repas' });
      refreshData();
      alert("Recette enregistrée avec succès.");
  };

  // --- Dashboard Calculations ---
  const totalStockValue = items.reduce((acc, item) => acc + (item.quantity * (item.unitPrice || 0)), 0);
  const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;
  
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = transactions
      .filter(t => t.flow === 'IN' && t.date.startsWith(today))
      .reduce((acc, t) => acc + t.amount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthExpense = transactions
      .filter(t => t.flow === 'OUT' && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.amount, 0);
    
  const monthIncome = transactions
      .filter(t => t.flow === 'IN' && t.date.startsWith(currentMonth))
      .reduce((acc, t) => acc + t.amount, 0);

  // --- Report Data Generation ---
  const getChartData = () => {
      const data: any[] = [];
      const grouped: Record<string, {name: string, income: number, expense: number}> = {};

      transactions.forEach(t => {
          let key = t.date.split('T')[0]; // Default Day
          let name = new Date(t.date).toLocaleDateString();

          if (reportFilter === 'MONTH') {
              key = t.date.slice(0, 7);
              name = new Date(t.date).toLocaleDateString('fr-FR', {month: 'short', year: 'numeric'});
          } else if (reportFilter === 'YEAR') {
              key = t.date.slice(0, 4);
              name = key;
          }

          if (!grouped[key]) grouped[key] = { name, income: 0, expense: 0 };
          
          if (t.flow === 'IN') grouped[key].income += t.amount;
          else grouped[key].expense += t.amount;
      });

      return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)); // Simple sort, improved with dates later
  };

  const chartData = getChartData();

  // Helper Icons
  const getCategoryIcon = (cat: FoodCategory) => {
      switch(cat) {
          case 'VIANDE': return <Beef size={16} className="text-red-500"/>;
          case 'LEGUME': return <Carrot size={16} className="text-orange-500"/>;
          case 'BOISSON': return <Coffee size={16} className="text-blue-500"/>;
          default: return <Package size={16} className="text-gray-500"/>;
      }
  };

  const formatCategory = (cat: FoodCategory) => {
      switch(cat) {
          case 'VIANDE': return 'Viandes & Poissons';
          case 'LEGUME': return 'Légumes & Fruits';
          case 'CEREALE': return 'Céréales';
          case 'EPICERIE': return 'Épicerie';
          case 'BOISSON': return 'Boissons';
          default: return 'Autre';
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
       {/* Header & Tabs */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex justify-between items-center">
           <div className="flex space-x-2">
               <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                   Tableau de bord
               </button>
               <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                   Stock & Achats
               </button>
               <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                   Ventes (Recettes)
               </button>
               <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                   Bilan & Rapports
               </button>
           </div>
       </div>

       {/* DASHBOARD VIEW */}
       {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <p className="text-sm text-gray-500">Ventes du Jour</p>
                           <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(todaysSales)}</h3>
                       </div>
                       <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20}/></div>
                   </div>
                   <div className="text-xs text-gray-400">Mise à jour temps réel</div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <p className="text-sm text-gray-500">Valeur du Stock</p>
                           <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(totalStockValue)}</h3>
                       </div>
                       <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Package size={20}/></div>
                   </div>
                   <div className="text-xs text-gray-400">{items.length} articles en stock</div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <p className="text-sm text-gray-500">Dépenses du Mois</p>
                           <h3 className="text-2xl font-bold text-rose-600">{formatCurrency(monthExpense)}</h3>
                       </div>
                       <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><ShoppingCart size={20}/></div>
                   </div>
                   <div className="text-xs text-gray-400">Approvisionnements</div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                           <p className="text-sm text-gray-500">Solde Mensuel</p>
                           <h3 className={`text-2xl font-bold ${monthIncome - monthExpense >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                               {formatCurrency(monthIncome - monthExpense)}
                           </h3>
                       </div>
                       <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><CircleDollarSign size={20}/></div>
                   </div>
                   <div className="text-xs text-gray-400">Recettes - Dépenses</div>
               </div>
               
               {/* Alert Section */}
               {lowStockCount > 0 && (
                   <div className="md:col-span-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-4">
                       <div className="p-2 bg-red-100 rounded-full text-red-600"><Package size={24} /></div>
                       <div>
                           <h4 className="font-bold text-red-800">Alerte Stock Faible</h4>
                           <p className="text-sm text-red-700">Il y a {lowStockCount} ingrédient(s) sous le seuil minimal. Veuillez réapprovisionner.</p>
                       </div>
                       <button onClick={() => setActiveTab('stock')} className="ml-auto px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100">
                           Voir Stock
                       </button>
                   </div>
               )}
           </div>
       )}

       {/* STOCK VIEW */}
       {activeTab === 'stock' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
               <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800">Inventaire des Ingrédients</h3>
                   <div className="flex gap-2">
                       {canWrite && (
                           <>
                               <button onClick={() => setIsRestockModalOpen(true)} className="flex items-center px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
                                   <ShoppingCart size={16} className="mr-2" /> Approvisionner
                               </button>
                               <button onClick={() => setIsItemModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                   <Plus size={16} className="mr-2" /> Nouvel Article
                               </button>
                           </>
                       )}
                   </div>
               </div>
               <div className="flex-1 overflow-auto">
                   <table className="w-full text-left">
                       <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                           <tr>
                               <th className="px-6 py-3">Nom</th>
                               <th className="px-6 py-3">Catégorie</th>
                               <th className="px-6 py-3 text-right">Quantité</th>
                               <th className="px-6 py-3 text-right">Prix Unitaire (Moyen)</th>
                               <th className="px-6 py-3">Dernier Ajout</th>
                               {canWrite && <th className="px-6 py-3 text-right">Actions</th>}
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {items.map(item => (
                               <tr key={item.id} className="hover:bg-gray-50">
                                   <td className="px-6 py-4 font-medium text-gray-800">
                                       {item.name}
                                       {item.quantity <= item.minThreshold && (
                                           <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full" title="Stock bas"></span>
                                       )}
                                   </td>
                                   <td className="px-6 py-4">
                                       <span className="flex items-center gap-2 text-sm text-gray-600">
                                           {getCategoryIcon(item.category)} {formatCategory(item.category)}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-right text-sm font-mono">
                                       <span className={item.quantity <= item.minThreshold ? 'text-red-600 font-bold' : 'text-gray-800'}>
                                           {item.quantity} {item.unit}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice || 0)}</td>
                                   <td className="px-6 py-4 text-sm text-gray-500">
                                       {item.lastRestockDate ? new Date(item.lastRestockDate).toLocaleDateString() : '-'}
                                   </td>
                                   {canWrite && (
                                       <td className="px-6 py-4 text-right">
                                           <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500">
                                               <Trash2 size={16} />
                                           </button>
                                       </td>
                                   )}
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* SALES VIEW */}
       {activeTab === 'sales' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
               <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                   <div>
                       <h3 className="font-bold text-gray-800">Journal des Ventes</h3>
                       <p className="text-sm text-gray-500">Suivi des recettes journalières de la cantine</p>
                   </div>
                   {canWrite && (
                       <button onClick={() => setIsSaleModalOpen(true)} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm">
                           <Plus size={16} className="mr-2" /> Saisir Recette
                       </button>
                   )}
               </div>
               <div className="flex-1 overflow-auto">
                   <table className="w-full text-left">
                       <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                           <tr>
                               <th className="px-6 py-3">Date</th>
                               <th className="px-6 py-3">Description</th>
                               <th className="px-6 py-3 text-right">Montant</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {transactions.filter(t => t.flow === 'IN').map(trx => (
                               <tr key={trx.id} className="hover:bg-gray-50">
                                   <td className="px-6 py-4 text-sm text-gray-500">{new Date(trx.date).toLocaleDateString()} {new Date(trx.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                   <td className="px-6 py-4 text-sm font-medium text-gray-800">{trx.description}</td>
                                   <td className="px-6 py-4 text-right font-bold text-emerald-600">+{formatCurrency(trx.amount)}</td>
                               </tr>
                           ))}
                           {transactions.filter(t => t.flow === 'IN').length === 0 && (
                               <tr>
                                   <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Aucune vente enregistrée.</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* REPORTS VIEW */}
       {activeTab === 'reports' && (
           <div className="flex flex-col space-y-6">
               {/* Report Filter Toolbar */}
               <div className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800 flex items-center gap-2">
                       <BarChart3 className="text-blue-600" /> Bilan Cantine
                   </h3>
                   <div className="flex bg-gray-100 p-1 rounded-lg">
                       <button onClick={() => setReportFilter('DAY')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${reportFilter === 'DAY' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Par Jour</button>
                       <button onClick={() => setReportFilter('MONTH')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${reportFilter === 'MONTH' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Par Mois</button>
                       <button onClick={() => setReportFilter('YEAR')} className={`px-3 py-1 text-xs font-medium rounded transition-all ${reportFilter === 'YEAR' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Par Année</button>
                   </div>
               </div>

               {/* Chart */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                           <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                           <Tooltip 
                               formatter={(value: number) => formatCurrency(value)} 
                               labelStyle={{color: '#333'}}
                               contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                           />
                           <Legend />
                           <Bar name="Recettes" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                           <Bar name="Dépenses" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                       </BarChart>
                   </ResponsiveContainer>
               </div>

               {/* Detailed Table */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 text-sm">Détail du Bilan</div>
                   <table className="w-full text-left">
                       <thead className="text-xs uppercase text-gray-500 bg-white border-b">
                           <tr>
                               <th className="px-6 py-3">Période</th>
                               <th className="px-6 py-3 text-right text-emerald-600">Recettes</th>
                               <th className="px-6 py-3 text-right text-rose-600">Dépenses</th>
                               <th className="px-6 py-3 text-right">Solde</th>
                           </tr>
                       </thead>
                       <tbody>
                           {chartData.map((d, i) => (
                               <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                   <td className="px-6 py-3 text-sm font-medium text-gray-800">{d.name}</td>
                                   <td className="px-6 py-3 text-sm text-right text-emerald-600">+{formatCurrency(d.income)}</td>
                                   <td className="px-6 py-3 text-sm text-right text-rose-600">-{formatCurrency(d.expense)}</td>
                                   <td className={`px-6 py-3 text-sm text-right font-bold ${d.income - d.expense >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                       {formatCurrency(d.income - d.expense)}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* --- MODALS --- */}

       {/* Add Item Modal */}
       {isItemModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                   <h3 className="font-bold text-lg mb-4">Nouvel Ingrédient</h3>
                   <form onSubmit={handleSaveItem} className="space-y-4">
                       <input type="text" placeholder="Nom (ex: Riz, Huile...)" required className="w-full p-2 border rounded" 
                           value={itemForm.name || ''} onChange={e => setItemForm({...itemForm, name: e.target.value})} 
                       />
                       <div className="grid grid-cols-2 gap-4">
                           <select className="w-full p-2 border rounded bg-white" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value as FoodCategory})}>
                               <option value="VIANDE">Viandes / Poissons</option>
                               <option value="LEGUME">Légumes / Fruits</option>
                               <option value="CEREALE">Céréales / Féculents</option>
                               <option value="EPICERIE">Épicerie</option>
                               <option value="BOISSON">Boissons</option>
                               <option value="AUTRE">Autre</option>
                           </select>
                           <input type="text" placeholder="Unité (kg, L...)" required className="w-full p-2 border rounded" 
                               value={itemForm.unit || ''} onChange={e => setItemForm({...itemForm, unit: e.target.value})} 
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="Seuil Alerte" className="w-full p-2 border rounded" 
                               value={itemForm.minThreshold || ''} onChange={e => setItemForm({...itemForm, minThreshold: Number(e.target.value)})} 
                           />
                           <input type="number" placeholder="Prix unitaire approx." className="w-full p-2 border rounded" 
                               value={itemForm.unitPrice || ''} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} 
                           />
                       </div>
                       <div className="flex justify-end gap-2 pt-4">
                           <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                           <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* Restock Modal */}
       {isRestockModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                   <h3 className="font-bold text-lg mb-4">Approvisionnement (Dépense)</h3>
                   <form onSubmit={handleRestock} className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium mb-1">Article</label>
                           <select required className="w-full p-2 border rounded bg-white" value={restockForm.itemId} onChange={e => setRestockForm({...restockForm, itemId: e.target.value})}>
                               <option value="">Sélectionner...</option>
                               {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                           </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium mb-1">Quantité Ajoutée</label>
                               <input type="number" required className="w-full p-2 border rounded" 
                                   value={restockForm.quantity || ''} onChange={e => setRestockForm({...restockForm, quantity: Number(e.target.value)})} 
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium mb-1">Coût Total (FCFA)</label>
                               <input type="number" required className="w-full p-2 border rounded" 
                                   value={restockForm.totalCost || ''} onChange={e => setRestockForm({...restockForm, totalCost: Number(e.target.value)})} 
                               />
                           </div>
                       </div>
                       <div className="flex justify-end gap-2 pt-4">
                           <button type="button" onClick={() => setIsRestockModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                           <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Valider Stock</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* Sale Modal */}
       {isSaleModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                   <h3 className="font-bold text-lg mb-4">Saisir Vente / Recette</h3>
                   <form onSubmit={handleAddSale} className="space-y-4">
                       <input type="text" placeholder="Description (ex: Vente midi)" required className="w-full p-2 border rounded" 
                           value={saleForm.description} onChange={e => setSaleForm({...saleForm, description: e.target.value})} 
                       />
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium mb-1">Nombre de Repas</label>
                               <input type="number" className="w-full p-2 border rounded" 
                                   value={saleForm.mealCount || ''} onChange={e => setSaleForm({...saleForm, mealCount: Number(e.target.value)})} 
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium mb-1">Montant Total (FCFA)</label>
                               <input type="number" required className="w-full p-2 border rounded" 
                                   value={saleForm.amount || ''} onChange={e => setSaleForm({...saleForm, amount: Number(e.target.value)})} 
                               />
                           </div>
                       </div>
                       <div className="flex justify-end gap-2 pt-4">
                           <button type="button" onClick={() => setIsSaleModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                           <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Encaisser</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

    </div>
  );
};
