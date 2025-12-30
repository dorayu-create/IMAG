
import React, { useState } from 'react';

interface ResultDisplayProps {
  markdown: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ markdown }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportAsMarkdown = () => {
    downloadFile(markdown, `table-export-${new Date().getTime()}.md`, 'text/markdown');
  };

  const exportAsCSV = () => {
    // Basic MD Table to CSV converter
    const lines = markdown.split('\n').filter(line => line.includes('|') && !line.includes('---'));
    const csvContent = lines.map(line => {
      const cols = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      return cols.map(c => `"${c.trim().replace(/"/g, '""')}"`).join(',');
    }).join('\n');
    
    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    downloadFile(bom + csvContent, `table-export-${new Date().getTime()}.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-700">辨識結果</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 font-medium text-xs ${
              copied 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>已複製</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>複製 Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={exportAsCSV}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition-all duration-200 font-medium text-xs"
          >
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>匯出 CSV</span>
          </button>

          <button
            onClick={exportAsMarkdown}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition-all duration-200 font-medium text-xs"
          >
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>匯出 Markdown</span>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px]">
          <pre className="text-gray-100 text-sm font-mono whitespace-pre">{markdown}</pre>
        </div>
        
        <div className="mt-8">
          <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">表格預覽</p>
          <div className="prose prose-sm max-w-none border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {markdown.split('\n').filter(line => line.includes('|')).map((line, i) => {
                    const cols = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                    if (line.includes('---')) return null;
                    return (
                      <tr key={i} className={i === 0 ? "bg-gray-50" : "hover:bg-gray-50 transition-colors"}>
                        {cols.map((col, j) => (
                          <td key={j} className={`px-4 py-3 text-xs ${i === 0 ? "font-bold text-gray-900 bg-gray-50" : "text-gray-600"} border-r last:border-r-0 border-gray-100 whitespace-nowrap`}>
                            {col.trim()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
