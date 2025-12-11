
import React, { useState, useRef, useEffect } from 'react';
import { View, Language } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  FileCode,
  Rocket,
  Code,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  views: View[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onAddView: () => void;
  onRemoveView: (id: string) => void;
  onUpdateView: (id: string, updates: Partial<View>) => void;
  onGenerateCode?: () => void;
  language?: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  views, 
  activeViewId, 
  onSelectView, 
  onAddView, 
  onRemoveView,
  onUpdateView,
  onGenerateCode,
  language = 'ko'
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const startEditing = (view: View, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(view.id);
    setEditName(view.name);
    setEditRoute(view.route);
  };

  const saveEditing = () => {
    if (editingId) {
      let formattedRoute = editRoute.trim();
      if (!formattedRoute.startsWith('/')) {
        formattedRoute = '/' + formattedRoute;
      }
      formattedRoute = formattedRoute.replace(/\s+/g, '-').toLowerCase();

      onUpdateView(editingId, {
        name: editName.trim() || (language === 'ko' ? '제목 없음' : 'Untitled Page'),
        route: formattedRoute
      });
      setEditingId(null);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Check if all views are ready (visited/generated)
  const isReady = views.length > 0 && views.every(v => {
    if (v.mode === 'custom') {
      return !!v.customDescription || (v.customFiles && v.customFiles.length > 0);
    }
    // Wireframe mode: must have layout items
    return v.layout && v.layout.length > 0;
  });

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          {language === 'ko' ? '페이지 & 라우트' : 'Pages & Routes'}
        </h2>
        <button
          onClick={onAddView}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 py-2 text-sm font-medium transition-colors border border-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'ko' ? '새 페이지 추가' : 'Add New Page'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700">
        <ul className="space-y-1 px-2">
          {views.map((view) => {
            const isViewReady = view.mode === 'custom' 
              ? (!!view.customDescription || (view.customFiles && view.customFiles.length > 0))
              : (view.layout && view.layout.length > 0);

            return (
              <li key={view.id}>
                {editingId === view.id ? (
                  <div className="p-2 rounded-lg bg-slate-800 border border-indigo-500/50 space-y-2">
                    <div>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                        placeholder={language === 'ko' ? "페이지 이름" : "Page Name"}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editRoute}
                        onChange={(e) => setEditRoute(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                        placeholder="/route"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={cancelEditing} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <X className="h-3 w-3" />
                      </button>
                      <button onClick={saveEditing} className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white">
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => onSelectView(view.id)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer border border-transparent ${
                      activeViewId === view.id
                        ? 'bg-indigo-500/10 text-indigo-100 border-indigo-500/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {/* Status Dot */}
                    <div className={`absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${
                       view.mode === 'custom' ? 'bg-purple-400' : (isViewReady ? 'bg-green-400' : 'bg-slate-700')
                    }`} />

                    <FileCode className={`h-4 w-4 flex-shrink-0 ml-1 ${activeViewId === view.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-500'}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{view.name}</div>
                      <div className="text-xs text-slate-600 truncate font-mono group-hover:text-slate-500">{view.route}</div>
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(view, e)}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveView(view.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Bottom Action Area */}
      <div className="p-4 border-t border-white/10 bg-slate-900/80">
        {!isReady && views.length > 0 && (
           <div className="mb-3 flex items-start gap-2 text-xs text-amber-500/80 px-1">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                {language === 'ko' 
                  ? '모든 페이지의 구성을 완료해야 코드를 생성할 수 있습니다.' 
                  : 'Complete all page configurations to generate code.'}
              </span>
           </div>
        )}
        <button
          onClick={onGenerateCode}
          disabled={!isReady}
          className={`
            w-full group relative flex items-center justify-center gap-2 rounded-xl py-3 text-white transition-all duration-300
            ${isReady 
               ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] cursor-pointer' 
               : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }
          `}
        >
          <div className={`absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity ${isReady ? 'group-hover:opacity-100' : ''}`}></div>
          <Code className="h-5 w-5" />
          <span className="font-semibold text-sm">
            {language === 'ko' ? 'AI 검토 및 생성' : 'Review & Generate'}
          </span>
          {isReady && (
            <Rocket className="h-4 w-4 absolute right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
