import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import NagarMirror from './pages/NagarMirror';
import SwachhTrack from './pages/SwachhTrack';
import DumpSpot from './pages/DumpSpot';
import CitizenView from './pages/CitizenView';
import CityTransformation from './pages/CityTransformation';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<CityTransformation />} />
          <Route element={<Layout />}>
            <Route path="nagar-mirror" element={<NagarMirror />} />
            <Route path="swachh-track" element={<SwachhTrack />} />
            <Route path="dump-spot" element={<DumpSpot />} />
            <Route path="citizen" element={<CitizenView />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

