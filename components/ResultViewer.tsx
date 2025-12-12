
import React, { useState, useEffect, useRef } from 'react';
import { BuildResult, Language, ProjectData, TechStack, View } from '../types';
import { Eye, FileText, Database, GitBranch, Github, UploadCloud, X, Loader2, CheckCircle2, ChevronDown, ChevronRight, AlertTriangle, Monitor, AlertCircle, Download, Package, Map } from 'lucide-react';
import mermaid from 'mermaid';
import JSZip from 'jszip';
import RoadmapModal from './RoadmapModal';

interface ResultViewerProps {
  result: BuildResult;
  projectData: ProjectData;
  techStack: TechStack;
  views: View[];
  reviewFeedback: string;
  language?: Language;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ 
  result, 
  projectData, 
  techStack, 
  views, 
  reviewFeedback, 
  language = 'ko' 
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'api' | 'sql' | 'erd'>('preview');
  
  // Preview State
  const [activePreviewPage, setActivePreviewPage] = useState(result.pages[0]);

  // Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTokenGuide, setShowTokenGuide] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [branch, setBranch] = useState('main');
  
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [pushLog, setPushLog] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Zip State
  const [isZipping, setIsZipping] = useState(false);

  // Roadmap Modal State
  const [showRoadmap, setShowRoadmap] = useState(false);

