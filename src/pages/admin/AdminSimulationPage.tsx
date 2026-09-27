import React, { useState } from 'react';
import { adminSimulationService } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { ErrorState } from '../../components/ui/ErrorState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';

export const AdminSimulationPage: React.FC = () => {
  const { data: simStatus, loading, error, refetch } = usePolling(adminSimulationService.getStatus, { interval: 10000 });
  const [lastAction, setLastAction] = useState<string | null>(null);

  const [surgeLoc, setSurgeLoc] = useState('');
  const [surgeAmount, setSurgeAmount] = useState(50);
  
  const [trafficRoad, setTrafficRoad] = useState('');
  const [trafficAmount, setTrafficAmount] = useState(50);

  const [attendance, setAttendance] = useState(10000);
  
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantOcc, setRestaurantOcc] = useState(80);

  const handleAction = async (actionFn: () => Promise<any>, actionName: string) => {
    try {
      await actionFn();
      setLastAction(`Successfully executed: ${actionName}`);
      refetch();
    } catch (err) {
      setLastAction(`Failed to execute ${actionName}`);
    }
  };

  if (error) return <ErrorState message="Failed to load simulation status" />;

  return (
    <div className="space-y-6">
      <h1 className="section-title text-city-charcoal">Simulation Control Center</h1>

      {lastAction && (
        <div className="p-4 bg-beige-100 text-city-charcoal border border-city-border rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {lastAction}
        </div>
      )}

      {/* Main Controls */}
      <div className="card bg-white flex gap-4">
        <button 
          onClick={() => handleAction(() => adminSimulationService.start(), 'Start Simulation')}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Play className="w-5 h-5" /> START
        </button>
        <button 
          onClick={() => handleAction(() => adminSimulationService.pause(), 'Pause Simulation')}
          className="btn-primary flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Pause className="w-5 h-5" /> PAUSE
        </button>
        <button 
          onClick={() => handleAction(() => adminSimulationService.reset(), 'Reset Simulation')}
          className="btn-danger flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> RESET
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Display */}
        <div className="card bg-white">
          <h2 className="text-xl font-bold mb-4">Simulation Status</h2>
          {loading && !simStatus ? (
            <div className="skeleton w-full h-40"></div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Status: </span>
                {simStatus?.simulation_running ? (
                  <span className="badge badge-green">Running</span>
                ) : (
                  <span className="badge badge-gray">Stopped</span>
                )}
              </div>
              <div>
                <span className="font-semibold">Event Attendance: </span>
                {simStatus?.event_attendance || 0}
              </div>
              <div>
                <span className="font-semibold">Event Progress: </span>
                <ProgressBar value={simStatus?.event_progress || 0} max={100} />
              </div>
              <div>
                <span className="font-semibold">Stadium Crowd: </span>
                {simStatus?.stadium_crowd || 0}%
              </div>
              <div>
                <span className="font-semibold">Road Congestion: </span>
                <div className="text-sm bg-beige-200 p-2 rounded mt-1 overflow-auto max-h-32">
                  {simStatus?.road_congestion ? JSON.stringify(simStatus.road_congestion) : 'None'}
                </div>
              </div>
              <div>
                <span className="font-semibold">Restaurants: </span>
                <div className="text-sm bg-beige-200 p-2 rounded mt-1 overflow-auto max-h-32">
                  {simStatus?.restaurants ? JSON.stringify(simStatus.restaurants) : 'None'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scenarios */}
        <div className="card bg-white space-y-6">
          <h2 className="text-xl font-bold">Trigger Scenarios</h2>
          
          <div className="space-y-2 border-b pb-4">
            <h3 className="font-semibold">Crowd Surge</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Location ID" className="input flex-1" value={surgeLoc} onChange={e => setSurgeLoc(e.target.value)} />
              <input type="number" className="input w-24" value={surgeAmount} onChange={e => setSurgeAmount(Number(e.target.value))} />
              <button className="btn-secondary" onClick={() => handleAction(() => adminSimulationService.crowdSurge({ location_id: surgeLoc, amount: surgeAmount }), 'Crowd Surge')}>Trigger</button>
            </div>
          </div>

          <div className="space-y-2 border-b pb-4">
            <h3 className="font-semibold">Traffic Jam</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Road ID" className="input flex-1" value={trafficRoad} onChange={e => setTrafficRoad(e.target.value)} />
              <input type="number" className="input w-24" value={trafficAmount} onChange={e => setTrafficAmount(Number(e.target.value))} />
              <button className="btn-secondary" onClick={() => handleAction(() => adminSimulationService.trafficJam({ road_id: trafficRoad, amount: trafficAmount }), 'Traffic Jam')}>Trigger</button>
            </div>
          </div>

          <div className="space-y-2 border-b pb-4">
            <h3 className="font-semibold">Event End</h3>
            <button className="btn-secondary w-full" onClick={() => {
              if (window.confirm('Are you sure you want to end the event?')) {
                handleAction(() => adminSimulationService.eventEnd(), 'Event End');
              }
            }}>End Event Now</button>
          </div>

          <div className="space-y-2 border-b pb-4">
            <h3 className="font-semibold">Set Attendance</h3>
            <div className="flex gap-2">
              <input type="number" className="input flex-1" value={attendance} onChange={e => setAttendance(Number(e.target.value))} />
              <button className="btn-secondary" onClick={() => handleAction(() => adminSimulationService.setAttendance({ event_attendance: attendance }), 'Set Attendance')}>Update</button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Restaurant Occupancy</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Partner ID" className="input flex-1" value={restaurantId} onChange={e => setRestaurantId(e.target.value)} />
              <input type="number" className="input w-24" value={restaurantOcc} onChange={e => setRestaurantOcc(Number(e.target.value))} />
              <button className="btn-secondary" onClick={() => handleAction(() => adminSimulationService.restaurantOccupancy({ partner_id: restaurantId, occupancy: restaurantOcc }), 'Set Restaurant Occupancy')}>Set</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSimulationPage;
