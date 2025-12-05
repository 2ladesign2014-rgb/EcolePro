
import React, { useState, useEffect, useRef } from 'react';
import { Message, SystemUser, UserRole } from '../types';
import { Send, Search, MoreVertical, Phone, Video, Megaphone, User } from 'lucide-react';
import { db } from '../services/db';

interface CommunicationHubProps {
  messages: Message[];
  onSendMessage: (msg: Message) => void;
  currentUser?: SystemUser; // Made optional prop but used in App
  currentSchoolId: string;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({ messages, onSendMessage, currentUser, currentSchoolId }) => {
  const [input, setInput] = useState('');
  const [activeContact, setActiveContact] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const canWrite = currentUser ? db.hasPermission(currentSchoolId, currentUser.role, 'COMMUNICATION.write') : false;

  // Define contacts based on User Role (Flow 3)
  const getContacts = () => {
    const role = currentUser?.role;
    if (!role) return [];

    const contacts = [
      { id: 'admin', name: 'Administration', role: 'ADMIN' },
      { id: 'bursar', name: 'Service Compta', role: 'BURSAR' },
      { id: 'librarian', name: 'Bibliothèque', role: 'LIBRARIAN' }, // Added Librarian contact
    ];

    if (role === 'PARENT' || role === 'STUDENT') {
      return [
        ...contacts,
        { id: 'teacher1', name: 'M. Dubois (Maths)', role: 'TEACHER' },
        { id: 'teacher2', name: 'Mme. Lefebvre (Fr)', role: 'TEACHER' },
      ];
    }
    
    if (role === 'TEACHER') {
      return [
        ...contacts,
        { id: 'parents_class', name: 'Parents Tle S1', role: 'PARENT' },
        { id: 'parents_student', name: 'Parents Jean Martin', role: 'PARENT' },
      ];
    }

    if (role === 'LIBRARIAN') {
      return [
        { id: 'admin', name: 'Administration', role: 'ADMIN' },
        { id: 'bursar', name: 'Économe (Facturation)', role: 'BURSAR' },
        { id: 'teachers', name: 'Enseignants (Groupe)', role: 'TEACHER' },
        { id: 'students', name: 'Élèves (Groupe)', role: 'STUDENT' },
      ];
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
       return [
         { id: 'broadcast_all', name: '>> TOUS (Annonce)', role: 'BROADCAST' },
         { id: 'broadcast_parents', name: '>> Parents (Groupe)', role: 'BROADCAST' },
         { id: 'teachers', name: 'Salle des Profs', role: 'TEACHER' },
         { id: 'bursar', name: 'Économe', role: 'BURSAR' },
         { id: 'librarian', name: 'Bibliothèque', role: 'LIBRARIAN' },
       ];
    }

    return contacts;
  };

  const contacts = getContacts();

  useEffect(() => {
    if (contacts.length > 0 && !activeContact) {
      setActiveContact(contacts[0].id);
    }
  }, [contacts, activeContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContact]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const isBroadcast = activeContact.startsWith('broadcast');

    const newMsg: Message = {
      id: Date.now().toString(),
      schoolId: currentSchoolId,
      sender: 'Moi',
      senderRole: currentUser?.role,
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
      isMe: true,
      isBroadcast: isBroadcast
    };

    onSendMessage(newMsg);
    setInput('');
    
    // Simulate reply if not broadcast
    if (!isBroadcast) {
      setTimeout(() => {
          const reply: Message = {
              id: (Date.now() + 1).toString(),
              schoolId: currentSchoolId,
              sender: contacts.find(c => c.id === activeContact)?.name || 'Correspondant',
              content: "Message bien reçu. Nous traitons votre demande.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
              isMe: false
          };
          onSendMessage(reply);
      }, 2000);
    }
  };

  const currentContactInfo = contacts.find(c => c.id === activeContact);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex h-[calc(100vh-140px)] overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-700 text-lg mb-2">Messagerie</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => setActiveContact(contact.id)}
              className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeContact === contact.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''}`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm shadow-sm
                ${contact.role === 'BROADCAST' ? 'bg-gradient-to-br from-red-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'}
              `}>
                {contact.role === 'BROADCAST' ? <Megaphone size={18} /> : contact.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <h4 className="font-semibold text-sm text-gray-800 truncate">{contact.name}</h4>
                  <span className="text-xs text-gray-400">10:30</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {contact.role === 'BROADCAST' ? 'Canal d\'annonce générale' : 'Cliquer pour voir la conversation...'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Header */}
        {currentContactInfo && (
          <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center">
               <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold mr-3 text-white
                  ${currentContactInfo.role === 'BROADCAST' ? 'bg-orange-500' : 'bg-emerald-500'}
               `}>
                 {currentContactInfo.role === 'BROADCAST' ? <Megaphone size={20} /> : currentContactInfo.name.substring(0,2)}
               </div>
               <div>
                 <h3 className="font-bold text-gray-800">{currentContactInfo.name}</h3>
                 <span className="flex items-center text-xs text-emerald-600">
                   {currentContactInfo.role !== 'BROADCAST' && (
                      <><span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span> En ligne</>
                   )}
                 </span>
               </div>
            </div>
            <div className="flex space-x-2 text-gray-400">
              <button className="p-2 hover:bg-gray-100 rounded-full"><Phone size={20} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-full"><Video size={20} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical size={20} /></button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative">
          {/* Broadcast Banner Warning */}
          {currentContactInfo?.role === 'BROADCAST' && (
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 text-sm rounded">
              <p className="font-bold">Mode Annonce</p>
              <p>Les messages envoyés ici seront visibles par tous les membres du groupe sélectionné. Ils ne peuvent pas répondre directement ici.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md px-4 py-3 rounded-2xl shadow-sm text-sm relative ${
                msg.isMe 
                  ? (msg.isBroadcast ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-blue-600 text-white rounded-tr-none') 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {msg.isBroadcast && msg.isMe && (
                    <div className="text-[10px] uppercase font-bold mb-1 flex items-center opacity-75 border-b border-white/20 pb-1">
                        <Megaphone size={10} className="mr-1" /> Annonce
                    </div>
                )}
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex items-center space-x-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentContactInfo?.role === 'BROADCAST' ? "Écrire une annonce..." : "Écrivez votre message..."}
              className="flex-1 px-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all outline-none"
              disabled={!canWrite}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || !canWrite}
              className={`p-3 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md
                ${currentContactInfo?.role === 'BROADCAST' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              <Send size={20} />
            </button>
          </form>
          {!canWrite && (
              <p className="text-xs text-red-500 text-center mt-2">Vous n'avez pas la permission d'envoyer des messages.</p>
          )}
        </div>
      </div>
    </div>
  );
};
