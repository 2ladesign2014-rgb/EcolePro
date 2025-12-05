import React, { useState } from 'react';
import { Sparkles, FileText, Loader2, Send, Copy } from 'lucide-react';
import { Student } from '../types';
import { generateStudentReport, analyzeClassPerformance } from '../services/geminiService';

interface AIAssistantProps {
  students: Student[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ students }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [classAnalysis, setClassAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleGenerateReport = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    setGeneratedReport('');
    const report = await generateStudentReport(selectedStudent);
    setGeneratedReport(report);
    setLoading(false);
  };

  const handleAnalyzeClass = async () => {
    setAnalyzing(true);
    setClassAnalysis('');
    const analysis = await analyzeClassPerformance(students);
    setClassAnalysis(analysis);
    setAnalyzing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Panel: Generator */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Générateur de Bulletins IA</h2>
            <p className="text-sm text-gray-500">Rédigez des commentaires professionnels instantanément.</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un élève</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Choisir un élève --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} - {s.classGrade}</option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Moyenne:</span>
                <span className="font-semibold">{selectedStudent.average}/20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assiduité:</span>
                <span className="font-semibold">{selectedStudent.attendance}%</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Notes comportement:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedStudent.behaviorNotes.map((note, i) => (
                    <span key={i} className="bg-white px-2 py-1 rounded border border-gray-200 text-xs text-gray-600">{note}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={!selectedStudent || loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            <span>{loading ? 'Génération en cours...' : 'Générer le commentaire'}</span>
          </button>
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="space-y-6">
        {/* Result Box */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-1/2 flex flex-col relative">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <FileText size={20} className="text-gray-400" />
            <span>Résultat</span>
          </h3>
          
          <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-auto font-serif text-gray-700 leading-relaxed">
             {generatedReport ? (
               <p className="animate-in fade-in duration-500">{generatedReport}</p>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                 Le commentaire généré apparaîtra ici...
               </div>
             )}
          </div>
          
          {generatedReport && (
            <button 
              className="absolute top-6 right-6 text-gray-400 hover:text-purple-600"
              title="Copier"
              onClick={() => navigator.clipboard.writeText(generatedReport)}
            >
              <Copy size={20} />
            </button>
          )}
        </div>

        {/* Global Analysis Box */}
        <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg h-[45%] flex flex-col">
          <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-lg font-bold">Analyse Globale de Classe</h3>
               <p className="text-indigo-200 text-xs">Basé sur tous les élèves</p>
             </div>
             <button 
               onClick={handleAnalyzeClass}
               disabled={analyzing}
               className="bg-indigo-700 hover:bg-indigo-600 p-2 rounded-lg transition-colors disabled:opacity-50"
             >
               {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
             </button>
          </div>
          
          <div className="flex-1 overflow-auto text-sm text-indigo-100 space-y-2">
            {classAnalysis ? (
               <div dangerouslySetInnerHTML={{ __html: classAnalysis }} className="prose prose-invert prose-sm" />
            ) : (
               <p className="italic text-indigo-400">Cliquez sur le bouton pour analyser les tendances globales de la classe via Gemini.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};