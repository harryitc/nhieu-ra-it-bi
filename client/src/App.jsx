import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import OanTuTi from './games/OanTuTi'
import Hub from './pages/Hub'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/oantuti" element={<OanTuTi />} />
        {/* Redirect any unknown path back to hub */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
