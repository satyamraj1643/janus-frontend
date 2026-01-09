import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Copy, Check, FileJson, Tag, Layers } from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useToast } from '../components/Toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const response = await jobsAPI.getJob(id);
        if (response.success) {
          setJob(response.data);
        } else {
          setError(response.error || 'Failed to fetch job');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch job');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(job.payload || job, null, 2));
    setCopied(true);
    toast.success('Payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

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
      pending: <Clock className="w-4 h-4" />,
      processing: <Loader2 className="w-4 h-4 animate-spin" />,
      completed: <CheckCircle className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      admitted: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
    };
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium border ${styles[status] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>
        {icons[status] || <AlertTriangle className="w-4 h-4" />}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading job details...</p>
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
            onClick={() => navigate('/jobs')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
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
            onClick={() => navigate('/jobs')}
            className="p-1.5 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900 font-mono">{job?.job_id || id}</h1>
              {getStatusBadge(job?.status || 'pending')}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Job Details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium text-gray-900">Overview</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</label>
                    <p className="mt-1 font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 inline-block">{job?.job_id || id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</label>
                    <p className="mt-1 text-sm text-gray-900">{job?.tenant_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{job?.priority || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</label>
                    <p className="mt-1 text-sm text-gray-900">{job?.batch_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{job?.created_at ? new Date(job.created_at).toLocaleString() : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</label>
                    <p className="mt-1 text-sm text-gray-900">{job?.updated_at ? new Date(job.updated_at).toLocaleString() : '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {job?.dependencies && Object.keys(job.dependencies).length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <h2 className="font-medium text-gray-900">Dependencies</h2>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(job.dependencies).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200">
                        <Tag className="w-3 h-3 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{key}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payload */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-gray-500" />
                  <h2 className="font-medium text-gray-900">Payload</h2>
                </div>
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-900 p-4 overflow-auto max-h-80">
                <pre className="text-sm font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(job?.payload || job, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium text-gray-900">Status</h2>
              </div>
              <div className="p-4">
                {getStatusBadge(job?.status || 'pending')}
                {job?.reason && (
                  <p className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {job.reason}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium text-gray-900">Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                {job?.batch_id && (
                  <button
                    onClick={() => navigate(`/batches/${job.batch_id}`)}
                    className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                  >
                    View Batch
                  </button>
                )}
                <button
                  onClick={() => navigate('/simulate')}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-left"
                >
                  Submit New Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
