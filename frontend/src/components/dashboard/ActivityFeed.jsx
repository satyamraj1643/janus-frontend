import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Activity, FileJson, X, Copy, Check } from 'lucide-react';

const ITEMS_PER_PAGE = 7;

const ActivityFeed = ({ decisions = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [copied, setCopied] = useState(false);

  const totalPages = Math.ceil(decisions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = decisions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCopy = () => {
    if (!selectedJob) return;
    navigator.clipboard.writeText(JSON.stringify(selectedJob.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 h-full flex flex-col relative">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">Live Activity Feed</h3>
            </div>
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 font-medium">
              {decisions.length} Jobs
            </span>
          </div>
        </div>
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {decisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Clock className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No jobs yet</p>
              <p className="text-xs mt-1">Jobs will appear here as they are processed</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Job ID</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">Reason</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 text-right">Payload</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((decision, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors group border-b border-gray-100">
                    <td className="px-4 py-3">
                      {decision.admitted ? (
                        <div className="flex items-center gap-1.5 text-green-700">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">Admitted</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-700">
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">Rejected</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5">
                        {decision.job_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium ${
                        decision.admitted 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {decision.reason.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <button 
                         onClick={() => setSelectedJob(decision)}
                         className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                       >
                         <FileJson className="w-3.5 h-3.5" />
                         View
                       </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {new Date(decision.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {decisions.length > ITEMS_PER_PAGE && (
          <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
            <div className="text-xs text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, decisions.length)} of {decisions.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:bg-white border border-transparent hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 min-w-[50px] text-center">
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-white border border-transparent hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payload Modal Overlay */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100">
                    <FileJson className="w-4 h-4 text-blue-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-gray-900">Job Payload</h3>
                    <div className="text-xs text-gray-500 font-mono">{selectedJob.job_id}</div>
                 </div>
               </div>
               <button 
                 onClick={() => setSelectedJob(null)}
                 className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-0 flex-1 overflow-hidden flex flex-col bg-gray-900 relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium transition-colors"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
                <div className="overflow-auto p-4 custom-scrollbar dark-scrollbar">
                    <pre className="text-sm font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(selectedJob.payload || {}, null, 2)}
                    </pre>
                </div>
            </div>
            
            {/* Footer Status info */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                <span>Timestamp: {new Date(selectedJob.timestamp).toLocaleString()}</span>
                {selectedJob.admitted ? (
                    <span className="flex items-center gap-1 text-green-700 font-medium px-2 py-0.5 bg-green-50 border border-green-200">
                        <CheckCircle className="w-3 h-3" /> Admitted
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-700 font-medium px-2 py-0.5 bg-red-50 border border-red-200">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityFeed;