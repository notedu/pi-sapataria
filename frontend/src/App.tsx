import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import EditarCliente from './pages/EditarCliente'
import PerfilCliente from './pages/PerfilCliente'
import Clientes from './pages/Clientes'
import NovoCliente from './pages/NovoCliente'
import PerfilFuncionario from './pages/PerfilFuncionario'
import EditarFuncionario from './pages/EditarFuncionario'
import Funcionarios from './pages/Funcionarios'
import NovoFuncionario from './pages/NovoFuncionario'
import Dashboard from './pages/Dashboard'
import Busca from './pages/Busca'
import OrdensServico from './pages/OrdensServico'
import NovaOrdemServico from './pages/NovaOrdemServico'
import DetalhesOrdemServico from './pages/DetalhesOrdemServico'
import EditarOrdemServico from './pages/EditarOrdemServico'
import Financeiro from './pages/Financeiro'
import Estoque from './pages/Estoque'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/ordens-servico/nova" element={<NovaOrdemServico />} />
        <Route path="/ordens-servico/:id/editar" element={<EditarOrdemServico />} />
        <Route path="/ordens-servico/:id" element={<DetalhesOrdemServico />} />
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
