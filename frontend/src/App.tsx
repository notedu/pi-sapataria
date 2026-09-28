import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { areas } from './config/navegacao'
import EmConstrucao from './pages/EmConstrucao'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        {areas.filter(area => area.caminho).map(area => (
          <Route key={area.caminho} path={area.caminho} element={<EmConstrucao titulo={area.titulo} inicial={area.caminho === '/dashboard'} />} />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
