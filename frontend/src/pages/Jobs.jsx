import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Filter, ChevronRight, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

const Jobs = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 15;
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      };
      if (statusFilter) params.status = statusFilter;
      if (batchFilter) params.batch_id = batchFilter;

      const response = await jobsAPI.listJobs(params);
      if (response.success) {
        setJobs(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalItems(response.total_items || 0);
      } else {
        setError(response.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch jobs');
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, statusFilter, batchFilter]);

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

  const filteredJobs = searchQuery 
    ? jobs.filter(job => 
        job.job_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.tenant_id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-0.5">View and manage job submissions</p>
          </div>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Job ID or Tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-2 py-1.5 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Batch Filter */}
          <input
            type="text"
            placeholder="Filter by Batch ID..."
            value={batchFilter}
            onChange={(e) => { setBatchFilter(e.target.value); setCurrentPage(1); }}
            className="px-2 py-1.5 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading jobs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={fetchJobs}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No jobs found</p>
              <p className="text-sm text-gray-400 mt-1">Jobs will appear here once submitted</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Job ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-400 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                perPage={perPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
