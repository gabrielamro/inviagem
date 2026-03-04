'use client';

import Link from 'next/link';
import {
  ArrowRight, TrendingUp, ShieldCheck, Zap, Globe, Smartphone,
  Users, DollarSign, BarChart3, Target, Crosshair, ChevronRight,
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

export default function PitchDeckPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-emerald-500/30">

      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/15 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
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

        {/* HERO: The Vision */}
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
            A Inviagem é uma startup <strong>100% local</strong> criada para solucionar os gargalos do transporte urbano de Manaus. Um ecossistema inteligente, integrado ao <strong>comércio da nossa região</strong>, com apoio do ecossistema de inovação e benefícios da nossa base tecnológica.
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

        {/* PROBLEM: The Market Gap */}
        <section id="cenario" className="py-32 px-6 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="mb-20 md:w-2/3">
              <h2 className="text-emerald-500 font-mono tracking-widest text-sm uppercase mb-4">01. O Cenário Atual</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">O modelo atual parou no tempo.</h3>
              <p className="text-xl text-white/50 font-light">As gigantes do transporte de fora não conhecem as particularidades de Manaus. O resultado são taxas abusivas e serviços que frustram os nossos moradores e motoristas todos os dias.</p>
            </motion.div>

            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
                  <AlertTriangle size={28} />
                </div>
                <h4 className="text-2xl font-medium mb-4">Insatisfação Padrão</h4>
                <p className="text-white/50 leading-relaxed">Cancelamentos frequentes devido à falta de clareza das tarifas. Em horários de pico ou chuva, os manauaras ficam reféns de algoritmos surpresas sem poder negociar.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6">
                  <DollarSign size={28} />
                </div>
                <h4 className="text-2xl font-medium mb-4">Taxas Extorsivas</h4>
                <p className="text-white/50 leading-relaxed">Até 40% do que é pago fica com empresas de fora. Um valor altíssimo retirado da nossa economia, e que dificulta o sustento dos nossos motoristas parceiros sob muito calor e trânsito.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <MapPin size={28} />
                </div>
                <h4 className="text-2xl font-medium mb-4">Comércio Local Desconectado</h4>
                <p className="text-white/50 leading-relaxed">Lojistas, restaurantes e eventos em Manaus gastam muito com internet, mas não têm um canal direto para interceptar o cliente enquanto ele está em movimento pelas ruas da cidade.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SOLUTION: Innovation */}
        <section id="solucao" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="mb-20 text-center max-w-3xl mx-auto">
              <h2 className="text-cyan-500 font-mono tracking-widest text-sm uppercase mb-4">02. A Proposta</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Feito daqui, para cá.</h3>
              <p className="text-xl text-white/50 font-light">Devolvemos o poder de escolha para a nossa população, fomentamos a retenção de renda de forma transparente e integramos o nosso comércio diretamente no aplicativo.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div {...fadeIn} className="space-y-12">
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <Crosshair size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-medium mb-2">Acordo Mútuo de Valores</h4>
                    <p className="text-white/50 leading-relaxed">Fim da caixa preta. O passageiro sugere o valor exato que deseja pagar na corrida. Os motoristas por perto avaliam e aceitam imediatamente, ou oferecem um novo valor com total liberdade e clareza.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-[24px] bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    <BrainCircuit size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-medium mb-2">Conectando Rotinas com I.A.</h4>
                    <p className="text-white/50 leading-relaxed">Embutida no mapa, temos uma assistente inteligente que conhece as peculiaridades e os melhores locais de Manaus. Ela ajuda a planejar a saída do trabalho, sugerindo trajetos orgânicos para o final de semana, almoços e pontos turísticos (Teatro Amazonas, Ponta Negra etc).</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-[24px] bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    <Globe size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-medium mb-2">Comércio Que "Ajuda a Pagar a Conta"</h4>
                    <p className="text-white/50 leading-relaxed">Ao usar a Inviagem para ir a uma loja parceira local que se destacou no mapa, esse comércio paga de parte do valor da corrida do passageiro. Eles atraem movimento direto pra porta do estabelecimento, e todos saem ganhando.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div {...fadeIn} className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-[100px] z-0"></div>
                <div className="relative z-10 glass-panel border border-white/10 rounded-[3rem] p-8 aspect-square flex flex-col items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-xl">
                  {/* Visão abstrata da economia */}
                  <div className="w-full flex items-center justify-between mb-8">
                    <div className="text-center w-32">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                        <Users className="text-white/60" />
                      </div>
                      <span className="text-sm font-medium">Você (Cidadão)</span>
                      <p className="text-xs text-emerald-400 mt-1">Acordo Rápido</p>
                    </div>

                    <div className="flex-1 px-4 flex items-center">
                      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent flex-1 relative">
                        <motion.div
                          animate={{ left: ['0%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]"
                        />
                      </div>
                    </div>

                    <div className="text-center w-32">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                        <Car className="text-white/60" />
                      </div>
                      <span className="text-sm font-medium">Motorista</span>
                      <p className="text-xs text-emerald-400 mt-1">Valor Justo</p>
                    </div>
                  </div>

                  <div className="w-full bg-blue-500/5 rounded-3xl p-6 border border-blue-500/20 text-center relative mt-8">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-black text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full">A Engrenagem Principal</div>
                    <Leaf className="text-blue-400 w-8 h-8 mx-auto mb-3" />
                    <h5 className="font-bold text-lg mb-1">Inviagem Para Negócios Locais</h5>
                    <p className="text-sm text-white/50">Restaurantes, shoppings e comércios da cidade abatem o custo da viagem atraindo fluxo para suas portas.</p>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* BUSINESS MODEL / STATS */}
        <section id="negocio" className="py-24 px-6 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-4">A Matemática Operacional</h2>
              <p className="text-lg text-white/50 font-light">Como plataforma de tecnologia com potencial de acesso a incentivos à Inovação Local e ao Pólo Digital, nosso modelo é desenhado para durar e proteger quem produz.</p>
            </motion.div>

            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-emerald-400 mb-2">9%</div>
                <div className="text-sm font-medium">Taxa do Aplicativo</div>
                <p className="text-xs text-white/40 mt-3">É o que fica no app para cobrir infraestrutura tecnológica. Mantemos os 91% nas ruas de Manaus, com quem trabalha.</p>
              </motion.div>
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-blue-400 mb-2">R$ 3</div>
                <div className="text-sm font-medium">Custo Sugerido Pela Parceria</div>
                <p className="text-xs text-white/40 mt-3">Comércios patrocinam pins físicos com esse repasse sempre que atraem o cliente pra sua porta. Um impulsionamento barato para eles.</p>
              </motion.div>
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-purple-400 mb-2">Tech</div>
                <div className="text-sm font-medium">Inovação Manaus</div>
                <p className="text-xs text-white/40 mt-3">Com desenvolvimento regional, temos possibilidade de integrar e fomentar nossa base por meio do Pólo Digital do Amazonas.</p>
              </motion.div>
              <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center">
                <div className="text-5xl font-light text-white mb-2">B2B</div>
                <div className="text-sm font-medium">Integração Corporativa</div>
                <p className="text-xs text-white/40 mt-3">Firmamoos parcerias com o Distrito Industrial, fornecendo soluções atrativas para pacotes de locomoção diária entre fábricas e residências.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* DEMO / THE APP EXPERIENCES */}
        <section id="produto" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeIn} className="mb-20 md:w-2/3">
              <h2 className="text-purple-500 font-mono tracking-widest text-sm uppercase mb-4">03. O Nosso Sistema</h2>
              <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Três Pilares Completos.</h3>
              <p className="text-xl text-white/50 font-light">Com tecnologia desenvolvida sem gargalos, garantimos um sistema transparente e dinâmico, dividido para as 3 esferas de atendimento.</p>
            </motion.div>

            <div id="demo" className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Product 1 */}
              <motion.div variants={fadeIn} initial="initial" whileInView="whileInView" className="group">
                <Link href="/passenger" className="block relative overflow-hidden rounded-[2.5rem] bg-[#111] border border-white/10 hover:border-emerald-500/50 transition-all aspect-[4/5]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity"></div>

                  {/* Mock Screenshot bg */}
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>

                  <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end transform group-hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 backdrop-blur-md border border-emerald-500/30">
                      <Smartphone size={24} />
                    </div>
                    <h3 className="text-3xl font-medium mb-3 group-hover:text-emerald-400 transition-colors">Ambiente do Usuário</h3>
                    <ul className="space-y-2 mb-8">
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-emerald-500" /> Tela para livre escolha de tarifas</li>
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-emerald-500" /> Chat inteligente e botão de resgate/segurança</li>
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-emerald-500" /> Menu para acionar parceiros da cidade</li>
                    </ul>
                    <div className="inline-flex items-center gap-2 font-medium text-emerald-400 justify-between">
                      Abrir Tela do Cidadão <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Product 2 */}
              <motion.div variants={fadeIn} initial="initial" whileInView="whileInView" transition={{ delay: 0.2 }} className="group">
                <Link href="/driver" className="block relative overflow-hidden rounded-[2.5rem] bg-[#111] border border-white/10 hover:border-blue-500/50 transition-all aspect-[4/5]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity"></div>

                  {/* Mock Screenshot bg */}
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>

                  <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end transform group-hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 backdrop-blur-md border border-blue-500/30">
                      <Car size={24} />
                    </div>
                    <h3 className="text-3xl font-medium mb-3 group-hover:text-blue-400 transition-colors">Ambiente do Motorista</h3>
                    <ul className="space-y-2 mb-8">
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Visão de ganhos totais já separando a % do App</li>
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Função de solicitar reajuste ao Cidadão antes do aceite</li>
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Mapa de Calor visual de demanda em tempo real</li>
                    </ul>
                    <div className="inline-flex items-center gap-2 font-medium text-blue-400 justify-between">
                      Abrir Tela do Motorista <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Product 3 */}
              <motion.div variants={fadeIn} initial="initial" whileInView="whileInView" transition={{ delay: 0.4 }} className="group">
                <Link href="/admin" className="block relative overflow-hidden rounded-[2.5rem] bg-[#111] border border-white/10 hover:border-purple-500/50 transition-all aspect-[4/5]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity"></div>

                  {/* Mock Screenshot bg */}
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-105 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>

                  <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end transform group-hover:-translate-y-2 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 backdrop-blur-md border border-purple-500/30">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="text-3xl font-medium mb-3 group-hover:text-purple-400 transition-colors">Centro de Controle</h3>
                    <ul className="space-y-2 mb-8">
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Monintoramento de corridas concluídas pela Inviagem</li>
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Adição e moderação de estabelecimentos parceiros</li>
                      <li className="flex items-center gap-2 text-white/70 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Alertas da IA sobre falhas de processos.</li>
                    </ul>
                    <div className="inline-flex items-center gap-2 font-medium text-purple-400 justify-between">
                      Visualizar o Painel Administrativo <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>

            </div>
          </div>
        </section>

        {/* CTA (The Ask) */}
        <section className="py-24 px-6 mb-20">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fadeIn} className="rounded-[3rem] bg-gradient-to-r from-emerald-900/40 via-blue-900/40 to-purple-900/40 border border-white/20 p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Venha construir com a gente, de Manaus para o mundo.</h2>
                <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto font-light">
                  A Inviagem convida os empresários, lideranças locais e potenciais apoiadores de tecnologia em nosso estado a comporem o esforço da construção do mais novo ambiente integrado de negócios e mobilidade inteligente do Amazonas. Juntos podemos transformar a realidade diária de milhares de pessoas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="mailto:contato@inviagem.com.br" className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all text-lg flex items-center justify-center gap-2">
                    Falar com a Nossa Equipe <ArrowRight size={20} />
                  </a>
                  <a href="/INVIAGEM_APRESENTACAO.pdf" className="px-8 py-4 bg-white/5 border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-all text-lg flex items-center justify-center">
                    Baixar O Relatório Completo
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10 text-center">
          <div className="text-2xl font-bold tracking-tighter mb-4">INVIAGEM<span className="text-emerald-500">.</span></div>
          <div className="text-sm text-white/40">
            © 2026 Inviagem Manaus. Revolucionando a mobilidade nos detalhes e inovando do Polo para frente.
          </div>
        </footer>
      </main>
    </div>
  );
}
