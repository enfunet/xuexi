import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

function App() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setSyncStatus('loading');
    setMessage('正在从 Notion 同步内容...');

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('同步失败');
      }

      setSyncStatus('success');
      setMessage('同步成功！请查看 public 目录下的 HTML 文件。');
    } catch (error) {
      setSyncStatus('error');
      setMessage('同步失败，请检查控制台获取详细信息。');
      console.error('Sync error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Notion 内容同步工具
        </h1>
        
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSync}
              disabled={syncStatus === 'loading'}
              className={`
                w-full px-6 py-3 rounded-lg font-medium text-white
                flex items-center justify-center gap-2
                transition duration-200
                ${syncStatus === 'loading' 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {syncStatus === 'loading' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : syncStatus === 'success' ? (
                <Check className="w-5 h-5" />
              ) : syncStatus === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {syncStatus === 'loading' ? '同步中...' : '开始同步'}
            </button>
            
            {message && (
              <div className={`
                text-sm px-4 py-2 rounded-lg w-full text-center
                ${syncStatus === 'success' ? 'bg-green-50 text-green-700' : ''}
                ${syncStatus === 'error' ? 'bg-red-50 text-red-700' : ''}
                ${syncStatus === 'loading' ? 'bg-blue-50 text-blue-700' : ''}
              `}>
                {message}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 space-y-2">
            <p>使用说明：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>点击"开始同步"按钮从 Notion 获取最新内容</li>
              <li>同步完成后，HTML 文件将生成在 public 目录中</li>
              <li>如遇到错误，请检查控制台获取详细信息</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;