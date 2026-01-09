import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Loader2, AlertTriangle, RefreshCw, Calendar, Hash } from 'lucide-react';
import { batchesAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

const Batches = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 15;

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      };

      const response = await batchesAPI.listBatches(params);
      if (response.success) {
        setBatches(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalItems(response.total_items || 0);
      } else {
        setError(response.error || 'Failed to fetch batches');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch batches');
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [currentPage]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Batches</h1>
            <p className="text-sm text-gray-500 mt-0.5">View job batch submissions</p>
          </div>
          <button
            onClick={fetchBatches}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading batches...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={fetchBatches}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No batches found</p>
              <p className="text-sm text-gray-400 mt-1">Batches will appear here once submitted</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {batches.map((batch) => (
              <div
                key={batch.id || batch.batch_id}
                onClick={() => navigate(`/batches/${batch.id || batch.batch_id}`)}
                className="bg-white border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {batch.batch_name || batch.name || `Batch ${batch.id}`}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {batch.id || batch.batch_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {batch.job_count !== undefined && (
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">{batch.job_count}</div>
                        <div className="text-xs text-gray-500">Jobs</div>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 p-4 bg-white border border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  perPage={perPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Batches;
