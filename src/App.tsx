import React from 'react';
import { useNeuroScopeState } from './hooks/useNeuroScopeState';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { TopToolbar } from './components/layout/TopToolbar';
import { Sidebar } from './components/layout/Sidebar';
import { WorkspacePage } from './pages/WorkspacePage';
import { SegmentationPage } from './pages/SegmentationPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { ReportsPage } from './pages/ReportsPage';
import { ModelInfoPage } from './pages/ModelInfoPage';
import { SettingsPage } from './pages/SettingsPage';
import { NiftiUploadModal } from './components/upload/NiftiUploadModal';
import { HelpGuideModal } from './components/common/HelpGuideModal';
import { LandingPage } from './pages/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { LoginPage } from './pages/LoginPage';
import { MultiPatientDemoSelectorModal } from './components/demo/MultiPatientDemoSelectorModal';
import { PipelineArchitecturePage } from './pages/PipelineArchitecturePage';

const AppContent: React.FC = () => {
  const state = useNeuroScopeState();
  const { isAuthenticated, user, role, openAuthModal } = useAuth();

  // MANDATORY SECURITY GATE:
  // Cannot use the website without authenticating as doctor or patient
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // If authenticated as a Patient, display dedicated Patient Portal
  if (role === 'patient') {
    return (
      <div className="min-h-screen w-screen bg-slate-50 overflow-y-auto font-sans">
        <PatientPortalPage
          onGoHome={() => state.setActivePage('landing')}
        />
        <AuthModal />
      </div>
    );
  }

  // If authenticated as Doctor and on the Product Overview / Landing Page
  if (state.activePage === 'landing') {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-y-auto font-sans">
        <LandingPage
          onLaunchWorkstation={() => state.setActivePage('workspace')}
          onLoadDemoCase={() => {
            state.loadDemoCase();
            state.setActivePage('workspace');
          }}
          onOpenUpload={() => state.setIsUploadModalOpen(true)}
          onOpenDoctorLogin={() => openAuthModal('doctor')}
          onOpenPatientLogin={() => openAuthModal('patient')}
          backendStatus={state.backendStatus}
          activeModelName={state.modelReliability.modelName}
        />

        {/* Modals accessible from landing page */}
        <NiftiUploadModal
          isOpen={state.isUploadModalOpen}
          onClose={() => state.setIsUploadModalOpen(false)}
          sequences={state.uploadedSequences}
          onUploadFile={state.handleUploadFile}
          onRemoveSequence={state.handleRemoveSequence}
          onConfirmLoad={() => {
            state.setActivePage('workspace');
          }}
        />

        <HelpGuideModal
          isOpen={state.isHelpModalOpen}
          onClose={() => state.setIsHelpModalOpen(false)}
        />

        <AuthModal />
      </div>
    );
  }

  // Doctor Clinician Workstation (Full 3D Viewer & AI Pipeline)
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100/90 text-slate-800 overflow-hidden font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:block">
      {/* 1. Regulatory Mandatory Disclaimer Banner */}
      <div className="no-print">
        <DisclaimerBanner />
      </div>

      {/* 2. Top Station Toolbar */}
      <div className="no-print">
        <TopToolbar
          studyId={state.provenance?.studyId || 'No Case Loaded'}
          isDemoMode={state.isDemoMode}
          datasetState={state.datasetState}
          segmentationSource={state.segmentationSource}
          backendStatus={state.backendStatus}
          backendUrl={state.backendUrl}
          onCheckBackend={state.checkBackendHealth}
          onResetView={state.resetView}
          onOpenUpload={() => state.setIsUploadModalOpen(true)}
          onOpenHelp={() => state.setIsHelpModalOpen(true)}
          onLoadDemo={state.loadDemoCase}
          onGoHome={() => state.setActivePage('landing')}
          activeSequence={state.activeSequence}
          onSelectSequence={state.setActiveSequence}
          crosshair={state.crosshair}
          worldCoordinate={state.worldCoordinate}
          onOpenDemoSelector={() => state.setIsDemoSelectorOpen(true)}
          activeSlotId={state.activeDemoSlot?.slotId}
          patientName={state.activeDemoSlot?.patientName}
        />
      </div>

      {/* 3. Main Workspace Area: Sidebar + Active Page */}
      <div className="flex-1 flex overflow-hidden min-h-0 print:overflow-visible print:h-auto print:block">
        {/* Left Navigation Sidebar */}
        <div className="no-print h-full flex flex-col flex-shrink-0">
          <Sidebar
            activePage={state.activePage}
            onSelectPage={state.setActivePage}
          />
        </div>

        {/* Dynamic Center Workstation Page */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-100/60 print:overflow-visible print:h-auto print:bg-white print:block">
          {state.activePage === 'workspace' && (
            <WorkspacePage
              crosshair={state.crosshair}
              onUpdateCrosshair={state.setCrosshair}
              worldCoordinate={state.worldCoordinate}
              dimensions={state.dimensions}
              spacing={state.spacing}
              affine={state.affine}
              activeVolume={state.activeVolume}
              segmentationMask={state.segmentationMask}
              expertMask={state.expertMask}
              labelCounts={state.labelCounts}
              expertCounts={state.expertCounts}
              visibility={state.regionVisibility}
              opacity={state.regionOpacity}
              windowLevel={state.windowLevel}
              clipping={state.clippingPlanes}
              isDemoMode={state.isDemoMode}
              datasetState={state.datasetState}
              segmentationSource={state.segmentationSource}
              inferenceProgress={state.inferenceProgress}
              inferenceCurrentStep={state.inferenceCurrentStep}
              inferenceError={state.inferenceError}
              onRunSegmentation={state.runSegmentation}
              onToggleVisibility={key =>
                state.setRegionVisibility(prev => ({ ...prev, [key]: !prev[key] }))
              }
              onChangeOpacity={(key, val) =>
                state.setRegionOpacity(prev => ({ ...prev, [key]: val }))
              }
              onChangeWindowLevel={state.setWindowLevel}
              onChangeClipping={state.setClippingPlanes}
              onResetCamera={state.resetView}
              activeSequence={state.activeSequence}
              onSelectSequence={state.setActiveSequence}
            />
          )}

          {state.activePage === 'segmentation' && (
            <SegmentationPage
              labelCounts={state.labelCounts}
              spacing={state.spacing}
              visibility={state.regionVisibility}
              opacity={state.regionOpacity}
              onToggleVisibility={key =>
                state.setRegionVisibility(prev => ({ ...prev, [key]: !prev[key] }))
              }
              onChangeOpacity={(key, val) =>
                state.setRegionOpacity(prev => ({ ...prev, [key]: val }))
              }
              isDemoMode={state.isDemoMode}
            />
          )}

          {state.activePage === 'evaluation' && (
            <EvaluationPage
              metrics={state.provenance?.metrics}
              labelCounts={state.labelCounts}
              expertCounts={state.expertCounts}
              spacing={state.spacing}
              onOpenUpload={() => state.setIsUploadModalOpen(true)}
              isDemoMode={state.isDemoMode}
              evaluatedDemoSlots={state.evaluatedDemoSlots}
              executionReceipt={state.executionReceipt}
              onOpenDemoSelector={() => state.setIsDemoSelectorOpen(true)}
              studyId={state.provenance?.studyId}
            />
          )}

          {state.activePage === 'reports' && (
            <ReportsPage
              provenance={state.provenance}
              reliabilityInfo={state.modelReliability}
            />
          )}

          {state.activePage === 'pipeline' && (
            <PipelineArchitecturePage
              backendStatus={state.backendStatus}
              backendUrl={state.backendUrl}
              onCheckBackend={state.checkBackendHealth}
              modelReliability={state.modelReliability}
            />
          )}

          {state.activePage === 'modelInfo' && (
            <ModelInfoPage
              reliabilityInfo={state.modelReliability}
              metrics={state.provenance?.metrics}
              onConnectBackend={state.checkBackendHealth}
            />
          )}

          {state.activePage === 'settings' && (
            <SettingsPage
              backendUrl={state.backendUrl}
              onUpdateBackendUrl={state.setBackendUrl}
              backendStatus={state.backendStatus}
              backendError={state.backendError}
              onCheckBackend={state.checkBackendHealth}
            />
          )}
        </main>
      </div>

      {/* 4. Modals */}
      <NiftiUploadModal
        isOpen={state.isUploadModalOpen}
        onClose={() => state.setIsUploadModalOpen(false)}
        sequences={state.uploadedSequences}
        onUploadFile={state.handleUploadFile}
        onRemoveSequence={state.handleRemoveSequence}
        onConfirmLoad={() => {
          // Loaded sequences are already updated in state
        }}
      />

      <HelpGuideModal
        isOpen={state.isHelpModalOpen}
        onClose={() => state.setIsHelpModalOpen(false)}
      />

      <MultiPatientDemoSelectorModal
        isOpen={state.isDemoSelectorOpen}
        onClose={() => state.setIsDemoSelectorOpen(false)}
        activeSlotId={state.activeDemoSlot?.slotId}
        onSelectSlot={state.loadDemoSlot}
        backendConnected={state.backendStatus === 'connected'}
        backendUrl={state.backendUrl}
      />

      <AuthModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
