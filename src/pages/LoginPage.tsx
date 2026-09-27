import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_USERS = [
  { role: 'visitor' as UserRole, name: 'Demo Visitor', email: 'visitor@demo.liquidcity' },
  { role: 'organizer' as UserRole, name: 'Demo Organizer', email: 'organizer@demo.liquidcity' },
  { role: 'partner' as UserRole, name: 'Demo Restaurant Partner', email: 'partner@demo.liquidcity', partnerType: 'restaurant' },
  { role: 'admin' as UserRole, name: 'Demo Admin', email: 'admin@demo.liquidcity' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expired = params.get('expired') === '1';

  /**
   * NOTE: The backend does not yet have a /auth/login endpoint.
   * When it does, replace this with a real API call that returns user + token.
   * For now, role is determined by email domain pattern for demo purposes.
   *
   * TODO: Backend endpoint required:
   *   POST /auth/login  → { user: User, token: string }
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate auth – derive role from email for demo
      await new Promise((r) => setTimeout(r, 600));

      let role: UserRole = 'visitor';
      if (email.includes('organizer')) role = 'organizer';
      else if (email.includes('partner')) role = 'partner';
      else if (email.includes('admin')) role = 'admin';

      const user = {
        id: `u_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role,
        partnerType: (role === 'partner' ? 'restaurant' : undefined) as 'restaurant' | 'hotel' | 'transport' | undefined,
      };

      login(user, 'demo-token');
      navigate(getDashboardPath(role));
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(u: typeof DEMO_USERS[0]) {
    login(
      {
        id: `demo_${u.role}`,
        email: u.email,
        name: u.name,
        role: u.role,
        partnerType: u.partnerType as 'restaurant' | undefined,
      },
      'demo-token'
    );
    navigate(getDashboardPath(u.role));
  }

  return (
    <div className="min-h-screen bg-beige-200 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-city-black flex items-center justify-center mx-auto mb-4">
          <span className="text-xl font-black text-beige-200">LC</span>
        </div>
        <h1 className="text-2xl font-bold text-city-black tracking-tight">LIQUID CITY</h1>
        <p className="text-sm text-city-muted mt-1">Smart Event & Crowd Management</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="card p-6 shadow-panel">
          <h2 className="text-lg font-bold text-city-black mb-5">Sign in</h2>

          {expired && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <AlertCircle size={14} />
              Session expired. Please sign in again.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-city-muted hover:text-city-gray"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-city-muted">Don't have an account? </span>
            <Link to="/signup" className="text-sm font-medium text-city-black hover:underline">
              Create one
            </Link>
          </div>
        </div>

        {/* Demo mode */}
        {DEMO_MODE && (
          <div className="mt-4 card p-4">
            <p className="text-xs font-bold text-city-muted uppercase tracking-wider mb-3">
              Demo Mode — Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.role}
                  onClick={() => handleDemoLogin(u)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
