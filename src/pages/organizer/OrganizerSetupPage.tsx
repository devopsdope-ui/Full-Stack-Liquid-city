import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaireService } from '../../services/questionnaireService';
import type { QuestionnaireSubmission, ZoneInput, ActivityInput } from '../../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = ['Basics', 'Venue', 'Schedule', 'Resources', 'Priorities', 'Submit'];

export default function OrganizerSetupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<QuestionnaireSubmission>>({
    event_type: 'Conference',
    expected_attendance: 1000,
    venue_name: '',
    venue_city: '',
    venue_type: 'indoor',
    zones: [],
    entrances: [],
    normal_exits: [],
    emergency_exits: [],
    activities: [],
    groups: { enabled: false },
    resources: {
      food: { selected: false },
      parking: { selected: false },
      public_transport: { selected: false },
      shuttle: { selected: false },
      registration: { selected: false },
      restrooms: { selected: false },
      medical: { selected: false },
      security: { selected: false },
      exhibition: { selected: false },
      accommodation: { selected: false },
    },
    priorities: [],
  });

  const handleNext = () => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1));
  const handlePrev = () => setCurrentStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await questionnaireService.submit(formData as QuestionnaireSubmission);
      navigate(`/organizer/planning?event_model_id=${res.event_model_id}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <h1 className="section-title mb-6">Organize New Event</h1>
        
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-city-charcoal -z-10 transition-all" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}></div>
          {STEPS.map((step, idx) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${idx <= currentStep ? 'bg-city-charcoal text-white border-city-charcoal' : 'bg-white text-gray-400 border-gray-300'}`}>
                {idx + 1}
              </div>
              <span className="text-xs mt-2 font-medium hidden sm:block">{step}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
          
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Event Basics</h2>
              <div>
                <label className="label">Event Type</label>
                <select 
                  className="input" 
                  value={formData.event_type} 
                  onChange={e => setFormData({...formData, event_type: e.target.value})}
                >
                  {['Hackathon', 'Conference', 'Concert', 'Sports Event', 'Exhibition', 'Festival', 'Workshop', 'Corporate Event', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Expected Attendance</label>
                <input 
                  type="number" 
                  className="input" 
                  value={formData.expected_attendance || ''} 
                  onChange={e => setFormData({...formData, expected_attendance: parseInt(e.target.value)})} 
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Venue Information</h2>
              <div>
                <label className="label">Venue Name</label>
                <input className="input" value={formData.venue_name || ''} onChange={e => setFormData({...formData, venue_name: e.target.value})} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={formData.venue_city || ''} onChange={e => setFormData({...formData, venue_city: e.target.value})} />
              </div>
              <div>
                <label className="label">Venue Type</label>
                <select className="input" value={formData.venue_type} onChange={e => setFormData({...formData, venue_type: e.target.value as any})}>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Schedule & Activities</h2>
              <p className="text-sm text-gray-500">Add key activities to your schedule.</p>
              <button 
                className="btn-secondary text-sm"
                onClick={() => setFormData({...formData, activities: [...(formData.activities || []), { name: '', start: '', end: '', zone: '' }]})}
              >
                + Add Activity
              </button>
              {formData.activities?.map((act, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input className="input" placeholder="Name" value={act.name} onChange={e => {
                    const newActs = [...formData.activities!];
                    newActs[idx].name = e.target.value;
                    setFormData({...formData, activities: newActs});
                  }} />
                  <input type="time" className="input" value={act.start} onChange={e => {
                     const newActs = [...formData.activities!];
                     newActs[idx].start = e.target.value;
                     setFormData({...formData, activities: newActs});
                  }} />
                  <input type="time" className="input" value={act.end} onChange={e => {
                     const newActs = [...formData.activities!];
                     newActs[idx].end = e.target.value;
                     setFormData({...formData, activities: newActs});
                  }} />
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Groups & Resources</h2>
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="groups-toggle" checked={formData.groups?.enabled} onChange={e => setFormData({...formData, groups: { enabled: e.target.checked }})} />
                <label htmlFor="groups-toggle">Attendees will arrive in groups/teams</label>
              </div>
              <h3 className="font-semibold text-sm">Required Resources</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(formData.resources || {}).map(res => (
                  <div key={res} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`res-${res}`} 
                      checked={(formData.resources as any)[res]?.selected} 
                      onChange={e => setFormData({
                        ...formData, 
                        resources: { ...formData.resources, [res]: { selected: e.target.checked } } as any
                      })} 
                    />
                    <label htmlFor={`res-${res}`} className="capitalize">{res.replace('_', ' ')}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Priorities & Upload</h2>
              <p className="text-sm text-gray-500">Select your main priorities for the event plan.</p>
              <div className="space-y-2">
                {['avoid_overcrowding', 'reduce_entry_queues', 'manage_food_crowds', 'smooth_event_exit'].map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`pri-${p}`} 
                      checked={formData.priorities?.includes(p as any)}
                      onChange={e => {
                        const pris = formData.priorities || [];
                        if (e.target.checked) setFormData({...formData, priorities: [...pris, p as any]});
                        else setFormData({...formData, priorities: pris.filter(x => x !== p)});
                      }}
                    />
                    <label htmlFor={`pri-${p}`} className="capitalize">{p.replace(/_/g, ' ')}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Ready to Submit</h2>
              <p className="text-gray-600">Review your event details. Once submitted, our system will analyze the requirements and generate a comprehensive operational plan.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-city-border">
          <button 
            className="btn-secondary flex items-center gap-2" 
            onClick={handlePrev} 
            disabled={currentStep === 0 || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          
          {currentStep === STEPS.length - 1 ? (
            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Generate Plan'}
            </button>
          ) : (
            <button className="btn-primary flex items-center gap-2" onClick={handleNext}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
