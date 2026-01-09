import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2, AlertTriangle, ChevronRight, Clock, CheckCircle, XCircle, Calendar, Hash } from 'lucide-react';
import { batchesAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [batch, setBatch] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Jobs pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;

  useEffect(() => {
    const fetchBatch = async () => {
      setLoading(true);
      try {
        const response = await batchesAPI.getBatch(id);
        if (response.success) {
          setBatch(response.data);
        } else {
          setError(response.error || 'Failed to fetch batch');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch batch');
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [id]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await batchesAPI.getBatchJobs(id, {
        page: currentPage,
        per_page: perPage,
      });
      if (response.success) {
        setJobs(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalItems(response.total_items || 0);
      }
    } catch (err) {
      toast.error('Failed to fetch batch jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (batch) {
      fetchJobs();
    }
  }, [batch, currentPage]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-800 border-amber-200',
      processing: 'bg-blue-50 text-blue-800 border-blue-200',
      completed: 'bg-green-50 text-green-800 border-green-200',
      failed: 'bg-red-50 text-red-800 border-red-200',
      admitted: 'bg-green-50 text-green-800 border-green-200',
      rejected: 'bg-red-50 text-red-800 border-red-200',
    };
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      processing: <Loader2 className="w-3 h-3 animate-spin" />,
      completed: <CheckCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
      admitted: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${styles[status] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>
        {icons[status] || <AlertTriangle className="w-3 h-3" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/batches')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/batches')}
            className="p-1.5 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{batch?.batch_name || batch?.name || `Batch ${id}`}</h1>
                <p className="text-sm text-gray-500">Batch Details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Batch Info Card */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-medium text-gray-900">Batch Information</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    <Hash className="w-3 h-3" />
                    Batch ID
                  </div>
                  <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 inline-block">
                    {batch?.id || id}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    <Package className="w-3 h-3" />
                    Total Jobs
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{batch?.job_count || totalItems || '-'}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    <Calendar className="w-3 h-3" />
                    Created
                  </div>
                  <p className="text-sm text-gray-900">
                    {batch?.created_at ? new Date(batch.created_at).toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    <Clock className="w-3 h-3" />
                    Status
                  </div>
                  {getStatusBadge(batch?.status || 'pending')}
                </div>
              </div>
            </div>
          </div>

          {/* Jobs in Batch */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-medium text-gray-900">Jobs in Batch</h2>
              <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 font-medium">
                {totalItems} Jobs
              </span>
            </div>
            
            {jobsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No jobs found in this batch
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Job ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr 
                        key={job.id || job.job_id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors group border-b border-gray-100"
                        onClick={() => navigate(`/jobs/${job.id || job.job_id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-800 bg-gray-100 px-1.5 py-0.5">
                            {job.job_id || job.id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {job.tenant_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                          {job.priority || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(job.status || 'pending')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-4 h-4 text-gray-400 inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      perPage={perPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchDetail;
