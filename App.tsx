
import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { PyramidBuilder } from './components/PyramidBuilder';
import { ResultsViewer } from './components/ResultsViewer';
import { VersionHistory } from './components/VersionHistory';
import {
  UploadedFile,
  RoleConfig,
  EstimationType,
  EffortUnit,
  OutputFormat,
  ProjectSettings,
  PyramidSettings,
  SavedVersion,
  DEFAULT_USER_PROMPT,
  FileCategory,
} from './types';
import { generateEstimationGemini } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [viewMode, setViewMode] = useState<'planner' | 'admin'>('planner');

  // Admin Config State
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');

  // We split files into two buckets for better UI organization
  const [standardFiles, setStandardFiles] = useState<UploadedFile[]>([]); // Admin Controlled: Definitions, Methodologies
  const [projectFiles, setProjectFiles] = useState<UploadedFile[]>([]);   // User Controlled: RFPs, Previous Est, Context

  // Admin Controlled: Default Pyramid
  const [roles, setRoles] = useState<RoleConfig[]>([
    { id: '1', roleName: 'Analyst', percentage: 35 },
    { id: '2', roleName: 'Senior Analyst', percentage: 35 },
    { id: '3', roleName: 'Lead / Manager', percentage: 20 },
    { id: '4', roleName: 'Architect / Principal', percentage: 10 },
  ]);

  // User Controlled: Project Specifics
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    startDate: '',
    endDate: '',
    estType: EstimationType.HIGH_LEVEL,
    effortUnit: EffortUnit.PERSON_DAYS,
    outputFormat: OutputFormat.TABLES,
  });

  const [useCustomPyramidPerPhase, setUseCustomPyramidPerPhase] = useState(false);
  
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [versions, setVersions] = useState<SavedVersion[]>([]);

  // Computed Checks
  const hasEstimationDefinition = standardFiles.some(f => f.category === FileCategory.EST_DEF);

  // --- Handlers ---
  const handleSettingsChange = (field: keyof ProjectSettings, value: string) => {
    setProjectSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    const allFiles = [...standardFiles, ...projectFiles];

    if (allFiles.length === 0) {
      alert("Please upload at least one document (RFP or Definition).");
      return;
    }
    
    if (!apiKey) {
      alert(`Please enter your Gemini API Key in Admin Settings.`);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const pyramidSettings: PyramidSettings = {
      useCustomPerPhase: useCustomPyramidPerPhase,
      defaultPyramid: roles,
    };

    try {
      const output = await generateEstimationGemini(
        apiKey,
        "gemini-2.5-flash",
        "gemini-3-pro-preview",
        allFiles,
        userPrompt,
        projectSettings,
        pyramidSettings
      );
      setResult(output);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = () => {
    const name = prompt("Enter a name for this snapshot:", `Plan v${versions.length + 1}`);
    if (!name) return;

    const allFiles = [...standardFiles, ...projectFiles];
    
    const newVersion: SavedVersion = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      files: allFiles,
      roles: [...roles],
      projectSettings: { ...projectSettings },
      pyramidSettings: {
          useCustomPerPhase: useCustomPyramidPerPhase,
          defaultPyramid: roles 
      },
      userPrompt,
      result
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const handleLoadVersion = (v: SavedVersion) => {
    if (standardFiles.length > 0 || projectFiles.length > 0 || result) {
       if(!window.confirm(`Load version "${v.name}"? Current unsaved changes will be lost.`)) return;
    }
    
    const stds = v.files.filter(f => f.category === FileCategory.EST_DEF || f.category === FileCategory.METHODOLOGY);
    const projs = v.files.filter(f => f.category !== FileCategory.EST_DEF && f.category !== FileCategory.METHODOLOGY);
    
    setStandardFiles(stds);
    setProjectFiles(projs);
    setRoles(v.roles);
    setProjectSettings(v.projectSettings);
    setUseCustomPyramidPerPhase(v.pyramidSettings.useCustomPerPhase);
    setUserPrompt(v.userPrompt);
    setResult(v.result);
  };

  const handleDeleteVersion = (id: string) => {
    if(!window.confirm("Are you sure you want to delete this saved version?")) return;
    setVersions(prev => prev.filter(v => v.id !== id));
  };

  // --- Render Helpers ---
  
  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="bg-indigo-900 text-indigo-50 p-4 rounded-lg shadow-sm flex items-start space-x-3">
         <svg className="w-6 h-6 mt-0.5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
         </svg>
         <div>
           <h3 className="font-bold text-lg">Admin Configuration Mode</h3>
           <p className="text-sm opacity-80">
             Configure AI Provider settings, organizational standards, and resource definitions.
           </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 0. API Config */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 col-span-1 md:col-span-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
              Service Configuration
            </h2>
            <div className="grid grid-cols-1 gap-6">
                <div>
                   <label className="block text-xs font-medium text-slate-700 mb-1">Gemini API Key</label>
                   <input 
                     type="password" 
                     className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     placeholder="sk-..."
                   />
                </div>
            </div>
        </section>

        {/* 1. Master Definitions (Standards) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
              Standards & Definitions
            </h2>
            <div className="bg-indigo-50/50 p-3 rounded-md mb-4 border border-indigo-100">
              <p className="text-[11px] text-indigo-800 leading-snug">
                <strong>Required:</strong> Upload your <em>"Estimation Definition"</em> Excel/PDF here (Simple/Medium/Complex rules).
              </p>
            </div>
            <FileUploader 
              files={standardFiles} 
              setFiles={setStandardFiles} 
              title="Global Definition Files"
              description="Estimation Definitions, Methodologies"
              defaultCategory={FileCategory.EST_DEF}
              icon={
                <svg className="mx-auto h-8 w-8 text-slate-400 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
        </section>

        {/* 2. Resource Pyramid */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
            Global Resource Pyramid
          </h2>
          <div className="bg-indigo-50/50 p-3 rounded-md mb-4 border border-indigo-100">
             <p className="text-[11px] text-indigo-800 leading-snug">
               Define the standard grade mix. This will be the default applied to all estimations unless the user's methodology requires overrides.
             </p>
          </div>
          <PyramidBuilder roles={roles} setRoles={setRoles} />
        </section>
      </div>
    </div>
  );

  const renderPlannerView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: Inputs (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* READ ONLY CONFIG SUMMARY */}
        <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Active Configuration</h2>
          
          <div className="space-y-3">
             {/* Definitions Status */}
             <div className="flex items-start">
               <div className={`mt-0.5 w-2 h-2 rounded-full mr-2 ${hasEstimationDefinition ? 'bg-green-500' : 'bg-red-500'}`}></div>
               <div className="flex-1">
                 <p className="text-xs font-medium text-slate-700">Estimation Standards</p>
                 {standardFiles.length > 0 ? (
                   <ul className="mt-1 space-y-1">
                     {standardFiles.map(f => (
                       <li key={f.id} className="text-[10px] text-slate-500 truncate bg-white px-2 py-1 rounded border border-slate-100">{f.file.name}</li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-[10px] text-red-500 italic mt-1">No standards loaded by Admin.</p>
                 )}
               </div>
             </div>

             {/* Pyramid Status */}
             <div className="flex items-start">
               <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
               <div className="flex-1">
                 <p className="text-xs font-medium text-slate-700">Default Resource Mix</p>
                 <div className="mt-2 w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                   {roles.map((r, i) => (
                      <div key={r.id} style={{ width: `${r.percentage}%` }} className={`h-full ${['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500'][i % 4]}`} title={`${r.roleName}: ${r.percentage}%`}></div>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* Project Context (Instance) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
            Project Context (RFP)
          </h2>
          <FileUploader 
            files={projectFiles} 
            setFiles={setProjectFiles} 
            title="Scope Documents"
            description="RFPs, Previous Estimates, Requirements"
            defaultCategory={FileCategory.RFP}
          />
        </section>

        {/* Timeline & Options */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
            Config
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                  type="date" 
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={projectSettings.startDate}
                  onChange={(e) => handleSettingsChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input 
                  type="date" 
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={projectSettings.endDate}
                  onChange={(e) => handleSettingsChange('endDate', e.target.value)}
                  />
                </div>
            </div>
            {/* Simplified Options for space */}
            <div className="grid grid-cols-1 gap-3">
                <select
                  className="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={projectSettings.effortUnit}
                  onChange={(e) => handleSettingsChange('effortUnit', e.target.value)}
                >
                  {Object.values(EffortUnit).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                  <select
                  className="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={projectSettings.outputFormat}
                  onChange={(e) => handleSettingsChange('outputFormat', e.target.value)}
                >
                  {Object.values(OutputFormat).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>
            
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center">
                  <input
                    id="customPhase"
                    type="checkbox"
                    checked={useCustomPyramidPerPhase}
                    onChange={(e) => setUseCustomPyramidPerPhase(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="customPhase" className="ml-2 block text-xs text-slate-600">
                    Allow custom pyramid per phase
                  </label>
                </div>
            </div>
             <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">Estimator Mode</label>
                    <div className="flex bg-slate-100 rounded p-1">
                        <button 
                            onClick={() => setProjectSettings(prev => ({...prev, estType: EstimationType.HIGH_LEVEL}))}
                            className={`text-[10px] px-2 py-0.5 rounded ${projectSettings.estType === EstimationType.HIGH_LEVEL ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                        >
                            High-Level
                        </button>
                        <button 
                             onClick={() => setProjectSettings(prev => ({...prev, estType: EstimationType.DETAILED}))}
                            className={`text-[10px] px-2 py-0.5 rounded ${projectSettings.estType === EstimationType.DETAILED ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                        >
                            Detailed
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </section>

          {/* Version History */}
          <section className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center justify-between">
            Versions
          </h2>
          <VersionHistory 
            versions={versions} 
            onLoad={handleLoadVersion} 
            onDelete={handleDeleteVersion} 
          />
        </section>
      </div>

      {/* RIGHT COLUMN: Presales Inputs & Results (8 cols) */}
      <div className="lg:col-span-8 space-y-6 flex flex-col h-full">
        
        {/* Presales Inputs Section */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Presales Inputs: Clarifications & Compliance
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100 mb-2">
                <strong>Instructions:</strong> Paste content from the <em>Compliance Matrix</em>, specific <em>Customer Clarification emails</em>, or override assumptions here. This content takes precedence over generic RFP text.
              </div>
              <textarea
              className="w-full h-40 p-3 text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 font-medium leading-relaxed"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., The customer clarified that Phase 1 must go live by Dec 1st.
e.g., Compliance Item 4.2 requires 24/7 support availability.
e.g., Assume 'Medium' complexity for all data migration tasks."
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-slate-500 italic flex items-center">
                {hasEstimationDefinition 
                  ? <span className="text-green-600 font-semibold flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Standards Loaded
                    </span>
                  : <span className="text-red-500 font-semibold flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    Warning: No Admin Standards
                    </span>}
              </div>
              <button
              onClick={handleGenerate}
              disabled={loading || (standardFiles.length === 0 && projectFiles.length === 0)}
              className={`
                px-6 py-3 rounded-md text-white font-semibold shadow-md transition-all flex items-center
                ${loading || (standardFiles.length === 0 && projectFiles.length === 0) ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}
              `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : 'Generate Estimation'}
              </button>
            </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Generation Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {result && (
          <div className="flex-1">
            <ResultsViewer content={result} />
          </div>
        )}
        
        {!result && !loading && !error && (
          <div className="flex-1 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 p-10 bg-slate-50/50">
            <div className="text-center">
              <p className="text-sm">Upload Project RFP files then Generate.</p>
              <p className="text-xs text-slate-400 mt-2">Definitions and Pyramids are managed in Admin Mode.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Estimator & Planner</h1>
              <p className="text-xs text-slate-500">Resource Pyramid & Phase Planning</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button
              onClick={handleSaveVersion}
              className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors flex items-center"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
               </svg>
               Save Snapshot
             </button>
             
             {/* Admin Switcher */}
             <div className="border-l border-slate-300 pl-4">
                <button
                  onClick={() => setViewMode(prev => prev === 'admin' ? 'planner' : 'admin')}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    viewMode === 'admin' 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {viewMode === 'admin' ? 'Exit Admin' : 'Admin Settings'}
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'admin' ? renderAdminView() : renderPlannerView()}
      </main>
    </div>
  );
};

export default App;