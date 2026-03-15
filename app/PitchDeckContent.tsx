'use client';

import Link from 'next/link';
import {
  ArrowRight, TrendingUp, Globe, Smartphone,
  Users, DollarSign, BarChart3, Crosshair,
  CheckCircle2, MapPin, BrainCircuit, Car, AlertTriangle, Leaf
} from 'lucide-react';
import { motion } from 'motion/react';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.2 }
};

export default function PitchDeckContent() {
  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020202]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter">INVIAGEM<span className="text-emerald-500">.</span></div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-white/50">
            <a href="#cenario" className="hover:text-white transition-colors">O Cenário</a>
            <a href="#solucao" className="hover:text-white transition-colors">Nossa Solução</a>
            <a href="#produto" className="hover:text-white transition-colors">Os Aplicativos</a>
            <a href="#negocio" className="hover:text-white transition-colors">O Negócio</a>
          </div>
          <Link href="/passenger" className="px-6 py-2.5 bg-white/10 text-white border border-white/20 rounded-full font-medium hover:bg-white hover:text-black transition-all text-sm flex items-center gap-2">
            Testar App <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="min-h-screen pt-32 pb-20 px-6 flex flex-col justify-center items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Tecnologia Manauara • Apresentação Executiva</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.95] mb-8 max-w-5xl mx-auto"
          >
            Mobilidade reimaginada no <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Coração da Amazônia.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/50 font-light leading-relaxed max-w-3xl mx-auto mb-12"
          >
            A Inviagem é uma startup <strong>100% local</strong> criada para solucionar os gargalos do transporte urbano de Manaus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <a href="#cenario" className="px-8 py-4 bg-emerald-500 text-black rounded-full font-bold hover:bg-emerald-400 hover:scale-105 transition-all flex items-center gap-2">
              Conhecer o Projeto <TrendingUp size={18} />
            </a>
          </motion.div>
        </section>

        <section id="cenario" className="py-32 px-6 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="mb-20 md:w-2/3">
              <h2 className="text-emerald-500 font-mono tracking-widest text-sm uppercase mb-4">01. O Cenário Atual</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">O modelo atual parou no tempo.</h3>
              <p className="text-xl text-white/50 font-light">As gigantes do transporte de fora não conhecem as particularidades de Manaus.</p>
            </motion.div>

            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
                  <AlertTriangle size={28} />
                </div>
                <h4 className="text-2xl font-medium mb-4">Insatisfação Padrão</h4>
                <p className="text-white/50 leading-relaxed">Cancelamentos frequentes devido à falta de clareza das tarifas.</p>
              </motion.div>
              <motion.div variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6">
                  <DollarSign size={28} />
                </div>
                <h4 className="text-2xl font-medium mb-4">Taxas Extorsivas</h4>
                <p className="text-white/50 leading-relaxed">Até 40% do que é pago fica com empresas de fora.</p>
              </motion.div>
              <motion.div variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <MapPin size={28} />
                </div>
                <h4 className="text-2xl font-medium mb-4">Comércio Local Desconectado</h4>
                <p className="text-white/50 leading-relaxed">Lojistas e restaurantes não têm um canal direto para o cliente.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="solucao" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="mb-20 text-center max-w-3xl mx-auto">
              <h2 className="text-cyan-500 font-mono tracking-widest text-sm uppercase mb-4">02. A Proposta</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Feito daqui, para cá.</h3>
              <p className="text-xl text-white/50 font-light">Devolvemos o poder de escolha e integramos o comércio no aplicativo.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div {...fadeIn} className="space-y-12">
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Crosshair size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-medium mb-2">Acordo Mútuo de Valores</h4>
                    <p className="text-white/50 leading-relaxed">O passageiro sugere o valor; motoristas avaliam e aceitam com clareza.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-[24px] bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <BrainCircuit size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-medium mb-2">I.A. e Comércio Local</h4>
                    <p className="text-white/50 leading-relaxed">Assistente inteligente e comércio que ajuda a pagar a corrida.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div {...fadeIn} className="relative">
                <div className="relative z-10 glass-panel border border-white/10 rounded-[3rem] p-8 aspect-square flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-xl">
                  <div className="w-full flex items-center justify-between mb-8">
                    <div className="text-center w-32">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                        <Users className="text-white/60" />
                      </div>
                      <span className="text-sm font-medium">Cidadão</span>
                    </div>
                    <div className="flex-1 px-4 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                    <div className="text-center w-32">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                        <Car className="text-white/60" />
                      </div>
                      <span className="text-sm font-medium">Motorista</span>
                    </div>
                  </div>
                  <div className="w-full bg-blue-500/5 rounded-3xl p-6 border border-blue-500/20 text-center">
                    <Leaf className="text-blue-400 w-8 h-8 mx-auto mb-3" />
                    <h5 className="font-bold text-lg mb-1">Inviagem Para Negócios Locais</h5>
                    <p className="text-sm text-white/50">Comércios abatem o custo da viagem e atraem fluxo.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="negocio" className="py-24 px-6 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">A Matemática Operacional</h2>
              <p className="text-lg text-white/50 font-light">Modelo desenhado para durar e proteger quem produz.</p>
            </motion.div>
            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-emerald-400 mb-2">9%</div>
                <div className="text-sm font-medium">Taxa do App</div>
              </motion.div>
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-blue-400 mb-2">R$ 3</div>
                <div className="text-sm font-medium">Parceria</div>
              </motion.div>
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-purple-400 mb-2">Tech</div>
                <div className="text-sm font-medium">Inovação Manaus</div>
              </motion.div>
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-white mb-2">B2B</div>
                <div className="text-sm font-medium">Integração</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="produto" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="mb-20 md:w-2/3">
              <h2 className="text-purple-500 font-mono tracking-widest text-sm uppercase mb-4">03. O Nosso Sistema</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Três Pilares.</h3>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div {...fadeIn}>
                <Link href="/passenger" className="block rounded-[2.5rem] bg-[#111] border border-white/10 hover:border-emerald-500/50 p-8 aspect-[4/5] flex flex-col justify-end">
                  <Smartphone className="text-emerald-400 w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-medium mb-2">Passageiro</h3>
                  <span className="text-emerald-400 font-medium">Abrir →</span>
                </Link>
              </motion.div>
              <motion.div {...fadeIn}>
                <Link href="/driver" className="block rounded-[2.5rem] bg-[#111] border border-white/10 hover:border-blue-500/50 p-8 aspect-[4/5] flex flex-col justify-end">
                  <Car className="text-blue-400 w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-medium mb-2">Motorista</h3>
                  <span className="text-blue-400 font-medium">Abrir →</span>
                </Link>
              </motion.div>
              <motion.div {...fadeIn}>
                <Link href="/admin" className="block rounded-[2.5rem] bg-[#111] border border-white/10 hover:border-purple-500/50 p-8 aspect-[4/5] flex flex-col justify-end">
                  <BarChart3 className="text-purple-400 w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-medium mb-2">Admin</h3>
                  <span className="text-purple-400 font-medium">Abrir →</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 mb-20">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fadeIn} className="rounded-[3rem] bg-gradient-to-r from-emerald-900/40 via-blue-900/40 to-purple-900/40 border border-white/20 p-12 md:p-20 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Venha construir com a gente.</h2>
              <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto font-light">
                Inviagem convida empresários e apoiadores de tecnologia no Amazonas.
              </p>
              <a href="mailto:contato@inviagem.com.br" className="inline-block px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all">
                Falar com a Equipe <ArrowRight size={20} className="inline ml-2" />
              </a>
            </motion.div>
          </div>
        </section>

        <footer className="py-12 px-6 border-t border-white/10 text-center">
          <div className="text-2xl font-bold tracking-tighter mb-4">INVIAGEM<span className="text-emerald-500">.</span></div>
          <div className="text-sm text-white/40">© 2026 Inviagem Manaus.</div>
        </footer>
      </main>
    </div>
  );
}
