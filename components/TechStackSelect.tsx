

import React, { useState } from 'react';
import { Language, TechStack } from '../types';
import { Server, Database, Check, ArrowRight, Code2 } from 'lucide-react';

interface TechStackSelectProps {
  onSelect: (stack: TechStack) => void;
  language?: Language;
}

const TechStackSelect: React.FC<TechStackSelectProps> = ({ onSelect, language = 'ko' }) => {
  const [backend, setBackend] = useState<TechStack['backend']>('nodejs');
  const [db, setDb] = useState<TechStack['database']>('postgresql');

  const backends = [
    { id: 'nodejs', name: 'Node.js', desc: 'Express/NestJS', icon: 'green' },
    { id: 'python', name: 'Python', desc: 'FastAPI/Django', icon: 'yellow' },
    { id: 'java', name: 'Java', desc: 'Spring Boot', icon: 'orange' },
    { id: 'kotlin', name: 'Kotlin', desc: 'Spring Boot/Ktor', icon: 'purple' },
    { id: 'go', name: 'Go', desc: 'Gin/Echo', icon: 'cyan' },
  ];

  const databases = [
    { id: 'postgresql', name: 'PostgreSQL', desc: 'Relational', icon: 'blue' },
    { id: 'mysql', name: 'MySQL', desc: 'Relational', icon: 'orange' },
    { id: 'oracle', name: 'Oracle DB', desc: 'Enterprise', icon: 'red' },
    { id: 'mongodb', name: 'MongoDB', desc: 'NoSQL Document', icon: 'green' },
    { id: 'sqlite', name: 'SQLite', desc: 'Embedded', icon: 'slate' },
  ];

  const handleSubmit = () => {
    onSelect({ backend, database: db });
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-3">
          {language === 'ko' ? '기술 스택 선택' : 'Choose Your Tech Stack'}
        </h2>
        <p className="text-slate-400 text-lg">
          {language === 'ko' 
            ? '생성할 애플리케이션의 백엔드와 데이터베이스 기술을 선택하세요.' 
            : 'Select the backend and database technologies for your application.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Backend Selection */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Backend</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {backends.map((item) => (
              <button
                key={item.id}
                onClick={() => setBackend(item.id as any)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  backend === item.id
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-inner'
                    : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${item.icon}-500 shadow-lg shadow-${item.icon}-500/50`}></div>
                  <div className="text-left">
                    <div className={`font-medium ${backend === item.id ? 'text-white' : 'text-slate-300'}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
                {backend === item.id && <Check className="h-5 w-5 text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Database Selection */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Database</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {databases.map((item) => (
              <button
                key={item.id}
                onClick={() => setDb(item.id as any)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  db === item.id
                    ? 'bg-purple-600/20 border-purple-500 shadow-inner'
                    : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${item.icon}-500 shadow-lg shadow-${item.icon}-500/50`}></div>
                  <div className="text-left">
                    <div className={`font-medium ${db === item.id ? 'text-white' : 'text-slate-300'}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
                {db === item.id && <Check className="h-5 w-5 text-purple-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          className="group relative flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-12 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/50"
        >
          <Code2 className="h-6 w-6" />
          <span>{language === 'ko' ? '코드 생성 시작' : 'Generate Codebase'}</span>
          <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default TechStackSelect;