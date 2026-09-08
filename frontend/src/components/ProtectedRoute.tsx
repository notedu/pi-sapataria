import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth';
export default function ProtectedRoute() {
  const { usuario, carregando, erro, verificar } = useAuth();
  if (carregando) return <p role="status" className="p-8">Verificando sessão...</p>;
  if (erro) return <div className="p-8"><p role="alert">{erro}</p><button onClick={() => void verificar()} className="mt-4 rounded bg-[#002c7c] px-4 py-2 text-white">Tentar novamente</button></div>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
