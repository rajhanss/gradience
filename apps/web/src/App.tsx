import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ObservePage from './pages/ObservePage';
import SimulatePage from './pages/SimulatePage';
import MitigatePage from './pages/MitigatePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/observe" element={<ObservePage />} />
        <Route path="/simulate" element={<SimulatePage />} />
        <Route path="/mitigate" element={<MitigatePage />} />
        <Route path="/optimize" element={<MitigatePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
