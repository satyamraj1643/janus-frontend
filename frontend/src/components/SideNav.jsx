import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Zap, Settings as SettingsIcon, PanelLeftClose, PanelLeft, Briefcase, Package, LogOut, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);

  const navItems = [
    { id: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/simulate', label: 'Simulate Jobs', icon: Zap },
    { id: '/jobs', label: 'Jobs', icon: Briefcase },
    { id: '/batches', label: 'Batches', icon: Package },
    { id: '/global', label: 'Global Settings', icon: SettingsIcon }
  ];

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div 
      className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Brand/Logo */}
      <div className={`flex items-center gap-2 px-3 py-3 border-b border-gray-200 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          J
        </div>
        {!isCollapsed && (
          <span className="font-semibold text-gray-900 text-sm">Janus</span>
        )}
      </div>

      {/* Top Navigation Items */}
      <nav className="flex-1 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.id || 
            (item.id !== '/' && location.pathname.startsWith(item.id));
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center px-2 py-2 mb-0.5 transition-colors group relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 -ml-0.5 pl-2.5'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center' : 'gap-2'}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              {!isCollapsed && (
                <span 
                  className={`text-sm ${
                    isActive ? 'font-medium' : 'font-normal'
                  }`}
                >
                  {item.label}
                </span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      {user && (
        <div className={`px-2 py-2 border-t border-gray-200`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-7 h-7 bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors group relative"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Logout
              </div>
            </button>
          )}
        </div>
      )}

      {/* Toggle Button at Bottom */}
      <div className={`px-2 py-2 border-t border-gray-200 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SideNav;