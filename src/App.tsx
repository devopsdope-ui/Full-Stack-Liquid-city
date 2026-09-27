import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';

// Public pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Visitor pages
import VisitorDashboard from './pages/visitor/VisitorDashboard';
import VisitorRestaurantsPage from './pages/visitor/VisitorRestaurantsPage';
import VisitorHotelsPage from './pages/visitor/VisitorHotelsPage';
import VisitorRoutesPage from './pages/visitor/VisitorRoutesPage';
import VisitorJourneyPage from './pages/visitor/VisitorJourneyPage';

// Organizer pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import OrganizerSetupPage from './pages/organizer/OrganizerSetupPage';
import OrganizerPlanningPage from './pages/organizer/OrganizerPlanningPage';
import OrganizerTimelinePage from './pages/organizer/OrganizerTimelinePage';
import OrganizerCrowdPage from './pages/organizer/OrganizerCrowdPage';
import OrganizerAllocationsPage from './pages/organizer/OrganizerAllocationsPage';
import OrganizerVolunteersPage from './pages/organizer/OrganizerVolunteersPage';

// Partner pages
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerAvailabilityPage from './pages/partner/PartnerAvailabilityPage';
import PartnerOffersPage from './pages/partner/PartnerOffersPage';
import PartnerCrowdMapPage from './pages/partner/PartnerCrowdMapPage';
import PartnerAnalyticsPage from './pages/partner/PartnerAnalyticsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminCrowdPage from './pages/admin/AdminCrowdPage';
import AdminPartnersPage from './pages/admin/AdminPartnersPage';
import AdminSimulationPage from './pages/admin/AdminSimulationPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';

// Shared / Digital Twin
import DigitalTwinPage from './pages/shared/DigitalTwinPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Visitor Routes */}
          <Route path="/visitor" element={<ProtectedRoute allowedRole="visitor" />}>
            <Route index element={<VisitorDashboard />} />
            <Route path="map" element={<VisitorDashboard />} />
            <Route path="restaurants" element={<VisitorRestaurantsPage />} />
            <Route path="hotels" element={<VisitorHotelsPage />} />
            <Route path="routes" element={<VisitorRoutesPage />} />
            <Route path="journey" element={<VisitorJourneyPage />} />
          </Route>

          {/* Organizer Routes */}
          <Route path="/organizer" element={<ProtectedRoute allowedRole="organizer" />}>
            <Route index element={<OrganizerDashboard />} />
            <Route path="setup" element={<OrganizerSetupPage />} />
            <Route path="planning" element={<OrganizerPlanningPage />} />
            <Route path="timeline" element={<OrganizerTimelinePage />} />
            <Route path="crowd" element={<OrganizerCrowdPage />} />
            <Route path="allocations" element={<OrganizerAllocationsPage />} />
            <Route path="volunteers" element={<OrganizerVolunteersPage />} />
            <Route path="digital-twin" element={<DigitalTwinPage />} />
            <Route path="live" element={<OrganizerCrowdPage />} />
          </Route>

          {/* Partner Routes */}
          <Route path="/partner" element={<ProtectedRoute allowedRole="partner" />}>
            <Route index element={<PartnerDashboard />} />
            <Route path="crowd-map" element={<PartnerCrowdMapPage />} />
            <Route path="business" element={<PartnerDashboard />} />
            <Route path="availability" element={<PartnerAvailabilityPage />} />
            <Route path="offers" element={<PartnerOffersPage />} />
            <Route path="orders" element={<PartnerAvailabilityPage />} />
            <Route path="analytics" element={<PartnerAnalyticsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="crowd" element={<AdminCrowdPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="simulation" element={<AdminSimulationPage />} />
            <Route path="digital-twin" element={<DigitalTwinPage />} />
            <Route path="system" element={<AdminSystemPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
