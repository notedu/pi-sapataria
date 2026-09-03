// Funcionarios.tsx
// Página de listagem de funcionários. Por enquanto é só leitura (GET);
// os botões de criar/editar ainda não abrem formulário — isso vem na próxima etapa.

import { useEffect, useState } from 'react';
import {
  listarFuncionarios,
  type Funcionario,
} from '../services/funcionarioService';
import { ApiError } from '../services/api';

// Cores do badge de status. Um objeto de "mapa" é mais fácil de estender
// (se surgir um terceiro status um dia) do que um if/else encadeado.
const CORES_STATUS: Record<string, string> = {
  Ativo: 'bg-emerald-100 text-emerald-700',
  Inativo: 'bg-stone-200 text-stone-600',
};

export default function Funcionarios() {
  // Guarda a lista vinda da API
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  // Controla o texto digitado na busca
  const [busca, setBusca] = useState('');
  // Toda tela que busca dado externo precisa desses dois estados:
  // "ainda está carregando?" e "deu erro?"
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // useEffect com array vazio [] = roda uma vez, quando o componente monta na tela.
  useEffect(() => {
    async function carregarFuncionarios() {
      try {
        const dados = await listarFuncionarios();
        setFuncionarios(dados);
      } catch (error) {
        // ApiError é o erro customizado que criamos em api.ts;
        // se cair aqui, já vem com a mensagem que o backend mandou.
        const mensagem =
          error instanceof ApiError
            ? error.message
            : 'Não foi possível conectar à API';
        setErro(mensagem);
      } finally {
        setCarregando(false);
      }
    }

    carregarFuncionarios();
  }, []);

  // Filtro client-side simples pela busca. Como a lista é pequena
  // (times de sapataria não têm milhares de funcionários), não precisa
  // de endpoint de busca dedicado — filtrar no front já resolve.
  const funcionariosFiltrados = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Equipe</h1>
            <p className="text-stone-500">
              Gerencie os funcionários da oficina.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-indigo-900"
            />
            <button
              type="button"
              className="rounded-md bg-indigo-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            >
              + Novo Funcionário
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          {carregando && (
            <p className="p-6 text-center text-stone-500">Carregando...</p>
          )}

          {erro && (
            <p className="p-6 text-center text-red-600">
              Erro ao carregar funcionários: {erro}
            </p>
          )}

          {!carregando && !erro && (
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">CPF</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admissão</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcionariosFiltrados.map(funcionario => (
                  <tr
                    key={funcionario.id}
                    className="border-t border-stone-100"
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">
                      {funcionario.nome}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {funcionario.cpf}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {funcionario.telefone}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {funcionario.cargo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          CORES_STATUS[funcionario.status] ??
                          'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {funcionario.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(funcionario.data_admissao).toLocaleDateString(
                        'pt-BR'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-400">
                      {/* Editar/Excluir entram na próxima etapa */}
                      &mdash;
                    </td>
                  </tr>
                ))}

                {funcionariosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-stone-400"
                    >
                      Nenhum funcionário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
