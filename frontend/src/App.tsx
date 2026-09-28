import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { areas } from './config/navegacao'
import EmConstrucao from './pages/EmConstrucao'
import Login from './pages/Login'
import Funcionarios from './pages/Funcionarios'
import NovoFuncionario from './pages/NovoFuncionario'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        {areas.filter(area => area.caminho && area.caminho !== '/funcionarios').map(area => (
          <Route key={area.caminho} path={area.caminho} element={<EmConstrucao titulo={area.titulo} inicial={area.caminho === '/dashboard'} />} />
        ))}
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/funcionarios/novo" element={<NovoFuncionario />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
