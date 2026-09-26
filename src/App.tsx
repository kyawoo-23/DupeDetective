import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScanInputPage } from './pages/ScanInputPage';
import { ScanWorkspacePage } from './pages/ScanWorkspacePage';

export function App() {
  return (
    <BrowserRouter>
      <NuqsAdapter>
        <Routes>
          <Route path="/" element={<ScanInputPage />} />
          <Route path="/scan/:scanId" element={<ScanWorkspacePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NuqsAdapter>
    </BrowserRouter>
  );
}
