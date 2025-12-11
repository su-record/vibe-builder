

export interface ProjectData {
  name: string;
  description: string;
}

export type ComponentType = 'header' | 'hero' | 'feature' | 'form' | 'list' | 'gallery' | 'content' | 'footer' | 'cta' | 'sidebar';

export interface WireframeComponent {
  id: string;
  type: ComponentType;
  label: string;
  description: string;
}

export type ViewMode = 'wireframe' | 'custom';

export interface View {
  id: string;
  name: string;
  route: string;
  description: string;
  layout?: WireframeComponent[]; // The suggested wireframe structure
  isGeneratingLayout?: boolean; // Loading state for specific view layout generation
  
  // Custom Design Mode Fields
  mode?: ViewMode; 
  customDescription?: string;
  customFiles?: File[]; 
}

export enum AppStep {
  INIT = 'INIT',
  GENERATING_VIEWS = 'GENERATING_VIEWS',
  BUILDER = 'BUILDER',
  REVIEWING = 'REVIEWING',     // AI Analyzing the project
  REVIEW_FEEDBACK = 'REVIEW_FEEDBACK', // User reading feedback
  STACK_SELECTION = 'STACK_SELECTION', // Choosing backend/db
  GENERATING_CODE = 'GENERATING_CODE', // Final code generation
  COMPLETED = 'COMPLETED'      // Showing results
}

export type Language = 'ko' | 'en';

export interface TechStack {
  backend: 'nodejs' | 'python' | 'go' | 'java' | 'kotlin';
  database: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'oracle';
}

export interface GeneratedPage {
  name: string;
  route: string;
  componentName: string; // PascalCase name for React Component
  tsxCode: string;       // Actual React source code for export
  previewHtml: string;   // Standalone HTML for preview iframe
}

export interface BuildResult {
  pages: GeneratedPage[];
  apiSpec: string; // JSON/YAML
  sqlSchema: string; // SQL
  erdMermaid: string; // Mermaid diagram code
}