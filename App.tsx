

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProjectForm from './components/ProjectForm';
import Sidebar from './components/Sidebar';
import WireframeBuilder from './components/WireframeBuilder';
import ReviewFeedback from './components/ReviewFeedback';
import TechStackSelect from './components/TechStackSelect';
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Updated to use the latest pro model for better reasoning and coding capabilities
  const model = "gemini-3-pro-preview";

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
      const prompt = language === 'ko' 
        ? `
          프로젝트 이름: ${data.name}
          설명: ${data.description}
          
          시니어 웹 아키텍트로서 행동하세요. 프로젝트 설명을 바탕으로 4~8개의 필수 페이지 뷰(라우트) 목록을 생성해주세요.
          
          중요 규칙:
          1. 사용자 계정이 필요한 앱이라면(대부분 그렇듯), 반드시 '로그인(Login)'과 '회원가입(Sign Up)' 페이지를 포함하세요.
          2. 로그인 후 이동할 '대시보드(Dashboard)'나 메인 랜딩 뷰를 포함하세요.
          3. 각 뷰에 대해 한국어 표시 이름(Display Name), 라우트 경로(/로 시작), 그리고 짧은 설명을 제공하세요.
          4. 응답은 반드시 한국어로 작성해주세요.
        `
        : `
          Project Name: ${data.name}
          Description: ${data.description}
          
          Act as a senior web architect. Based on the project description, generate a list of 4 to 8 essential page views (routes).
          
          IMPORTANT RULES:
          1. If the app requires user accounts (which most do), YOU MUST include 'Login' and 'Sign Up' pages.
          2. Include a 'Dashboard' or main landing view after login if applicable.
          3. For each view, provide a display name, a route path (starting with /), and a brief description.
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
                    name: { type: Type.STRING, description: "Display name (e.g., 로그인, 대시보드)" },
                    route: { type: Type.STRING, description: "URL path (e.g., /login)" },
                    description: { type: Type.STRING, description: "Purpose of this page" },
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
      const prompt = language === 'ko'
        ? `
          페이지 이름: ${view.name}
          경로: ${view.route}
          설명: ${view.description}
          프로젝트 컨텍스트: ${projectData?.name} - ${projectData?.description}

          이 특정 페이지를 위한 UI 와이어프레임 청사진(Blueprint)을 생성하세요.
          이 페이지에 수직으로 배치되어야 할 컴포넌트 목록을 순서대로 반환하세요.
          
          사용 가능한 컴포넌트 타입: 'header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'.
          
          각 블록의 라벨(Label)과 구체적인 설명(Description)은 반드시 **한국어**로 작성하세요.
        `
        : `
          Page Name: ${view.name}
          Route: ${view.route}
          Description: ${view.description}
          Project Context: ${projectData?.name} - ${projectData?.description}

          Generate a UI wireframe blueprint for this specific page. 
          Return a list of ordered components that should appear on this page vertically.
          
          Available Component Types: 'header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'.
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
      const currentLayoutJson = JSON.stringify(view.layout.map(({ type, label, description }) => ({ type, label, description })));
      
      const prompt = language === 'ko'
        ? `
          현재 페이지 이름: ${view.name}
          현재 레이아웃 구조: ${currentLayoutJson}
          
          사용자 수정 요청: "${instruction}"
          
          위 사용자 요청을 반영하여 레이아웃을 수정해주세요.
          필요하다면 컴포넌트를 추가, 삭제, 순서 변경하거나, 설명(description)을 수정하세요.
          
          사용 가능한 컴포넌트 타입: 'header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'.
          
          결과는 전체 레이아웃 리스트로 반환해야 합니다. 설명은 한국어로 작성하세요.
        `
        : `
          Current Page: ${view.name}
          Current Layout: ${currentLayoutJson}
          
          User Instruction: "${instruction}"
          
          Modify the layout based on the user instruction.
          You can add, remove, reorder components, or update descriptions.
          
          Available Component Types: 'header', 'hero', 'feature', 'form', 'list', 'content', 'gallery', 'cta', 'footer', 'sidebar'.
          
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

      const prompt = language === 'ko'
        ? `
          당신은 까다로운 시니어 PM이자 아키텍트입니다. 다음 프로젝트 구성을 검토해주세요:
          ${projectSummary}

          1. 프로젝트 설명에 비해 누락된 필수 페이지(예: 비밀번호 찾기, 설정, 마이페이지 등)가 있는지 확인하세요.
          2. 페이지 간의 흐름이 논리적인지 확인하세요.
          3. 사용자에게 보완해야 할 점을 **친절하지만 날카롭게** 지적하는 피드백 요약문을 작성하세요.
          4. 만약 완벽하다면 칭찬과 함께 진행해도 좋다고 말해주세요.
          
          답변은 마크다운 형식이 아닌 일반 줄바꿈 텍스트로 작성해주세요.
        `
        : `
          Act as a Senior PM/Architect. Review this project structure:
          ${projectSummary}

          1. Check for missing essential pages based on description (e.g., Forgot Password, Settings, Profile).
          2. Check if the flow is logical.
          3. Provide a feedback summary pointing out what needs improvement.
          4. If perfect, give a thumbs up.
          
          Provide plain text response.
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
      const currentViewsSummary = JSON.stringify(views.map(v => ({
        name: v.name,
        route: v.route,
        description: v.description
      })));

      const prompt = language === 'ko' 
        ? `
          현재 뷰 목록: ${currentViewsSummary}
          피드백: ${reviewFeedback}

          위 피드백 내용을 바탕으로, 기존 뷰 목록에 누락된 페이지(예: 비밀번호 찾기, 설정 등)를 추가하여 **완전한 뷰 목록**을 새로 생성하세요.
          기존에 존재하던 뷰는 절대 삭제하지 말고 그대로 포함해야 합니다.
          새로 추가되는 뷰는 적절한 이름과 라우트 경로를 가져야 합니다.
          JSON 형식으로 반환하세요.
        `
        : `
          Current Views: ${currentViewsSummary}
          Feedback: ${reviewFeedback}

          Based on the feedback, generate a COMPLETE list of views by adding any missing pages (e.g., Forgot Password, Settings) to the current list.
          DO NOT remove any existing views.
          Ensure new views have appropriate names and routes.
          Return as JSON.
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

      const promptText = language === 'ko' 
        ? `
          프로젝트: ${projectData?.name}
          기술 스택: Backend=${stack.backend}, Database=${stack.database}
          Frontend: React + TypeScript + Tailwind + Vite (Strict Constraint)

          *** 중요: 멀티모달 이미지 참조 ***
          이 요청에는 ${imageParts.length}개의 참조 이미지가 포함되어 있습니다.
          이미지는 사용자가 업로드한 디자인 시안 또는 스케치입니다.
          AI는 이 이미지들의 시각적 요소(레이아웃, 색상, 배치)를 분석하여, 
          해당 이미지가 어떤 페이지(예: 로그인, 대시보드 등)에 해당하는지 추론하고,
          **텍스트 와이어프레임보다 이미지의 디자인을 최우선으로 반영하여 코드를 생성해야 합니다.**

          다음 4가지 결과물을 포함한 JSON을 생성하세요:
          
          1. pages: 다음 목록에 있는 **모든 페이지**에 대해 코드를 생성합니다.
             페이지 목록: ${allPagesSummary}
             - 각 페이지마다 두 가지 버전을 생성해야 합니다:
               a. componentName: PascalCase 컴포넌트 이름 (예: UserDashboard)
               b. tsxCode: 실제 React Function Component 코드.
                  - **중요**: Next.js 기능(next/link, next/navigation, next/image 등)을 절대 사용하지 마세요.
                  - 대신 'react-router-dom'의 Link, useNavigate 등을 사용하세요.
                  - Tailwind CSS로 세련된 디자인을 적용하세요.
               c. previewHtml: 브라우저에서 바로 볼 수 있는 단독 실행 가능한 HTML 파일 코드 (Tailwind CDN 포함).
             
          2. apiSpec: **OpenAPI 3.0 JSON** 포맷으로 작성된 완전한 API 명세서.
          3. sqlSchema: 선택한 DB(${stack.database})에 맞는 CREATE TABLE SQL 스키마.
          4. erdMermaid: 데이터베이스 구조를 표현하는 Mermaid.js 다이어그램 코드.
        `
        : `
          Project: ${projectData?.name}
          Tech Stack: Backend=${stack.backend}, Database=${stack.database}
          Frontend: React + TypeScript + Tailwind + Vite (Strict Constraint)

          *** IMPORTANT: Multimodal Vision References ***
          I have attached ${imageParts.length} reference images to this request.
          These are user-uploaded designs or sketches.
          Analyze the visual elements (layout, color, structure) of these images.
          Infer which page (e.g., Login, Dashboard) each image corresponds to.
          **PRIORITIZE the visual design from the images over the text wireframes.**

          Generate a JSON response with these 4 fields:
          
          1. pages: Generate code for **EACH** of the following pages:
             Page List: ${allPagesSummary}
             - For each page, provide:
               a. componentName: PascalCase name (e.g. UserDashboard)
               b. tsxCode: Real React Functional Component code.
                  - **IMPORTANT**: DO NOT use Next.js features (next/link, next/navigation, etc.).
                  - Use 'react-router-dom' (Link, useNavigate) instead.
                  - Use Tailwind CSS for modern design.
               c. previewHtml: Standalone HTML with Tailwind CDN for immediate preview.

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
