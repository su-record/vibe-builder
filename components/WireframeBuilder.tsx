
import React, { useState, useRef, useEffect } from 'react';
import { View, WireframeComponent, ComponentType, Language, ViewMode } from '../types';
import { 
  Layout, Type, Image as ImageIcon, FormInput, List, 
  AlignJustify, PanelBottom, MousePointerClick, Sidebar as SidebarIcon,
  Plus, X, Trash2, Sparkles, MoveRight, Monitor, Settings2, Upload, FileText, Paperclip, AlertCircle, CheckCircle2,
  Settings, Wand2, Send
} from 'lucide-react';

interface WireframeBuilderProps {
  view: View;
  onUpdateLayout: (viewId: string, layout: WireframeComponent[]) => void;
  onUpdateView?: (viewId: string, updates: Partial<View>) => void;
  onRefine?: (viewId: string, instruction: string) => void; // New prop for AI refinement
  isGenerating: boolean;
  language?: Language;
}

const getLocalizedPalette = (lang: Language) => [
  { 
    type: 'header', 
    icon: Layout, 
    label: lang === 'ko' ? '헤더 / 네비게이션' : 'Header / Nav', 
    defaultDesc: lang === 'ko' ? '왼쪽 로고, 오른쪽 메뉴 링크, 사용자 프로필 드롭다운' : 'Logo left, Navigation links right, User profile dropdown' 
  },
  { 
    type: 'hero', 
    icon: ImageIcon, 
    label: lang === 'ko' ? '히어로 섹션' : 'Hero Section', 
    defaultDesc: lang === 'ko' ? '큰 제목, 부제목, 주요 CTA 버튼과 배경 이미지' : 'Large catchy headline, subtext, and primary CTA button with background image' 
  },
  { 
    type: 'feature', 
    icon: Sparkles, 
    label: lang === 'ko' ? '기능 그리드' : 'Features Grid', 
    defaultDesc: lang === 'ko' ? '아이콘과 짧은 텍스트가 있는 3열 기능 소개' : '3-column grid displaying key features with icons and short text' 
  },
  { 
    type: 'content', 
    icon: AlignJustify, 
    label: lang === 'ko' ? '텍스트 콘텐츠' : 'Text Content', 
    defaultDesc: lang === 'ko' ? '제목과 문단으로 구성된 일반적인 본문 섹션' : 'Standard prose section with headings and paragraphs' 
  },
  { 
    type: 'form', 
    icon: FormInput, 
    label: lang === 'ko' ? '입력 폼' : 'Input Form', 
    defaultDesc: lang === 'ko' ? '사용자 입력 필드(텍스트, 이메일 등)와 제출 버튼' : 'User input fields (Text, Email, etc.) and Submit button' 
  },
  { 
    type: 'list', 
    icon: List, 
    label: lang === 'ko' ? '데이터 리스트' : 'Data List', 
    defaultDesc: lang === 'ko' ? '데이터 항목의 수직 목록 또는 테이블' : 'A vertical list or table of data items' 
  },
  { 
    type: 'gallery', 
    icon: ImageIcon, 
    label: lang === 'ko' ? '이미지 갤러리' : 'Image Gallery', 
    defaultDesc: lang === 'ko' ? '이미지나 카드가 격자 형태로 배치된 레이아웃' : 'Grid layout of images/cards' 
  },
  { 
    type: 'cta', 
    icon: MousePointerClick, 
    label: lang === 'ko' ? '행동 유도(CTA)' : 'Call to Action', 
    defaultDesc: lang === 'ko' ? '버튼을 포함한 중앙 정렬 배너로 사용자 행동 유도' : 'Centered banner with button to drive user action' 
  },
  { 
    type: 'footer', 
    icon: PanelBottom, 
    label: lang === 'ko' ? '푸터' : 'Footer', 
    defaultDesc: lang === 'ko' ? '하단 링크, 저작권 정보, 소셜 아이콘' : 'Bottom links, copyright, and social icons' 
  },
] as const;

