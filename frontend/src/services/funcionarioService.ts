// funcionarioService.ts
// Mesma ideia do funcionarioModel.ts do backend, mas aqui a "fonte de dado"
// é a API REST em vez do banco diretamente.

import { api } from './api';

// Espelha a interface Funcionario do backend (funcionarioModel.ts).
// id é opcional porque não existe ainda em um funcionário que estamos criando.
export interface Funcionario {
  id?: number;
  nome: string;
  cpf: string;
  telefone: string;
  genero?: string;
  cargo: string;
  status: string;
  data_admissao: string;
}

export function listarFuncionarios() {
  return api.get<Funcionario[]>('/funcionarios');
}

export function buscarFuncionarioPorId(id: number) {
  return api.get<Funcionario>(`/funcionarios/${id}`);
}

export function criarFuncionario(funcionario: Omit<Funcionario, 'id'>) {
  return api.post<Funcionario>('/funcionarios', funcionario);
}

export function atualizarFuncionario(id: number, funcionario: Funcionario) {
  return api.put<Funcionario>(`/funcionarios/${id}`, funcionario);
}

export function deletarFuncionario(id: number) {
  return api.delete<{ mensagem: string }>(`/funcionarios/${id}`);
}
