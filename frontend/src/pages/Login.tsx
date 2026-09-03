import { useState, type FormEvent } from 'react';
import { Info, LockKeyhole, UserRound } from 'lucide-react';

const logoUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBHCdUm7ijCSG-y2UVWTBFDc-v1TGLA6xH5v943tL4WUIP41xNj_3kZWLuOTa1dbR99cJ0oF45_SIhxwBURzAyMf9AMySObrcmHIcLkhRSJV-xh8bFodMF-VTF2hEDe_ikQkn5APFFNk9SwnN86gK-TYtQ-mvd21NzwiIWqDUStwCIR8rUiMDFWARxuAvytalPtYbpU1Yw0VKw4AY4JEgm6DnIm2Bd7QP50VNGIwwRftwMoL5a9P7udwxvguoCAynbK7Hg';
export default function Login() {
  const [mensagem, setMensagem] = useState('');

  function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem('A autenticação será conectada à API na próxima etapa.');
  }

  return (
    <div className="grid min-h-[100dvh] bg-[#f9f9ff] md:grid-cols-2">
      <aside
        aria-label="Identidade visual da Sapataria Seda e Couro"
        className="relative hidden min-h-full items-center justify-center overflow-hidden bg-[#e6e2db] md:flex"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50Q25 25 50 50T100 50' fill='none' stroke='%23002c7c' stroke-opacity='.1' stroke-width='2'/%3E%3C/svg%3E\")",
        }}
      >
        <img
          alt="Logotipo da Sapataria Seda e Couro"
          className="relative z-10 w-64 max-w-[65%] object-contain mix-blend-multiply lg:w-80"
          src={logoUrl}
        />
      </aside>

      <main className="flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-10 md:px-16 lg:px-24">
        <section className="w-full max-w-md">
          <div className="mb-9 text-center md:mb-12 md:text-left">
            <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-[#18325c] md:hidden">
              SEDA E COURO
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#002c7c] sm:text-[32px]">
              Acesso ao Sistema
            </h1>
            <p className="mt-2 text-sm text-[#444652]">
              Seda e Couro Gestão Interna
            </p>
          </div>

          <form className="space-y-6" onSubmit={enviarFormulario}>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-[#181c23]"
                htmlFor="usuario"
              >
                Usuário
              </label>
              <div className="relative">
                <UserRound
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#747683]"
                />
                <input
                  autoComplete="username"
                  className="w-full rounded border border-[#c4c6d4] bg-[#f1f3fe] py-3 pl-11 pr-4 text-base text-[#181c23] outline-none transition placeholder:text-[#747683] focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
                  id="usuario"
                  name="usuario"
                  placeholder="Seu nome de usuário"
                  required
                  type="text"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <label
                  className="text-sm font-semibold text-[#181c23]"
                  htmlFor="senha"
                >
                  Senha
                </label>
                <button
                  className="text-xs font-semibold text-[#002c7c] transition hover:text-[#1d439c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002c7c]"
                  onClick={() =>
                    setMensagem('A recuperação de senha ainda será implementada.')
                  }
                  type="button"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#747683]"
                />
                <input
                  autoComplete="current-password"
                  className="w-full rounded border border-[#c4c6d4] bg-[#f1f3fe] py-3 pl-11 pr-4 text-base text-[#181c23] outline-none transition placeholder:text-[#747683] focus:border-[#002c7c] focus:ring-2 focus:ring-[#002c7c]/20"
                  id="senha"
                  name="senha"
                  placeholder="Sua senha"
                  required
                  type="password"
                />
              </div>
            </div>

            <button
              className="mt-2 w-full rounded bg-[#002c7c] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#1d439c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002c7c] focus-visible:ring-offset-2 active:scale-[0.99]"
              type="submit"
            >
              Acessar
            </button>

            {mensagem && (
              <p aria-live="polite" className="text-center text-sm text-[#444652]">
                {mensagem}
              </p>
            )}
          </form>

          <div className="mt-12 border-t border-[#c4c6d4]/40 pt-7">
            <p className="flex items-center justify-center gap-2 text-center text-xs text-[#444652]">
              <Info aria-hidden="true" className="size-4" />
              Acesso restrito a funcionários
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
