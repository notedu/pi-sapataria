import { createContext, useContext } from 'react';
export interface Usuario { id: number; usuario: string; nome: string; perfil: string }
export interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  erro: string;
  verificar: () => Promise<void>;
  entrar: (usuario: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider ausente');
  return auth;
}
