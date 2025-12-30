
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import ResultDisplay from './components/ResultDisplay';
import { extractTableFromImages, ImageInput } from './geminiService';
import { AppStatus } from './types';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [markdownResult, setMarkdownResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
      setStatus(AppStatus.IDLE);
      setMarkdownResult('');
      setErrorMessage('');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setMarkdownResult('');
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setStatus(AppStatus.LOADING);
    setErrorMessage('');

    const today = new Date().toISOString().split('T')[0];

    try {
      const imageInputs: ImageInput[] = await Promise.all(
        files.map(file => {
          return new Promise<ImageInput>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                base64: e.target?.result as string,
                mimeType: file.type
              });
            };
            reader.onerror = () => reject(new Error(`檔案 ${file.name} 讀取失敗`));
            reader.readAsDataURL(file);
          });
        })
      );

      const result = await extractTableFromImages(imageInputs, today);
      setMarkdownResult(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setErrorMessage(err.message || '辨識過程中發生錯誤');
      setStatus(AppStatus.ERROR);
    }
  };

  const resetAll = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
    setStatus(AppStatus.IDLE);
    setMarkdownResult('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black flex items-center text-slate-800">
                  <span className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center mr-3 text-xs shadow-lg shadow-blue-100">01</span>
                  上傳來源圖片
                </h2>
                {files.length > 0 && (
                  <button onClick={resetAll} className="text-[10px] text-red-400 hover:text-red-500 font-black uppercase tracking-widest border-b border-red-100 pb-0.5">全部重置</button>
                )}
              </div>
              
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 text-center border-slate-200 hover:border-blue-400 bg-slate-50/30 hover:bg-white group`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-4">
                  <div className="mx-auto w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-500 group-hover:scale-110 transition-transform duration-300 border border-slate-50">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">拖放或點擊選取檔案</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium italic">Powered by InsightData Precision Engine</p>
                  </div>
                </div>
              </div>

              {previewUrls.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">辨識隊列 ({files.length})</p>
                    <span className="text-[9px] bg-slate-900 text-blue-400 px-2.5 py-1 rounded-md font-black tracking-tighter">GEMINI 3 PRO ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={url} className="relative aspect-video group bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img 
                          src={url} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                        />
                        <button 
                          onClick={() => removeFile(index)}
                          className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-red-500 text-white p-1 rounded-md transition-all z-20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <button
                  disabled={files.length === 0 || status === AppStatus.LOADING}
                  onClick={handleAnalyze}
                  className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-black transition-all duration-300 tracking-wider ${
                    files.length === 0 || status === AppStatus.LOADING
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-200 active:scale-[0.98]'
                  }`}
                >
                  {status === AppStatus.LOADING ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-blue-400">靈析引擎處理中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-2.136-.557-4.136-1.532-5.877" />
                      </svg>
                      <span>啟動靈析提取模式</span>
                    </>
                  )}
                </button>
              </div>

              {status === AppStatus.ERROR && (
                <div className="mt-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[11px] flex items-start space-x-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold leading-relaxed">{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-7 rounded-2xl text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-3xl rounded-full"></div>
              <h3 className="text-blue-400 font-black mb-5 text-xs flex items-center tracking-[0.2em] uppercase">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                精確辨識邏輯規範
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="text-blue-500 font-black text-xs">01.</span>
                  <div>
                    <p className="text-[11px] font-black text-slate-100 uppercase tracking-widest mb-1">案源 & 部門歸類</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">全自動補全：案源「直客」、部門「IMAG」。</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-blue-500 font-black text-xs">02.</span>
                  <div>
                    <p className="text-[11px] font-black text-slate-100 uppercase tracking-widest mb-1">工時 & 類型標註</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">標準化處理：類型「專案」、預估工時「NA」。</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-blue-500 font-black text-xs">03.</span>
                  <div>
                    <p className="text-[11px] font-black text-slate-100 uppercase tracking-widest mb-1">日期結構化引擎</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">嚴格拆分起迄日，確保 16 欄位結構完整不位移。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {status === AppStatus.IDLE && !markdownResult && (
              <div className="h-full flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center shadow-inner">
                <div className="w-24 h-24 mb-8 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm transition-transform hover:rotate-3">
                  <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">靈析引擎 Ready</p>
                <p className="text-xs mt-3 max-w-xs text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                  Waiting for document input...
                </p>
              </div>
            )}

            {status === AppStatus.LOADING && (
              <div className="h-full flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="relative w-28 h-28 mb-12">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative z-10 w-full h-full bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl">
                    <svg className="w-14 h-14 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">深度解析中</p>
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-1.5 rounded-full">
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] animate-pulse">
                    Insight Engine Active
                  </p>
                </div>
                <p className="mt-10 text-[11px] text-slate-400 font-bold max-w-xs text-center leading-loose">
                  正在對 16 個預定義欄位進行多重核對<br/>並驗證數據的一致性與精準度...
                </p>
              </div>
            )}

            {markdownResult && (
              <ResultDisplay markdown={markdownResult} />
            )}
          </div>

        </div>
      </main>
      
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-slate-100 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-4 text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
            <span>InsightData AI Engine</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span>Gemini 3 Pro Powered</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium">© {new Date().getFullYear()} 靈析數據 (InsightData AI) - 專業數據提取解決方案</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