// --- Wireframe Visual Renderers ---
const SkeletonHeader = () => (
  <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
    <div className="flex items-center gap-4">
      <div className="h-6 w-6 rounded bg-indigo-500/20"></div>
      <div className="h-3 w-24 rounded bg-slate-700"></div>
    </div>
    <div className="flex gap-4">
      <div className="h-2 w-16 rounded bg-slate-700"></div>
      <div className="h-2 w-16 rounded bg-slate-700"></div>
      <div className="h-2 w-16 rounded bg-slate-700"></div>
      <div className="h-6 w-6 rounded-full bg-slate-700 ml-2"></div>
    </div>
  </div>
);

const SkeletonHero = () => (
  <div className="flex flex-col items-center justify-center py-16 px-8 bg-slate-800/30 border-b border-slate-800">
    <div className="h-8 w-3/4 max-w-lg rounded bg-slate-700 mb-4"></div>
    <div className="h-8 w-1/2 max-w-md rounded bg-slate-700 mb-8"></div>
    <div className="h-3 w-2/3 max-w-xl rounded bg-slate-700/50 mb-2"></div>
    <div className="h-3 w-1/2 max-w-lg rounded bg-slate-700/50 mb-8"></div>
    <div className="flex gap-4">
      <div className="h-10 w-32 rounded bg-indigo-600/40"></div>
      <div className="h-10 w-32 rounded border border-slate-600"></div>
    </div>
  </div>
);

const SkeletonFeature = () => (
  <div className="grid grid-cols-3 gap-6 p-8 bg-slate-900/20">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex flex-col gap-3 p-4 rounded bg-slate-800/50 border border-slate-700/50">
        <div className="h-8 w-8 rounded bg-indigo-500/20 mb-1"></div>
        <div className="h-4 w-3/4 rounded bg-slate-700"></div>
        <div className="h-2 w-full rounded bg-slate-700/50"></div>
        <div className="h-2 w-5/6 rounded bg-slate-700/50"></div>
      </div>
    ))}
  </div>
);

const SkeletonForm = () => (
  <div className="max-w-md mx-auto p-8 my-4 rounded border border-slate-700/50 bg-slate-800/20 space-y-5">
    <div className="space-y-2">
      <div className="h-2 w-20 rounded bg-slate-600"></div>
      <div className="h-10 w-full rounded bg-slate-900/50 border border-slate-700"></div>
    </div>
    <div className="space-y-2">
      <div className="h-2 w-24 rounded bg-slate-600"></div>
      <div className="h-10 w-full rounded bg-slate-900/50 border border-slate-700"></div>
    </div>
    <div className="pt-2">
      <div className="h-10 w-full rounded bg-indigo-600/40"></div>
    </div>
  </div>
);

const SkeletonList = () => (
  <div className="p-8 space-y-4">
    <div className="flex justify-between items-center mb-4">
      <div className="h-5 w-32 rounded bg-slate-700"></div>
      <div className="h-8 w-24 rounded bg-slate-700/50"></div>
    </div>
    <div className="border border-slate-700 rounded overflow-hidden">
      <div className="bg-slate-800/50 h-10 border-b border-slate-700 flex items-center px-4 gap-4">
        <div className="h-3 w-1/4 rounded bg-slate-600"></div>
        <div className="h-3 w-1/4 rounded bg-slate-600"></div>
        <div className="h-3 w-1/4 rounded bg-slate-600"></div>
        <div className="h-3 w-1/4 rounded bg-slate-600"></div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-900/20 h-12 border-b border-slate-700/50 flex items-center px-4 gap-4 last:border-0">
          <div className="h-2 w-1/4 rounded bg-slate-700/50"></div>
          <div className="h-2 w-1/4 rounded bg-slate-700/50"></div>
          <div className="h-2 w-1/4 rounded bg-slate-700/50"></div>
          <div className="h-2 w-1/4 rounded bg-slate-700/50"></div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonContent = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-4">
    <div className="h-6 w-1/3 rounded bg-slate-700 mb-6"></div>
    <div className="space-y-2">
      <div className="h-2 w-full rounded bg-slate-700/50"></div>
      <div className="h-2 w-full rounded bg-slate-700/50"></div>
      <div className="h-2 w-5/6 rounded bg-slate-700/50"></div>
      <div className="h-2 w-full rounded bg-slate-700/50"></div>
    </div>
    <div className="space-y-2 pt-4">
      <div className="h-2 w-full rounded bg-slate-700/50"></div>
      <div className="h-2 w-4/5 rounded bg-slate-700/50"></div>
    </div>
  </div>
);

