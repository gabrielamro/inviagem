'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export type RideStatus =
  | 'CREATED'
  | 'MATCHING'
  | 'NEGOTIATING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAID'
  | 'CANCELLED'
  | 'NO_DRIVER';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string;
  active: boolean;
}

export interface SponsoredLocation {
  id: string;
  sponsorId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  tags: string[];
  rating: number;
  active: boolean;
  bidAmount?: number;
  stats?: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  origin: Location;
  destination: Location;
  category: 'X' | 'Comfort' | 'Black' | 'Moto Entrega' | 'Carro Entrega';
  status: RideStatus;
  estimatedPrice: number;
  offeredPrice: number;
  lastOfferBy?: 'PASSENGER' | 'DRIVER';
  estimatedTime: number; // minutes
  startTime?: number; // timestamp when status became IN_PROGRESS
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
}

export interface Vehicle {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  capacity: number;
  crlvUrl?: string; // Link direto para o storage
}

export interface User {
  id: string;
  name: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  cpf?: string; // Phase 1
  driverStatus?: 'PENDING_DOCS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'; // Phase 1
  walletBalance?: number; // Phase 3 (Carteira Pessoal)
  status?: 'OFFLINE' | 'ONLINE' | 'IN_RIDE'; // For drivers
  location?: Location; // Current location
  vehicle?: Vehicle; // Relational vehicle for analytics
  cnhUrl?: string; // Link da CNH no Storage
  certificationUrl?: string; // Link do ZIP no Storage
  profilePhotoUrl?: string; // Foto real do motorista
  rejectionReason?: string; // Motivo da recusa para o motorista corrigir
}

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  multiplier: number; // e.g. 1.2x
  name: string;
  message: string;
  active: boolean;
}

