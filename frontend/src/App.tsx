import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Busca from './pages/Busca';
import Clientes from './pages/Clientes';
import OrdensServico from './pages/OrdensServico';
import Financeiro from './pages/Financeiro';
import Funcionarios from './pages/Funcionarios';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
      </Route>
    </Routes>
  );
}

export default App;
