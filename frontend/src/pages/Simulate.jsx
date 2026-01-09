import React, { useState, useEffect } from 'react';
import { Play, Code, Layout, Plus, Trash2, CheckCircle, AlertCircle, FileJson, Copy, Check, Layers, RotateCcw, Zap } from 'lucide-react';
import { submitAPI } from '../services/api';
import { useToast } from '../components/Toast';

const generateJobId = () => "job_" + Math.floor(Math.random() * 10000);

const INITIAL_DATA = {
  job_id: generateJobId(),
  tenant_id: "tenant_A",
  priority: 10,
  dependencies: {
    "db_shard_1": 5,
    "redis_cache": 10
  },
  payload: {
    "task_type": "data_processing"
  }
};

const Simulate = () => {
  const toast = useToast();
  const [mode, setMode] = useState('visual');
  
  const [visualData, setVisualData] = useState({
    ...INITIAL_DATA,
    dependencies: Object.entries(INITIAL_DATA.dependencies).map(([key, value]) => ({ key, value })),
    payloadString: JSON.stringify(INITIAL_DATA.payload, null, 2)
  });
  const [jsonInput, setJsonInput] = useState(JSON.stringify(INITIAL_DATA, null, 2));

  const [batchName, setBatchName] = useState("experiment_run");
  const [batch, setBatch] = useState([]);
  const [isAtomicBatch, setIsAtomicBatch] = useState(false);
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode === 'visual') {
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(visualData.payloadString || "{}");
      } catch (e) { }

      const exportData = {
        ...visualData,
        dependencies: visualData.dependencies.reduce((acc, dep) => {
          if (dep.key) acc[dep.key] = dep.value;
          return acc;
        }, {}),
        payload: payloadObj
      };
      delete exportData.payloadString;
    }
  }, [visualData, mode]);

  const handleModeSwitch = (newMode) => {
    if (newMode === 'json') {
      let payloadObj = {};
      try {
        payloadObj = JSON.parse(visualData.payloadString || "{}");
      } catch (e) {
        toast.error("Invalid Payload JSON. Please fix before switching.");
        return;
      }

      const exportData = {
        ...visualData,
        dependencies: visualData.dependencies.reduce((acc, dep) => {
          if (dep.key) acc[dep.key] = dep.value;
          return acc;
        }, {}),
        payload: payloadObj
      };
      delete exportData.payloadString;
      setJsonInput(JSON.stringify(exportData, null, 2));
    } else {
      try {
        const parsed = JSON.parse(jsonInput);
        setVisualData({
          ...parsed,
          dependencies: parsed.dependencies 
            ? Object.entries(parsed.dependencies).map(([key, value]) => ({ key, value }))
            : [],
          payloadString: JSON.stringify(parsed.payload || {}, null, 2)
        });
      } catch (e) {
        toast.error("Invalid JSON. Please fix errors before switching to Visual mode.");
        return;
      }
    }
    setMode(newMode);
  };

  const getJobFromEditor = () => {
     if (mode === 'json') {
       try { return JSON.parse(jsonInput); }
       catch(e) { return null; }
     } else {
        let payloadObj = {};
        try { payloadObj = JSON.parse(visualData.payloadString || "{}"); } catch (e) {}
        
        const job = {
          ...visualData,
          dependencies: visualData.dependencies.reduce((acc, dep) => {
            if (dep.key) acc[dep.key] = dep.value;
            return acc;
          }, {}),
          payload: payloadObj
        };
        delete job.payloadString;
        return job;
     }
  };

  const addToBatch = () => {
    const job = getJobFromEditor();
    if (!job) {
      toast.error('Invalid job data');
      return;
    }

    setBatch([...batch, job]);
    toast.success('Job added to batch');
    
    const newId = generateJobId();
    setVisualData(prev => ({
      ...prev,
      job_id: newId
    }));
    const newJson = { ...job, job_id: newId };
    setJsonInput(JSON.stringify(newJson, null, 2));
  };

  const clearBatch = () => {
    setBatch([]);
    setResults(null);
    toast.info('Batch cleared');
  };

  const handleSimulate = async () => {
    setLoading(true);
    setResults(null);

    const currentDraft = getJobFromEditor();
    if (!currentDraft && batch.length === 0) {
        toast.error('No job data to submit');
        setLoading(false);
        return;
    }

    try {
      let response;
      
      if (batch.length > 0) {
        const batchPayload = {
          batch_name: batchName,
          jobs: batch
        };
        
        if (isAtomicBatch) {
          response = await submitAPI.submitAtomicBatch(batchPayload);
        } else {
          response = await submitAPI.submitBatch(batchPayload);
        }
      } else {
        const jobPayload = {
          batch_name: `standalone_job_${Date.now()}`,
          ...currentDraft
        };
        response = await submitAPI.submitJob(jobPayload);
      }

      if (response.success) {
        toast.success(batch.length > 0 ? 'Batch submitted successfully' : 'Job submitted successfully');
        setResults([{
          success: true,
          jobId: currentDraft?.job_id || 'batch',
          message: 'Submitted',
          reason: response.message || 'Job submitted to queue',
          data: response.data
        }]);
      } else {
        toast.error(response.error || 'Submission failed');
        setResults([{
          success: false,
          jobId: currentDraft?.job_id || 'batch',
          message: 'Failed',
          reason: response.error || 'Submission failed'
        }]);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit job';
      toast.error(errorMsg);
      setResults([{
        success: false,
        jobId: currentDraft?.job_id || 'batch',
        message: 'Error',
        reason: errorMsg
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getLiveJSON = () => {
    const current = getJobFromEditor();
    const fullList = [...batch];
    if (current && batch.length === 0) fullList.push(current);
    
    let currentBatchName = batchName;
    if (batch.length === 0) {
        currentBatchName = `standalone_job_${Date.now()}`;
    }

    return JSON.stringify({
        batch_name: currentBatchName,
        jobs: fullList
    }, null, 2);
  };

  const handleCopy = () => {
    const content = getLiveJSON();
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const updateVisualField = (field, value) => {
    setVisualData(prev => ({ ...prev, [field]: value }));
  };

  const addDependency = () => {
    setVisualData(prev => ({
      ...prev,
      dependencies: [...prev.dependencies, { key: "", value: 1 }]
    }));
  };

  const updateDependency = (idx, field, value) => {
    const newDeps = [...visualData.dependencies];
    newDeps[idx][field] = value;
    setVisualData(prev => ({ ...prev, dependencies: newDeps }));
  };

  const removeDependency = (idx) => {
    const newDeps = visualData.dependencies.filter((_, i) => i !== idx);
    setVisualData(prev => ({ ...prev, dependencies: newDeps }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Job Simulator</h1>
            <p className="text-sm text-gray-500 mt-0.5">Submit jobs to the admission controller</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Editor */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Mode Toggle Tabs */}
            <div className="bg-white border border-gray-200 p-0.5 flex w-fit">
              <button
                onClick={() => handleModeSwitch('visual')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === 'visual' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Layout className="w-4 h-4" />
                Visual Editor
              </button>
              <button
                onClick={() => handleModeSwitch('json')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === 'json' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4" />
                JSON Payload
              </button>
            </div>

            <div className="bg-white border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                {mode === 'visual' ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Job Identity</label>
                        <input
                          type="text"
                          value={visualData.job_id}
                          onChange={(e) => updateVisualField('job_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                          placeholder="e.g. job_123"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Tenant Scope</label>
                        <input
                          type="text"
                          value={visualData.tenant_id}
                          onChange={(e) => updateVisualField('tenant_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                          placeholder="e.g. tenant_A"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                         <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</label>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={visualData.priority}
                            onChange={(e) => updateVisualField('priority', parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 cursor-pointer accent-blue-600"
                        />
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={visualData.priority}
                            onChange={(e) => updateVisualField('priority', parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 text-center text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Dependencies</label>
                        <button 
                          onClick={addDependency}
                          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="space-y-2 bg-gray-50 p-3 border border-gray-200 min-h-[80px]">
                        {visualData.dependencies.length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-2">
                            No resource dependencies defined
                          </div>
                        )}
                        {visualData.dependencies.map((dep, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <div className="flex-1">
                              <input
                                placeholder="Key (e.g. db_shard)"
                                value={dep.key}
                                onChange={(e) => updateDependency(idx, 'key', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </div>
                            <div className="w-20">
                              <input
                                type="number"
                                placeholder="Cost"
                                value={dep.value}
                                onChange={(e) => updateDependency(idx, 'value', parseInt(e.target.value))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </div>
                            <button 
                              onClick={() => removeDependency(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Optional Payload (JSON)</label>
                      <textarea
                        value={visualData.payloadString}
                        onChange={(e) => updateVisualField('payloadString', e.target.value)}
                        className="w-full h-20 px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono resize-none"
                        placeholder="{}"
                        spellCheck="false"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-[350px]">
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-full font-mono text-sm p-3 bg-gray-50 text-gray-800 resize-none focus:outline-none border border-gray-200"
                      spellCheck="false"
                    />
                  </div>
                )}
              </div>

              {/* Editor Footer Actions */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <button
                        onClick={addToBatch}
                        className="flex items-center gap-2 px-3 py-1.5 font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                    >
                        <Layers className="w-4 h-4" />
                        Add to Batch
                    </button>
                    {batch.length > 0 && (
                        <button
                            onClick={clearBatch}
                            className="flex items-center gap-2 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 transition-colors text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear ({batch.length})
                        </button>
                    )}
                </div>
                
                <button
                onClick={handleSimulate}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-1.5 font-medium text-white transition-colors ${
                    loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                >
                {loading ? (
                    <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                    </>
                ) : (
                    <>
                    <Play className="w-4 h-4 fill-current" />
                    {batch.length > 0 ? `Submit Batch (${batch.length})` : 'Submit Job'}
                    </>
                )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Result & Payload Preview */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            
            {/* Batch Options */}
             {batch.length > 0 && (
               <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Batch/Experiment Name</label>
                  <input
                      type="text"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      placeholder="e.g. Experiment 1"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAtomicBatch}
                    onChange={(e) => setIsAtomicBatch(e.target.checked)}
                    className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    <Zap className="w-4 h-4 inline mr-1 text-amber-500" />
                    Atomic Batch (all-or-nothing)
                  </span>
                </label>
               </div>
             )}

            {/* Simulation Result */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Submission Result</h3>
              {results ? (
                <div className="space-y-2 max-h-[350px] overflow-auto pr-1">
                  {results.map((res, idx) => (
                    <div key={idx} className={`bg-white border ${
                        res.success ? 'border-green-200' : 'border-red-200'
                    }`}>
                        <div className={`px-3 py-2 border-b flex items-center justify-between ${
                        res.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            {res.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`font-medium text-xs ${
                            res.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {res.jobId} - {res.message}
                            </span>
                        </div>
                        </div>
                        
                        <div className="p-3">
                           <div className="text-xs text-gray-600">{res.reason}</div>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 p-6 text-center bg-gray-50/50">
                  <div className="text-sm text-gray-400">No Submission Yet</div>
                  <p className="text-xs text-gray-400 mt-1">
                    Results will appear here after you submit a job.
                  </p>
                </div>
              )}
            </div>

            {/* Live Payload Preview */}
            <div className="flex flex-col">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Live Payload {batch.length > 0 && `(Batch: ${batch.length})`}
              </h3>
              <div className="bg-gray-900 border border-gray-700 overflow-hidden flex flex-col h-[300px]">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                  <div className="flex items-center gap-2">
                     <FileJson className="w-3 h-3 text-gray-500" />
                     <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        {batch.length > 0 ? "batch_export.json" : "single_job.json"}
                     </span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-2 py-0.5"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 overflow-auto custom-scrollbar dark-scrollbar flex-1">
                  <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
                    {getLiveJSON()}
                  </pre>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Simulate;