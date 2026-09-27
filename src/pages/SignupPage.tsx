import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { Check, Users, Calendar, Briefcase } from 'lucide-react';

type Role = 'visitor' | 'organizer' | 'partner';

interface RoleCard {
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'visitor',
    label: 'Visitor',
    description: 'Explore events, restaurants, hotels and routes.',
    icon: <Users size={24} />,
  },
  {
    role: 'organizer',
    label: 'Organizer',
    description: 'Plan and manage events and crowd movement.',
    icon: <Calendar size={24} />,
  },
  {
    role: 'partner',
    label: 'Partner',
    description: 'Manage your business, availability and offers.',
    icon: <Briefcase size={24} />,
  },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('visitor');
  const [partnerType, setPartnerType] = useState('restaurant');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * NOTE: Backend /auth/signup endpoint not yet available.
   * TODO: Backend endpoint required:
   *   POST /auth/signup → { user: User, token: string }
   */
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 700));
      const user = {
        id: `u_${Date.now()}`,
        email: form.email,
        name: form.name,
        role: selectedRole as UserRole,
        partnerType: selectedRole === 'partner' ? (partnerType as 'restaurant' | 'hotel' | 'transport') : undefined,
      };
      login(user, 'demo-token');
      navigate(getDashboardPath(selectedRole as UserRole));
    } catch {
      setError('Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-beige-200 flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-city-black flex items-center justify-center mx-auto mb-3">
          <span className="text-lg font-black text-beige-200">LC</span>
        </div>
        <h1 className="text-2xl font-bold text-city-black">Create your Liquid City account</h1>
        <p className="text-sm text-city-muted mt-1">Join the smart city platform</p>
      </div>

      <div className="w-full max-w-lg">
        <div className="card p-6 shadow-panel">
          {/* Role selection */}
          <div className="mb-6">
            <p className="label mb-3">I am a…</p>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => setSelectedRole(card.role)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                    selectedRole === card.role
                      ? 'border-city-black bg-city-black text-white'
                      : 'border-city-border bg-white text-city-charcoal hover:border-city-dark'
                  }`}
                >
                  {selectedRole === card.role && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <Check size={10} className="text-city-black" />
                    </div>
                  )}
                  <span>{card.icon}</span>
                  <div>
                    <div className="text-sm font-bold">{card.label}</div>
                    <div className={`text-xs mt-0.5 leading-tight ${selectedRole === card.role ? 'text-white/70' : 'text-city-muted'}`}>
                      {card.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Partner type */}
          {selectedRole === 'partner' && (
            <div className="mb-5">
              <label className="label">Business type</label>
              <select
                className="input"
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
              >
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="transport">Transport</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-city-muted">Already have an account? </span>
            <Link to="/login" className="text-sm font-medium text-city-black hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