const SkeletonGallery = () => (
  <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="aspect-square rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-slate-700" />
      </div>
    ))}
  </div>
);

const SkeletonCTA = () => (
  <div className="p-12 mx-8 my-8 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center text-center gap-4">
    <div className="h-6 w-2/3 rounded bg-slate-600"></div>
    <div className="h-2 w-1/2 rounded bg-slate-700"></div>
    <div className="mt-2 h-10 w-40 rounded bg-white/10"></div>
  </div>
);

const SkeletonFooter = () => (
  <div className="mt-auto p-10 bg-slate-950 border-t border-slate-800 grid grid-cols-4 gap-8">
    <div className="col-span-1 space-y-3">
      <div className="h-6 w-8 rounded bg-indigo-900/50"></div>
      <div className="h-2 w-full rounded bg-slate-800"></div>
      <div className="h-2 w-2/3 rounded bg-slate-800"></div>
    </div>
    {[1, 2, 3].map(col => (
      <div key={col} className="col-span-1 space-y-3">
        <div className="h-3 w-16 rounded bg-slate-800 mb-2"></div>
        <div className="h-2 w-20 rounded bg-slate-800/50"></div>
        <div className="h-2 w-20 rounded bg-slate-800/50"></div>
        <div className="h-2 w-20 rounded bg-slate-800/50"></div>
      </div>
    ))}
  </div>
);

const SkeletonGeneric = ({ label }: { label: string }) => (
  <div className="p-8 flex items-center justify-center border-2 border-dashed border-slate-700 rounded bg-slate-900/20">
    <span className="text-slate-500 font-mono text-sm">{label} Block</span>
  </div>
);

// --- Main Builder Component ---

