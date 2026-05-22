import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import OanTuTi from './games/OanTuTi'
import Survival from './games/Survival'
import PaperIo from './games/PaperIo'
import Hub from './pages/Hub'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/oantuti" element={<OanTuTi />} />
        <Route path="/survival" element={<Survival />} />
        <Route path="/paperio" element={<PaperIo />} />
        {/* Redirect any unknown path back to hub */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
