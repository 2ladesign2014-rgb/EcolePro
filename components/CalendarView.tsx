
import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventCategory, EventStatus, SystemUser } from '../types';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Plus, X, Save, Trash2, CheckSquare, Square, Filter } from 'lucide-react';
import { db } from '../services/db';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentUser?: SystemUser; 
  currentSchoolId?: string; // Added prop for data isolation
  onRefresh?: () => void; // Added prop for data synchronization
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events: initialEvents, currentUser, currentSchoolId, onRefresh }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State
  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    category: 'PEDAGOGIC',
    status: 'PLANNED',
    startTime: '08:00',
    endTime: '10:00'
  });

  // Sync state with props when parent updates data
  useEffect(() => {
      setEvents(initialEvents);
  }, [initialEvents]);

  // Helper to get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    // Adjust for Monday start: Mon=0, Sun=6
    const adjustedFirstDay = (firstDay === 0 ? 6 : firstDay - 1);
    return { days, firstDay: adjustedFirstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case 'EXAM': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'HOLIDAY': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MEETING': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EXTRA_CURRICULAR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMINISTRATIVE': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const getStatusIcon = (status: EventStatus) => {
      if (status === 'COMPLETED') return <CheckSquare size={14} className="text-emerald-600" />;
      if (status === 'CANCELLED') return <X size={14} className="text-red-600" />;
      return <Square size={14} className="text-gray-400" />;
  };

  const filteredEvents = events.filter(e => {
      const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
      const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
      return matchesCategory && matchesStatus;
  });

  const dayEvents = filteredEvents.filter(e => e.date === selectedDate);

  const handleSaveEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!eventForm.title || !eventForm.date || !currentSchoolId) return;

      const newEvent: CalendarEvent = {
          id: eventForm.id || `EVT-${Date.now()}`,
          schoolId: currentSchoolId, // Use prop instead of guessing
          title: eventForm.title,
          description: eventForm.description || '',
          location: eventForm.location || '',
          date: eventForm.date,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          category: eventForm.category as EventCategory || 'PEDAGOGIC',
          status: eventForm.status as EventStatus || 'PLANNED',
          organizer: currentUser?.name || 'Admin'
      };

      db.saveEvent(newEvent);
      if (onRefresh) onRefresh(); // Notify parent
      setIsModalOpen(false);
      setEventForm({ category: 'PEDAGOGIC', status: 'PLANNED', startTime: '08:00', endTime: '10:00' });
  };

  const handleDeleteEvent = (id: string) => {
      if (confirm("Supprimer cet événement ?")) {
          db.deleteEvent(id);
          if (onRefresh) onRefresh();
          setIsModalOpen(false);
      }
  };

  const openModal = (event?: CalendarEvent, date?: string) => {
      if (event) {
          setEventForm(event);
      } else {
          setEventForm({
              category: 'PEDAGOGIC',
              status: 'PLANNED',
              startTime: '08:00',
              endTime: '10:00',
              date: date || selectedDate
          });
      }
      setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={18} /></button>
                  <span className="px-4 font-bold text-gray-800 capitalize min-w-[140px] text-center">{monthName}</span>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={18} /></button>
              </div>
              <button 
                onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); }}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                  Aujourd'hui
              </button>
          </div>

          <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm">
                  <Filter size={14} className="text-gray-400" />
                  <select 
                    className="bg-transparent outline-none text-gray-700 font-medium"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                      <option value="ALL">Toutes Catégories</option>
                      <option value="PEDAGOGIC">Pédagogique</option>
                      <option value="EXTRA_CURRICULAR">Extra-scolaire</option>
                      <option value="EXAM">Examens</option>
                      <option value="MEETING">Réunions</option>
                      <option value="HOLIDAY">Vacances</option>
                      <option value="ADMINISTRATIVE">Administratif</option>
                  </select>
              </div>
              
              <select 
                className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none text-gray-700 font-medium"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                  <option value="ALL">Tous Statuts</option>
                  <option value="PLANNED">À Venir</option>
                  <option value="COMPLETED">Réalisés</option>
                  <option value="CANCELLED">Annulés</option>
              </select>

              <button 
                onClick={() => openModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
              >
                  <Plus size={16} /> Ajouter
              </button>
          </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-4 overflow-auto">
              {/* Days Header */}
              <div className="grid grid-cols-7 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-2">{d}</div>
                  ))}
              </div>
              
              {/* Days Cells */}
              <div className="grid grid-cols-7 grid-rows-5 gap-1 flex-1 min-h-[400px]">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="bg-gray-50/50 rounded"></div>)}
                  {Array.from({ length: days }).map((_, i) => {
                      const day = i + 1;
                      // Safe local date construction
                      const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const checkDateStr = checkDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

                      const daysEvents = filteredEvents.filter(e => e.date === checkDateStr);
                      const isSelected = selectedDate === checkDateStr;
                      const isToday = checkDateStr === new Date().toLocaleDateString('en-CA');

                      return (
                          <div 
                            key={day} 
                            onClick={() => setSelectedDate(checkDateStr)}
                            className={`
                                relative p-2 rounded-lg border transition-all cursor-pointer flex flex-col hover:shadow-md
                                ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-100 hover:border-blue-200 bg-white'}
                            `}
                          >
                              <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                                  {day}
                              </span>
                              
                              <div className="flex-1 flex flex-col justify-end gap-1 mt-1">
                                  {daysEvents.slice(0, 3).map(evt => (
                                      <div key={evt.id} className={`h-1.5 rounded-full w-full ${getCategoryIconColor(evt.category)}`}></div>
                                  ))}
                                  {daysEvents.length > 3 && (
                                      <span className="text-[10px] text-gray-400 text-center leading-none">+ {daysEvents.length - 3}</span>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Sidebar Details */}
          <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div>
                      <h3 className="font-bold text-gray-800">Événements</h3>
                      <p className="text-xs text-gray-500 capitalize">{new Date(selectedDate).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'})}</p>
                  </div>
                  <button onClick={() => openModal(undefined, selectedDate)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded"><Plus size={18} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {dayEvents.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                          <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aucun événement prévu.</p>
                      </div>
                  ) : (
                      dayEvents.map(event => (
                          <div 
                            key={event.id} 
                            onClick={() => openModal(event)}
                            className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow group relative ${getCategoryColor(event.category)}`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className="font-bold text-sm line-clamp-1">{event.title}</div>
                                  <div className="flex gap-1">
                                      {getStatusIcon(event.status)}
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs opacity-80 mb-2">
                                  <Clock size={12} /> 
                                  <span>{event.startTime} - {event.endTime}</span>
                              </div>
                              {event.location && (
                                  <div className="flex items-center gap-2 text-xs opacity-80">
                                      <MapPin size={12} /> 
                                      <span className="truncate">{event.location}</span>
                                  </div>
                              )}
                              {event.status === 'COMPLETED' && (
                                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg pointer-events-none">
                                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded border border-emerald-200 transform -rotate-12">RÉALISÉ</span>
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* Event Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">{eventForm.id ? 'Modifier l\'événement' : 'Nouvel Événement'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Titre</label>
                          <input 
                            type="text" 
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={eventForm.title || ''}
                            onChange={e => setEventForm({...eventForm, title: e.target.value})}
                            placeholder="ex: Conseil de classe"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                              <input 
                                type="date" 
                                required
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={eventForm.date || ''}
                                onChange={e => setEventForm({...eventForm, date: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Catégorie</label>
                              <select 
                                className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                                value={eventForm.category}
                                onChange={e => setEventForm({...eventForm, category: e.target.value as any})}
                              >
                                  <option value="PEDAGOGIC">Pédagogique</option>
                                  <option value="EXTRA_CURRICULAR">Extra-scolaire</option>
                                  <option value="ADMINISTRATIVE">Administratif</option>
                                  <option value="EXAM">Examen</option>
                                  <option value="MEETING">Réunion</option>
                                  <option value="HOLIDAY">Vacances</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Début</label>
                              <input 
                                type="time" 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={eventForm.startTime || ''}
                                onChange={e => setEventForm({...eventForm, startTime: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Fin</label>
                              <input 
                                type="time" 
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                value={eventForm.endTime || ''}
                                onChange={e => setEventForm({...eventForm, endTime: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Lieu</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            value={eventForm.location || ''}
                            onChange={e => setEventForm({...eventForm, location: e.target.value})}
                            placeholder="ex: Salle Polyvalente"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                          <textarea 
                            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                            rows={3}
                            value={eventForm.description || ''}
                            onChange={e => setEventForm({...eventForm, description: e.target.value})}
                            placeholder="Détails supplémentaires..."
                          />
                      </div>

                      <div className="border-t pt-4 mt-2">
                          <label className="block text-xs font-bold text-gray-500 mb-2">Statut</label>
                          <div className="flex gap-4">
                              <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="status"
                                    value="PLANNED"
                                    checked={eventForm.status === 'PLANNED'}
                                    onChange={() => setEventForm({...eventForm, status: 'PLANNED'})}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">À venir (Prévu)</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="status"
                                    value="COMPLETED"
                                    checked={eventForm.status === 'COMPLETED'}
                                    onChange={() => setEventForm({...eventForm, status: 'COMPLETED'})}
                                    className="w-4 h-4 text-emerald-600"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Réalisé</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="status"
                                    value="CANCELLED"
                                    checked={eventForm.status === 'CANCELLED'}
                                    onChange={() => setEventForm({...eventForm, status: 'CANCELLED'})}
                                    className="w-4 h-4 text-red-600"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Annulé</span>
                              </label>
                          </div>
                      </div>

                      <div className="pt-4 flex justify-between items-center border-t border-gray-100 mt-4">
                          {eventForm.id ? (
                              <button 
                                type="button" 
                                onClick={() => handleDeleteEvent(eventForm.id!)}
                                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium transition-colors"
                              >
                                  <Trash2 size={18} />
                              </button>
                          ) : <div></div>}
                          
                          <div className="flex gap-3">
                              <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium"
                              >
                                  Annuler
                              </button>
                              <button 
                                type="submit" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                              >
                                  <Save size={16} /> Enregistrer
                              </button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

function getCategoryIconColor(category: EventCategory) {
    switch (category) {
      case 'EXAM': return 'bg-rose-500';
      case 'HOLIDAY': return 'bg-emerald-500';
      case 'MEETING': return 'bg-blue-500';
      case 'EXTRA_CURRICULAR': return 'bg-purple-500';
      case 'ADMINISTRATIVE': return 'bg-gray-500';
      default: return 'bg-blue-400';
    }
}
