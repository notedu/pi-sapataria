import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../services/api';
import { AuthContext, type Usuario } from './auth';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const verificar = useCallback(() => api.get<Usuario>('/auth/me').then(user => {
      setUsuario(user); setErro('');
    }).catch(error => {
      setUsuario(null);
      setErro('');
      if (!(error instanceof ApiError && error.status === 401)) setErro('Não foi possível conectar ao servidor. Verifique se a API está em execução.');
    }).finally(() => { setCarregando(false); }), []);
  useEffect(() => {
    void verificar();
    const expired = () => { setUsuario(null); };
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [verificar]);
  async function entrar(login: string, senha: string) {
    setUsuario(await api.post<Usuario>('/auth/login', { usuario: login, senha }));
    setErro('');
  }
  async function sair() {
    await api.post('/auth/logout', {});
    setUsuario(null);
  }
  return <AuthContext.Provider value={{ usuario, carregando, erro, verificar, entrar, sair }}>{children}</AuthContext.Provider>;
}
