
import React, { useState, useEffect } from 'react';
import { Resource, ResourceType, SystemUser } from '../types';
import { db } from '../services/db';
import { DEFAULT_SUBJECTS } from '../constants';
import { 
  Search, Upload, Filter, Download, FileText, 
  Video, FileQuestion, File, Trash2, Plus, X, Eye, Play
} from 'lucide-react';

interface ResourcesManagerProps {
  currentSchoolId: string;
  currentUser: SystemUser | null;
}

export const ResourcesManager: React.FC<ResourcesManagerProps> = ({ currentSchoolId, currentUser }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    level: '',
    type: ''
  });
  const [sortOrder, setSortOrder] = useState<'DATE' | 'DOWNLOADS' | 'NAME'>('DATE');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  
  // Preview State
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  const [newResource, setNewResource] = useState<Partial<Resource>>({
    type: 'COURSE',
    subject: 'Mathématiques',
    level: 'Terminale'
  });

  useEffect(() => {
    setResources(db.getResources(currentSchoolId));
    
    const config = db.getSchoolConfig(currentSchoolId);
    if (config.subjects) {
        setAvailableSubjects(config.subjects);
    }
  }, [currentSchoolId]);

  const canWrite = currentUser ? db.hasPermission(currentSchoolId, currentUser.role, 'RESOURCES.write') : false;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.description) return;

    const resourceToAdd: Resource = {
      id: `R-${Date.now()}`,
      schoolId: currentSchoolId,
      title: newResource.title,
      description: newResource.description,
      subject: newResource.subject || 'Autre',
      level: newResource.level || 'Tous',
      type: newResource.type as ResourceType || 'DOCUMENT',
      authorName: currentUser?.name || 'Utilisateur',
      uploadDate: new Date().toISOString(),
      size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      downloadCount: 0
    };

    db.addResource(resourceToAdd);
    setResources(db.getResources(currentSchoolId));
    setIsModalOpen(false);
    setNewResource({ type: 'COURSE', subject: 'Mathématiques', level: 'Terminale' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette ressource ?')) {
      db.deleteResource(id);
      setResources(db.getResources(currentSchoolId));
    }
  };

  const handleDownloadStats = (resource: Resource) => {
      // Simulate download action
      db.incrementResourceDownload(resource.id);
      setResources(db.getResources(currentSchoolId)); // Refresh UI
      alert(`Téléchargement de "${resource.title}" démarré...`);
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filters.subject ? r.subject === filters.subject : true;
    const matchesLevel = filters.level ? r.level === filters.level : true;
    const matchesType = filters.type ? r.type === filters.type : true;

    return matchesSearch && matchesSubject && matchesLevel && matchesType;
  }).sort((a, b) => {
      if (sortOrder === 'DOWNLOADS') return (b.downloadCount || 0) - (a.downloadCount || 0);
      if (sortOrder === 'NAME') return a.title.localeCompare(b.title);
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(); // DATE (default)
  });

  const getIconForType = (type: ResourceType) => {
    switch(type) {
      case 'VIDEO': return <Video className="text-rose-500" size={24} />;
      case 'COURSE': return <FileText className="text-blue-500" size={24} />;
      case 'EXERCISE': return <FileQuestion className="text-emerald-500" size={24} />;
      default: return <File className="text-gray-500" size={24} />;
    }
  };

  const getTypeLabel = (type: ResourceType) => {
    switch(type) {
      case 'VIDEO': return 'Vidéo';
      case 'COURSE': return 'Cours';
      case 'EXERCISE': return 'Exercice';
      default: return 'Document';
    }
  };

  // Render content for the Preview Modal
  const renderPreviewContent = (resource: Resource) => {
    if (resource.type === 'VIDEO') {
      return (
        <div className="w-full aspect-video bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-50"></div>
          {/* Mock Thumbnail Pattern */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="z-10 flex flex-col items-center animate-in zoom-in duration-300">
             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 group-hover:scale-110 transition-transform cursor-pointer">
               <Play size={32} className="ml-1 text-white" fill="white" />
             </div>
             <p className="mt-4 font-medium tracking-wide">Aperçu Vidéo</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
             <p className="text-sm text-white/90">{resource.title}</p>
             <p className="text-xs text-white/60">Durée estimée: 15:00</p>
          </div>
        </div>
      );
    } else {
      // Document Preview (Course, Exercise, Doc)
      return (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg h-[400px] overflow-y-auto p-8 shadow-inner">
           <div className="max-w-2xl mx-auto bg-white shadow-sm min-h-full p-8 border border-gray-100">
              <div className="border-b-2 border-gray-100 pb-4 mb-6">
                 <h1 className="text-2xl font-bold text-gray-800 font-serif">{resource.title}</h1>
                 <p className="text-gray-500 text-sm mt-2 uppercase tracking-wide">{resource.subject} - {resource.level}</p>
              </div>
              
              <div className="space-y-4 text-gray-600 font-serif leading-relaxed text-justify">
                 <p className="font-bold text-gray-800">Introduction</p>
                 <p>
                   Voici un aperçu généré automatiquement du document. Ce contenu simule la première page du fichier "{resource.title}". 
                   {resource.description}
                 </p>
                 <p>
                   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                   Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                 </p>
                 
                 {resource.type === 'EXERCISE' && (
                   <div className="my-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                      <p className="font-bold text-blue-800 mb-2">Exercice 1</p>
                      <p className="text-blue-700 italic">Calculer la dérivée de la fonction suivante...</p>
                   </div>
                 )}

                 <p>
                   Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                   Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                 </p>
                 <div className="h-32 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              </div>
           </div>
        </div>
      );
    }
  };

  // Unique values for filters based on current resources + available subjects
  const levels = Array.from(new Set(resources.map(r => r.level)));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
      {/* Toolbar */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-white z-10">
        <div>
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <Filter className="text-blue-600" size={24} />
             Ressources Pédagogiques
           </h2>
           <p className="text-sm text-gray-500 mt-1">Partagez et organisez les supports de cours.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Rechercher..." 
               className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-64"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          {canWrite && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
            >
              <Upload size={16} />
              <span>Uploader</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3 items-center">
         <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Filtres:</span>
         
         <select 
            className="text-sm border-gray-200 rounded-md px-2 py-1 focus:border-blue-500 outline-none"
            value={filters.subject}
            onChange={e => setFilters({...filters, subject: e.target.value})}
         >
            <option value="">Toutes les matières</option>
            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
         </select>

         <select 
            className="text-sm border-gray-200 rounded-md px-2 py-1 focus:border-blue-500 outline-none"
            value={filters.level}
            onChange={e => setFilters({...filters, level: e.target.value})}
         >
            <option value="">Tous les niveaux</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
         </select>

         <select 
            className="text-sm border-gray-200 rounded-md px-2 py-1 focus:border-blue-500 outline-none"
            value={filters.type}
            onChange={e => setFilters({...filters, type: e.target.value})}
         >
            <option value="">Tous les types</option>
            <option value="COURSE">Cours</option>
            <option value="EXERCISE">Exercices</option>
            <option value="VIDEO">Vidéos</option>
            <option value="DOCUMENT">Documents</option>
         </select>

         <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>
         
         <select 
            className="text-sm border-gray-200 rounded-md px-2 py-1 focus:border-blue-500 outline-none font-medium text-gray-600"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as any)}
         >
            <option value="DATE">Plus récents</option>
            <option value="DOWNLOADS">Plus téléchargés</option>
            <option value="NAME">Alphabétique</option>
         </select>

         {(filters.subject || filters.level || filters.type) && (
           <button 
             onClick={() => setFilters({subject: '', level: '', type: ''})}
             className="text-xs text-red-500 hover:text-red-700 ml-auto underline"
           >
             Réinitialiser
           </button>
         )}
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {filteredResources.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <Filter size={64} className="mb-4" />
            <p className="text-lg">Aucune ressource trouvée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map(resource => (
              <div key={resource.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full relative group">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    {getIconForType(resource.type)}
                  </div>
                  <div className="flex gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {resource.level}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-1 rounded">
                        {resource.subject.slice(0, 3)}
                      </span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">{resource.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">{resource.description}</p>

                <div className="pt-4 border-t border-gray-100 mt-auto">
                   <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                      <span>{resource.authorName}</span>
                      <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setPreviewResource(resource)}
                        className="bg-slate-100 text-slate-700 p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Aperçu"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownloadStats(resource)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2 transition-colors"
                      >
                        <Download size={14} /> <span className="hidden sm:inline">Télécharger</span>
                      </button>
                      {canWrite && (
                        <button 
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                   </div>
                   <div className="text-center mt-3 text-[10px] text-gray-400 flex flex-col items-center bg-gray-50 py-1 rounded">
                     <span>{resource.size} • <span className="font-bold text-gray-600">{resource.downloadCount || 0} téléchargements</span></span>
                     {resource.lastDownloadDate && (
                         <span className="text-blue-400 mt-0.5">Dernier: {new Date(resource.lastDownloadDate).toLocaleDateString()}</span>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Ajouter une Ressource</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* Form Fields (Same as before) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du fichier</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newResource.title || ''}
                  onChange={e => setNewResource({...newResource, title: e.target.value})}
                  placeholder="ex: Chapitre 1 - Trigonométrie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={newResource.description || ''}
                  onChange={e => setNewResource({...newResource, description: e.target.value})}
                  placeholder="Description du contenu..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newResource.subject}
                    onChange={e => setNewResource({...newResource, subject: e.target.value})}
                  >
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newResource.level}
                    onChange={e => setNewResource({...newResource, level: e.target.value})}
                  >
                    <option value="Terminale">Terminale</option>
                    <option value="Première">Première</option>
                    <option value="Seconde">Seconde</option>
                  </select>
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Type de ressource</label>
                 <div className="grid grid-cols-4 gap-2">
                    {(['COURSE', 'EXERCISE', 'VIDEO', 'DOCUMENT'] as ResourceType[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewResource({...newResource, type})}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors
                          ${newResource.type === type 
                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {getTypeLabel(type)}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                 <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                 <p className="text-sm text-gray-500">Glisser un fichier ou cliquer pour parcourir</p>
                 <p className="text-xs text-gray-400 mt-1">(Simulé pour la démo)</p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-600/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                       {getIconForType(previewResource.type)}
                     </div>
                     <div>
                       <h3 className="font-bold text-gray-800 text-lg">{previewResource.title}</h3>
                       <p className="text-xs text-gray-500">Aperçu avant téléchargement</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setPreviewResource(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                  >
                    <X size={24} />
                  </button>
              </div>
              
              <div className="flex-1 bg-gray-100 p-4 overflow-y-auto flex items-center justify-center">
                 {renderPreviewContent(previewResource)}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                 <div className="text-sm text-gray-500 hidden sm:block">
                    Taille: {previewResource.size}
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setPreviewResource(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium w-full sm:w-auto"
                    >
                      Fermer
                    </button>
                    <button 
                      onClick={() => handleDownloadStats(previewResource)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                       <Download size={18} /> Télécharger le fichier
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