  const mermaidRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'api', label: 'API Specs', icon: FileText },
    { id: 'sql', label: 'SQL Schema', icon: Database },
    { id: 'erd', label: 'ERD', icon: GitBranch },
  ] as const;

  useEffect(() => {
    if (activeTab === 'erd' && result.erdMermaid) {
      mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      const renderMermaid = async () => {
        if (mermaidRef.current) {
          try {
            mermaidRef.current.innerHTML = ''; // Clear previous
            const id = 'mermaid-chart-' + crypto.randomUUID();
            const { svg } = await mermaid.render(id, result.erdMermaid);
            if (mermaidRef.current) {
               mermaidRef.current.innerHTML = svg;
            }
          } catch (error) {
            console.error('Mermaid render error:', error);
            if (mermaidRef.current) {
               mermaidRef.current.innerHTML = '<div class="text-red-400 p-4">Failed to render diagram</div>';
            }
          }
        }
      };
      renderMermaid();
    }
  }, [activeTab, result.erdMermaid]);

  const getContent = () => {
    switch (activeTab) {
      case 'preview': return activePreviewPage.previewHtml; // Use previewHtml for visual
      case 'api': return result.apiSpec;
      case 'sql': return result.sqlSchema;
      case 'erd': return result.erdMermaid;
      default: return '';
    }
  };

  // Helper to ensure Tailwind CSS is present in the preview
  const getPreviewHtml = (html: string) => {
    if (!html) return '';
    // If specifically missing the CDN
    if (!html.includes('cdn.tailwindcss.com')) {
      const script = '<script src="https://cdn.tailwindcss.com"></script>';
      // Inject into head if it exists
      if (html.includes('<head>')) {
        return html.replace('<head>', `<head>${script}`);
      }
      // Otherwise prepend
      return `${script}${html}`;
    }
    return html;
  };

  // Helper: Generate Project Structure for GitHub/Zip
  const generateFiles = () => {
    const files: { path: string, content: string, mode?: '100644' | '100755' }[] = [];

    // --- FRONTEND (React + Vite + Tailwind) ---
    // 1. Package.json
    files.push({
      path: 'frontend/package.json',
      content: JSON.stringify({
        name: projectData.name.toLowerCase().replace(/\s+/g, '-'),
        version: "0.0.1",
        type: "module",
        scripts: {
          "dev": "vite",
          "build": "tsc && vite build",
          "preview": "vite preview"
        },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router-dom": "^6.14.0",
          "lucide-react": "^0.263.1",
          "clsx": "^2.0.0",
          "tailwind-merge": "^1.14.0"
        },
        devDependencies: {
          "@types/react": "^18.2.15",
          "@types/react-dom": "^18.2.7",
          "@vitejs/plugin-react": "^4.0.3",
          "autoprefixer": "^10.4.14",
          "postcss": "^8.4.27",
          "tailwindcss": "^3.3.3",
          "typescript": "^5.0.2",
          "vite": "^4.4.5"
        }
      }, null, 2)
    });

    // 2. Config files
    files.push({
      path: 'frontend/vite.config.ts',
      content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});`
    });
    files.push({
      path: 'frontend/tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }]
      }, null, 2)
    });
    files.push({
       path: 'frontend/tsconfig.node.json',
       content: JSON.stringify({
         compilerOptions: {
           composite: true,
           skipLibCheck: true,
           module: "ESNext",
           moduleResolution: "bundler",
           allowSyntheticDefaultImports: true
         },
         include: ["vite.config.ts"]
       }, null, 2)
    });
    files.push({
      path: 'frontend/tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}`
    });
    files.push({
      path: 'frontend/postcss.config.js',
      content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`
    });

    // 3. Entry Points
    files.push({
      path: 'frontend/index.html',
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${projectData.name}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>`
    });
    files.push({
      path: 'frontend/src/index.css',
      content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml, body, #root {\n  height: 100%;\n}`
    });
    files.push({
      path: 'frontend/src/main.tsx',
      content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.tsx';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>, \n);`
    });

    // 4. Pages & App Router
    // Generate page files
    result.pages.forEach(page => {
      files.push({
        path: `frontend/src/pages/${page.componentName}.tsx`,
        content: page.tsxCode
      });
    });

    // Generate Router (App.tsx)
    const imports = result.pages.map(p => `import ${p.componentName} from './pages/${p.componentName}';`).join('\n');
    const routes = result.pages.map(p => `<Route path="${p.route}" element={<${p.componentName} />} />`).join('\n          ');
    
    files.push({
      path: 'frontend/src/App.tsx',
      content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';\n${imports}\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n          ${routes}\n      </Routes>\n    </BrowserRouter>\n  );\n}\n\nexport default App;`
    });

    // --- BACKEND ---
    // Boilerplate based on stack
    if (techStack.backend === 'nodejs') {
      files.push({
         path: 'backend/package.json',
         content: JSON.stringify({
            name: "backend-api",
            version: "1.0.0",
            main: "server.js",
            scripts: { "start": "node server.js", "dev": "nodemon server.js" },
            dependencies: { "express": "^4.18.2", "cors": "^2.8.5", "pg": "^8.11.0", "dotenv": "^16.3.1" },
            devDependencies: { "nodemon": "^3.0.1" }
         }, null, 2)
      });
      files.push({
         path: 'backend/server.js',
         content: `const express = require('express');\nconst cors = require('cors');\nconst app = express();\nconst port = process.env.PORT || 3001;\n\napp.use(cors());\napp.use(express.json());\n\n// TODO: Connect to ${techStack.database}\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Welcome to ${projectData.name} API' });\n});\n\napp.listen(port, () => {\n  console.log(\`Server running on port \${port}\`);\n});`
      });
    } else if (techStack.backend === 'python') {
       files.push({
          path: 'backend/requirements.txt',
          content: 'fastapi\nuvicorn\nsqlalchemy\npsycopg2-binary\n'
       });
       files.push({
          path: 'backend/main.py',
          content: `from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI(title="${projectData.name}")\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_methods=["*"],\n    allow_headers=["*"],\n)\n\n@app.get("/")\ndef read_root():\n    return {"message": "Welcome to ${projectData.name} API"}\n\nif __name__ == "__main__":\n    import uvicorn\n    uvicorn.run(app, host="0.0.0.0", port=3001)`
       });
    } else {
       files.push({
          path: 'backend/README.md',
          content: `# Backend\n\nTech Stack: ${techStack.backend}\n\nPlease initialize your ${techStack.backend} project here.`
       });
    }

    // --- DATABASE ---
    files.push({ path: 'database/schema.sql', content: result.sqlSchema });
    files.push({ path: 'database/erd.mmd', content: result.erdMermaid });

    // --- DOCS ---
    files.push({ path: 'docs/openapi.json', content: result.apiSpec });
    files.push({
      path: 'docs/project-requirements.md',
      content: `# ${projectData.name}\n\n${projectData.description}\n\n## Views\n${views.map(v => `- **${v.name}** (${v.route}): ${v.description}`).join('\n')}`
    });
    files.push({ path: 'docs/ai-review.md', content: reviewFeedback });

    // --- ROOT ---
    files.push({
      path: 'README.md',
      content: `# ${projectData.name}\n\nGenerated by Vibe Builder.\n\n## Project Structure\n- \`frontend/\`: React 18 + Vite + TypeScript + Tailwind CSS\n- \`backend/\`: ${techStack.backend} API server\n- \`database/\`: SQL schema and ERD\n- \`docs/\`: Documentation\n\n## Quick Start\nRun \`./setup.sh\` to install dependencies.`
    });
    
    // Setup Script
    const setupContent = `#!/bin/bash\n\n` +
      `echo "🚀 Setting up ${projectData.name}..."\n\n` +
      `echo "📦 Installing Frontend dependencies..."\n` +
      `cd frontend && npm install\ncd ..\n\n` +
      `echo "📦 Installing Backend dependencies..."\n` +
      `cd backend\n` +
      (techStack.backend === 'nodejs' ? `npm install\n` : '') +
      (techStack.backend === 'python' ? `pip install -r requirements.txt\n` : '') +
      `cd ..\n\n` +
      `echo "✅ Setup Complete! Run 'cd frontend && npm run dev' to launch the UI."`;
      
    files.push({
      path: 'setup.sh',
      content: setupContent,
      mode: '100755'
    });

    return files;
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const files = generateFiles();

      files.forEach(file => {
        zip.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectData.name.toLowerCase().replace(/\s+/g, '-')}-vibe-build.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Trigger Roadmap Modal after download
      setTimeout(() => setShowRoadmap(true), 1500);

    } catch (error) {
      console.error("Failed to zip files", error);
      alert("Failed to create ZIP file.");
    } finally {
      setIsZipping(false);
    }
  };

  // Main Push Logic
  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    setPushStatus('pushing');
    setPushLog('Starting push process...');
    setErrorMsg('');

    try {
      // 1. Parse Repo URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (!match) throw new Error("Invalid GitHub Repository URL");
      const owner = match[1];
      const repo = match[2];

      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };
      
      const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

      // 2. Check Repo & Get Reference
      setPushLog(`Connecting to ${owner}/${repo}...`);
      let baseTreeSha: string | null = null;
      let parentCommitSha: string | null = null;

      try {
         const refRes = await fetch(`${baseUrl}/git/ref/heads/${branch}`, { headers });
         if (refRes.ok) {
            const refData = await refRes.json();
            const commitSha = refData.object.sha;
            parentCommitSha = commitSha;
            
            const commitRes = await fetch(`${baseUrl}/git/commits/${commitSha}`, { headers });
            const commitData = await commitRes.json();
            baseTreeSha = commitData.tree.sha;
            setPushLog(`Found branch '${branch}'. Base commit: ${commitSha.substring(0, 7)}`);
         } else if (refRes.status === 409 || refRes.status === 404) {
             setPushLog(`Branch '${branch}' not found (or repo empty). Creating initial commit.`);
         } else {
             throw new Error(`Failed to access repo: ${refRes.statusText}`);
         }
      } catch (err) {
         console.warn("Could not fetch ref, assuming empty or new repo");
      }

      // 3. Create Blobs
      const files = generateFiles();
      setPushLog(`Preparing ${files.length} files...`);
      
      const treeItems = [];
      for (const file of files) {
         setPushLog(`Uploading ${file.path}...`);
         const blobRes = await fetch(`${baseUrl}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content: file.content, encoding: 'utf-8' })
         });
         
         if (!blobRes.ok) throw new Error(`Failed to create blob for ${file.path}`);
         const blobData = await blobRes.json();
         
         treeItems.push({
            path: file.path,
            mode: file.mode || '100644',
            type: 'blob',
            sha: blobData.sha
         });
      }

      // 4. Create Tree
      setPushLog('Creating tree...');
      const treeBody: any = { tree: treeItems };
      if (baseTreeSha) treeBody.base_tree = baseTreeSha;

      const treeRes = await fetch(`${baseUrl}/git/trees`, {
         method: 'POST',
         headers,
         body: JSON.stringify(treeBody)
      });
      if (!treeRes.ok) throw new Error("Failed to create tree");
      const treeData = await treeRes.json();

      // 5. Create Commit
      setPushLog('Creating commit...');
      const commitBody: any = {
         message: `feat: Generated by Vibe Builder (${projectData.name})`,
         tree: treeData.sha,
         parents: parentCommitSha ? [parentCommitSha] : []
      };
      const commitRes = await fetch(`${baseUrl}/git/commits`, {
         method: 'POST',
         headers,
         body: JSON.stringify(commitBody)
      });
      if (!commitRes.ok) throw new Error("Failed to create commit");
      const commitData = await commitRes.json();

      // 6. Update Reference
      setPushLog(`Updating branch ${branch}...`);
      const refUrl = `${baseUrl}/git/refs/heads/${branch}`;
      let updateRes;
      if (!parentCommitSha) {
         updateRes = await fetch(`${baseUrl}/git/refs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commitData.sha })
         });
      } else {
         updateRes = await fetch(refUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ sha: commitData.sha, force: true })
         });
      }

      if (!updateRes.ok) throw new Error("Failed to update branch reference");

      setPushStatus('success');
      setPushLog('Successfully pushed to GitHub!');

    } catch (error: any) {
       console.error(error);
       setPushStatus('error');
       setErrorMsg(error.message || "Unknown error occurred");
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setPushStatus('idle');
    setPushLog('');
    setShowTokenGuide(false);
  };

  return (
    <>
      <div className="flex h-full flex-col bg-slate-950 relative">
        {/* Tabs Header */}
        <div className="border-b border-white/10 bg-slate-900 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-white bg-white/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="pl-4 py-2 flex items-center gap-3">
              {/* Recommendation Badge */}
              <div className="flex flex-col items-end mr-1 hidden sm:flex">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wide animate-pulse flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {language === 'ko' ? '권장' : 'Recommended'}
                  </span>
              </div>

              {/* Download ZIP Button */}
              <button 
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  {isZipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  <span>Download ZIP</span>
              </button>

              {/* Github Export Button (Secondary) */}
              <button 
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-slate-700"
              >
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">Export to GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'preview' ? (
            <div className="flex h-full">
              {/* Pages Sidebar for Preview */}
              <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'ko' ? '페이지 목록' : 'Generated Pages'}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {result.pages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePreviewPage(page)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                        activePreviewPage.route === page.route
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Monitor className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{page.name}</div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">{page.route}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Iframe Preview - using previewHtml */}
              <div className="flex-1 bg-white relative">
                <iframe 
                    key={activePreviewPage.route} // Force re-render on page change
                    srcDoc={getPreviewHtml(activePreviewPage.previewHtml)}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts"
                />
              </div>
            </div>
          ) : activeTab === 'erd' ? (
            <div className="h-full w-full bg-slate-900 p-8 overflow-auto flex flex-col items-center">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-5xl shadow-2xl">
                  <h3 className="text-slate-400 mb-6 text-sm uppercase tracking-wider font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Entity Relationship Diagram
                  </h3>
                  <div className="overflow-auto bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 min-h-[400px] flex items-center justify-center">
                      <div ref={mermaidRef} className="w-full flex justify-center"></div>
                  </div>
                  <div className="mt-4 text-right">
                      <span className="text-xs text-slate-500">Rendered with Mermaid.js</span>
                  </div>
                </div>
            </div>
          ) : (
            <div className="h-full w-full overflow-auto p-0 scrollbar-thin scrollbar-thumb-slate-700">
              <pre className="p-8 font-mono text-sm text-slate-300 leading-relaxed">
                {getContent()}
              </pre>
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative m-4 max-h-[90vh] overflow-y-auto">
              <button 
                onClick={closeExportModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {pushStatus === 'success' ? (
                <div className="py-8 text-center animate-fade-in-up">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 border border-green-500/30">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">Push Successful!</h3>
                  <p className="text-slate-400 mb-6 px-4 text-sm leading-relaxed">
                    {language === 'ko' 
                      ? '모든 코드가 GitHub 저장소로 성공적으로 업로드되었습니다.' 
                      : 'All code has been successfully uploaded to your GitHub repository.'}
                  </p>
                  <div className="bg-slate-950 rounded-lg p-3 text-xs text-slate-500 font-mono mb-6 mx-4 truncate border border-slate-800">
                    {repoUrl}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        closeExportModal();
                        setShowRoadmap(true);
                      }}
                      className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      View Project Roadmap
                    </button>
                    <button 
                      onClick={closeExportModal}
                      className="px-8 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 border border-slate-700">
                      <Github className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Export to GitHub</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold border border-yellow-500/30 uppercase">Experimental</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      {language === 'ko' 
                        ? '코드를 푸쉬할 저장소 정보를 입력하세요.' 
                        : 'Enter repository details to push your code.'}
                    </p>
                  </div>

                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                      {language === 'ko' 
                        ? '⚠️ 브라우저 보안 정책(CORS)으로 인해 실패할 수 있습니다. 실패 시 Download ZIP을 이용해주세요.' 
                        : '⚠️ May fail due to CORS. Use Download ZIP if this happens.'}
                  </div>

                  {/* Token Guide Accordion */}
                  <div className="mb-6 border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
                    <button 
                      onClick={() => setShowTokenGuide(!showTokenGuide)}
                      className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        {language === 'ko' ? '토큰 발급 방법 (필독)' : 'How to get a Token (Read Me)'}
                      </span>
                      {showTokenGuide ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    
                    {showTokenGuide && (
                      <div className="p-4 bg-slate-950/50 text-xs text-slate-400 space-y-2 border-t border-slate-700">
                        <p>1. Go to <strong>GitHub Settings</strong> {'>'} <strong>Developer settings</strong>.</p>
                        <p>2. Select <strong>Personal access tokens</strong> {'>'} <strong>Tokens (classic)</strong>.</p>
                        <p>3. Click <strong>Generate new token (classic)</strong>.</p>
                        <p>4. Check the <strong className="text-indigo-400">repo</strong> scope box (Full control of private repositories).</p>
                        <p>5. Click <strong>Generate token</strong> and copy the code starting with <code>ghp_...</code></p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handlePush} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Repository URL</label>
                      <input 
                        type="url" 
                        required
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/username/repo.git"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Personal Access Token</label>
                      <input 
                        type="password" 
                        required
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Branch</label>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-slate-500" />
                        <input 
                          type="text" 
                          required
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="main"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                        />
                      </div>
                    </div>

                    {pushStatus === 'error' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {pushStatus === 'pushing' && (
                      <div className="text-xs text-indigo-400 font-mono text-center animate-pulse">
                          {pushLog || 'Initializing...'}
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={pushStatus === 'pushing'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {pushStatus === 'pushing' ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Pushing Code...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-5 w-5" />
                            <span>Push to GitHub</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <RoadmapModal 
        isOpen={showRoadmap} 
        onClose={() => setShowRoadmap(false)} 
        language={language}
      />
    </>
  );
};

export default ResultViewer;
