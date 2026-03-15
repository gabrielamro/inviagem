'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore, Ride, User, Hotspot } from '@/lib/store';
import { Users, Map, DollarSign, Settings, Activity, CheckCircle, XCircle, AlertTriangle, Search, ChevronRight, Megaphone, Zap, Trash2, Plus, X, FileText, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useLoadScript, Marker, Circle, OverlayViewF } from '@react-google-maps/api';

const MAP_LIBRARIES: ('places' | 'geometry' | 'visualization')[] = ['places', 'geometry', 'visualization'];

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function AdminPanel() {
  const { users, currentUser, setCurrentUser, rides, sponsors, sponsoredLocations, hotspots, addHotspot, removeHotspot, updateHotspot, updateDriverClearance, deleteDriverAccount, immuTaxCollected, violations, resolveViolation } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'rides' | 'finance' | 'sponsors' | 'hotspots' | 'fleet_map'>('dashboard');
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [newHotspot, setNewHotspot] = useState<Omit<Hotspot, 'id' | 'active'>>({
    name: '',
    lat: -23.5505,
    lng: -46.6333,
    radius: 1000,
    multiplier: 1.2,
    message: ''
  });

  const [selectedDoc, setSelectedDoc] = useState<{ title: string; url: string; type: 'pdf' | 'zip' | 'image' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({ isOpen: false, userId: '', userName: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [fleetSearch, setFleetSearch] = useState('');
  const [geoFenceEnabled, setGeoFenceEnabled] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  useEffect(() => {
    if (!currentUser) {
      const admin = users.find(u => u.role === 'ADMIN');
      if (admin) setCurrentUser(admin);
    }
  }, [users, currentUser, setCurrentUser]);

  const handleAddHotspot = (e: React.FormEvent) => {
    e.preventDefault();
    addHotspot({ ...newHotspot, active: true });
    setIsAddingHotspot(false);
    setNewHotspot({
      name: '',
      lat: -23.5505,
      lng: -46.6333,
      radius: 1000,
      multiplier: 1.2,
      message: ''
    });
  };

  if (!currentUser) return <div className="flex items-center justify-center h-screen bg-[#050505] text-white">Carregando...</div>;

  const activeRidesCount = rides.filter(r => !['COMPLETED', 'PAID', 'CANCELLED'].includes(r.status)).length;
  const totalRevenue = rides.filter(r => r.status === 'PAID').reduce((acc, r) => acc + r.estimatedPrice, 0);
  const pendingDrivers = users.filter(u => u.role === 'DRIVER' && u.driverStatus === 'UNDER_REVIEW');
  const processedDrivers = users.filter(u => u.role === 'DRIVER' && (u.driverStatus === 'APPROVED' || u.driverStatus === 'REJECTED'));
  const appRevenue = totalRevenue * 0.09;

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/10 flex flex-col relative z-20 bg-[#050505]/80 backdrop-blur-xl">
        {/* Geo-Fence Global Alert (Simulation Phase 3) */}
        <AnimatePresence>
          {geoFenceEnabled && users.some(u => u.role === 'DRIVER' && u.status === 'ONLINE' && (u.location?.lat && u.location.lat > -2.9)) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/20 border-b border-red-500/30 p-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={14} className="animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Alerta de Perímetro (Manaus)</span>
              </div>
              <p className="text-[9px] text-white/50 mt-1">Motorista cruzando limite da zona permitida.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8 border-b border-white/10">
          <h1 className="text-2xl font-bold tracking-tighter">INVIAGEM<span className="text-emerald-500">.</span></h1>
          <p className="text-xs font-mono tracking-widest text-white/40 mt-2 uppercase">Painel de Controle</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'dashboard', icon: Activity, label: 'Visão Geral' },
            { id: 'users', icon: Users, label: 'Usuários e Motoristas' },
            { id: 'rides', icon: Map, label: 'Viagens Ativas' },
            { id: 'finance', icon: DollarSign, label: 'Financeiro' },
            { id: 'sponsors', icon: Megaphone, label: 'Patrocinadores (Ads)' },
            { id: 'hotspots', icon: Zap, label: 'Zonas de Demanda' },
            { id: 'fleet_map', icon: Map, label: 'Mapa de Frotas' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id
                ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={activeTab === item.id ? 'text-emerald-400' : ''} />
                <span className="font-medium tracking-wide text-sm">{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight size={16} className="text-emerald-400/50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-white/5">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-medium border border-emerald-500/30">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm tracking-wide">{currentUser.name}</p>
              <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mt-0.5">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative atmospheric-bg">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="p-12 relative z-10 max-w-7xl mx-auto">
          <header className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-light tracking-tight">
                {activeTab === 'dashboard' && 'Visão Geral da Plataforma'}
                {activeTab === 'users' && 'Gestão de Usuários'}
                {activeTab === 'rides' && 'Monitoramento de Viagens'}
                {activeTab === 'finance' && 'Relatórios Financeiros'}
                {activeTab === 'sponsors' && 'Patrocinadores & Ads'}
                {activeTab === 'fleet_map' && 'Mapa de Frotas (Tempo Real)'}
              </h2>
              <p className="text-white/50 mt-2 font-light tracking-wide">
                Métricas em tempo real e controles do sistema.
              </p>
            </div>

            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 border border-white/10 w-64">
              <Search size={16} className="text-white/40" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/30"
              />
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity"><Activity size={48} /></div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-4">Viagens Ativas</h3>
                    <div className="text-5xl font-light tracking-tighter text-white mb-4">{activeRidesCount}</div>
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      RASTREAMENTO AO VIVO
                    </div>
                  </div>

                  <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity"><DollarSign size={48} /></div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-4">Receita de Hoje</h3>
                    <div className="text-5xl font-light tracking-tighter text-emerald-400 mb-4">
                      <span className="text-2xl text-emerald-400/50 mr-1">R$</span>
                      {totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                      ↑ 12.5% VS ONTEM
                    </div>
                  </div>

                  <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity"><AlertTriangle size={48} /></div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-4">Aprovações Pendentes</h3>
                    <div className="text-5xl font-light tracking-tighter text-amber-400 mb-4">{pendingDrivers.length}</div>
                    <div className="text-xs font-mono text-amber-400/70 flex items-center gap-2">
                      AÇÃO NECESSÁRIA
                    </div>
                  </div>
                </div>

                {/* Recent Rides Table */}
                <div className="glass-panel rounded-[2rem] border border-white/10 overflow-hidden">
                  <div className="p-8 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-light tracking-tight">Atividade Recente</h3>
                    <button className="text-xs font-mono uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">Ver Todas</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-mono uppercase tracking-widest text-white/30 border-b border-white/5">
                          <th className="p-6 font-normal">ID</th>
                          <th className="p-6 font-normal">Passageiro</th>
                          <th className="p-6 font-normal">Status</th>
                          <th className="p-6 font-normal">Valor</th>
                          <th className="p-6 font-normal">Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rides.slice(0, 5).map(ride => (
                          <tr key={ride.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="p-6 text-sm font-mono text-white/40 group-hover:text-white/60 transition-colors">{ride.id.split('_')[1]}</td>
                            <td className="p-6 font-medium text-white/90">
                              {users.find(u => u.id === ride.passengerId)?.name || 'Desconhecido'}
                            </td>
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border ${ride.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                ride.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                {ride.status}
                              </span>
                            </td>
                            <td className="p-6 font-mono text-white/90">R$ {ride.estimatedPrice.toFixed(2)}</td>
                            <td className="p-6 text-sm text-white/40 font-mono">{new Date(ride.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                        {rides.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-white/30 font-light">Nenhuma viagem registrada ainda.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Geo-Fence Violations Log (Phase 3 Audit) */}
                <div className="glass-panel rounded-[2rem] border border-red-500/10 overflow-hidden bg-red-500/[0.02]">
                  <div className="p-8 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={20} className="text-red-500" />
                      <h3 className="text-xl font-light tracking-tight text-white">Log de Infrações de Perímetro (Auditoria)</h3>
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-red-500/50 uppercase">Tempo Real • GPS Manaus</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-mono uppercase tracking-widest text-white/30 border-b border-white/5">
                          <th className="p-6 font-normal">Motorista</th>
                          <th className="p-6 font-normal">Localização</th>
                          <th className="p-6 font-normal">Severidade</th>
                          <th className="p-6 font-normal">Status</th>
                          <th className="p-6 font-normal">Hora</th>
                          <th className="p-6 font-normal">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {violations.slice(0, 10).map(violation => {
                          const driver = users.find(u => u.id === violation.driverId);
                          return (
                            <tr key={violation.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                              <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-[10px]">
                                    {driver?.name.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-white/90 text-sm">{driver?.name || 'Desconhecido'}</p>
                                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">{driver?.vehicle?.plate || 'S/ PLACA'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <p className="text-xs text-white/60 truncate max-w-[200px]">{violation.addressText}</p>
                                <p className="text-[9px] font-mono text-white/30 uppercase mt-1">{violation.lastKnownLocation.lat.toFixed(4)}, {violation.lastKnownLocation.lng.toFixed(4)}</p>
                              </td>
                              <td className="p-6">
                                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded border ${violation.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  }`}>
                                  {violation.severity}
                                </span>
                              </td>
                              <td className="p-6 text-sm text-white/40 font-mono">
                                {violation.status === 'PENDING' ? (
                                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Pendente</span>
                                ) : (
                                  <span className="flex items-center gap-2 text-emerald-400"><CheckCircle size={12} /> Resolvido</span>
                                )}
                              </td>
                              <td className="p-6 text-sm text-white/40 font-mono">
                                {new Date(violation.violationTime).toLocaleTimeString()}
                              </td>
                              <td className="p-6">
                                {violation.status === 'PENDING' && (
                                  <button
                                    onClick={() => resolveViolation(violation.id)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl border border-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                                  >
                                    Arquivar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {violations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-white/30 font-light">Nenhuma infração de perímetro detectada hoje.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="glass-panel rounded-[2rem] border border-white/10 overflow-hidden">
                  <div className="p-8 border-b border-white/10">
                    <h3 className="text-xl font-light tracking-tight">Aprovações de Motoristas Pendentes</h3>
                  </div>
                  <div className="p-4 grid gap-2">
                    {pendingDrivers.map(driver => (
                      <div key={driver.id} className="flex flex-col gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/60 font-medium text-lg border border-white/10 shrink-0 overflow-hidden shadow-lg group-hover:border-emerald-500/30 transition-colors">
                              {driver.profilePhotoUrl ? (
                                <img src={driver.profilePhotoUrl} alt={driver.name} className="w-full h-full object-cover" />
                              ) : (
                                driver.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-white/90 tracking-wide text-lg">{driver.name}</h4>
                              <p className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-widest">Documentos enviados para análise • CPF: {driver.cpf}</p>
                            </div>
                          </div>
                          <div className="flex gap-3 shrink-0">
                            <button
                              onClick={() => setRejectionModal({ isOpen: true, userId: driver.id, userName: driver.name })}
                              title="Recusar Cadastro (Faltam Dados)"
                              className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
                              <XCircle size={20} />
                            </button>
                            <button
                              onClick={() => updateDriverClearance(driver.id, 'APPROVED')}
                              title="Aprovar Motorista para Corridas"
                              className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                            >
                              <CheckCircle size={20} />
                            </button>
                          </div>
                        </div>

                        {/* Detalhes do Veículo Extraídos da IA/DB */}
                        {driver.vehicle ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-[#00a2e8] mb-1">Carroceria (CRLV)</p>
                              <p className="text-sm font-medium">{driver.vehicle.brand} {driver.vehicle.model}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-[#00a2e8] mb-1">Cores e Chassi</p>
                              <p className="text-sm font-medium uppercase font-mono">{driver.vehicle.plate} • {driver.vehicle.color}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-[#00a2e8] mb-1">Ano de Fabricação</p>
                              <p className={`text-sm font-medium flex items-center gap-2 ${driver.vehicle.year < 2019 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {driver.vehicle.year}
                                {driver.vehicle.year < 2019 && <span className="text-[9px] uppercase bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/30">Vencido</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-[#00a2e8] mb-1">IMMU Capacidade Máxima</p>
                              <p className="text-sm font-medium">{driver.vehicle.capacity} Lugares Autorizados</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-500/70 italic bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                            Aguardando a varredura da nuvem confirmar o PDF deste veículo.
                          </div>
                        )}

                        {/* Análise Visual de Documentos */}
                        <div className="mt-2 pt-3 border-t border-white/5 flex flex-wrap gap-3">
                          <button
                            disabled={!driver.cnhUrl}
                            onClick={() => { setSelectedDoc({ title: `CNH - ${driver.name}`, url: driver.cnhUrl || '', type: 'pdf' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 transition-colors ${driver.cnhUrl ? 'bg-white/5 hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
                          >
                            <FileText size={12} /> CNH (PDF/X)
                          </button>
                          <button
                            disabled={!driver.vehicle?.crlvUrl}
                            onClick={() => { setSelectedDoc({ title: `CRLV - ${driver.name}`, url: driver.vehicle?.crlvUrl || '', type: 'pdf' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${driver.vehicle?.crlvUrl ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'opacity-30 cursor-not-allowed border-white/10'}`}
                          >
                            <FileText size={12} /> CRLV-e
                          </button>
                          <button
                            disabled={!driver.certificationUrl}
                            onClick={() => { setSelectedDoc({ title: `Certidões - ${driver.name}`, url: driver.certificationUrl || '', type: 'zip' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${driver.certificationUrl ? 'bg-[#00a2e8]/10 hover:bg-[#00a2e8]/20 text-[#00a2e8] border-[#00a2e8]/20' : 'opacity-30 cursor-not-allowed border-white/10'}`}
                          >
                            <Zap size={12} /> Certidões LGPD (ZIP)
                          </button>
                          <button
                            disabled={!driver.profilePhotoUrl}
                            onClick={() => { setSelectedDoc({ title: `Biometria Facial - ${driver.name}`, url: driver.profilePhotoUrl || '', type: 'image' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${driver.profilePhotoUrl ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'opacity-30 cursor-not-allowed border-white/10'}`}
                          >
                            <ShieldCheck size={12} /> Biometria Facial
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingDrivers.length === 0 && (
                      <div className="text-center text-white/30 font-light py-12">Nenhuma aprovação pendente.</div>
                    )}
                  </div>
                </div>

                {/* Motoristas Processados (Re-análise) */}
                <div className="glass-panel rounded-[2rem] border border-white/10 overflow-hidden">
                  <div className="p-8 border-b border-white/10">
                    <h3 className="text-xl font-light tracking-tight">Motoristas Analisados (Histórico)</h3>
                  </div>
                  <div className="p-4 grid gap-2">
                    {processedDrivers.map(driver => (
                      <div key={driver.id} className="flex flex-col gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-black/30 rounded-2xl flex items-center justify-center text-white/60 font-medium text-lg border border-white/20 shrink-0 overflow-hidden">
                              {driver.profilePhotoUrl ? (
                                <img src={driver.profilePhotoUrl} alt={driver.name} className="w-full h-full object-cover" />
                              ) : (
                                driver.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-white/90 tracking-wide text-lg">{driver.name}</h4>
                                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded border ${driver.driverStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                  {driver.driverStatus === 'APPROVED' ? 'Aprovado' : 'Recusado'}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-widest">Veículo: {driver.vehicle ? `${driver.vehicle.brand} ${driver.vehicle.model}` : 'Sem Veículo'} • CPF: {driver.cpf}</p>
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => updateDriverClearance(driver.id, 'UNDER_REVIEW', undefined)}
                              title="Enviar novamente para análise de documentos"
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-colors border border-white/10"
                            >
                              Reanalisar
                            </button>
                          </div>
                        </div>

                        {/* Histórico Visual de Documentos */}
                        <div className="mt-2 pt-3 border-t border-white/5 flex flex-wrap gap-3">
                          <button
                            disabled={!driver.cnhUrl}
                            onClick={() => { setSelectedDoc({ title: `CNH - ${driver.name}`, url: driver.cnhUrl || '', type: 'pdf' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 transition-colors ${driver.cnhUrl ? 'bg-white/5 hover:bg-white/10' : 'opacity-30 cursor-not-allowed'}`}
                          >
                            <FileText size={12} /> CNH (PDF/X)
                          </button>
                          <button
                            disabled={!driver.vehicle?.crlvUrl}
                            onClick={() => { setSelectedDoc({ title: `CRLV - ${driver.name}`, url: driver.vehicle?.crlvUrl || '', type: 'pdf' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${driver.vehicle?.crlvUrl ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'opacity-30 cursor-not-allowed border-white/10'}`}
                          >
                            <FileText size={12} /> CRLV-e
                          </button>
                          <button
                            disabled={!driver.certificationUrl}
                            onClick={() => { setSelectedDoc({ title: `Certidões - ${driver.name}`, url: driver.certificationUrl || '', type: 'zip' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${driver.certificationUrl ? 'bg-[#00a2e8]/10 hover:bg-[#00a2e8]/20 text-[#00a2e8] border-[#00a2e8]/20' : 'opacity-30 cursor-not-allowed border-white/10'}`}
                          >
                            <Zap size={12} /> Certidões LGPD (ZIP)
                          </button>
                          <button
                            disabled={!driver.profilePhotoUrl}
                            onClick={() => { setSelectedDoc({ title: `Biometria Facial - ${driver.name}`, url: driver.profilePhotoUrl || '', type: 'image' }); setIsModalOpen(true); }}
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${driver.profilePhotoUrl ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20' : 'opacity-30 cursor-not-allowed border-white/10'}`}
                          >
                            <ShieldCheck size={12} /> Biometria Facial
                          </button>
                        </div>
                      </div>
                    ))}
                    {processedDrivers.length === 0 && (
                      <div className="text-center text-white/30 font-light py-12">Nenhum motorista processado ainda.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">Receita Líquida do App</h3>
                    <div className="text-4xl font-light tracking-tighter text-white mb-2">
                      R$ {appRevenue.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-sm text-white/50">Representa 9% (Take Rate) de todas as viagens pagas no Pix ou Dinheiro descontadas das carteiras.</p>
                  </div>

                  <div className="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#00a2e8] mb-2">Retenção Fisco Municipal (IMMU)</h3>
                    <div className="text-4xl font-light tracking-tighter text-white mb-2">
                      R$ {immuTaxCollected.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-sm text-white/50">Reserva automática de 1% referente a conformidade da Lei 2.468/2019 de Manaus.</p>
                    <button className="mt-4 px-6 py-2 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors">
                      Gerar Guia DAM
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sponsors' && (
              <motion.div
                key="sponsors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* ... existing sponsors content ... */}
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-light tracking-tight">Campanhas Ativas</h3>
                  <button className="bg-emerald-500 text-black px-6 py-2 rounded-full font-medium text-sm hover:bg-emerald-400 transition-colors">
                    + Novo Patrocinador
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {sponsoredLocations.map(loc => {
                    const sponsor = sponsors.find(s => s.id === loc.sponsorId);
                    return (
                      <div key={loc.id} className="glass-panel p-6 rounded-[2rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-start gap-6">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/60 font-medium text-2xl border border-white/10 shrink-0">
                            {sponsor?.name.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-white/90 text-lg">{loc.name}</h4>
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border border-emerald-500/30">
                                Ativo
                              </span>
                            </div>
                            <p className="text-sm text-white/50 mt-1">{loc.address}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {loc.tags.map(tag => (
                                <span key={tag} className="bg-white/5 text-white/60 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-white/10">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Custo por Conversão (Bid)</p>
                            <p className="text-xl font-light text-emerald-400">R$ {loc.bidAmount?.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-4 mt-2 text-right">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-white/40">Impressões</p>
                              <p className="text-sm font-medium">{loc.stats?.impressions || 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-white/40">Cliques</p>
                              <p className="text-sm font-medium">{loc.stats?.clicks || 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-white/40">Conversões</p>
                              <p className="text-sm font-medium text-emerald-400">{loc.stats?.conversions || 0}</p>
                            </div>
                          </div>
                          <button className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-white transition-colors mt-2">
                            Editar Campanha
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'fleet_map' && (
              <motion.div
                key="fleet_map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 h-[calc(100vh-250px)]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                  {/* Driver List Sidebar (Phase 2 Filter) */}
                  <div className="lg:col-span-1 glass-panel rounded-[2rem] border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5 text-center">
                      <p className="text-[10px] font-mono tracking-widest text-[#00a2e8] uppercase mb-1">Status da Frota em Manaus</p>
                      <div className="flex justify-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[8px] text-white/40">ONLINE</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[8px] text-white/40">CURSO</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/20"></div><span className="text-[8px] text-white/40">OFF</span></div>
                      </div>
                    </div>
                    <div className="p-6 border-b border-white/10">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          placeholder="Filtrar por placa ou nome..."
                          value={fleetSearch}
                          onChange={e => setFleetSearch(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {users.filter(u => u.role === 'DRIVER')
                        .filter(u => !fleetSearch || u.name.toLowerCase().includes(fleetSearch.toLowerCase()) || u.vehicle?.plate.toLowerCase().includes(fleetSearch.toLowerCase()))
                        .sort((a, b) => (a.status === 'OFFLINE' ? 1 : -1))
                        .map(driver => (
                          <div
                            key={driver.id}
                            onClick={() => setSelectedDriverId(selectedDriverId === driver.id ? null : driver.id)}
                            className={`p-3 border rounded-2xl flex items-center gap-3 transition-all cursor-pointer group ${selectedDriverId === driver.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                          >
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${driver.status === 'ONLINE' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                              driver.status === 'IN_RIDE' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                'bg-white/5 border-white/10 text-white/30'
                              }`}>
                              {driver.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-white/90">{driver.name}</p>
                              <p className="text-[10px] font-mono text-white/40 tracking-wider">
                                <span className="text-[#00a2e8]">{driver.vehicle?.plate || 'S/ PLACA'}</span>
                                {driver.status === 'IN_RIDE' && <span className="ml-2 text-blue-400/50">• OCUPADO</span>}
                              </p>
                            </div>
                            {driver.status !== 'OFFLINE' && (
                              <div className="ml-auto flex flex-col items-end gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${driver.status === 'ONLINE' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-400 animate-pulse'}`}></span>
                                <p className={`text-[8px] font-mono ${driver.status === 'ONLINE' ? 'text-emerald-400' : 'text-blue-400'}`}>{driver.status === 'ONLINE' ? 'GPS' : 'LIVE'}</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Real-time Map — Google Maps */}
                  <FleetMap
                    users={users}
                    rides={rides}
                    hotspots={hotspots}
                    showHeatmap={showHeatmap}
                    setShowHeatmap={setShowHeatmap}
                    geoFenceEnabled={geoFenceEnabled}
                    setGeoFenceEnabled={setGeoFenceEnabled}
                    selectedDriverId={selectedDriverId}
                    setSelectedDriverId={setSelectedDriverId}
                  />
                </div>
              </motion.div>
            )}
            {activeTab === 'hotspots' && (
              <motion.div
                key="hotspots"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-light tracking-tight">Zonas de Alta Demanda</h3>
                  <button
                    onClick={() => setIsAddingHotspot(true)}
                    className="bg-emerald-500 text-black px-6 py-2 rounded-full font-medium text-sm hover:bg-emerald-400 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Nova Zona
                  </button>
                </div>

                {isAddingHotspot && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass-panel p-6 rounded-[2rem] border border-white/10 mb-6"
                  >
                    <h4 className="text-lg font-medium mb-4">Configurar Nova Zona</h4>
                    <form onSubmit={handleAddHotspot} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs uppercase tracking-widest text-white/40 mb-1 block">Nome da Zona</label>
                          <input
                            type="text"
                            value={newHotspot.name}
                            onChange={e => setNewHotspot({ ...newHotspot, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50"
                            placeholder="Ex: Centro Expandido"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-widest text-white/40 mb-1 block">Mensagem ao Motorista</label>
                          <input
                            type="text"
                            value={newHotspot.message}
                            onChange={e => setNewHotspot({ ...newHotspot, message: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50"
                            placeholder="Ex: Alta demanda de shows"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-widest text-white/40 mb-1 block">Multiplicador (x)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="1.0"
                            value={newHotspot.multiplier}
                            onChange={e => setNewHotspot({ ...newHotspot, multiplier: parseFloat(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-widest text-white/40 mb-1 block">Raio (metros)</label>
                          <input
                            type="number"
                            step="100"
                            min="100"
                            value={newHotspot.radius}
                            onChange={e => setNewHotspot({ ...newHotspot, radius: parseFloat(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-widest text-white/40 mb-1 block">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={newHotspot.lat}
                            onChange={e => setNewHotspot({ ...newHotspot, lat: parseFloat(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-widest text-white/40 mb-1 block">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={newHotspot.lng}
                            onChange={e => setNewHotspot({ ...newHotspot, lng: parseFloat(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => setIsAddingHotspot(false)}
                          className="px-6 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-500 text-black px-6 py-2 rounded-xl font-medium hover:bg-emerald-400 transition-colors"
                        >
                          Salvar Zona
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {hotspots.map(hotspot => (
                    <div key={hotspot.id} className="glass-panel p-6 rounded-[2rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-6 w-full">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 font-medium text-2xl border border-amber-500/20 shrink-0">
                          <Zap size={32} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-white/90 text-lg">{hotspot.name}</h4>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${hotspot.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
                              {hotspot.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-sm text-white/50 mb-2">{hotspot.message}</p>
                          <div className="flex gap-4 text-xs font-mono text-white/40">
                            <span className="flex items-center gap-1"><Map size={12} /> {hotspot.radius}m raio</span>
                            <span className="flex items-center gap-1 text-emerald-400"><DollarSign size={12} /> {hotspot.multiplier}x tarifa</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => updateHotspot(hotspot.id, { active: !hotspot.active })}
                          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors border ${hotspot.active ? 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                        >
                          {hotspot.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => removeHotspot(hotspot.id)}
                          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {hotspots.length === 0 && (
                    <div className="text-center py-12 text-white/30 font-light">
                      Nenhuma zona de alta demanda configurada.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'rides' && (
              <motion.div
                key="rides"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Ativas Now */}
                <div className="glass-panel rounded-[2rem] border border-blue-500/20 overflow-hidden bg-blue-500/[0.02]">
                  <div className="p-8 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <h3 className="text-xl font-light tracking-tight">Viagens em Curso (Live)</h3>
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-blue-400/50 uppercase">{rides.filter(r => r.status === 'IN_PROGRESS' || r.status === 'DRIVER_ARRIVING').length} Ativas</span>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rides.filter(r => r.status === 'IN_PROGRESS' || r.status === 'DRIVER_ARRIVING').map(ride => {
                      const passenger = users.find(u => u.id === ride.passengerId);
                      const driver = users.find(u => u.id === ride.driverId);
                      return (
                        <div key={ride.id} className="bg-black/40 border border-white/10 rounded-3xl p-6 hover:border-blue-500/30 transition-all group">
                          <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">ID: {ride.id.split('_')[1]}</span>
                            <span className="bg-blue-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                              {ride.status === 'IN_PROGRESS' ? 'Em Trânsito' : 'Motorista Chegando'}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                                {passenger?.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Passageiro</p>
                                <p className="text-sm font-medium text-white/90 truncate">{passenger?.name}</p>
                              </div>
                            </div>

                            <div className="py-2 flex flex-col gap-1 border-l-2 border-dashed border-white/10 ml-5 my-1">
                              <div className="flex items-center gap-2 -ml-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <p className="text-[10px] text-white/40 truncate">{ride.origin.address}</p>
                              </div>
                              <div className="flex items-center gap-2 -ml-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <p className="text-[10px] text-white/40 truncate">{ride.destination.address}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                                {driver?.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] uppercase tracking-widest text-[#00a2e8] mb-0.5">Motorista</p>
                                <p className="text-sm font-medium text-white/90 truncate">{driver?.name}</p>
                                <p className="text-[9px] font-mono text-white/40">{driver?.vehicle?.plate} • {driver?.vehicle?.model}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-white/30">Valor Combinado</p>
                              <p className="text-lg font-light text-emerald-400">R$ {ride.offeredPrice.toFixed(2)}</p>
                            </div>
                            <button className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {rides.filter(r => r.status === 'IN_PROGRESS' || r.status === 'DRIVER_ARRIVING').length === 0 && (
                      <div className="col-span-full py-12 text-center text-white/20 italic text-sm">Nenhuma viagem em curso neste momento.</div>
                    )}
                  </div>
                </div>

                {/* Historico */}
                <div className="glass-panel rounded-[2rem] border border-white/10 overflow-hidden">
                  <div className="p-8 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-light tracking-tight">Histórico de Corridas (Finalizadas)</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">De:</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs text-white/80 font-mono invert brightness-200"
                        />
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono ml-2">Até:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs text-white/80 font-mono invert brightness-200"
                        />
                        {(startDate || endDate) && (
                          <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="ml-2 text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-tighter"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-mono text-white/40 hover:text-white transition-colors border border-white/5">Exportar CSV</button>
                    </div>
                  </div>

                  {/* Period Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/5 bg-white/[0.01]">
                    {(() => {
                      const filteredHistory = rides.filter(r => {
                        const isFinished = ['COMPLETED', 'PAID', 'CANCELLED'].includes(r.status);
                        if (!isFinished) return false;

                        const rideDate = new Date(r.createdAt);
                        rideDate.setHours(0, 0, 0, 0);

                        if (startDate) {
                          const start = new Date(startDate);
                          start.setHours(0, 0, 0, 0);
                          if (rideDate < start) return false;
                        }

                        if (endDate) {
                          const end = new Date(endDate);
                          end.setHours(23, 59, 59, 999);
                          if (rideDate > end) return false;
                        }

                        return true;
                      });

                      const periodTotal = filteredHistory.filter(r => r.status === 'PAID').reduce((acc, r) => acc + r.offeredPrice, 0);
                      const periodTax = periodTotal * 0.09;
                      const periodCount = filteredHistory.length;
                      const periodSuccess = filteredHistory.filter(r => r.status === 'PAID' || r.status === 'COMPLETED').length;

                      return (
                        <>
                          <div className="p-6 border-r border-white/5">
                            <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Volume Bruto (Período)</p>
                            <p className="text-xl font-light text-white">R$ {periodTotal.toFixed(2)}</p>
                          </div>
                          <div className="p-6 border-r border-white/5">
                            <p className="text-[9px] uppercase tracking-widest text-emerald-400/60 mb-1">Comissão App (9%)</p>
                            <p className="text-xl font-light text-emerald-400">R$ {periodTax.toFixed(2)}</p>
                          </div>
                          <div className="p-6 border-r border-white/5">
                            <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Total de Chamadas</p>
                            <p className="text-xl font-light text-white">{periodCount}</p>
                          </div>
                          <div className="p-6">
                            <p className="text-[9px] uppercase tracking-widest text-blue-400/60 mb-1">Corridas Finalizadas</p>
                            <p className="text-xl font-light text-blue-400">{periodSuccess}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-mono uppercase tracking-widest text-white/30 border-b border-white/5">
                          <th className="p-6 font-normal">Hora/Data</th>
                          <th className="p-6 font-normal">Passageiro & Motorista</th>
                          <th className="p-6 font-normal">Trajeto</th>
                          <th className="p-6 font-normal">Status</th>
                          <th className="p-6 font-normal">Preço</th>
                          <th className="p-6 font-normal">Taxa App</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rides.filter(r => {
                          const isFinished = ['COMPLETED', 'PAID', 'CANCELLED'].includes(r.status);
                          if (!isFinished) return false;

                          const rideDate = new Date(r.createdAt);
                          rideDate.setHours(0, 0, 0, 0);

                          if (startDate) {
                            const start = new Date(startDate);
                            start.setHours(0, 0, 0, 0);
                            if (rideDate < start) return false;
                          }

                          if (endDate) {
                            const end = new Date(endDate);
                            end.setHours(23, 59, 59, 999);
                            if (rideDate > end) return false;
                          }

                          return true;
                        }).map(ride => {
                          const passenger = users.find(u => u.id === ride.passengerId);
                          const driver = users.find(u => u.id === ride.driverId);
                          return (
                            <tr key={ride.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                              <td className="p-6 font-mono text-xs text-white/40">
                                {new Date(ride.createdAt).toLocaleDateString()}<br />
                                <span className="text-white/60">{new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>
                              <td className="p-6">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-white/90">{passenger?.name || '---'}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                    <p className="text-[10px] text-white/40 truncate max-w-[120px]">{driver?.name || 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="max-w-[200px]">
                                  <p className="text-[10px] text-white/60 truncate">{ride.origin.address}</p>
                                  <p className="text-[10px] text-white/30 truncate mt-1">{ride.destination.address}</p>
                                </div>
                              </td>
                              <td className="p-6">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest border ${ride.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  ride.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                  {ride.status}
                                </span>
                              </td>
                              <td className="p-6 font-mono text-sm text-white/90">R$ {ride.offeredPrice.toFixed(2)}</td>
                              <td className="p-6 font-mono text-xs text-emerald-400/60">R$ {(ride.offeredPrice * 0.09).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main >

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {
          isModalOpen && selectedDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#0a0a0a] border border-white/20 rounded-[2rem] w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-light tracking-tight text-white">{selectedDoc.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest">Acesso Criptografado Disponível</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-3">
                    <button
                      onClick={() => window.open(selectedDoc.url, '_blank')}
                      className="px-4 py-2 bg-emerald-600 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      Abrir em Nova Guia
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 active:scale-95"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-black/40 flex items-center justify-center relative">
                  {selectedDoc?.url && selectedDoc.url !== '#' ? (
                    <div className="w-full h-full p-2">
                      {selectedDoc.type === 'pdf' ? (
                        <iframe
                          src={`${selectedDoc.url}#toolbar=0`}
                          className="w-full h-full rounded-2xl border border-white/5"
                          title="Document Viewer"
                        />
                      ) : selectedDoc.type === 'image' ? (
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <img src={selectedDoc.url} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain border border-white/10" alt="Documento" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                          <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400/30 mb-6 border border-blue-500/20">
                            <Zap size={48} />
                          </div>
                          <h4 className="text-xl font-light text-white/80 mb-2">Pacote Comprimido (ZIP)</h4>
                          <p className="text-sm text-white/40 max-w-md leading-relaxed">
                            Este arquivo deve ser baixado para análise local.
                          </p>
                          <a
                            href={selectedDoc.url}
                            download
                            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-colors"
                          >
                            Baixar Documentos
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                      <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500/20 mb-6 border border-red-500/20">
                        <FileText size={48} />
                      </div>
                      <h4 className="text-xl font-light text-white/80 mb-2">URL Não Encontrada</h4>
                      <p className="text-sm text-white/40 max-w-md leading-relaxed">
                        O link deste documento ainda não foi sincronizado com o Storage do Supabase ou o upload falhou.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {
          rejectionModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
              onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#0a0a0a] border border-red-500/20 rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-[0_0_100px_rgba(255,0,0,0.1)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                      <XCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-light tracking-tight text-white">Recusar Documentação</h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Motorista: {rejectionModal.userName}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-3">
                      Motivo da Recusa / Instruções de Correção
                    </label>
                    <textarea
                      autoFocus
                      placeholder="Ex: CNH vencida ou Foto do CRLV está cortada. Por favor, envie novamente o arquivo completo."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none placeholder:text-white/20"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <p className="text-[10px] text-white/30 italic mt-3">
                      Este texto será exibido no aplicativo do motorista para que ele saiba exatamente o que regularizar.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                      <div>
                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Zona de Perigo</h4>
                        <p className="text-[10px] text-white/40 mt-1">Excluir permanentemente este pré-cadastro</p>
                      </div>
                      <button
                        onClick={() => setIsDeleteArmed(!isDeleteArmed)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isDeleteArmed ? 'bg-red-500 text-black' : 'bg-white/5 text-red-500 border border-red-500/20'}`}
                      >
                        {isDeleteArmed ? '🔒 Destravar' : '🔓 Trava de Segurança'}
                      </button>
                    </div>

                    {isDeleteArmed && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={async () => {
                          const confirmed = window.confirm(`Tem CERTEZA que deseja APAGAR ${rejectionModal.userName}? Esta ação não pode ser desfeita.`);
                          if (confirmed) {
                            const success = await deleteDriverAccount(rejectionModal.userId);
                            if (success) {
                              setRejectionModal({ ...rejectionModal, isOpen: false });
                              setIsDeleteArmed(false);
                            }
                          }
                        }}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.2)]"
                      >
                        <Trash2 size={16} /> APAGAR REGISTRO PERMANENTEMENTE
                      </motion.button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                      className="py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={!rejectionReason.trim()}
                      onClick={() => {
                        updateDriverClearance(rejectionModal.userId, 'REJECTED', rejectionReason);
                        setRejectionModal({ ...rejectionModal, isOpen: false });
                        setRejectionReason('');
                        setIsDeleteArmed(false);
                      }}
                      className="py-4 bg-red-500 disabled:bg-red-500/20 disabled:text-white/20 hover:bg-red-400 text-black rounded-2xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
                    >
                      Confirmar Recusa
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </div >
  );
}

// ─── FleetMap Component ────────────────────────────────────────────────────────
interface FleetMapProps {
  users: User[];
  rides: Ride[];
  hotspots: Hotspot[];
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean) => void;
  geoFenceEnabled: boolean;
  setGeoFenceEnabled: (v: boolean) => void;
  selectedDriverId: string | null;
  setSelectedDriverId: (id: string | null) => void;
}

function FleetMap({ users, rides, hotspots, showHeatmap, setShowHeatmap, geoFenceEnabled, setGeoFenceEnabled, selectedDriverId, setSelectedDriverId }: FleetMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries: MAP_LIBRARIES });

  const onlineDrivers = users.filter(u => u.role === 'DRIVER' && u.status !== 'OFFLINE');

  // Default to Manaus center
  const defaultCenter = { lat: -3.1190, lng: -60.0217 };

  // Calculate center based on first online driver with location, or Manaus
  const mapCenter = onlineDrivers.find(d => d.location)?.location
    ? { lat: onlineDrivers.find(d => d.location)!.location!.lat, lng: onlineDrivers.find(d => d.location)!.location!.lng }
    : defaultCenter;

  if (loadError) {
    return (
      <div className="lg:col-span-3 glass-panel rounded-[2rem] border border-red-500/20 overflow-hidden flex items-center justify-center bg-red-500/5 min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-2">⚠️ Erro ao carregar mapa</p>
          <p className="text-white/40 text-xs">Verifique a chave da API Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="lg:col-span-3 glass-panel rounded-[2rem] border border-white/10 overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 glass-panel rounded-[2rem] border border-white/10 overflow-hidden relative min-h-[400px]">
      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', minHeight: 400 }}
        center={mapCenter}
        zoom={12}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          backgroundColor: '#0a0a0a',
        }}
      >
        {/* Driver Markers */}
        {onlineDrivers.map(driver => {
          if (!driver.location) return null;
          const isSelected = selectedDriverId === driver.id;
          const color = driver.status === 'ONLINE' ? '#10b981' : '#3b82f6';
          return (
            <Marker
              key={driver.id}
              position={{ lat: driver.location.lat, lng: driver.location.lng }}
              onClick={() => setSelectedDriverId(isSelected ? null : driver.id)}
              icon={{
                path: 'M -8,-8 L 8,-8 L 8,8 L -8,8 Z',
                fillColor: '#000000',
                fillOpacity: 0.9,
                strokeColor: color,
                strokeWeight: isSelected ? 3 : 2,
                scale: isSelected ? 1.5 : 1.2,
                anchor: new (window as any).google.maps.Point(0, 0),
              }}
              label={{
                text: driver.name.charAt(0),
                color: color,
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            />
          );
        })}

        {/* Hotspot Circles (when heatmap is enabled) */}
        {showHeatmap && hotspots.filter(h => h.active).map(hotspot => (
          <Circle
            key={hotspot.id}
            center={{ lat: hotspot.lat, lng: hotspot.lng }}
            radius={hotspot.radius}
            options={{
              fillColor: '#ef4444',
              fillOpacity: 0.1,
              strokeColor: '#ef4444',
              strokeOpacity: 0.4,
              strokeWeight: 1,
            }}
          />
        ))}
      </GoogleMap>

      {/* UI Overlays on top of the map */}
      {/* Top-right controls */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-30 pointer-events-auto">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl transition-all text-left ${showHeatmap ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-black/70 border-white/10 text-white/50 hover:bg-black/90'}`}
        >
          <Zap size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Visualizar Hotspots</span>
        </button>
        <button
          onClick={() => setGeoFenceEnabled(!geoFenceEnabled)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl transition-all ${geoFenceEnabled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-black/70 border-white/10 text-white/50 hover:bg-black/90'}`}
        >
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Monitorar Perímetro</span>
        </button>
      </div>

      {/* Top-left badge */}
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-4">
          <Map size={14} className="text-emerald-400" />
          <p className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">Auditado: IMMU Manaus • v1.5</p>
        </div>
      </div>

      {/* Bottom-left stats */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-3xl border border-white/15 p-5 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={16} className="text-emerald-400" />
            <h4 className="text-[9px] font-mono tracking-[0.2em] text-white/60 uppercase">Estatísticas Operacionais</h4>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-3xl font-light text-white mb-1">{users.filter(u => u.role === 'DRIVER' && u.status === 'ONLINE').length}</p>
              <div className="flex items-center gap-1.5 font-mono text-[8px] text-emerald-400">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>LIVE
              </div>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div>
              <p className="text-3xl font-light text-blue-400 mb-1">{users.filter(u => u.role === 'DRIVER' && u.status === 'IN_RIDE').length}</p>
              <div className="font-mono text-[8px] text-blue-400">OCUPADOS</div>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div>
              <p className="text-3xl font-light text-[#00a2e8] mb-1">{rides.filter(r => r.status === 'MATCHING').length}</p>
              <div className="font-mono text-[8px] text-[#00a2e8]">SOLICITAÇÕES</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
