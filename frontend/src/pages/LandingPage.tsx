import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo-sapataria.png'
import { aplicarTemaEscuro } from '../services/preferencias'

const whatsapp = 'https://wa.me/5519989800297?text=Ol%C3%A1%2C%20gostaria%20de%20conhecer%20os%20servi%C3%A7os%20da%20Seda%20e%20Couro.'
const instagram = 'https://www.instagram.com/sedaecouro/'
const endereco = 'Rua Santa Cruz, 700, Centro, Santa Cruz das Palmeiras - SP, CEP 13650-011'
const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
const chaveTemaLanding = 'seda-landing-modo-escuro-v1'

const servicos = [
  { numero: '01', titulo: 'Consertos especializados', texto: 'Reparos e cuidados para dar mais vida aos seus calçados.' },
  { numero: '02', titulo: 'Higienização e hidratação', texto: 'Cuidado para calçados e jaquetas, respeitando cada material.' },
  { numero: '03', titulo: 'Manutenção e restauração', texto: 'Atenção aos detalhes para recuperar peças que fazem parte da sua história.' },
]

const fotos = [
  { src: '/landing/calcados-e-cintos.webp', alt: 'Exposição de calçados, botas e cintos na loja' },
  { src: '/landing/chapeus-e-cintos.webp', alt: 'Chapéus e cintos expostos na loja' },
  { src: '/landing/calcados-e-caixas.webp', alt: 'Variedade de calçados e caixas de produtos' },
  { src: '/landing/bolsas-e-acessorios.webp', alt: 'Bolsas e acessórios expostos em vitrines' },
  { src: '/landing/botas-e-calcados.webp', alt: 'Botas e calçados expostos nas prateleiras' },
  { src: '/landing/exposicao-de-calcados.webp', alt: 'Exposição vertical de diferentes calçados' },
]

function Seta() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
}

function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r=".8" fill="currentColor" stroke="none" /></svg>
}

function PinIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
}

