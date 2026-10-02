import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { areas } from './config/navegacao'
import EmConstrucao from './pages/EmConstrucao'
import Login from './pages/Login'
import EditarCliente from './pages/EditarCliente'
import PerfilCliente from './pages/PerfilCliente'
import Clientes from './pages/Clientes'
import NovoCliente from './pages/NovoCliente'
import PerfilFuncionario from './pages/PerfilFuncionario'
import EditarFuncionario from './pages/EditarFuncionario'
import Funcionarios from './pages/Funcionarios'
import NovoFuncionario from './pages/NovoFuncionario'
import Financeiro from './pages/Financeiro'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/financeiro" element={<Financeiro />} />
        {areas.filter(area => area.caminho && !['/funcionarios', '/clientes', '/financeiro'].includes(area.caminho)).map(area => (
          <Route key={area.caminho} path={area.caminho} element={<EmConstrucao titulo={area.titulo} inicial={area.caminho === '/dashboard'} />} />
        ))}
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id/editar" element={<EditarCliente />} />
        <Route path="/clientes/:id" element={<PerfilCliente />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/meu-perfil" element={<PerfilFuncionario proprio />} />
        <Route path="/funcionarios/:id" element={<PerfilFuncionario />} />
        <Route path="/funcionarios/:id/editar" element={<EditarFuncionario />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/funcionarios/novo" element={<NovoFuncionario />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