const WireframeBuilder: React.FC<WireframeBuilderProps> = ({ 
  view, 
  onUpdateLayout, 
  onUpdateView, 
  onRefine,
  isGenerating, 
  language = 'ko' 
}) => {
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const palette = getLocalizedPalette(language as Language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers for Wireframe Mode ---
  const handleAddComponent = (type: ComponentType, label: string, defaultDesc: string) => {
    const newComponent: WireframeComponent = {
      id: crypto.randomUUID(),
      type,
      label,
      description: defaultDesc
    };
    const currentLayout = view.layout || [];
    onUpdateLayout(view.id, [...currentLayout, newComponent]);
    setActiveComponentId(newComponent.id);
  };

  const handleRemoveComponent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const currentLayout = view.layout || [];
    onUpdateLayout(view.id, currentLayout.filter(c => c.id !== id));
    if (activeComponentId === id) setActiveComponentId(null);
  };

  const handleUpdateDescription = (id: string, newDesc: string) => {
    const currentLayout = view.layout || [];
    onUpdateLayout(view.id, currentLayout.map(c => c.id === id ? { ...c, description: newDesc } : c));
  };

  // --- Handlers for Custom Mode ---
  const handleModeChange = (mode: ViewMode) => {
    if (onUpdateView) {
      onUpdateView(view.id, { mode });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onUpdateView) {
      const newFiles = Array.from(e.target.files);
      const currentFiles = view.customFiles || [];
      onUpdateView(view.id, { customFiles: [...currentFiles, ...newFiles] });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUpdateView) {
      const newFiles = Array.from(e.dataTransfer.files);
      const currentFiles = view.customFiles || [];
      onUpdateView(view.id, { customFiles: [...currentFiles, ...newFiles] });
    }
  };

  const handleRemoveFile = (index: number) => {
    if (onUpdateView && view.customFiles) {
      const updatedFiles = view.customFiles.filter((_, i) => i !== index);
      onUpdateView(view.id, { customFiles: updatedFiles });
    }
  };

  const handleCustomDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdateView) {
      onUpdateView(view.id, { customDescription: e.target.value });
    }
  };

  // --- Handler for AI Refinement ---
  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refineInstruction.trim() && onRefine) {
      onRefine(view.id, refineInstruction);
      setRefineInstruction('');
    }
  };

  const renderComponentVisual = (component: WireframeComponent) => {
    switch (component.type) {
      case 'header': return <SkeletonHeader />;
      case 'hero': return <SkeletonHero />;
      case 'feature': return <SkeletonFeature />;
      case 'form': return <SkeletonForm />;
      case 'list': return <SkeletonList />;
      case 'content': return <SkeletonContent />;
      case 'gallery': return <SkeletonGallery />;
      case 'cta': return <SkeletonCTA />;
      case 'footer': return <SkeletonFooter />;
      default: return <SkeletonGeneric label={component.label} />;
    }
  };

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
        setProgress(0);
        interval = setInterval(() => {
            setProgress((prev) => {
                const increment = Math.random() * 8 + 2; // Random increment between 2% and 10%
                const next = prev + increment;
                return next > 92 ? 92 : next; // Cap at 92% until completion
            });
        }, 300);
    } else {
        setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 bg-slate-950/50 animate-fade-in">
        {/* Gears Animation */}
        <div className="relative h-24 w-24">
           {/* Big Gear */}
           <div className="absolute inset-0 flex items-center justify-center">
             <Settings className="h-20 w-20 text-indigo-500/80 animate-spin-slow" />
           </div>
           {/* Small Gear */}
           <div className="absolute -bottom-2 -right-2">
             <Settings className="h-12 w-12 text-purple-500/80 animate-spin-reverse-slow" />
           </div>
           {/* Glow effect */}
           <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
        </div>

        <div className="space-y-4 text-center max-w-sm w-full px-8">
            <p className="text-slate-300 text-lg font-medium animate-pulse">
            {language === 'ko' 
                ? <><span className="text-indigo-400 font-bold">{view.name}</span> 구조 설계 및 와이어프레임 수정 중...</>
                : <>Refining wireframe for <span className="text-indigo-400 font-bold">{view.name}</span>...</>
            }
            </p>
            
            {/* Real Progress Bar */}
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className="text-right w-full">
                  <span className="text-xs font-semibold inline-block text-indigo-400 font-mono">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-800 border border-slate-700/50">
                <div 
                  style={{ width: `${progress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                ></div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 font-mono">
                AI Agent is adjusting components...
            </p>
        </div>
      </div>
    );
  }

  // Determine current mode (default to wireframe)
  const mode = view.mode || 'wireframe';

  return (
    <div className="flex h-full gap-6">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Monitor className="h-6 w-6 text-slate-500" />
              {view.name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{view.description}</p>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700/50">
            <button
              onClick={() => handleModeChange('wireframe')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                mode === 'wireframe' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Layout className="h-4 w-4" />
              {language === 'ko' ? 'AI 와이어프레임' : 'AI Wireframe'}
            </button>
            <button
              onClick={() => handleModeChange('custom')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                mode === 'custom' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Upload className="h-4 w-4" />
              {language === 'ko' ? '사용자 디자인 업로드' : 'Custom Upload'}
            </button>
          </div>
        </div>

        {/* --- WIREFRAME MODE --- */}
        {mode === 'wireframe' && (
          <div className="flex-1 overflow-hidden bg-slate-950 border border-slate-700 rounded-lg shadow-2xl flex flex-col relative">
            
            {/* AI Refinement Input Bar (Magic Bar) */}
            <div className="bg-slate-900 border-b border-slate-800 p-2">
              <form onSubmit={handleRefineSubmit} className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Wand2 className="h-4 w-4 text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  placeholder={language === 'ko' 
                    ? "AI에게 수정을 요청하세요... (예: 헤더 아래에 검색바를 추가해줘)" 
                    : "Ask AI to change layout... (e.g., Add a search bar below header)"
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!refineInstruction.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-0 disabled:pointer-events-none transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Browser Toolbar */}
            <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 flex-shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
              </div>
              <div className="flex-1 max-w-2xl mx-auto bg-slate-950 rounded px-3 py-0.5 text-[10px] text-slate-500 font-mono text-center truncate border border-slate-800">
                localhost:3000{view.route}
              </div>
              <div className="w-12"></div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-y-auto bg-slate-950 scroll-smooth relative p-4 space-y-1">
              {!view.layout || view.layout.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none opacity-50">
                  <Layout className="h-20 w-20 mb-4 stroke-1" />
                  <p className="text-lg font-light">
                    {language === 'ko' ? '캔버스가 비어있습니다' : 'Canvas is empty'}
                  </p>
                  <p className="text-sm">
                    {language === 'ko' ? '오른쪽 팔레트에서 섹션을 추가하여 빌드를 시작하세요.' : 'Add sections from the palette to start building.'}
                  </p>
                </div>
              ) : (
                view.layout.map((component, index) => (
                  <div 
                    key={component.id}
                    onClick={() => setActiveComponentId(component.id)}
                    className={`
                      group relative transition-all duration-200 border-2 rounded-lg
                      ${activeComponentId === component.id 
                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 z-10' 
                        : 'border-transparent hover:border-slate-700'
                      }
                    `}
                  >
                    {/* Action Overlay */}
                    <div className={`
                      absolute top-2 right-2 flex items-center gap-2 z-20 transition-opacity duration-200
                      ${activeComponentId === component.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}>
                      <div className="bg-slate-900/90 text-xs text-slate-300 px-2 py-1 rounded border border-slate-700 backdrop-blur">
                          {component.label}
                      </div>
                      <button 
                          onClick={(e) => handleRemoveComponent(e, component.id)}
                          className="p-1.5 bg-red-500/90 text-white rounded hover:bg-red-600 shadow-sm"
                          title={language === 'ko' ? "섹션 삭제" : "Remove Section"}
                      >
                          <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Visual */}
                    <div className={`
                      overflow-hidden rounded opacity-80 transition-opacity
                      ${activeComponentId === component.id ? 'opacity-100' : 'group-hover:opacity-90'}
                    `}>
                      {renderComponentVisual(component)}
                    </div>

                    {/* Inline Editor */}
                    {activeComponentId === component.id && (
                      <div className="mt-2 p-3 bg-slate-900/90 border-t border-indigo-500/30 backdrop-blur rounded-b-lg animate-fade-in">
                        <div className="flex items-start gap-3">
                            <Settings2 className="h-5 w-5 text-indigo-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-indigo-300 mb-1.5 uppercase">
                                  {language === 'ko' 
                                    ? `이 ${component.label} 섹션의 기능은 무엇인가요?` 
                                    : `What should this ${component.label} do?`
                                  }
                              </label>
                              <textarea 
                                  autoFocus
                                  className="w-full bg-slate-950 border border-slate-700 rounded-md p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[60px] resize-none font-mono"
                                  value={component.description}
                                  onChange={(e) => handleUpdateDescription(component.id, e.target.value)}
                                  placeholder={language === 'ko' 
                                    ? "구체적인 요구사항, 포함될 필드나 내용을 적어주세요..." 
                                    : "Describe specific requirements, fields, or content..."
                                  }
                              />
                            </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- CUSTOM MODE --- */}
        {mode === 'custom' && (
          <div className="flex-1 flex flex-col gap-6 animate-fade-in">
             <div className="bg-slate-900/50 border border-white/10 rounded-xl p-8 flex-1 flex flex-col">
                {/* File Upload Section */}
                <div className="mb-8">
                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-purple-400" />
                      {language === 'ko' ? '디자인 파일 업로드' : 'Upload Design Assets'}
                   </h3>
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        border-2 border-dashed rounded-xl transition-all cursor-pointer p-10 flex flex-col items-center justify-center text-center group
                        ${isDragging 
                            ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' 
                            : 'border-slate-700 bg-slate-950/50 hover:bg-slate-800/30 hover:border-purple-500/50'
                        }
                      `}
                   >
                      <input 
                         type="file" 
                         multiple 
                         className="hidden" 
                         ref={fileInputRef} 
                         onChange={handleFileUpload} 
                      />
                      <div className={`
                        h-16 w-16 rounded-full border flex items-center justify-center mb-4 transition-transform
                        ${isDragging ? 'bg-purple-500/20 border-purple-500 scale-110' : 'bg-slate-900 border-slate-800 group-hover:scale-110'}
                      `}>
                         <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'}`} />
                      </div>
                      <p className={`font-medium mb-1 transition-colors ${isDragging ? 'text-purple-300' : 'text-slate-300'}`}>
                         {isDragging 
                            ? (language === 'ko' ? '파일을 여기에 놓으세요' : 'Drop files here')
                            : (language === 'ko' ? '파일을 클릭하거나 드래그하여 업로드하세요' : 'Click or drag files to upload')
                         }
                      </p>
                      <p className="text-sm text-slate-500">
                         PNG, JPG, PDF, Figma exports
                      </p>
                   </div>

                   {/* File List */}
                   {view.customFiles && view.customFiles.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {view.customFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                               <div className="h-10 w-10 rounded bg-slate-900 flex items-center justify-center flex-shrink-0">
                                  {file.type.includes('image') ? (
                                     <ImageIcon className="h-5 w-5 text-blue-400" />
                                  ) : (
                                     <FileText className="h-5 w-5 text-slate-400" />
                                  )}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">{file.name}</div>
                                  <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                               </div>
                               <button 
                                  onClick={() => handleRemoveFile(index)}
                                  className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"
                               >
                                  <X className="h-4 w-4" />
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* Requirements Text Area */}
                <div className="flex-1 flex flex-col">
                   <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <AlignJustify className="h-5 w-5 text-purple-400" />
                      {language === 'ko' ? '상세 요구사항' : 'Detailed Requirements'}
                   </h3>
                   <div className="flex-1 relative">
                      <textarea 
                         className="w-full h-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none font-mono"
                         placeholder={language === 'ko' 
                            ? "이 페이지에 대한 구체적인 기능, 디자인 스타일, 애니메이션 효과 등을 자유롭게 작성해주세요..." 
                            : "Describe specific functionality, design styles, animations, etc..."
                         }
                         value={view.customDescription || ''}
                         onChange={handleCustomDescriptionChange}
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-500 pointer-events-none">
                         Markdown Supported
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Right Palette (Sidebar) - Only visible in Wireframe Mode */}
      {mode === 'wireframe' && (
        <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900 border-l border-white/10 h-full animate-fade-in">
          <div className="p-4 border-b border-white/10 bg-slate-900/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                  <Layout className="h-4 w-4 text-indigo-400" />
                  {language === 'ko' ? 'UI 컴포넌트' : 'UI Components'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ko' ? '드래그하거나 클릭하여 추가하세요' : 'Drag or click to add sections'}
              </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {palette.map((item) => (
                  <button
                      key={item.type}
                      onClick={() => handleAddComponent(item.type, item.label, item.defaultDesc)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-indigo-900/20 hover:border-indigo-500/40 transition-all group text-left hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                      <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                          <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{item.label}</div>
                          <div className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
                            {language === 'ko' ? '추가하기' : 'Add to layout'}
                          </div>
                      </div>
                      <Plus className="h-4 w-4 ml-auto text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
              ))}
          </div>
        </div>
      )}

      {/* Info Panel for Custom Mode */}
      {mode === 'custom' && (
         <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900 border-l border-white/10 h-full p-6 animate-fade-in">
            <div className="mb-6">
               <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-purple-400" />
               </div>
               <h3 className="font-semibold text-white mb-2">
                  {language === 'ko' ? '사용자 맞춤 제작' : 'Custom Implementation'}
               </h3>
               <p className="text-sm text-slate-400 leading-relaxed">
                  {language === 'ko' 
                     ? '업로드된 디자인 파일과 요구사항을 바탕으로 AI가 코드를 작성합니다. 와이어프레임 구조 대신 제공된 자료를 최우선으로 반영합니다.' 
                     : 'AI will generate code based on your uploaded assets and instructions, prioritizing them over wireframe structures.'
                  }
               </p>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
               <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                     <p className="text-xs text-yellow-200 font-medium mb-1">
                        {language === 'ko' ? '팁' : 'Tip'}
                     </p>
                     <p className="text-xs text-yellow-500/80 leading-relaxed">
                        {language === 'ko'
                           ? '상세한 설명을 작성할수록 더 정확한 결과를 얻을 수 있습니다.'
                           : 'More detailed descriptions yield more accurate results.'
                        }
                     </p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default WireframeBuilder;
