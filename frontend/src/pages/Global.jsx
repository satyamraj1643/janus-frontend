import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit3, CheckCircle, XCircle, Loader2, AlertTriangle, RefreshCw, Power, PowerOff, Save, X, HelpCircle, ChevronDown, ChevronRight, Info, Zap, Database, Globe, Shield, Clock, Repeat, AlertOctagon } from 'lucide-react';
import { configAPI } from '../services/api';
import { useToast } from '../components/Toast';

// Demo config template with all fields
const DEMO_CONFIG = {
  version: 1,
  global_execution_limit: {
    max_jobs: 100,
    window_ms: 60000,
    max_concurrent_per_tenant: 10,
    min_priority: 0,
    min_interval_ms: 100
  },
  dependencies: {
    payment_gateway: {
      type: "external_api",
      rate_limit: {
        max_requests: 50,
        window_ms: 1000
      },
      concurrent: {
        max_inflight: 10
      },
      min_interval_ms: 200,
      warmup_ms: 5000
    },
    inventory_db: {
      type: "database",
      rate_limit: {
        max_requests: 200,
        window_ms: 1000
      },
      concurrent: {
        max_inflight: 50
      },
      min_interval_ms: 0,
      warmup_ms: 0
    },
    notification_service: {
      type: "internal_service",
      rate_limit: {
        max_requests: 100,
        window_ms: 1000
      },
      concurrent: {
        max_inflight: 25
      },
      min_interval_ms: 50,
      warmup_ms: 2000
    }
  },
  default_job_policy: {
    dependencies: {
      payment_gateway: 1,
      inventory_db: 2
    },
    idempotency_window_ms: 300000,
    scope_limits: {
      per_user: 5,
      per_region: 50
    },
    scope_keys: ["user_id", "region"],
    retry: {
      max_attempts: 3,
      backoff: "exponential",
      initial_delay_ms: 1000
    },
    execution: {
      timeout_ms: 30000
    },
    quarantine: {
      failure_threshold: 5,
      quarantine_duration_ms: 600000,
      monitoring_window_ms: 300000
    }
  }
};

// Field descriptions for tooltips
const FIELD_DESCRIPTIONS = {
  version: "Config schema version. Helps track config changes and migrations.",
  max_jobs: "Maximum total jobs allowed across the entire system within the time window.",
  window_ms: "Time window (in milliseconds) for counting max_jobs.",
  max_concurrent_per_tenant: "Noisy Neighbor Prevention - Limits how many concurrent jobs a single tenant can run.",
  min_priority: "Emergency Kill Switch - Only jobs with priority ≥ this value are admitted. Set high during incidents.",
  min_interval_ms: "Burst Smoothing - Minimum milliseconds between job admissions.",
  dependency_type: "Dependency type: 'external_api', 'internal_service', or 'database'",
  rate_limit_max_requests: "Maximum requests allowed to this dependency per window.",
  rate_limit_window_ms: "Time window for rate limiting (ms).",
  max_inflight: "Maximum simultaneous in-flight requests to this dependency.",
  dep_min_interval_ms: "Minimum time (ms) between requests to this dependency.",
  warmup_ms: "Cold Start Protection - Grace period after startup before applying full rate limits.",
  idempotency_window_ms: "Duplicate Prevention - Time window (ms) to detect and reject duplicate job submissions.",
  scope_limits: "Limits per scope dimension (e.g., per_user: 5 = max 5 concurrent jobs per user).",
  scope_keys: "Which job payload fields to use for scope limits.",
  max_attempts: "Maximum retry attempts before marking job as failed.",
  backoff: "Backoff strategy: 'exponential', 'linear', or 'fixed'.",
  initial_delay_ms: "Initial delay (ms) before first retry.",
  timeout_ms: "Maximum execution time (ms) before job is considered timed out.",
  failure_threshold: "Number of failures ('strikes') before the job is quarantined.",
  quarantine_duration_ms: "How long (ms) to ban the job before allowing retry.",
  monitoring_window_ms: "Time window (ms) during which failures are counted."
};

