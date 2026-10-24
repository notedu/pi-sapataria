import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'

// Cada rota busca seu código quando é acessada. O layout interno fica compartilhado.
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const EditarCliente = lazy(() => import('./pages/EditarCliente'))
const PerfilCliente = lazy(() => import('./pages/PerfilCliente'))
const Clientes = lazy(() => import('./pages/Clientes'))
const NovoCliente = lazy(() => import('./pages/NovoCliente'))
const PerfilFuncionario = lazy(() => import('./pages/PerfilFuncionario'))
const EditarFuncionario = lazy(() => import('./pages/EditarFuncionario'))
const Funcionarios = lazy(() => import('./pages/Funcionarios'))
const NovoFuncionario = lazy(() => import('./pages/NovoFuncionario'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Busca = lazy(() => import('./pages/Busca'))
const OrdensServico = lazy(() => import('./pages/OrdensServico'))
const NovaOrdemServico = lazy(() => import('./pages/NovaOrdemServico'))
const DetalhesOrdemServico = lazy(() => import('./pages/DetalhesOrdemServico'))
const EditarOrdemServico = lazy(() => import('./pages/EditarOrdemServico'))
const Financeiro = lazy(() => import('./pages/Financeiro'))
const Estoque = lazy(() => import('./pages/Estoque'))
const Atividades = lazy(() => import('./pages/Atividades'))
const Notificacoes = lazy(() => import('./pages/Notificacoes'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))

function CarregandoPagina() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <p role="status">Carregando página…</p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<CarregandoPagina />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<CarregandoPagina />}>
            <Login />
          </Suspense>
        }
      />
      <Route element={<AppLayout />}>
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/atividades" element={<Atividades />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/ordens-servico/nova" element={<NovaOrdemServico />} />
        <Route
          path="/ordens-servico/:id/editar"
          element={<EditarOrdemServico />}
        />
        <Route path="/ordens-servico/:id" element={<DetalhesOrdemServico />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id/editar" element={<EditarCliente />} />
        <Route path="/clientes/:id" element={<PerfilCliente />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/meu-perfil" element={<PerfilFuncionario proprio />} />
        <Route path="/funcionarios/:id" element={<PerfilFuncionario />} />
        <Route
          path="/funcionarios/:id/editar"
          element={<EditarFuncionario />}
        />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/funcionarios/novo" element={<NovoFuncionario />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
