import React, { useState } from 'react';
import { ProjectData } from '../types';
import { ArrowRight, Wand2, Box, FileText } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: ProjectData) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFocused, setIsFocused] = useState<'name' | 'description' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onSubmit({ name, description });
    }
  };

  const isValid = name.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto animation-fade-in-up">
      <div className="absolute -top-12 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -top-12 right-0 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden p-8 md:p-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 border border-slate-700 shadow-inner">
            <Wand2 className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create New Project</h1>
          <p className="text-slate-400 text-lg">Tell us about your idea, and let AI handle the code.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Project Name Input */}
          <div className={`group relative transition-all duration-300 ${isFocused === 'name' ? 'scale-[1.02]' : ''}`}>
            <label htmlFor="projectName" className="block text-sm font-medium text-slate-300 mb-2 ml-1">
              Project Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Box className={`h-5 w-5 transition-colors duration-300 ${isFocused === 'name' ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
              <input
                type="text"
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsFocused('name')}
                onBlur={() => setIsFocused(null)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all duration-300 sm:text-lg shadow-sm"
                placeholder="e.g., My Awesome Dashboard"
              />
            </div>
          </div>

          {/* Description Input */}
          <div className={`group relative transition-all duration-300 ${isFocused === 'description' ? 'scale-[1.02]' : ''}`}>
            <label htmlFor="projectDesc" className="block text-sm font-medium text-slate-300 mb-2 ml-1">
              Description
            </label>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                <FileText className={`h-5 w-5 transition-colors duration-300 ${isFocused === 'description' ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
              <textarea
                id="projectDesc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setIsFocused('description')}
                onBlur={() => setIsFocused(null)}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all duration-300 sm:text-lg shadow-sm resize-none"
                placeholder="Describe what you want to build. e.g., A task management app with drag and drop features..."
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isValid}
              className={`
                group relative w-full flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-semibold text-white transition-all duration-300
                ${isValid 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02]' 
                  : 'bg-slate-800 cursor-not-allowed text-slate-500'
                }
              `}
            >
              <span>Start Building</span>
              <ArrowRight className={`h-5 w-5 transition-transform duration-300 ${isValid ? 'group-hover:translate-x-1' : ''}`} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;