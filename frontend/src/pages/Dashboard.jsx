import React, { useEffect, useState } from 'react';
import { Layers, CheckCircle, XCircle, Activity, Play, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import RejectionChart from '../components/dashboard/RejectionChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Dashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [stats, setStats] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsResponse, jobsResponse] = await Promise.all([
                jobsAPI.getStats().catch(() => ({ success: false })),
                jobsAPI.listJobs({ page: 1, per_page: 50 }).catch(() => ({ success: false }))
            ]);

            if (statsResponse.success) {
                setStats(statsResponse.data);
            } else {
                setStats({
                    total_requests: 0,
                    admitted_requests: 0,
                    rejected_requests: 0,
                    rejection_reasons: {}
                });
            }

            if (jobsResponse.success && jobsResponse.data) {
                const decisions = jobsResponse.data.map(job => ({
                    job_id: job.job_id || job.id,
                    admitted: job.status === 'admitted' || job.status === 'completed',
                    reason: job.reason || job.status || 'pending',
                    timestamp: job.created_at || new Date().toISOString(),
                    payload: job.payload || {}
                }));
                setRecentJobs(decisions);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load dashboard data');
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const acceptanceRate = stats?.total_requests > 0 
        ? ((stats.admitted_requests / stats.total_requests) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Real-time system overview and analytics</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchDashboardData}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button 
                            onClick={() => navigate('/simulate')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Simulate Job
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                <div className="p-6 max-w-[1600px] mx-auto">
                    <div className="flex flex-col gap-6">
                        {/* KPI Cards Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard 
                                title="Total Jobs" 
                                value={(stats?.total_requests || 0).toLocaleString()} 
                                icon={Layers} 
                                color="bg-blue-500" 
                            />
                            <KPICard 
                                title="Admitted" 
                                value={(stats?.admitted_requests || 0).toLocaleString()} 
                                icon={CheckCircle} 
                                color="bg-green-500" 
                            />
                            <KPICard 
                                title="Rejected" 
                                value={(stats?.rejected_requests || 0).toLocaleString()} 
                                icon={XCircle} 
                                color="bg-red-500" 
                            />
                            <KPICard 
                                title="Acceptance Rate" 
                                value={`${acceptanceRate}%`} 
                                icon={Activity} 
                                color="bg-purple-500" 
                            />
                        </div>

                        {/* Charts and Activity Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Rejection Chart */}
                            <div className="lg:col-span-1 h-[380px]">
                                <RejectionChart data={stats?.rejection_reasons || {}} />
                            </div>

                            {/* Activity Feed */}
                            <div className="lg:col-span-2 h-[380px]">
                                <ActivityFeed decisions={recentJobs} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;