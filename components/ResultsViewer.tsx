import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { downloadFile } from '../utils';

interface ResultsViewerProps {
  content: string;
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'raw'>('view');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    downloadFile(JSON.stringify({ content }, null, 2), 'estimation.json', 'application/json');
  };

  const handleDownloadMD = () => {
    downloadFile(content, 'estimation.md', 'text/markdown');
  };

  const handleDownloadDoc = () => {
    // Simple HTML wrapper for Word
    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Estimation</title></head><body>
      <pre>${content}</pre>
      </body></html>`;
    downloadFile(docContent, 'estimation.doc', 'application/msword');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-lg">
        <h2 className="text-lg font-bold text-slate-800">Estimation Results</h2>
        <div className="flex space-x-2">
           <button
            onClick={() => setActiveTab('view')}
            className={`px-3 py-1 text-sm rounded ${activeTab === 'view' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
          >
            Formatted
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 text-sm rounded ${activeTab === 'raw' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
          >
            Raw Text
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-white min-h-[400px]">
        {activeTab === 'view' ? (
          <article className="prose prose-slate max-w-none prose-sm prose-headings:text-indigo-900 prose-a:text-indigo-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        ) : (
          <textarea
            readOnly
            className="w-full h-full p-4 font-mono text-xs bg-slate-50 border rounded resize-none focus:outline-none"
            value={content}
          />
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-lg flex justify-end space-x-3">
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Copy to Clipboard
        </button>
        <button
          onClick={handleDownloadJSON}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Download JSON
        </button>
        <button
          onClick={handleDownloadMD}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          Download .MD
        </button>
        <button
          onClick={handleDownloadDoc}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Download .DOC
        </button>
      </div>
    </div>
  );
};