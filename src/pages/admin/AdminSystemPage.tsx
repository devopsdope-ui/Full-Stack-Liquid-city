import React, { useEffect, useState } from 'react';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { CheckCircle, XCircle, Activity, Globe } from 'lucide-react';
import { eventService, crowdService, roadService, partnerService, recommendationService, adminSimulationService } from '../../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const AdminSystemPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [servicesStatus, setServicesStatus] = useState<Record<string, boolean | null>>({
    Events: null,
    Crowd: null,
    Roads: null,
    Partners: null,
    Recommendations: null,
    Simulation: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystem = async () => {
      setLoading(true);
      
      // Global health
      try {
        const rootRes = await fetch(API_BASE_URL.replace('/api/v1', '/'));
        const healthRes = await fetch(API_BASE_URL.replace('/api/v1', '/health'));
        const healthData = await healthRes.json().catch(() => null);
        setHealthStatus({ ok: healthRes.ok, data: healthData });
      } catch (err) {
        setHealthStatus({ ok: false, data: null });
      }

      // Check services
      const checks = [
        { name: 'Events', fn: eventService.getAll },
        { name: 'Crowd', fn: crowdService.getAll },
        { name: 'Roads', fn: roadService.getAll },
        { name: 'Partners', fn: partnerService.getAll },
        { name: 'Recommendations', fn: () => recommendationService.getRestaurants() },
        { name: 'Simulation', fn: adminSimulationService.getStatus }
      ];

      for (const check of checks) {
        try {
          await check.fn();
          setServicesStatus(prev => ({ ...prev, [check.name]: true }));
        } catch (e) {
          setServicesStatus(prev => ({ ...prev, [check.name]: false }));
        }
      }
      
      setLoading(false);
    };

    checkSystem();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-city-charcoal">System Status</h1>

      <div className="card bg-white">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" /> Environment
        </h2>
        <div className="p-4 bg-beige-100 rounded border border-city-border">
          <div className="font-mono text-sm">
            <span className="font-bold">API Base URL:</span> {API_BASE_URL}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Core Health
          </h2>
          {loading && !healthStatus ? (
            <CardSkeleton />
          ) : (
            <div className="flex items-center gap-4 p-4 border rounded">
              {healthStatus?.ok ? (
                <CheckCircle className="w-10 h-10 text-green-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500" />
              )}
              <div>
                <h3 className="font-bold text-lg">
                  Backend API {healthStatus?.ok ? 'Online' : 'Offline'}
                </h3>
                <p className="text-sm text-gray-600">
                  {healthStatus?.data ? JSON.stringify(healthStatus.data) : 'No health data available'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card bg-white">
          <h2 className="text-xl font-bold mb-4">Service Connectivity</h2>
          <div className="space-y-3">
            {Object.entries(servicesStatus).map(([name, status]) => (
              <div key={name} className="flex justify-between items-center p-3 border rounded bg-beige-50">
                <span className="font-semibold">{name} Service</span>
                {status === null ? (
                  <span className="badge badge-gray animate-pulse">Checking...</span>
                ) : status ? (
                  <span className="badge badge-green flex items-center gap-1"><CheckCircle className="w-3 h-3"/> OK</span>
                ) : (
                  <span className="badge badge-red flex items-center gap-1"><XCircle className="w-3 h-3"/> Error</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemPage;
