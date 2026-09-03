import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Funcionarios from './pages/Funcionarios';

// Cada integrante adiciona a própria rota aqui embaixo, como uma linha nova.
// Todas ficam "dentro" de Layout (que injeta a sidebar em volta via <Outlet />).
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/funcionarios" element={<Funcionarios />} />
        {/* <Route path="/estoque" element={<Estoque />} />       <- você adiciona quando construir */}
        {/* <Route path="/clientes" element={<Clientes />} />    <- Integrante 1 adiciona a dele aqui */}
      </Route>
    </Routes>
  );
}

export default App;
