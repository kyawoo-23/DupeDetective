import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SiteFooter } from './components/layout/SiteFooter';
import { ScanInputPage } from './pages/ScanInputPage';
import { ScanWorkspacePage } from './pages/ScanWorkspacePage';
import { useAppStore } from './store';

const toastClass = '!rounded-lg !border !px-3 !py-2.5 !text-sm !font-medium !shadow-sm';

export function App() {
  const scansLoaded = useAppStore((state) => state.scansLoaded);
  const storageWarning = useAppStore((state) => state.storageWarning);
  const initializeScans = useAppStore((state) => state.initializeScans);

  useEffect(() => {
    void initializeScans();
  }, [initializeScans]);

  if (!scansLoaded) {
    return (
      <div className="dd-site-background flex min-h-screen items-center justify-center px-4" role="status">
        Loading saved scans…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: `${toastClass} !border-slate-200 !bg-white !text-slate-800`,
          success: {
            className: `${toastClass} !border-emerald-200 !bg-emerald-50 !text-emerald-800 !shadow-emerald-900/5`,
            iconTheme: { primary: '#059669', secondary: '#ecfdf5' },
          },
          error: {
            className: `${toastClass} !border-red-200 !bg-red-50 !text-red-800 !shadow-red-900/5`,
            iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
          },
        }}
      />
      <NuqsAdapter>
        {storageWarning && (
          <div
            role="alert"
            className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
          >
            {storageWarning}
          </div>
        )}
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<ScanInputPage />} />
              <Route path="/scan/:scanId" element={<ScanWorkspacePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <SiteFooter />
        </div>
      </NuqsAdapter>
    </BrowserRouter>
  );
}
