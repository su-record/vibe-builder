
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectForm from './components/ProjectForm';
import Sidebar from './components/Sidebar';
import WireframeBuilder from './components/WireframeBuilder';
import ReviewFeedback from './components/ReviewFeedback';
import TechStackSelect from './components/TechStackSelect'; // Kept for type safety if needed, though step removed in logic
import ResultViewer from './components/ResultViewer';
import { ProjectData, AppStep, View, WireframeComponent, Language, BuildResult, TechStack } from './types';
import { Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INIT);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('ko');
  
  // New States for Workflow
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [techStack, setTechStack] = useState<TechStack | null>(null);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);

  // Updated to use the latest pro model for better reasoning and coding capabilities
  const model = "gemini-3-pro-preview";

  // Helper to get AI instance with current key
  const getAI = () => {
    // Support both AI Studio (process.env) and Local Vite (import.meta.env)
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GOOGLE_API_KEY;
    return new GoogleGenAI({ apiKey });
  };

  // Helper to convert File to Gemini InlineData
  const fileToGenerativePart = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Initial Route Generation
  const generateViews = async (data: ProjectData) => {
    try {
      const ai = getAI();
      
      // Common context
      const context = `Project Name: ${data.name}\nDescription: ${data.description}`;
      
      // Strict Language Instruction
      const langInstruction = language === 'ko' 
        ? "모든 결과값(name, description)은 반드시 **한국어**로 작성하세요."
        : "All output values (name, description) MUST be in **English**, even if the project description provided above is in Korean or another language.";

      const prompt = `
        ${context}
        
        Act as a senior web architect. Based on the project description, generate a list of 4 to 8 essential page views (routes).
        
        IMPORTANT RULES:
        1. If the app requires user accounts, include 'Login' and 'Sign Up' pages.
        2. Include a 'Dashboard' or main landing view after login if applicable.
        3. ${langInstruction}
        4. For each view, provide:
           - name: Display name (e.g., 'Home', '로그인')
           - route: URL path starting with / (e.g., '/login')
           - description: Brief purpose of the page.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              views: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Display name in the target language" },
                    route: { type: Type.STRING, description: "URL path" },
                    description: { type: Type.STRING, description: "Purpose of this page in the target language" },
                  },
                  required: ["name", "route", "description"]
                }
              }
            }
          }
        }
      });

      const jsonResponse = JSON.parse(response.text || '{"views": []}');
      
      const viewsWithIds: View[] = jsonResponse.views.map((v: any) => ({
        ...v,
        id: crypto.randomUUID()
      }));

      // Fallback
      if (viewsWithIds.length === 0) {
        if (language === 'ko') {
           viewsWithIds.push(
            { id: crypto.randomUUID(), name: "홈", route: "/", description: "메인 랜딩 페이지" },
            { id: crypto.randomUUID(), name: "로그인", route: "/login", description: "사용자 인증 및 로그인" }
          );
        } else {
           viewsWithIds.push(
            { id: crypto.randomUUID(), name: "Home", route: "/", description: "Main landing page" },
            { id: crypto.randomUUID(), name: "Login", route: "/login", description: "User authentication" }
          );
        }
      }

      setViews(viewsWithIds);
      if (viewsWithIds.length > 0) {
        setActiveViewId(viewsWithIds[0].id);
      }
      setStep(AppStep.BUILDER);

    } catch (error) {
      console.error("Error generating views:", error);
      const fallbackViews = language === 'ko' 
        ? [
            { id: crypto.randomUUID(), name: "홈", route: "/", description: "메인 랜딩 페이지" },
            { id: crypto.randomUUID(), name: "로그인", route: "/login", description: "사용자 인증 및 로그인" }
          ]
        : [
            { id: crypto.randomUUID(), name: "Home", route: "/", description: "Main landing page" },
            { id: crypto.randomUUID(), name: "Login", route: "/login", description: "User authentication" }
          ];
      setViews(fallbackViews);
      setActiveViewId(fallbackViews[0].id);
      setStep(AppStep.BUILDER);
    }
  };

  // Generate Layout Blueprint for a specific view
  const generateLayoutBlueprint = async (view: View) => {
    if (view.layout || view.isGeneratingLayout || view.mode === 'custom') return;

    setViews(prev => prev.map(v => v.id === view.id ? { ...v, isGeneratingLayout: true } : v));

    try {
      const ai = getAI();
      
      const langInstruction = language === 'ko' 
        ? "각 블록의 라벨(Label)과 설명(Description)은 반드시 **한국어**로 작성하세요."
        : "Labels and descriptions MUST be in **English**, translating from the input context if necessary.";

      const prompt = `
        Page Name: ${view.name}
        Route: ${view.route}
        Description: ${view.description}
        Project Context: ${projectData?.name} - ${projectData?.description}

        Generate a UI wireframe blueprint for this specific page. 
        Return a list of ordered components that should appear on this page vertically.
        
        Available Component Types: 'header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'.
        
        ${langInstruction}
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              layout: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'] },
                    label: { type: Type.STRING, description: "Short label" },
                    description: { type: Type.STRING, description: "Specific details" },
                  },
                  required: ["type", "label", "description"]
                }
              }
            }
          }
        }
      });

      const jsonResponse = JSON.parse(response.text || '{"layout": []}');
      const layoutComponents: WireframeComponent[] = jsonResponse.layout.map((c: any) => ({
        ...c,
        id: crypto.randomUUID()
      }));

      setViews(prev => prev.map(v => 
        v.id === view.id ? { ...v, layout: layoutComponents, isGeneratingLayout: false } : v
      ));

    } catch (error) {
      console.error("Error generating layout:", error);
      setViews(prev => prev.map(v => 
        v.id === view.id ? { ...v, layout: [], isGeneratingLayout: false } : v
      ));
    }
  };

  // NEW: Refine Layout based on User Instruction
  const handleRefineLayout = async (viewId: string, instruction: string) => {
    const view = views.find(v => v.id === viewId);
    if (!view || !view.layout) return;

    setViews(prev => prev.map(v => v.id === viewId ? { ...v, isGeneratingLayout: true } : v));

    try {
      const ai = getAI();
      const currentLayoutJson = JSON.stringify(view.layout.map(({ type, label, description }) => ({ type, label, description })));
      
      const langInstruction = language === 'ko' 
        ? "결과는 한국어로 작성하세요."
        : "Output MUST be in English.";

      const prompt = `
        Current Page: ${view.name}
        Current Layout: ${currentLayoutJson}
        
        User Instruction: "${instruction}"
        
        Modify the layout based on the user instruction.
        You can add, remove, reorder components, or update descriptions.
        
        Available Component Types: 'header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'.
        
        ${langInstruction}
        Return the complete updated layout list.
      `;

        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                layout: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, enum: ['header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'] },
                      label: { type: Type.STRING, description: "Short label" },
                      description: { type: Type.STRING, description: "Specific details" },
                    },
                    required: ["type", "label", "description"]
                  }
                }
              }
            }
          }
        });

        const jsonResponse = JSON.parse(response.text || '{"layout": []}');
        const layoutComponents: WireframeComponent[] = jsonResponse.layout.map((c: any) => ({
          ...c,
          id: crypto.randomUUID()
        }));

        setViews(prev => prev.map(v => 
          v.id === viewId ? { ...v, layout: layoutComponents, isGeneratingLayout: false } : v
        ));

    } catch (error) {
      console.error("Error refining layout:", error);
      setViews(prev => prev.map(v => 
        v.id === viewId ? { ...v, isGeneratingLayout: false } : v
      ));
    }
  };


  // 1. Review Process
  const handleGenerateReview = async () => {
    setStep(AppStep.REVIEWING);
    try {
      const ai = getAI();
      // Serialize view data for AI analysis
      const projectSummary = JSON.stringify({
         project: projectData,
         views: views.map(v => ({
            name: v.name,
            route: v.route,
            description: v.description,
            mode: v.mode || 'wireframe',
            components: v.layout?.map(l => l.label) || [],
            customRequirements: v.customDescription
         }))
      });

      const langInstruction = language === 'ko'
        ? "반드시 한국어로 답변하세요. 마크다운 형식이 아닌 일반 텍스트로 작성하세요."
        : "Respond in English. Provide plain text response.";

      const prompt = `
        Act as a Senior PM/Architect. Review this project structure:
        ${projectSummary}

        1. Check for missing essential pages based on description (e.g., Forgot Password, Settings, Profile).
        2. Check if the flow is logical.
        3. Provide a feedback summary pointing out what needs improvement.
        4. If perfect, give a thumbs up.
        
        ${langInstruction}
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      setReviewFeedback(response.text || "Review completed.");
      setStep(AppStep.REVIEW_FEEDBACK);

    } catch (error) {
      console.error("Review Error:", error);
      setReviewFeedback(language === 'ko' ? "검토 중 오류가 발생했습니다. 다시 시도해주세요." : "Error during review. Please try again.");
      setStep(AppStep.REVIEW_FEEDBACK);
    }
  };

  // 1.5 Apply Improvements logic
  const handleApplyImprovements = async () => {
    setStep(AppStep.GENERATING_VIEWS); // Re-use generating views loading state
    try {
      const ai = getAI();
      const currentViewsSummary = JSON.stringify(views.map(v => ({
        name: v.name,
        route: v.route,
        description: v.description
      })));

      const langInstruction = language === 'ko'
        ? "결과는 JSON 형식이어야 하며, 페이지 이름과 설명은 한국어로 작성하세요."
        : "Output MUST be JSON. Page names and descriptions MUST be in English.";

      const prompt = `
        Current Views: ${currentViewsSummary}
        Feedback: ${reviewFeedback}

        Based on the feedback, generate a COMPLETE list of views by adding any missing pages (e.g., Forgot Password, Settings) to the current list.
        DO NOT remove any existing views.
        Ensure new views have appropriate names and routes.
        
        ${langInstruction}
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              views: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    route: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "route", "description"]
                }
              }
            }
          }
        }
      });

      const jsonResponse = JSON.parse(response.text || '{"views": []}');
      const newViewList = jsonResponse.views || [];

      // Merge Logic: Keep existing views (to preserve layout/custom work), add new ones
      const updatedViews = [...views];
      
      newViewList.forEach((nv: any) => {
        // Check if route already exists
        const exists = views.some(ev => ev.route === nv.route || ev.name === nv.name);
        if (!exists) {
          updatedViews.push({
            id: crypto.randomUUID(),
            name: nv.name,
            route: nv.route,
            description: nv.description
          });
        }
      });

      setViews(updatedViews);
      setStep(AppStep.BUILDER); // Go back to builder

    } catch (error) {
      console.error("Apply Improvements Error:", error);
      // Fallback: just go back to builder without changes if error
      setStep(AppStep.BUILDER);
    }
  };

  // 2. Final Code Generation (Multimodal)
  const handleFinalGeneration = async (stack: TechStack) => {
    setTechStack(stack);
    setStep(AppStep.GENERATING_CODE);

    try {
      const ai = getAI();
      // 1. Prepare Image Parts from Custom Uploads
      const imageParts: any[] = [];
      const viewsWithFiles = views.filter(v => v.customFiles && v.customFiles.length > 0);

      for (const view of viewsWithFiles) {
        if (view.customFiles) {
          for (const file of view.customFiles) {
            if (file.type.startsWith('image/')) {
              try {
                const part = await fileToGenerativePart(file);
                imageParts.push(part);
              } catch (err) {
                console.warn(`Failed to process image ${file.name}`);
              }
            }
          }
        }
      }

      // Serialize all pages info
      const allPagesSummary = JSON.stringify(views.map(v => ({
         name: v.name,
         route: v.route,
         layout: v.layout?.map(l => `${l.type} - ${l.description}`).join(', ') || 'Custom Design',
         customRequirements: v.customDescription,
         hasUploadedImages: !!(v.customFiles && v.customFiles.length > 0)
      })));

      const langConstraint = language === 'ko'
        ? "UI 텍스트, 주석, 그리고 API 문서는 반드시 한국어로 작성되어야 합니다."
        : "UI text, comments, and API documentation MUST be in English. TRANSLATE any Korean input to English.";

      const promptText = `
          Project: ${projectData?.name}
          Tech Stack: Backend=${stack.backend}, Database=${stack.database}
          Frontend: React + TypeScript + Tailwind + Vite (Strict Constraint)

          *** IMPORTANT: Multimodal Vision References ***
          I have attached ${imageParts.length} reference images to this request.
          These are user-uploaded designs or sketches.
          Analyze the visual elements (layout, color, structure) of these images.
          Infer which page (e.g., Login, Dashboard) each image corresponds to.
          **PRIORITIZE the visual design from the images over the text wireframes.**
          
          *** LANGUAGE CONSTRAINT ***
          ${langConstraint}

          Generate a JSON response with these 4 fields:
          
          1. pages: Generate code for **EACH** of the following pages:
             Page List: ${allPagesSummary}
             - For each page, provide:
               a. componentName: PascalCase name (e.g. UserDashboard)
               b. tsxCode: Real React Functional Component code.
                  - **IMPORTANT**: DO NOT use Next.js features (next/link, next/navigation, etc.).
                  - Use 'react-router-dom' (Link, useNavigate) instead.
                  - Use Tailwind CSS for modern design.
               c. previewHtml: Standalone HTML file. IMPORTANT: You MUST include <script src="https://cdn.tailwindcss.com"></script> in the <head> tag for styling.

          2. apiSpec: Complete API specification in **OpenAPI 3.0 JSON** format.
          3. sqlSchema: CREATE TABLE SQL schema for ${stack.database}.
          4. erdMermaid: Mermaid.js diagram code for the ERD.
      `;

      // Construct Multimodal Content
      const contents = [
        ...imageParts,
        { text: promptText }
      ];

      const response = await ai.models.generateContent({
        model: model,
        contents: contents, // Sending images + text
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    route: { type: Type.STRING },
                    componentName: { type: Type.STRING },
                    tsxCode: { type: Type.STRING },
                    previewHtml: { type: Type.STRING }
                  },
                  required: ["name", "route", "componentName", "tsxCode", "previewHtml"]
                }
              },
              apiSpec: { type: Type.STRING },
              sqlSchema: { type: Type.STRING },
              erdMermaid: { type: Type.STRING }
            },
            required: ["pages", "apiSpec", "sqlSchema", "erdMermaid"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setBuildResult(result);
      setStep(AppStep.COMPLETED);

    } catch (error) {
      console.error("Generation Error:", error);
      // Fallback mock
      setBuildResult({
         pages: [{ 
            name: "Error", 
            route: "/error", 
            componentName: "ErrorPage",
            tsxCode: "export default function ErrorPage() { return <div>Error generating code. Please check console.</div> }",
            previewHtml: '<h1 class="text-center mt-10 text-red-500">Error generating code. Please try again.</h1>' 
         }],
         apiSpec: '{"info": {"title": "Error", "version": "1.0.0"}}',
         sqlSchema: '-- Error generating SQL',
         erdMermaid: 'graph TD; A[Error] --> B[Retry]'
      });
      setStep(AppStep.COMPLETED);
    }
  };


  useEffect(() => {
    if (step === AppStep.BUILDER && activeViewId) {
      const activeView = views.find(v => v.id === activeViewId);
      if (activeView && !activeView.layout && !activeView.isGeneratingLayout && (!activeView.mode || activeView.mode === 'wireframe')) {
        generateLayoutBlueprint(activeView);
      }
    }
  }, [activeViewId, step, views]);


  const handleProjectSubmit = (data: ProjectData) => {
    setProjectData(data);
    setStep(AppStep.GENERATING_VIEWS);
    generateViews(data);
  };

  const handleAddView = () => {
    const newView: View = {
      id: crypto.randomUUID(),
      name: language === 'ko' ? "새 페이지" : "New Page",
      route: "/new-page",
      description: language === 'ko' ? "새로운 빈 페이지" : "A new blank page"
    };
    setViews(prev => [...prev, newView]);
    setActiveViewId(newView.id);
  };

  const handleRemoveView = (id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
    if (activeViewId === id) {
      setActiveViewId(null);
    }
  };

  const handleUpdateView = (id: string, updates: Partial<View>) => {
    setViews(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const handleUpdateLayout = (viewId: string, layout: WireframeComponent[]) => {
    setViews(prev => prev.map(v => v.id === viewId ? { ...v, layout } : v));
  };

  const renderContent = () => {
    const loadingMessage = (title: string, desc: string) => (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center animate-fade-in">
         <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
            <Loader2 className="h-16 w-16 animate-spin text-indigo-500 relative z-10" />
         </div>
         <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
         <p className="text-slate-400 max-w-md">{desc}</p>
      </div>
    );

    switch (step) {
      case AppStep.INIT:
        return (
          <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
            <ProjectForm onSubmit={handleProjectSubmit} />
          </div>
        );
      
      case AppStep.GENERATING_VIEWS:
        return loadingMessage(
           language === 'ko' ? '앱 구조 설계 중...' : 'Architecting your App',
           language === 'ko' 
             ? `AI가 "${projectData?.name}" 프로젝트를 분석하고, 필요한 라우트를 정의하고 있습니다...`
             : `AI is analyzing "${projectData?.name}", defining routes, and including essential auth pages...`
        );

      case AppStep.BUILDER:
        const activeView = views.find(v => v.id === activeViewId);
        return (
          <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
            <Sidebar 
                views={views}
                activeViewId={activeViewId}
                onSelectView={setActiveViewId}
                onAddView={handleAddView}
                onRemoveView={handleRemoveView}
                onUpdateView={handleUpdateView}
                onGenerateCode={handleGenerateReview}
                language={language}
            />
            <main className="flex-1 bg-slate-950/30 p-8 overflow-hidden relative flex flex-col">
                {activeView ? (
                    <WireframeBuilder 
                        view={activeView}
                        onUpdateLayout={handleUpdateLayout}
                        onUpdateView={handleUpdateView}
                        onRefine={handleRefineLayout}
                        isGenerating={activeView.isGeneratingLayout || false}
                        language={language}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        {language === 'ko' ? '사이드바에서 페이지를 선택하여 빌드를 시작하세요.' : 'Select a view from the sidebar to start building.'}
                    </div>
                )}
            </main>
          </div>
        );
      
      case AppStep.REVIEWING:
        return loadingMessage(
           language === 'ko' ? '프로젝트 검토 중...' : 'Reviewing Project...',
           language === 'ko' 
             ? 'AI가 누락된 페이지나 요구사항을 검토하고 있습니다.' // Removed "logic"
             : 'AI is checking for missing pages or requirements.'
        );

      case AppStep.REVIEW_FEEDBACK:
        return (
          <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
             <ReviewFeedback 
                feedback={reviewFeedback}
                onApply={handleApplyImprovements} // Changed handler
                onProceed={() => setStep(AppStep.STACK_SELECTION)}
                language={language}
             />
          </div>
        );
      
      case AppStep.STACK_SELECTION:
         return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
               <TechStackSelect 
                  onSelect={handleFinalGeneration}
                  language={language}
               />
            </div>
         );

      case AppStep.GENERATING_CODE:
         return loadingMessage(
            language === 'ko' ? '최종 코드 생성 중...' : 'Generating Codebase...',
            language === 'ko'
               ? `요구사항과 업로드된 이미지를 반영하여 코드를 작성하고 있습니다...` // Updated text
               : `Writing code based on requirements and uploaded visuals...`
         );

      case AppStep.COMPLETED:
         return (buildResult && projectData && techStack) ? (
            <div className="h-[calc(100vh-64px)] animate-fade-in">
               <ResultViewer 
                  result={buildResult} 
                  language={language}
                  projectData={projectData}
                  techStack={techStack}
                  views={views}
                  reviewFeedback={reviewFeedback}
               />
            </div>
         ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px]" />
      </div>

      <Header language={language} setLanguage={setLanguage} />
      
      <div className="relative z-10 flex-1 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
