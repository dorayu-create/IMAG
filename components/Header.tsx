
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-6 px-4 mb-8 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg shadow-slate-200">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">靈析數據 <span className="text-blue-600">InsightData AI</span></h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">專業級 16 欄位 AI 表格精準提取引擎</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
