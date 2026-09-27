import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Map, UtensilsCrossed, Hotel, Navigation,
  Route, Users, Calendar, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Briefcase, Truck,
  Activity, Zap, Globe, ShieldCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'visitor':
      return [
        { label: 'Dashboard', path: '/visitor', icon: <LayoutDashboard size={18} /> },
        { label: 'Map', path: '/visitor/map', icon: <Map size={18} /> },
        { label: 'Restaurants', path: '/visitor/restaurants', icon: <UtensilsCrossed size={18} /> },
        { label: 'Hotels', path: '/visitor/hotels', icon: <Hotel size={18} /> },
        { label: 'Routes', path: '/visitor/routes', icon: <Route size={18} /> },
        { label: 'My Journey', path: '/visitor/journey', icon: <Navigation size={18} /> },
      ];
    case 'organizer':
      return [
        { label: 'Dashboard', path: '/organizer', icon: <LayoutDashboard size={18} /> },
        { label: 'Event Setup', path: '/organizer/setup', icon: <Calendar size={18} /> },
        { label: 'Timeline', path: '/organizer/timeline', icon: <Activity size={18} /> },
        { label: 'Crowd', path: '/organizer/crowd', icon: <Users size={18} /> },
        { label: 'Allocations', path: '/organizer/allocations', icon: <BarChart3 size={18} /> },
        { label: 'Volunteers', path: '/organizer/volunteers', icon: <Users size={18} /> },
        { label: 'Digital Twin', path: '/organizer/digital-twin', icon: <Globe size={18} /> },
        { label: 'Live Event', path: '/organizer/live', icon: <Zap size={18} /> },
      ];
    case 'partner':
      return [
        { label: 'Dashboard', path: '/partner', icon: <LayoutDashboard size={18} /> },
        { label: 'Crowd Map', path: '/partner/crowd-map', icon: <Map size={18} /> },
        { label: 'Business', path: '/partner/business', icon: <Briefcase size={18} /> },
        { label: 'Availability', path: '/partner/availability', icon: <Calendar size={18} /> },
        { label: 'Offers', path: '/partner/offers', icon: <Zap size={18} /> },
        { label: 'Orders', path: '/partner/orders', icon: <Users size={18} /> },
        { label: 'Analytics', path: '/partner/analytics', icon: <BarChart3 size={18} /> },
      ];
    case 'admin':
      return [
        { label: 'Overview', path: '/admin', icon: <LayoutDashboard size={18} /> },
        { label: 'Events', path: '/admin/events', icon: <Calendar size={18} /> },
        { label: 'Crowd', path: '/admin/crowd', icon: <Users size={18} /> },
        { label: 'Partners', path: '/admin/partners', icon: <Briefcase size={18} /> },
        { label: 'Simulation', path: '/admin/simulation', icon: <Zap size={18} /> },
        { label: 'Digital Twin', path: '/admin/digital-twin', icon: <Globe size={18} /> },
        { label: 'System', path: '/admin/system', icon: <Settings size={18} /> },
      ];
    default:
      return [];
  }
}

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user ? getNavItems(user.role) : [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleColor: Record<string, string> = {
    visitor: 'bg-blue-100 text-blue-700',
    organizer: 'bg-purple-100 text-purple-700',
    partner: 'bg-green-100 text-green-700',
    admin: 'bg-red-100 text-red-700',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-beige-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-city-black">LC</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white tracking-tight">LIQUID CITY</div>
            <div className="text-xs text-white/50">Smart City Platform</div>
          </div>
        )}
      </div>

      {/* User role badge */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="text-xs text-white/60 mb-1 truncate">{user.email}</div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[user.role] || 'bg-gray-100 text-gray-600'}`}>
            {user.role.toUpperCase()}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user?.role}`}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-beige-200 text-city-black font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-beige-200">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-city-black transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-city-black flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-city-black border-b border-white/10">
          <button onClick={() => setMobileOpen(true)} className="text-white">
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-white">LIQUID CITY</span>
          {user && (
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[user.role] || ''}`}>
              {user.role.toUpperCase()}
            </span>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
