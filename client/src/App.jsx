import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ContextualAIChatbot } from './components/ContextualAIChatbot';
import { TasksDrawer } from './components/TasksDrawer';
import { NotificationsDrawer } from './components/NotificationsDrawer';

// Pages
import { Home } from './pages/Home';
import { Opportunities } from './pages/Opportunities';
import { OpportunityDetail } from './pages/OpportunityDetail';
import { CreateOpportunity } from './pages/CreateOpportunity';
import { VendorDirectory } from './pages/VendorDirectory';
import { VendorProfileDetail } from './pages/VendorProfileDetail';
import { ServicesOverview } from './pages/ServicesOverview';
import { ServiceRequestDetail } from './pages/ServiceRequestDetail';
import { InstitutionWorkspace } from './pages/InstitutionWorkspace';
import { VendorWorkspace } from './pages/VendorWorkspace';
import { AdminWorkspace } from './pages/AdminWorkspace';
import { LoginRegister } from './pages/LoginRegister';

function MainApp() {
  const { user } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState('home');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Drawers
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  const handleSelectOpportunity = (id) => {
    setSelectedOpportunityId(id);
    setCurrentView('opportunity-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVendor = (id) => {
    setSelectedVendorId(id);
    setCurrentView('vendor-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectService = (slug) => {
    setSelectedServiceSlug(slug);
    setCurrentView('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRequest = (id) => {
    setSelectedRequestId(id);
    setCurrentView('service-request-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInternalNavigate = (link) => {
    if (!link) return;
    if (link.startsWith('/opportunities/create')) {
      setCurrentView('create-opportunity');
    } else if (link.startsWith('/opportunities/') && link.includes('/proposals')) {
      const oppId = link.split('/')[2];
      setSelectedOpportunityId(oppId);
      setCurrentView('institution-workspace');
    } else if (link.startsWith('/opportunities/')) {
      const oppId = link.split('/')[2];
      handleSelectOpportunity(oppId);
    } else if (link.startsWith('/proposals/')) {
      setCurrentView('dashboard');
    } else if (link.startsWith('/services/requests/')) {
      const reqId = link.split('/')[3];
      handleSelectRequest(reqId);
    } else if (link.startsWith('/services')) {
      setCurrentView('services');
    } else if (link.startsWith('/tasks')) {
      setIsTasksOpen(true);
    } else if (link.startsWith('/dashboard')) {
      setCurrentView('dashboard');
    } else if (link.startsWith('/enquiries/')) {
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine which workspace component to render for 'dashboard'
  const renderDashboard = () => {
    if (!user) {
      return <LoginRegister onComplete={() => setCurrentView('dashboard')} />;
    }
    if (user.role === 'institution') {
      return (
        <InstitutionWorkspace
          onNavigate={setCurrentView}
          onSelectOpportunity={handleSelectOpportunity}
        />
      );
    }
    if (user.role === 'vendor') {
      return (
        <VendorWorkspace
          onNavigate={setCurrentView}
          onSelectOpportunity={handleSelectOpportunity}
        />
      );
    }
    if (user.role === 'admin') {
      return <AdminWorkspace onNavigate={setCurrentView} />;
    }
    if (user.role === 'service_customer') {
      // Default to first service request
      return (
        <ServiceRequestDetail
          requestId="sr-2026-001"
          onBack={() => setCurrentView('services')}
          onNavigate={setCurrentView}
        />
      );
    }
    return <Opportunities onSelectOpportunity={handleSelectOpportunity} onNavigate={setCurrentView} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1F1F1F] text-white selection:bg-[#D8FF45] selection:text-black">
      {/* Main Sticky Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openAssistant={() => setIsAssistantOpen(true)}
        openNotifications={() => setIsNotifsOpen(true)}
        openTasks={() => setIsTasksOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <Home
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectOpportunity={handleSelectOpportunity}
            onSelectVendor={handleSelectVendor}
            onSelectService={handleSelectService}
          />
        )}

        {currentView === 'opportunities' && (
          <Opportunities
            onSelectOpportunity={handleSelectOpportunity}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'opportunity-detail' && selectedOpportunityId && (
          <OpportunityDetail
            opportunityId={selectedOpportunityId}
            onBack={() => setCurrentView('opportunities')}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'create-opportunity' && (
          <CreateOpportunity
            onBack={() => setCurrentView('opportunities')}
            onComplete={(newOppId) => {
              setSelectedOpportunityId(newOppId);
              setCurrentView('opportunity-detail');
            }}
          />
        )}

        {currentView === 'vendors' && (
          <VendorDirectory
            onSelectVendor={handleSelectVendor}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'vendor-detail' && selectedVendorId && (
          <VendorProfileDetail
            vendorId={selectedVendorId}
            onBack={() => setCurrentView('vendors')}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'services' && (
          <ServicesOverview
            selectedServiceSlug={selectedServiceSlug}
            onRequestCreated={(reqId) => {
              setSelectedRequestId(reqId);
              setCurrentView('service-request-detail');
            }}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'service-request-detail' && selectedRequestId && (
          <ServiceRequestDetail
            requestId={selectedRequestId}
            onBack={() => setCurrentView('services')}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'dashboard' && renderDashboard()}

        {currentView === 'institution-workspace' && (
          <InstitutionWorkspace
            onNavigate={setCurrentView}
            onSelectOpportunity={handleSelectOpportunity}
          />
        )}

        {currentView === 'login' && (
          <LoginRegister onComplete={() => setCurrentView('dashboard')} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={setCurrentView} />

      {/* Floating Drawers */}
      <ContextualAIChatbot
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigate={handleInternalNavigate}
      />

      <TasksDrawer
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        onNavigate={handleInternalNavigate}
      />

      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        onNavigate={handleInternalNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