interface StoreContextType {
  rides: Ride[];
  users: User[];
  sponsors: Sponsor[];
  sponsoredLocations: SponsoredLocation[];
  hotspots: Hotspot[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  registerUser: (user: Omit<User, 'id'>) => Promise<User | null>;
  loginUser: (cpf: string, role: string) => Promise<User | null>;
  submitDriverDocs: (userId: string, vehicleData: any, files: { cnh?: File, crlv?: File, certification?: File, profile?: File }) => Promise<boolean>;
  createRide: (ride: Omit<Ride, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Ride | null>;
  updateRideStatus: (id: string, status: RideStatus, driverId?: string) => Promise<void>;
  updateRidePrice: (id: string, newPrice: number, offeredBy: 'PASSENGER' | 'DRIVER', driverId?: string) => Promise<void>;
  updateUserLocation: (userId: string, location: Location) => void;
  updateDriverStatus: (userId: string, status: 'OFFLINE' | 'ONLINE' | 'IN_RIDE') => void;
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => void;
  addSponsoredLocation: (location: Omit<SponsoredLocation, 'id'>) => void;
  toggleSponsorStatus: (id: string) => void;
  toggleLocationStatus: (id: string) => void;
  trackAdEvent: (locationId: string, event: 'impression' | 'click' | 'conversion') => void;
  addChatMessage: (rideId: string, senderId: string, text: string) => void;
  addHotspot: (hotspot: Omit<Hotspot, 'id'>) => void;
  removeHotspot: (id: string) => void;
  updateHotspot: (id: string, updates: Partial<Hotspot>) => void;
  updateDriverClearance: (userId: string, status: 'PENDING_DOCS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
  addWalletBalance: (userId: string, amount: number) => void;
  deleteDriverAccount: (userId: string) => Promise<boolean>;
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  immuTaxCollected: number; // Variável global pro tesouro municipal
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rides, setRides] = useState<Ride[]>([]);

  // Carrega corridas do Supabase
  useEffect(() => {
    const fetchActiveRides = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setRides(data.map(mapSupabaseRideToFront));
      }
    };

    fetchActiveRides();

    // Assinatura Live do Supabase Realtime (Coração do App)
    const channel = supabase.channel('rides_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, payload => {
        if (payload.eventType === 'INSERT') {
          setRides(prev => [mapSupabaseRideToFront(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRides(prev => prev.map(ride => ride.id === payload.new.id ? mapSupabaseRideToFront(payload.new) : ride));
        } else if (payload.eventType === 'DELETE') {
          setRides(prev => prev.filter(ride => ride.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Carrega Usuários do Supabase (Para o Admin Panel)
  useEffect(() => {
    const fetchUsers = async () => {
      // Usando inner join do postgREST para trazer veículos atrelados
      const { data, error } = await supabase.from('users').select('*, vehicles(*)');
      if (!error && data) {
        setUsers(data.map(row => {
          let vehicleInfo;
          if (row.vehicles && row.vehicles.length > 0) {
            const v = row.vehicles[0];
            vehicleInfo = {
              plate: v.plate,
              brand: v.brand,
              model: v.model,
              year: v.manufacturing_year,
              color: v.color,
              capacity: v.maximum_capacity,
              crlvUrl: v.crlv_url
            }
          }

          return {
            id: row.id,
            name: row.name,
            role: row.role,
            cpf: row.cpf,
            driverStatus: row.driver_status,
            walletBalance: row.wallet_balance,
            status: row.status,
            location: row.location ? { lat: row.location.lat, lng: row.location.lng, address: row.address_text || '' } : undefined,
            vehicle: vehicleInfo,
            cnhUrl: row.cnh_url,
            certificationUrl: row.certification_url,
            profilePhotoUrl: row.profile_photo_url, // Mapeia do banco
            rejectionReason: row.rejection_reason,
          };
        }));
      }
    };
    fetchUsers();

    const usersChannel = supabase.channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers) // recarrega a lista se houver alteração
      .subscribe();

    return () => { supabase.removeChannel(usersChannel); };
  }, []);

  const mapSupabaseRideToFront = (row: any): Ride => ({
    id: row.id,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    origin: { lat: row.origin_lat, lng: row.origin_lng, address: row.origin_address },
    destination: { lat: row.dest_lat, lng: row.dest_lng, address: row.dest_address },
    category: row.category,
    status: row.status,
    estimatedPrice: row.estimated_price,
    offeredPrice: row.offered_price,
    lastOfferBy: row.last_offer_by,
    estimatedTime: row.estimated_time,
    startTime: row.start_time,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
  const [users, setUsers] = useState<User[]>([]);
  const [immuTaxCollected, setImmuTaxCollected] = useState(0);
  const [sponsors, setSponsors] = useState<Sponsor[]>([
    { id: 's1', name: 'Hamburgueria do Zé', active: true },
    { id: 's2', name: 'Shopping Cidade', active: true }
  ]);
  const [sponsoredLocations, setSponsoredLocations] = useState<SponsoredLocation[]>([
    {
      id: 'l1',
      sponsorId: 's1',
      name: 'Hamburgueria do Zé (Matriz)',
      address: 'Avenida Paulista, 1000, São Paulo',
      lat: -23.565,
      lng: -46.652,
      description: 'O melhor blend artesanal da cidade. Ganhe 10% OFF pedindo pelo Inviagem.',
      tags: ['hamburguer', 'lanche', 'jantar', 'fast food'],
      rating: 4.9,
      active: true,
      bidAmount: 2.50,
      stats: { impressions: 1450, clicks: 320, conversions: 45 }
    },
    {
      id: 'l2',
      sponsorId: 's2',
      name: 'Shopping Cidade',
      address: 'Rua Augusta, 2000, São Paulo',
      lat: -23.558,
      lng: -46.660,
      description: 'O maior centro de compras da região. Desembarque VIP.',
      tags: ['shopping', 'compras', 'cinema', 'passeio'],
      rating: 4.7,
      active: true,
      bidAmount: 1.50,
      stats: { impressions: 3200, clicks: 540, conversions: 82 }
    }
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoMode, setDemoMode] = useState(true); // Default to true for realism during demonstration

  const [hotspots, setHotspots] = useState<Hotspot[]>([
    {
      id: 'h1',
      lat: -23.561684,
      lng: -46.655981,
      radius: 1000,
      multiplier: 1.5,
      name: 'Av. Paulista',
      message: 'Alta demanda de saída de escritórios',
      active: true
    },
    {
      id: 'h2',
      lat: -23.598772,
      lng: -46.676388,
      radius: 800,
      multiplier: 1.3,
      name: 'Vila Olímpia',
      message: 'Happy Hour bombando!',
      active: true
    }
  ]);

  const addHotspot = useCallback((hotspot: Omit<Hotspot, 'id'>) => {
    setHotspots(prev => [...prev, { ...hotspot, id: `h_${Date.now()}` }]);
  }, []);

  const removeHotspot = useCallback((id: string) => {
    setHotspots(prev => prev.filter(h => h.id !== id));
  }, []);

  const updateHotspot = useCallback((id: string, updates: Partial<Hotspot>) => {
    setHotspots(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, []);

  const registerUser = useCallback(async (userData: Omit<User, 'id'>) => {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: userData.name,
          role: userData.role,
          cpf: userData.cpf,
          driver_status: userData.driverStatus,
          wallet_balance: userData.walletBalance,
          status: userData.status
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao registrar no Supabase:", error);
      return null;
    }

    const newUser: User = {
      id: data.id,
      name: data.name,
      role: data.role as any,
      cpf: data.cpf,
      driverStatus: data.driver_status,
      walletBalance: data.wallet_balance,
      status: data.status
    };

    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, []);

  const loginUser = useCallback(async (cpf: string, role: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('cpf', cpf)
      .eq('role', role)
      .single();

    if (error || !data) {
      console.error("Erro no login:", error);
      return null;
    }

    const foundUser: User = {
      id: data.id,
      name: data.name,
      role: data.role as any,
      cpf: data.cpf,
      driverStatus: data.driver_status,
      walletBalance: data.wallet_balance,
      status: data.status
    };

    return foundUser;
  }, []);

  const submitDriverDocs = useCallback(async (userId: string, vehicleData: any, files: { cnh?: File, crlv?: File, certification?: File, profile?: File }) => {
    try {
      let cnhUrl = '';
      let crlvUrl = '';
      let certificationUrl = '';
      let profileUrl = '';

      // Alerta barulhento para debug em mobile
      window.alert(`DEBUG: Iniciando envio.\nArquivos: CNH=${!!files.cnh}, CRLV=${!!files.crlv}, CERT=${!!files.certification}, PROFILE=${!!files.profile}`);

      // Helper para upload
      const uploadFile = async (file: File, path: string) => {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}/${path}_${Date.now()}.${fileExt}`;

          window.alert(`DEBUG: Tentando upload de ${path}...`);

          const { error: uploadError } = await supabase.storage
            .from('driver-documents')
            .upload(fileName, file);

          if (uploadError) {
            window.alert(`❌ ERRO NO STORAGE (${path}): ${uploadError.message}`);
            throw uploadError;
          }

          const { data } = supabase.storage
            .from('driver-documents')
            .getPublicUrl(fileName);

          console.log(`URL para ${path}:`, data.publicUrl);
          return data.publicUrl;
        } catch (e: any) {
          window.alert(`❌ FALHA CRÍTICA NO UPLOAD (${path}): ${e.message}`);
          throw e;
        }
      };

      // Realiza uploads se os arquivos existirem
      if (files.cnh) cnhUrl = await uploadFile(files.cnh, 'cnh');
      if (files.crlv) crlvUrl = await uploadFile(files.crlv, 'crlv');
      if (files.certification) certificationUrl = await uploadFile(files.certification, 'certification');
      if (files.profile) profileUrl = await uploadFile(files.profile, 'profile_photo');

      console.log("URLs geradas:", { cnhUrl, crlvUrl, certificationUrl, profileUrl });

      // 1. Insere dados do Veículo (Placa, Ano, Modelo...)
      const { error: vehError } = await supabase
        .from('vehicles')
        .upsert([{
          driver_id: userId,
          plate: vehicleData.plate,
          model: vehicleData.model,
          brand: vehicleData.brand,
          color: vehicleData.color,
          manufacturing_year: parseInt(vehicleData.year),
          maximum_capacity: parseInt(vehicleData.capacity),
          status: 'PENDING',
          crlv_url: crlvUrl || null // Garante que mandamos null se vazio para o BD
        }], { onConflict: 'plate' });

      if (vehError) {
        console.error("Erro ao salvar veículo:", vehError);
        alert("Erro no banco de dados (Veículo): " + vehError.message);
        return false;
      }

      // 2. Registra o LOG LGPD Imutável
      await supabase
        .from('lgpd_terms_logs')
        .insert([{
          user_id: userId,
          ip_address: '127.0.0.1',
          term_version: 'v1.0-IMMU'
        }]);

      // 3. Atualiza status e URLs na tabela de Users
      const userUpdate: any = { driver_status: 'UNDER_REVIEW' };
      if (cnhUrl) userUpdate.cnh_url = cnhUrl;
      if (certificationUrl) userUpdate.certification_url = certificationUrl;
      if (profileUrl) userUpdate.profile_photo_url = profileUrl;

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', userId);

      if (userError) {
        console.error("Erro ao atualizar usuário:", userError);
        alert("Erro no banco de dados (Usuário): " + userError.message);
        return false;
      }

      // 4. Atualiza contexto local
      setCurrentUser(prev => prev ? {
        ...prev,
        driverStatus: 'UNDER_REVIEW',
        cnhUrl: cnhUrl || prev.cnhUrl,
        certificationUrl: certificationUrl || prev.certificationUrl,
        profilePhotoUrl: profileUrl || prev.profilePhotoUrl,
        vehicle: prev.vehicle ? {
          ...prev.vehicle,
          crlvUrl: crlvUrl || prev.vehicle.crlvUrl
        } : undefined
      } : null);

      alert("🎉 Documentos enviados com sucesso! Aguarde a análise do administrador.");
      return true;
    } catch (err) {
      console.error("Erro geral no submitDriverDocs:", err);
      alert("❌ " + (err instanceof Error ? err.message : "Erro desconhecido ao enviar"));
      return false;
    }
  }, []);

  const createRide = useCallback(async (rideData: Omit<Ride, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('rides')
      .insert([{
        passenger_id: rideData.passengerId,
        origin_lat: rideData.origin.lat,
        origin_lng: rideData.origin.lng,
        origin_address: rideData.origin.address,
        dest_lat: rideData.destination.lat,
        dest_lng: rideData.destination.lng,
        dest_address: rideData.destination.address,
        category: rideData.category,
        estimated_price: rideData.estimatedPrice,
        offered_price: rideData.offeredPrice,
        estimated_time: rideData.estimatedTime,
        status: 'MATCHING'
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar corrida no Supabase:", error);
      return null;
    }
    return mapSupabaseRideToFront(data);
  }, []);

  const updateRideStatus = useCallback(async (id: string, status: RideStatus, driverId?: string) => {
    // 1. Store previous state for rollback
    let previousRides: Ride[] | undefined;
    setRides(prev => {
      previousRides = [...prev];
      return prev.map(ride => ride.id === id ? { ...ride, status, driver_id: driverId || ride.driverId, updated_at: new Date() } : ride);
    });

    const updateObj: any = { status, updated_at: new Date().toISOString() };
    if (driverId) updateObj.driver_id = driverId;
    if (status === 'IN_PROGRESS') updateObj.start_time = Date.now();

    const { error } = await supabase.from('rides').update(updateObj).eq('id', id);

    if (error) {
      console.error("Erro ao atualizar status no Supabase:", error);
      if (previousRides) {
        setRides(previousRides);
        alert("Erro de conexão: O status da corrida não pôde ser atualizado.");
      }
      return;
    }

    // Business logic for completed rides
    if (status === 'COMPLETED') {
      const ride = rides.find(r => r.id === id);
      if (ride) {
        const takeRate = ride.offeredPrice * 0.09;
        const immuTax = ride.offeredPrice * 0.01;
        setUsers(usersList => usersList.map(u => {
          if (u.id === (driverId || ride.driverId) && u.role === 'DRIVER') {
            return { ...u, walletBalance: (u.walletBalance || 0) - (takeRate + immuTax) };
          }
          return u;
        }));
        setImmuTaxCollected(prev => prev + immuTax);
      }
    }
  }, [rides]);

  const updateRidePrice = useCallback(async (id: string, newPrice: number, offeredBy: 'PASSENGER' | 'DRIVER', driverId?: string) => {
    // 1. Store previous state for rollback
    let previousRides: Ride[] | undefined;
    setRides(prev => {
      previousRides = [...prev];
      return prev.map(ride => ride.id === id ? { ...ride, offeredPrice: newPrice, lastOfferBy: offeredBy, status: 'NEGOTIATING', updated_at: new Date() } : ride);
    });

    const updateObj: any = {
      offered_price: newPrice,
      last_offer_by: offeredBy,
      status: 'NEGOTIATING',
      updated_at: new Date().toISOString()
    };
    if (driverId) updateObj.driver_id = driverId;

    const { error } = await supabase.from('rides').update(updateObj).eq('id', id);
    if (error) {
      console.error("Erro ao atualizar preço no Supabase:", error);
      if (previousRides) {
        setRides(previousRides);
        alert("Erro ao enviar contraproposta: Verifique sua conexão.");
      }
    }
  }, []);

  const updateUserLocation = useCallback((userId: string, location: Location) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, location } : user))
    );
  }, []);

  const updateDriverStatus = useCallback((userId: string, status: 'OFFLINE' | 'ONLINE' | 'IN_RIDE') => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, status } : user))
    );
    setCurrentUser(prev => (prev?.id === userId ? { ...prev, status } : prev));
  }, []);

  const updateDriverClearance = useCallback(async (userId: string, driverStatus: 'PENDING_DOCS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED', reason?: string) => {
    // 1. Store previous state for rollback
    let previousUser: User | undefined;

    setUsers(prev => {
      previousUser = prev.find(u => u.id === userId);
      return prev.map(u => u.id === userId ? { ...u, driverStatus, rejectionReason: reason } : u);
    });

    setCurrentUser(prev => prev?.id === userId ? { ...prev, driverStatus, rejectionReason: reason } : prev);

    // 2. Prepare Payload
    const updatePayload: any = { driver_status: driverStatus };
    if (driverStatus === 'REJECTED') {
      updatePayload.rejection_reason = reason || 'Documentos inconsistentes';
    } else {
      updatePayload.rejection_reason = null;
    }

    // 3. Update remote
    const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);

    if (error) {
      console.error("Erro crítico ao sincronizar status com Supabase:", error);

      // 4. Robust Rollback
      if (previousUser) {
        setUsers(prev => prev.map(u => u.id === userId ? previousUser! : u));
        if (currentUser?.id === userId) {
          setCurrentUser(previousUser);
        }
        alert(`Falha na sincronização: O status de ${previousUser.name} foi revertido devido a um erro de rede ou permissão.`);
      }
    }
  }, [currentUser]);

  const addWalletBalance = useCallback((userId: string, amount: number) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, walletBalance: (user.walletBalance || 0) + amount } : user))
    );
    setCurrentUser(prev => (prev?.id === userId ? { ...prev, walletBalance: (prev.walletBalance || 0) + amount } : prev));
  }, []);

  const deleteDriverAccount = useCallback(async (userId: string) => {
    try {
      // 1. Delete vehicle first (foreign key dependency usually requires this)
      await supabase.from('vehicles').delete().eq('driver_id', userId);

      // 2. Delete user
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;

      // 3. Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));

      return true;
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      alert("Erro ao excluir: " + (err instanceof Error ? err.message : "Erro desconhecido"));
      return false;
    }
  }, []);

  const addSponsor = useCallback((sponsor: Omit<Sponsor, 'id'>) => {
    setSponsors(prev => [...prev, { ...sponsor, id: `s_${Date.now()}` }]);
  }, []);

  const addSponsoredLocation = useCallback((location: Omit<SponsoredLocation, 'id'>) => {
    setSponsoredLocations(prev => [...prev, { ...location, id: `l_${Date.now()}` }]);
  }, []);

  const toggleSponsorStatus = useCallback((id: string) => {
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  }, []);

  const toggleLocationStatus = useCallback((id: string) => {
    setSponsoredLocations(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  }, []);

  const trackAdEvent = useCallback((locationId: string, event: 'impression' | 'click' | 'conversion') => {
    setSponsoredLocations(prev => prev.map(l => {
      if (l.id === locationId) {
        const stats = l.stats || { impressions: 0, clicks: 0, conversions: 0 };
        return {
          ...l,
          stats: {
            ...stats,
            [event + 's']: stats[event + 's' as keyof typeof stats] + 1
          }
        };
      }
      return l;
    }));
  }, []);

  const addChatMessage = useCallback((rideId: string, senderId: string, text: string) => {
    setRides(prev => prev.map(ride => {
      if (ride.id === rideId) {
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderId,
          text,
          timestamp: Date.now()
        };
        return {
          ...ride,
          messages: [...(ride.messages || []), newMessage]
        };
      }
      return ride;
    }));
  }, []);

  // Simulation Logic
  useEffect(() => {
    if (!isDemoMode) return;

    // REMOVED: Auto-assignment of driver. User wants to do this manually.

    const assignedRide = rides.find(r => r.status === 'DRIVER_ASSIGNED');
    if (assignedRide) {
      // Driver takes about 5-10 seconds to "arrive" at the origin in demo
      const timer = setTimeout(() => {
        updateRideStatus(assignedRide.id, 'DRIVER_ARRIVING');
      }, 8000);
      return () => clearTimeout(timer);
    }

    const arrivingRide = rides.find(r => r.status === 'DRIVER_ARRIVING');
    if (arrivingRide) {
      // Passenger takes about 4 seconds to "board" in demo
      const timer = setTimeout(() => {
        updateRideStatus(arrivingRide.id, 'IN_PROGRESS');
      }, 6000);
      return () => clearTimeout(timer);
    }

    const inProgressRide = rides.find(r => r.status === 'IN_PROGRESS');
    if (inProgressRide) {
      // Scale: 1 minute estimated = 2 seconds real time for demo purposes
      const duration = (inProgressRide.estimatedTime || 5) * 2000;
      const timer = setTimeout(() => {
        updateRideStatus(inProgressRide.id, 'COMPLETED');
        updateDriverStatus('d1', 'ONLINE');
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [rides, isDemoMode, updateRideStatus, updateDriverStatus]);

  return (
    <StoreContext.Provider
      value={{
        rides,
        users,
        sponsors,
        sponsoredLocations,
        hotspots,
        currentUser,
        setCurrentUser,
        registerUser,
        loginUser,
        submitDriverDocs,
        createRide,
        updateRideStatus,
        updateRidePrice,
        updateUserLocation,
        updateDriverStatus,
        addSponsor,
        addSponsoredLocation,
        toggleSponsorStatus,
        toggleLocationStatus,
        trackAdEvent,
        addChatMessage,
        addHotspot,
        removeHotspot,
        updateHotspot,
        updateDriverClearance,
        addWalletBalance,
        deleteDriverAccount,
        isDemoMode,
        setDemoMode,
        immuTaxCollected,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
