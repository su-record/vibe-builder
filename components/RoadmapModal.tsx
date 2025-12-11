
import React from 'react';
import { Language } from '../types';
import { X, Milestone, Zap, Globe, Rocket, Trophy, ArrowRight } from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose, language = 'ko' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 z-20"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Trophy className="h-3 w-3" />
              <span>Kaggle Gemini 3.0 Hackathon Entry</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'ko' ? 'Vibe Builder: 비전과 로드맵' : 'Vibe Builder: Vision & Roadmap'}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              {language === 'ko' 
                ? '현재 버전은 거대한 비전의 시작점(POC)입니다. AI가 주도하는 소프트웨어 개발의 미래를 확인하세요.' 
                : 'This version is a Proof of Concept (POC). Explore our vision for the future of AI-driven software development.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 -translate-x-1/2"></div>

            {/* Phase 1: Current */}
            <div className="relative group">
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-indigo-500/30 relative overflow-hidden h-full hover:bg-slate-800 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Zap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Phase 1 (Current)</div>
                    <h3 className="text-xl font-bold text-white">AI-Native Prototyping</h3>
                  </div>
                </div>

                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                  {language === 'ko'
                    ? 'Gemini 3.0의 추론 능력을 활용하여 기획부터 실행 가능한 코드(Vite+React)까지 생성하는 POC 단계입니다.'
                    : 'Leveraging Gemini 3.0\'s reasoning capabilities to go from idea to executable code (Vite+React) instantly.'}
                </p>

                <ul className="space-y-3">
                  {[
                    language === 'ko' ? 'Gemini 3.0 기반 아키텍처 설계' : 'Gemini 3.0 Powered Architecture',
                    language === 'ko' ? 'React + Tailwind 스캐폴딩 생성' : 'React + Tailwind Scaffolding',
                    language === 'ko' ? '지능형 기획 검토 및 피드백' : 'Intelligent Planning Review',
                    language === 'ko' ? 'DB 스키마 및 API 명세 자동화' : 'Auto DB Schema & API Specs'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Phase 2: Future */}
            <div className="relative group opacity-80 hover:opacity-100 transition-opacity">
               {/* Arrow for timeline flow */}
               <div className="md:hidden flex justify-center py-4">
                  <ArrowRight className="h-6 w-6 text-slate-600 rotate-90" />
               </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 border-dashed relative overflow-hidden h-full hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Globe className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Phase 2+ (Vision)</div>
                    <h3 className="text-xl font-bold text-white">End-to-End SaaS Platform</h3>
                  </div>
                </div>

                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                  {language === 'ko'
                    ? '단순한 코드 생성을 넘어, 배포와 운영까지 자동화하는 완전한 노코드 SaaS 플랫폼으로 진화합니다.'
                    : 'Evolving into a complete No-Code SaaS platform that automates not just coding, but deployment and operation.'}
                </p>

                <ul className="space-y-3">
                  {[
                    language === 'ko' ? 'Next.js 모노레포 아키텍처' : 'Next.js Monorepo Architecture',
                    language === 'ko' ? 'Vercel / Supabase 원클릭 배포' : 'One-Click Deploy (Vercel/Supabase)',
                    language === 'ko' ? '멀티테넌트 SaaS 인프라' : 'Multi-tenant SaaS Infrastructure',
                    language === 'ko' ? '실시간 협업 및 코드 수정' : 'Live Collaboration & Editing'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                      <Milestone className="h-4 w-4 text-purple-500/50 group-hover:text-purple-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
            >
              {language === 'ko' ? '멋지네요! 계속하기' : 'Awesome! Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModal;
