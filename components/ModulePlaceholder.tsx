import React from 'react';
import { Hammer, Construction } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  features: string[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, description, features }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-50 p-6 rounded-full mb-6 animate-pulse">
        <Construction size={48} className="text-slate-400" />
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-3">{title}</h2>
      <p className="text-slate-500 max-w-md mb-8 text-lg">{description}</p>
      
      <div className="bg-slate-50 rounded-xl p-6 max-w-md w-full border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Fonctionnalités prévues</h3>
        <ul className="space-y-3 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-slate-600 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      
      <button className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-lg shadow-slate-800/20">
        M'avertir de la disponibilité
      </button>
    </div>
  );
};