
# Vibe Builder (Gemini 3.0 Hackathon Entry)

**Vibe Builder** is an AI-native no-code solution designed to bridge the gap between abstract ideas and executable code. Built for the **Kaggle Gemini 3.0 Competition**, it leverages the advanced reasoning capabilities of Google's **Gemini 3.0 Pro** model to act as a senior web architect, designer, and developer.

## 🚀 Vision & Roadmap

Currently, Vibe Builder operates as a powerful **POC (Proof of Concept)** that generates high-quality React + Vite scaffolding. However, our long-term vision is to evolve this tool into a fully managed, **Multi-tenant SaaS Platform** that automates the entire software development lifecycle.

### Phase 1: AI-Native Prototyping (Current POC)
- **Core Engine**: Gemini 3.0 Pro (Reasoning, Planning, Coding).
- **Workflow**: Route Definition -> Wireframing -> AI Review -> Code Generation.
- **Output**: Complete source code bundles (Frontend, Backend, DB, Docs) via ZIP or GitHub.
- **Current Stack Support**: React, TypeScript, Tailwind CSS, Node.js/Python.
- **Goal**: Drastically reduce the "zero to one" setup time for developers and founders.

### Phase 2: End-to-End SaaS Platform (Future Vision)
The project will evolve into a comprehensive service with the following architecture:

- **Architecture**: **Multi-tenant SaaS** (Software as a Service).
- **Frontend Framework**: **Next.js** (App Router) using Monorepo structure for scalability.
- **Backend Service**: **FastAPI** (Python) for high-performance, asynchronous processing and AI orchestration.
- **Database**: **PostgreSQL** with Row Level Security (RLS) and tenant isolation strategies.
- **Key Features**:
  - **One-Click Deployment**: Direct integration with cloud providers (Vercel, Supabase).
  - **Live Sandbox**: Integrated IDE for real-time code editing and preview.
  - **Continuous Evolution**: AI agents that can maintain and update existing applications.

## 🛠 Tech Stack (Vibe Builder Itself)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Model**: `gemini-3-pro-preview`
- **Visualization**: Mermaid.js (ERD), Lucide React (UI Icons)
- **Utilities**: JSZip (Client-side compression)

## ✨ Key Features (Hackathon Highlights)
1. **Agentic Workflow**: Mimics human development process (Plan -> Design -> Review -> Code).
2. **Multimodal Vision-to-Code**: Upload sketches or screenshots, and Gemini 3.0 will translate visual designs directly into React/Tailwind code.
3. **Self-Correcting Review**: AI detects missing logic (e.g., forgotten auth pages) and auto-corrects the architecture.
4. **Full-Stack Scaffolding**: Generates not just code snippets, but a runnable project structure with backend and docs.

## 💡 How It Works
1. **Ideation**: Users describe their project idea in natural language.
2. **Architecture**: AI architect suggests necessary routes and page structures.
3. **Wireframing / Vision**: AI designs blueprints. Users can upload **images/sketches** which Gemini 3.0 analyzes to generate pixel-perfect layouts.
4. **Review**: AI acts as a PM to review logical gaps (e.g., missing auth pages).
5. **Generation**: The system outputs a production-ready codebase including API specs (OpenAPI) and DB Schemas.

---

## 🎬 Demo Scenario (For Hackathon Presentation)

To showcase the full potential of Vibe Builder during the demo video, follow this recommended flow:

1.  **Planning (Ideation)**:
    *   Input: "I want to build an online shopping mall."
    *   Action: AI automatically generates the route structure.
2.  **Multimodal (Core Feature)**:
    *   Action: Go to the "Custom Upload" tab.
    *   Input: Upload a photo of a **hand-drawn sketch** of the shopping mall's main page.
3.  **Review (Agentic Reasoning)**:
    *   Action: AI Architect points out, "There is no shopping cart page."
    *   Input: Click "Apply Improvements" to auto-correct the structure.
4.  **Result (Vision-to-Code)**:
    *   Observation: Show the generated code preview. Point out that the layout matches the **hand-drawn sketch** uploaded earlier.
5.  **Vision (Closing)**:
    *   Action: Open the Roadmap Modal after downloading code.
    *   Message: "This is just the beginning. Vibe Builder will evolve into a full SaaS platform."

---
*Built with ❤️ using Gemini 3.0*
