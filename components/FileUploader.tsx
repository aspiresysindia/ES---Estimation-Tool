
import React, { useRef } from 'react';
import { UploadedFile, FileCategory } from '../types';
import { formatBytes, fileToBase64, fileToText } from '../utils';

interface FileUploaderProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  title?: string;
  description?: string;
  defaultCategory?: FileCategory;
  icon?: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  files, 
  setFiles, 
  title = "Upload Documents", 
  description = "PDF, DOCX, XLSX, Images", 
  defaultCategory = FileCategory.RFP,
  icon
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const base64 = await fileToBase64(file);
          let textContent: string | undefined = undefined;
          
          // Try to read text for text-based files
          if (file.type === "text/plain" || file.type === "text/csv" || file.type === "text/markdown" || file.name.endsWith(".json") || file.name.endsWith(".md")) {
            textContent = await fileToText(file);
          }

          newFiles.push({
            id: crypto.randomUUID(),
            file,
            category: defaultCategory, 
            contentBase64: base64,
            textContent
          });
        } catch (err) {
          console.error("Error reading file", file.name, err);
        }
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCategoryChange = (id: string, newCategory: FileCategory) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category: newCategory } : f))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
         <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">{title}</h3>
      </div>
      
      <div
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg"
        />
        <div className="text-slate-500 group-hover:text-indigo-500 transition-colors">
          {icon || (
            <svg
              className="mx-auto h-10 w-10 text-slate-400 group-hover:text-indigo-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <p className="mt-2 text-sm font-medium">Click to upload</p>
          <p className="mt-1 text-[10px] text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <ul className="divide-y divide-slate-100">
            {files.map((file) => (
              <li key={file.id} className="px-4 py-2 flex items-center justify-between text-sm">
                <div className="flex-1 truncate pr-2">
                  <span className="font-medium text-slate-700 block truncate" title={file.file.name}>{file.file.name}</span>
                  <span className="text-[10px] text-slate-400">{formatBytes(file.file.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={file.category}
                    onChange={(e) =>
                      handleCategoryChange(file.id, e.target.value as FileCategory)
                    }
                    className="block w-32 rounded border-gray-200 bg-slate-50 text-[10px] py-1 pl-2 pr-6 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {Object.values(FileCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(file.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
