import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Busca from './pages/Busca';
import Clientes from './pages/Clientes';
import OrdensServico from './pages/OrdensServico';
import Financeiro from './pages/Financeiro';
import Funcionarios from './pages/Funcionarios';
import Estoque from './pages/Estoque';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
    </Routes>
  );
}

export default App;