export default function LandingPage() {
  const galeriaRef = useRef<HTMLDivElement>(null)
  const transicaoTemaRef = useRef<number | null>(null)
  const [reducaoDeMovimento, setReducaoDeMovimento] = useState(false)
  const [mouseNaGaleria, setMouseNaGaleria] = useState(false)
  const [focoNaGaleria, setFocoNaGaleria] = useState(false)
  const [modoEscuro, setModoEscuro] = useState(() => {
    try {
      return localStorage.getItem(chaveTemaLanding) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    aplicarTemaEscuro(modoEscuro)
    try {
      localStorage.setItem(chaveTemaLanding, String(modoEscuro))
    } catch {
      // A página mantém o tema nesta visita mesmo sem persistência local.
    }
  }, [modoEscuro])

  useEffect(() => () => {
    if (transicaoTemaRef.current !== null) window.clearTimeout(transicaoTemaRef.current)
    document.documentElement.classList.remove('theme-transition')
  }, [])

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const atualizarPreferencia = () => setReducaoDeMovimento(consulta.matches)
    atualizarPreferencia()
    consulta.addEventListener('change', atualizarPreferencia)
    return () => consulta.removeEventListener('change', atualizarPreferencia)
  }, [])

  const moverGaleria = useCallback((direcao: -1 | 1) => {
    const faixa = galeriaRef.current
    const primeiroCartao = faixa?.querySelector<HTMLElement>('[data-foto]')
    if (!faixa || !primeiroCartao) return

    const estilo = window.getComputedStyle(faixa)
    const intervalo = Number.parseFloat(estilo.columnGap || estilo.gap) || 0
    const passo = primeiroCartao.offsetWidth + intervalo
    const fim = faixa.scrollWidth - faixa.clientWidth
    const destino = faixa.scrollLeft + passo * direcao
    const posicao = destino > fim - 2 ? 0 : destino < 2 ? fim : destino

    faixa.scrollTo({ left: posicao, behavior: reducaoDeMovimento ? 'auto' : 'smooth' })
  }, [reducaoDeMovimento])

  useEffect(() => {
    if (mouseNaGaleria || focoNaGaleria || reducaoDeMovimento) return
    const intervalo = window.setInterval(() => moverGaleria(1), 5000)
    return () => window.clearInterval(intervalo)
  }, [mouseNaGaleria, focoNaGaleria, moverGaleria, reducaoDeMovimento])

  const alternarTema = () => {
    const raiz = document.documentElement
    raiz.classList.add('theme-transition')
    if (transicaoTemaRef.current !== null) window.clearTimeout(transicaoTemaRef.current)
    setModoEscuro((temaAtual) => !temaAtual)
    transicaoTemaRef.current = window.setTimeout(() => {
      raiz.classList.remove('theme-transition')
      transicaoTemaRef.current = null
    }, 300)
  }

  return <div className="min-h-screen bg-surface text-on-surface">
    <header className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-container-max items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a href="#inicio" className="flex min-w-0 items-center gap-3" aria-label="Seda e Couro, início">
          <img src={logo} alt="" className="h-11 w-11 rounded-full object-cover" />
          <span className="min-w-0"><span className="block text-label-md text-primary md:text-body-lg">Seda e Couro</span><span className="block text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">Sapataria profissional</span></span>
        </a>
        <nav aria-label="Navegação da página" className="hidden items-center gap-7 lg:flex">
          <a href="#servicos" className="text-label-md text-on-surface-variant transition hover:text-primary">Serviços</a>
          <a href="#loja" className="text-label-md text-on-surface-variant transition hover:text-primary">A loja</a>
          <a href="#contato" className="text-label-md text-on-surface-variant transition hover:text-primary">Contato</a>
        </nav>
        <Link to="/login" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-label-md text-on-primary transition hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-5">
          <span className="hidden sm:inline">Acessar o sistema</span><span className="sm:hidden">Entrar</span><Seta />
        </Link>
      </div>
    </header>

    <main>
      <section id="inicio" className="relative isolate flex min-h-[620px] items-end overflow-hidden bg-primary md:min-h-[700px]">
        <img src="/landing/fachada.webp" alt="Fachada da loja Seda e Couro em Santa Cruz das Palmeiras" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07142a]/90 via-[#07142a]/65 to-[#07142a]/20" />
        <div className="mx-auto w-full max-w-container-max px-5 pb-16 pt-24 md:px-8 md:pb-24">
          <div className="max-w-3xl text-white">
            <p className="mb-5 inline-flex rounded-full border border-white/35 bg-white/10 px-4 py-2 text-label-sm uppercase tracking-[0.16em] backdrop-blur-sm">Seda e Couro · Sapataria profissional</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">Cuidado que renova. Consertos que acompanham você.</h1>
            <p className="mt-6 max-w-xl text-body-lg text-white/90">Higienização, manutenção, restauração e hidratação de calçados e jaquetas, com atenção a cada detalhe.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 text-label-md text-on-primary-fixed transition hover:bg-secondary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Fale com a loja pelo WhatsApp <Seta /></a>
              <a href="#servicos" className="inline-flex min-h-12 items-center rounded-full border border-white/70 px-6 text-label-md text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Conheça os serviços</a>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute bottom-0 right-0 hidden h-24 w-1/3 rounded-tl-[5rem] bg-surface/95 lg:block" />
      </section>

      <section id="servicos" className="scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-container-max">
          <div className="mb-10 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end">
            <div><p className="mb-3 text-label-sm uppercase tracking-[0.18em] text-primary">Cuidado para acompanhar você</p><h2 className="max-w-xl text-headline-lg-mobile text-on-surface md:text-headline-xl">Seu calçado merece uma nova história.</h2></div>
            <p className="max-w-md text-body-md text-on-surface-variant">Na Seda e Couro, a especialidade é cuidar de calçados e jaquetas por meio de consertos e serviços de conservação.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {servicos.map(servico => <article key={servico.numero} className="group min-h-56 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg md:p-8">
              <span className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-label-md text-on-primary-fixed">{servico.numero}</span>
              <h3 className="text-headline-md text-on-surface">{servico.titulo}</h3>
              <p className="mt-3 text-body-md text-on-surface-variant">{servico.texto}</p>
            </article>)}
          </div>
          <div className="mt-7 rounded-2xl bg-secondary-container px-6 py-5 text-body-md text-on-secondary-fixed md:flex md:items-center md:justify-between md:gap-6">
            <p><strong>Também cuidamos de jaquetas.</strong> Higienização, manutenção, restauração e hidratação.</p>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-label-md text-primary hover:underline md:mt-0">Consulte a loja <Seta /></a>
          </div>
        </div>
      </section>

      <section id="loja" className="scroll-mt-24 bg-surface-container-low px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-container-max">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="mb-3 text-label-sm uppercase tracking-[0.18em] text-primary">Um pouco da loja</p><h2 className="text-headline-lg-mobile text-on-surface md:text-headline-xl">Seda e Couro por dentro</h2></div>
            <p className="max-w-md text-body-md text-on-surface-variant">Calçados, acessórios e cuidado profissional no mesmo endereço.</p>
          </div>
          <div
            className="relative"
            onMouseEnter={() => setMouseNaGaleria(true)}
            onMouseLeave={() => setMouseNaGaleria(false)}
            onFocusCapture={() => setFocoNaGaleria(true)}
            onBlurCapture={(evento) => {
              if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setFocoNaGaleria(false)
            }}
          >
            <div
              ref={galeriaRef}
              className="galeria-faixa flex snap-x snap-mandatory gap-3 overflow-x-auto sm:gap-4"
              role="region"
              aria-label="Fotos da loja"
              aria-roledescription="carrossel"
            >
              {fotos.map((foto) => <figure data-foto key={foto.src} className="group relative h-[260px] w-[86%] shrink-0 snap-start overflow-hidden rounded-xl bg-surface-container sm:h-[300px] sm:w-[calc((100%-1rem)/2)] lg:h-[360px] lg:w-[calc((100%-2rem)/3)]">
                <img src={foto.src} alt={foto.alt} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
              </figure>)}
            </div>
            <button type="button" onClick={() => moverGaleria(-1)} aria-label="Ver foto anterior" className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface/95 text-primary shadow-lg transition hover:scale-105 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:left-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button type="button" onClick={() => moverGaleria(1)} aria-label="Ver próxima foto" className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface/95 text-primary shadow-lg transition hover:scale-105 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </section>

      <section id="contato" className="scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-container-max gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-label-sm uppercase tracking-[0.18em] text-primary">Estamos por aqui</p>
            <h2 className="max-w-xl text-headline-lg-mobile text-on-surface md:text-headline-xl">Seu próximo passo começa com uma conversa.</h2>
            <p className="mt-5 max-w-lg text-body-md text-on-surface-variant">Fale com a Seda e Couro para saber mais sobre os serviços ou venha conhecer a loja.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-6 text-label-md text-on-primary transition hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Chamar no WhatsApp <Seta /></a>
              <a href="tel:+5519989800297" className="inline-flex min-h-12 items-center rounded-full border border-outline px-6 text-label-md text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Ligar para a loja</a>
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-8">
            <div className="flex gap-4 border-b border-outline-variant/70 pb-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed"><PinIcon /></span>
              <div><h3 className="text-headline-md text-on-surface">Visite a loja</h3><p className="mt-2 max-w-sm text-body-md text-on-surface-variant">{endereco}</p><a href={mapa} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-label-md text-primary hover:underline">Ver rota no mapa <Seta /></a></div>
            </div>
            <div className="grid gap-5 pt-6 sm:grid-cols-2">
              <div><p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Telefone / WhatsApp</p><a href="tel:+5519989800297" className="mt-2 block text-body-md text-on-surface hover:text-primary">(19) 98980-0297</a><a href={whatsapp} target="_blank" rel="noreferrer" className="mt-2 inline-block text-label-md text-primary hover:underline">Conversar pelo WhatsApp</a></div>
              <div><p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Instagram</p><a href={instagram} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-body-md text-on-surface hover:text-primary"><InstagramIcon /> @sedaecouro</a></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t border-white/10 bg-[#181c23] px-5 py-7 text-white md:px-8">
      <div className="mx-auto flex max-w-container-max flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" /><p className="text-label-md">Seda e Couro <span className="block text-label-sm font-normal text-white/70">Sapataria profissional · Santa Cruz das Palmeiras - SP</span></p></div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-label-sm text-white/85">
          <a href={instagram} target="_blank" rel="noreferrer" className="group relative isolate overflow-hidden rounded-full px-3 py-2 text-white/85 transition-colors duration-300 hover:text-white hover:shadow-md focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span className="relative z-10">Instagram</span>
          </a>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="group relative isolate overflow-hidden rounded-full px-3 py-2 text-white/85 transition-colors duration-300 hover:text-white hover:shadow-md focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 rounded-full bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#25d366] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span className="relative z-10">WhatsApp</span>
          </a>
          <Link to="/login" className="hover:text-white">Acessar o sistema</Link>
          <button type="button" role="switch" aria-checked={modoEscuro} aria-label="Modo escuro" onClick={alternarTema} className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-white transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <span>Modo escuro</span>
            <span aria-hidden="true" className={`relative h-6 w-11 rounded-full border border-white/50 transition-colors duration-250 ease-in-out ${modoEscuro ? 'bg-white/30' : 'bg-white/10'}`}>
              <span className={`interruptor-tema-thumb absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow ${modoEscuro ? 'translate-x-5' : ''}`} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  </div>
}