// Tooltip component
const Tooltip = ({ text }) => (
  <div className="group relative inline-flex ml-1">
    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs max-w-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

// Section header component
const SectionHeader = ({ icon: Icon, title, description, color = "blue", expanded, onToggle }) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
  >
    <div className="flex items-center gap-2">
      <div className={`p-1.5 bg-${color}-100`}>
        <Icon className={`w-4 h-4 text-${color}-600`} />
      </div>
      <div className="text-left">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
    {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
  </button>
);

// Form field component
const FormField = ({ label, tooltip, required, children }) => (
  <div className="space-y-1">
    <label className="flex items-center text-xs font-medium text-gray-600">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
    {children}
  </div>
);

const Global = () => {
  const toast = useToast();
  
  const [configs, setConfigs] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [configName, setConfigName] = useState('');
  const [configJson, setConfigJson] = useState('');
  const [jsonMode, setJsonMode] = useState(false);
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    global: true,
    dependencies: false,
    policy: false,
    retry: false,
    quarantine: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configsResponse, activeResponse] = await Promise.all([
        configAPI.listConfigs(),
        configAPI.getActiveConfig().catch(() => ({ success: false }))
      ]);
      
      if (configsResponse.success) {
        setConfigs(configsResponse.data || []);
      } else {
        setError(configsResponse.error || 'Failed to fetch configs');
      }
      
      if (activeResponse.success) {
        setActiveConfig(activeResponse.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch configs');
      toast.error('Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const openCreateModal = (useDemo = false) => {
    setEditingConfig(null);
    setConfigName(useDemo ? 'Production Config (Demo)' : '');
    setConfigJson(JSON.stringify(useDemo ? DEMO_CONFIG : {
      version: 1,
      global_execution_limit: {
        max_jobs: 100,
        window_ms: 60000
      },
      default_job_policy: {}
    }, null, 2));
    setJsonMode(true);
    setExpandedSections({ global: true, dependencies: false, policy: false, retry: false, quarantine: false });
    setShowModal(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setConfigName(config.config_name || config.name || '');
    setConfigJson(JSON.stringify(config.config || {}, null, 2));
    setJsonMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!configName.trim()) {
      toast.error('Please enter a config name');
      return;
    }

    let configData;
    try {
      configData = JSON.parse(configJson);
    } catch (e) {
      toast.error('Invalid JSON in config');
      return;
    }

    // Validate required fields
    if (!configData.version) {
      toast.error('Config version is required');
      return;
    }
    if (!configData.global_execution_limit?.max_jobs) {
      toast.error('global_execution_limit.max_jobs is required');
      return;
    }
    if (!configData.global_execution_limit?.window_ms) {
      toast.error('global_execution_limit.window_ms is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        config_name: configName,
        config: configData
      };

      let response;
      if (editingConfig) {
        response = await configAPI.updateConfig(editingConfig.id, payload);
      } else {
        response = await configAPI.createConfig(payload);
      }

      if (response.success) {
        toast.success(editingConfig ? 'Configuration updated' : 'Configuration created');
        setShowModal(false);
        fetchConfigs();
      } else {
        toast.error(response.error || 'Failed to save config');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config) => {
    if (!window.confirm(`Are you sure you want to delete "${config.config_name || config.name}"?`)) {
      return;
    }

    try {
      const response = await configAPI.deleteConfig(config.id);
      if (response.success) {
        toast.success('Configuration deleted');
        fetchConfigs();
      } else {
        toast.error(response.error || 'Failed to delete config');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete config');
    }
  };

  const handleActivate = async (config) => {
    try {
      const response = await configAPI.activateConfig(config.id);
      if (response.success) {
        toast.success('Configuration activated');
        fetchConfigs();
      } else {
        toast.error(response.error || 'Failed to activate config');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to activate config');
    }
  };

  const handleDeactivate = async (config) => {
    try {
      const response = await configAPI.deactivateConfig(config.id);
      if (response.success) {
        toast.success('Configuration deactivated');
        setActiveConfig(null);
        fetchConfigs();
      } else {
        toast.error(response.error || 'Failed to deactivate config');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate config');
    }
  };

  const isActive = (config) => activeConfig?.id === config.id;

  // Parse current config for display
  const getCurrentConfig = () => {
    try {
      return JSON.parse(configJson);
    } catch {
      return null;
    }
  };

  const renderConfigSummary = (config) => {
    if (!config) return null;
    
    const gel = config.global_execution_limit || {};
    const deps = config.dependencies || {};
    const policy = config.default_job_policy || {};
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-blue-50 p-2 border border-blue-100">
          <div className="text-blue-600 font-medium">Max Jobs</div>
          <div className="text-gray-900 font-semibold">{gel.max_jobs || '-'}</div>
        </div>
        <div className="bg-green-50 p-2 border border-green-100">
          <div className="text-green-600 font-medium">Window</div>
          <div className="text-gray-900 font-semibold">{gel.window_ms ? `${gel.window_ms/1000}s` : '-'}</div>
        </div>
        <div className="bg-purple-50 p-2 border border-purple-100">
          <div className="text-purple-600 font-medium">Dependencies</div>
          <div className="text-gray-900 font-semibold">{Object.keys(deps).length}</div>
        </div>
        <div className="bg-amber-50 p-2 border border-amber-100">
          <div className="text-amber-600 font-medium">Max Concurrent/Tenant</div>
          <div className="text-gray-900 font-semibold">{gel.max_concurrent_per_tenant || 'Unlimited'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Global Job Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage job admission configurations</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchConfigs}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => openCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              title="Create with demo template"
            >
              <Zap className="w-4 h-4" />
              Demo Config
            </button>
            <button
              onClick={() => openCreateModal(false)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Config
            </button>
          </div>
        </div>
      </div>

      {/* Active Config Banner */}
      {activeConfig && (
        <div className="flex-shrink-0 bg-green-50 border-b border-green-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Active Configuration:</span>
              <span className="text-sm text-green-700">{activeConfig.config_name || activeConfig.name}</span>
            </div>
            <button
              onClick={() => handleDeactivate(activeConfig)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <PowerOff className="w-3 h-3" />
              Deactivate
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading configurations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={fetchConfigs}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : configs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium text-lg">No configurations found</p>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                Create your first configuration to control job admission policies, rate limits, and dependency management.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => openCreateModal(true)}
                  className="px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Start with Demo
                </button>
                <button
                  onClick={() => openCreateModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Create Empty
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 max-w-5xl mx-auto">
            {configs.map((config) => (
              <div
                key={config.id}
                className={`bg-white border overflow-hidden transition-colors ${
                  isActive(config) 
                    ? 'border-green-300 bg-green-50/30' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center ${
                        isActive(config) 
                          ? 'bg-green-600' 
                          : 'bg-gray-500'
                      }`}>
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{config.config_name || config.name}</h3>
                          {isActive(config) && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Created: {config.created_at ? new Date(config.created_at).toLocaleDateString() : '-'}
                          {config.config?.version && <span className="ml-2">• Version {config.config.version}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isActive(config) && (
                        <button
                          onClick={() => handleActivate(config)}
                          className="p-1.5 text-green-600 hover:bg-green-50 transition-colors"
                          title="Activate"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(config)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!isActive(config) && (
                        <button
                          onClick={() => handleDelete(config)}
                          className="p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Config Summary */}
                  {config.config && renderConfigSummary(config.config)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white shadow-lg w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editingConfig ? 'Edit Configuration' : 'New Configuration'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure job admission policies and rate limits</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto">
              <div className="p-5 space-y-4">
                {/* Config Name */}
                <FormField label="Configuration Name" required tooltip="A unique name to identify this configuration">
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Production Config"
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </FormField>

                {/* Help Banner */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 text-sm">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800">
                    <p className="font-medium">Configuration Fields Guide</p>
                    <p className="text-xs mt-1 text-blue-700">
                      <span className="text-red-600 font-medium">Required:</span> version, global_execution_limit.max_jobs, global_execution_limit.window_ms<br/>
                      <span className="text-amber-600 font-medium">Recommended:</span> max_concurrent_per_tenant, dependencies, retry policy, timeout_ms
                    </p>
                  </div>
                </div>

                {/* JSON Editor */}
                <div className="border border-gray-200">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Configuration JSON</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(configJson);
                            setConfigJson(JSON.stringify(parsed, null, 2));
                            toast.success('JSON formatted');
                          } catch (e) {
                            toast.error('Invalid JSON');
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Format
                      </button>
                      <button
                        onClick={() => {
                          setConfigJson(JSON.stringify(DEMO_CONFIG, null, 2));
                          toast.info('Demo config loaded');
                        }}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Load Demo
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    className="w-full h-80 px-3 py-2 font-mono text-sm border-0 focus:outline-none focus:ring-0 resize-none bg-gray-900 text-green-400"
                    spellCheck="false"
                    placeholder={JSON.stringify(DEMO_CONFIG, null, 2)}
                  />
                </div>

                {/* Live Preview */}
                {getCurrentConfig() && (
                  <div className="border border-gray-200">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Configuration Summary</span>
                    </div>
                    <div className="p-3">
                      {renderConfigSummary(getCurrentConfig())}
                      
                      {/* Dependencies List */}
                      {getCurrentConfig()?.dependencies && Object.keys(getCurrentConfig().dependencies).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs font-medium text-gray-600 mb-2">Dependencies:</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(getCurrentConfig().dependencies).map(([name, dep]) => (
                              <div key={name} className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-gray-200 text-xs">
                                {dep.type === 'database' ? <Database className="w-3 h-3 text-blue-600" /> : 
                                 dep.type === 'external_api' ? <Globe className="w-3 h-3 text-green-600" /> :
                                 <Zap className="w-3 h-3 text-amber-600" />}
                                <span className="font-medium text-gray-700">{name}</span>
                                <span className="text-gray-500">({dep.rate_limit?.max_requests || 0}/s)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Policy Summary */}
                      {getCurrentConfig()?.default_job_policy && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                          {getCurrentConfig().default_job_policy.retry && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Repeat className="w-3 h-3" />
                              <span>Retry: {getCurrentConfig().default_job_policy.retry.max_attempts}x {getCurrentConfig().default_job_policy.retry.backoff}</span>
                            </div>
                          )}
                          {getCurrentConfig().default_job_policy.execution?.timeout_ms && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>Timeout: {getCurrentConfig().default_job_policy.execution.timeout_ms/1000}s</span>
                            </div>
                          )}
                          {getCurrentConfig().default_job_policy.quarantine && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Shield className="w-3 h-3" />
                              <span>Quarantine: {getCurrentConfig().default_job_policy.quarantine.failure_threshold} strikes</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {getCurrentConfig() ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Valid JSON
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Invalid JSON
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !getCurrentConfig()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingConfig ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Global;