import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Busca from './pages/Busca';
import Clientes from './pages/Clientes';
import OrdensServico from './pages/OrdensServico';
import Financeiro from './pages/Financeiro';
import Funcionarios from './pages/Funcionarios';
import Estoque from './pages/Estoque';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import AuthProvider from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider><Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}><Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route></Route>
    </Routes></AuthProvider>
  );
}

export default App;
