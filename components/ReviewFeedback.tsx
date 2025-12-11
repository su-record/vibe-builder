
import React from 'react';
import { Language } from '../types';
import { ArrowRight, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';

interface ReviewFeedbackProps {
  feedback: string;
  onApply: () => void; // Changed from onFix to onApply
  onProceed: () => void;
  language?: Language;
}

const ReviewFeedback: React.FC<ReviewFeedbackProps> = ({ feedback, onApply, onProceed, language = 'ko' }) => {
  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in-up">
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-slate-900 to-indigo-950/30">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {language === 'ko' ? 'AI 프로젝트 검토 결과' : 'AI Project Review'}
              </h2>
              <p className="text-slate-400">
                {language === 'ko' 
                  ? '제미나이가 프로젝트 구조를 분석했습니다. 아래 피드백을 확인하세요.' 
                  : 'Gemini has analyzed your project structure. Please review the feedback below.'}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Content */}
        <div className="p-8">
          <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-lg">
            {feedback}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-950/30 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Apply Improvements Button */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={onApply}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 transition-all font-medium group"
            >
              <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>{language === 'ko' ? '보완사항 반영하기' : 'Apply Improvements'}</span>
            </button>
            <span className="text-xs text-slate-500 text-center">
              {language === 'ko' 
                ? '피드백을 반영하여 누락된 페이지를 자동으로 생성합니다.' 
                : 'Automatically add missing pages based on feedback.'}
            </span>
          </div>

          {/* Proceed Button */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={onProceed}
              className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 text-white transition-all font-semibold group"
            >
              <span>{language === 'ko' ? '이대로 진행하기' : 'Proceed Anyway'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-slate-500 text-center opacity-0">Spacer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewFeedback;
