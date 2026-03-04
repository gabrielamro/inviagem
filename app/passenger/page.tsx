'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, Ride, Location } from '@/lib/store';
import { MapPin, Navigation, CreditCard, MessageSquare, ShieldAlert, Star, Search, Car, CheckCircle2, User as UserIcon, ArrowRight, Menu, X, Volume2, VolumeX, Play, Timer, ShieldCheck, Info, Check, DollarSign, Share2, Wind, Clock, Calendar, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { GoogleGenAI, Modality } from "@google/genai";
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, Autocomplete, Polyline, TrafficLayerF } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -23.5505, // São Paulo
  lng: -46.6333,
};

const libraries: ("places" | "geometry" | "visualization")[] = ["places", "geometry", "visualization"];

export default function PassengerApp() {
  const router = useRouter();
  const { isDemoMode, setDemoMode, createRide, currentUser, setCurrentUser, registerUser, loginUser, updateRideStatus, sponsoredLocations, trackAdEvent, users, rides, addChatMessage } = useStore();
  const [activeTab, setActiveTab] = useState<'home' | 'ride' | 'settings' | 'ai' | 'history'>('home');

  // Auth & Docs state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authCpf, setAuthCpf] = useState('');
  const [authError, setAuthError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originObj, setOriginObj] = useState<Location | null>(null);
  const [destObj, setDestObj] = useState<Location | null>(null);

  const [category, setCategory] = useState<'X' | 'Comfort' | 'Black' | 'Moto Entrega' | 'Carro Entrega'>('X');
  const [showVehicleOptions, setShowVehicleOptions] = useState(false);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [isCustomOfferEnabled, setIsCustomOfferEnabled] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  const [prefSilent, setPrefSilent] = useState(false);
  const [prefAC, setPrefAC] = useState(true);
  const [scheduledRide, setScheduledRide] = useState(false);
  const [notification, setNotification] = useState<{ title: string, body: string } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [originAutocomplete, setOriginAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [destAutocomplete, setDestAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const [carAnimPosition, setCarAnimPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [carHeading, setCarHeading] = useState(0);
  const [isAutoCenter, setIsAutoCenter] = useState(true);
  const originInitializedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Get current location and watch for changes
  useEffect(() => {
    if (navigator.geolocation && isLoaded) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(pos);

          // Only set origin automatically on the first load
          if (!originInitializedRef.current) {
            originInitializedRef.current = true;
            // Try to geocode the address
            if (window.google) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: pos }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                  const address = results[0].formatted_address;
                  setOriginObj({ ...pos, address });
                  setOrigin(address);
                } else {
                  setOriginObj({ ...pos, address: 'Sua localização atual' });
                  setOrigin('Sua localização atual');
                }
              });
            } else {
              setOriginObj({ ...pos, address: 'Sua localização atual' });
              setOrigin('Sua localização atual');
            }
          }
        },
        (error) => {
          console.error("Error: The Geolocation service failed.", error);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isLoaded]);

  // Generate nearby cars when map center changes
  const nearbyCars = React.useMemo(() => {
    if (!mapCenter || directionsResponse) return [];
    const offsets = [
      { lat: 0.005, lng: 0.005 },
      { lat: -0.008, lng: 0.002 },
      { lat: 0.003, lng: -0.007 },
      { lat: -0.004, lng: -0.004 },
      { lat: 0.009, lng: -0.001 },
    ];
    return offsets.map((offset, i) => ({
      id: i,
      lat: mapCenter.lat + offset.lat,
      lng: mapCenter.lng + offset.lng,
    }));
  }, [mapCenter, directionsResponse]);

  // Fit bounds when directions change
  useEffect(() => {
    if (directionsResponse && mapRef) {
      const bounds = directionsResponse.routes[0].bounds;
      if (bounds) {
        // Use a small timeout to ensure the map has processed the renderer
        setTimeout(() => {
          mapRef.fitBounds(bounds, { bottom: 400, left: 50, right: 50, top: 120 });
        }, 50);
      }
    }
  }, [directionsResponse, mapRef]);

  // Login simulation
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'PASSENGER') {
      const passenger = users.find(u => u.role === 'PASSENGER');
      if (passenger) setCurrentUser(passenger);
    }
  }, [users, currentUser, setCurrentUser]);

  const activeRide = rides.find(r => r.passengerId === currentUser?.id && !['COMPLETED', 'PAID', 'CANCELLED'].includes(r.status));

  // Phase 3: Push Notification for Chat (Mock)
  useEffect(() => {
    if (activeRide?.messages && activeRide.messages.length > 0) {
      const lastMsg = activeRide.messages[activeRide.messages.length - 1];
      if (lastMsg.senderId !== currentUser?.id && !showChat) {
        setNotification({ title: 'Mensagem do Motorista', body: lastMsg.text });
        const timer = setTimeout(() => setNotification(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeRide?.messages, showChat, currentUser?.id]);

  // Recalculate route if active ride exists but no directions (e.g. on refresh)
  useEffect(() => {
    if (activeRide && !directionsResponse && isLoaded && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: activeRide.origin.address,
        destination: activeRide.destination.address,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }).then(result => {
        setDirectionsResponse(result);
      }).catch(err => console.error("Error recalculating route:", err));
    }
  }, [activeRide, directionsResponse, isLoaded]);

  // Car Animation Logic
  useEffect(() => {
    if (activeRide?.status === 'IN_PROGRESS' && directionsResponse && activeRide.startTime && window.google) {
      const path = directionsResponse.routes[0].overview_path;
      const totalDuration = (activeRide.estimatedTime || 5) * 2000; // 1 min = 2 sec for demo

      let animId: number;
      const animate = () => {
        const elapsed = Date.now() - (activeRide.startTime || 0);
        const progress = Math.min(elapsed / totalDuration, 1);

        if (path.length > 1) {
          const totalPoints = path.length;
          const floatIndex = progress * (totalPoints - 1);
          const index = Math.floor(floatIndex);
          const nextIndex = Math.min(index + 1, totalPoints - 1);
          const segmentProgress = floatIndex - index;

          const currentPoint = path[index];
          const nextPoint = path[nextIndex];

          const lat = currentPoint.lat() + (nextPoint.lat() - currentPoint.lat()) * segmentProgress;
          const lng = currentPoint.lng() + (nextPoint.lng() - currentPoint.lng()) * segmentProgress;

          // Calculate heading for rotation
          if (index < totalPoints - 1) {
            const heading = window.google.maps.geometry.spherical.computeHeading(currentPoint, nextPoint);
            setCarHeading(heading);
          }

          const newPos = { lat, lng };
          setCarAnimPosition(newPos);

          // Update route polyline to erase traveled path
          if (routePolylineRef.current) {
            const remainingPath = [newPos, ...path.slice(nextIndex)];
            routePolylineRef.current.setPath(remainingPath);
          }

          if (isAutoCenter && mapRef) {
            mapRef.panTo(newPos);
            if (isAutoCenter) {
              setMapCenter(newPos);
            }
          }
        }

        if (progress < 1) {
          animId = requestAnimationFrame(animate);
        }
      };

      animId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animId);
    } else if (carAnimPosition !== null && activeRide?.status !== 'IN_PROGRESS') {
      setTimeout(() => setCarAnimPosition(null), 0);
    }
  }, [activeRide?.status, activeRide?.startTime, activeRide?.estimatedTime, directionsResponse, carAnimPosition, mapRef, isAutoCenter]);

  const handleSendChat = (text: string = chatMessage) => {
    if (!text.trim() || !activeRide || !currentUser) return;

    // Simulate AI Moderation (Phase 3)
    const lowerText = text.toLowerCase();
    if (lowerText.includes('palavrão') || lowerText.includes('ofensa') || lowerText.includes('idiota') || lowerText.includes('burro')) {
      alert("🤖 Inviagem AI: Sua mensagem violou as diretrizes de comunidade e foi bloqueada.");
      return;
    }

    addChatMessage(activeRide.id, currentUser.id, text);
    if (text === chatMessage) setChatMessage('');
  };

  const handleSelectLocationFromAI = (locAddress: string) => {
    setDestination(locAddress);
    setActiveTab('home');

    if (window.google && originObj) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: locAddress }, async (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const newDest = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            address: results[0].formatted_address || locAddress
          };
          setDestObj(newDest);
          await calculateRoute(originObj, newDest);
          setShowVehicleOptions(true);
        } else {
          // Fallback if geocoding fails
          console.warn("Geocoding failed for:", locAddress);
        }
      });
    }
  };

  const calculateRoute = async (originLoc: Location, destLoc: Location) => {
    if (!window.google) {
      setCustomPrice(getEstimatedPrice(category));
      setShowVehicleOptions(true);
      return;
    }
    const directionsService = new window.google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: originLoc.address,
        destination: destLoc.address,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
      // Initialize custom price when route is found
      const initialPrice = getEstimatedPrice(category);
      setCustomPrice(initialPrice);
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  };

  const getEstimatedPrice = useCallback((cat: string) => {
    let baseFare = 5;
    let perKm = 2;
    let perMin = 0.5;

    if (cat === 'Comfort') { baseFare = 8; perKm = 3; perMin = 0.8; }
    else if (cat === 'Black') { baseFare = 12; perKm = 5; perMin = 1.2; }
    else if (cat === 'Moto Entrega') { baseFare = 4; perKm = 1.5; perMin = 0.4; }
    else if (cat === 'Carro Entrega') { baseFare = 6; perKm = 2.5; perMin = 0.6; }

    let distanceKm = 5;
    let durationMins = 12;

    if (directionsResponse) {
      const leg = directionsResponse.routes[0].legs[0];
      distanceKm = (leg.distance?.value || 0) / 1000;
      durationMins = Math.ceil((leg.duration?.value || 0) / 60);
    }

    return baseFare + (distanceKm * perKm) + (durationMins * perMin);
  }, [directionsResponse]);

  const autocompleteOptions = React.useMemo(() => {
    if (!isLoaded || !window.google) return undefined;

    // Create a bounds object roughly 50km around the current map center
    const offset = 0.5; // roughly 50km
    return {
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(mapCenter.lat - offset, mapCenter.lng - offset),
        new window.google.maps.LatLng(mapCenter.lat + offset, mapCenter.lng + offset)
      ),
      strictBounds: false, // bias towards the bounds, but don't restrict strictly
    };
  }, [isLoaded, mapCenter]);

  const handleRequestRide = async () => {
    if (!originObj || !destObj || !currentUser) return;

    const estimatedPrice = getEstimatedPrice(category);
    let estimatedTime = 12;

    if (directionsResponse) {
      const leg = directionsResponse.routes[0].legs[0];
      estimatedTime = Math.ceil((leg.duration?.value || 0) / 60);
    }

    const ride = await createRide({
      passengerId: currentUser.id,
      origin: originObj,
      destination: destObj,
      category,
      estimatedPrice,
      offeredPrice: isCustomOfferEnabled ? customPrice : estimatedPrice,
      lastOfferBy: 'PASSENGER',
      estimatedTime,
    });

    if (ride) {
      setShowVehicleOptions(false);
      setActiveTab('ride');
    } else {
      alert("Não foi possível conectar com os servidores em Manaus para registrar a viagem. Tente de novo.");
    }
  };

  const handleCancelRide = () => {
    if (activeRide) {
      updateRideStatus(activeRide.id, 'CANCELLED');
      setActiveTab('home');
      setDirectionsResponse(null);
      setOrigin('');
      setDestination('');
      setOriginObj(null);
      setDestObj(null);
    }
  };

  const handlePay = () => {
    if (activeRide) {
      // Check for conversion
      const sponsoredLoc = sponsoredLocations.find(l => l.address === activeRide.destination.address);
      if (sponsoredLoc) {
        trackAdEvent(sponsoredLoc.id, 'conversion');
      }

      updateRideStatus(activeRide.id, 'PAID');
      setActiveTab('home');
      setDirectionsResponse(null);
      setOrigin('');
      setDestination('');
      setOriginObj(null);
      setDestObj(null);
    }
  };

  const handleRegisterPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const newUser = await registerUser({
      name: authName,
      role: 'PASSENGER',
      cpf: authCpf,
      walletBalance: 0,
    });
    if (newUser) {
      setCurrentUser(newUser);
    } else {
      setAuthError('Erro ao criar conta. CPF já existe?');
    }
  };

  const handleLoginPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authCpf) return setAuthError("Por favor, digite seu CPF.");

    const foundUser = await loginUser(authCpf, 'PASSENGER');
    if (foundUser) {
      setCurrentUser(foundUser);
    } else {
      setAuthError("Passageiro não encontrado com este CPF.");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen bg-[#050505] text-white max-w-md mx-auto relative overflow-hidden font-sans justify-center p-8">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="text-3xl font-bold tracking-tighter mb-4">INVIAGEM<span className="text-emerald-500">.</span></div>
          <h1 className="text-2xl font-light tracking-tight">{authMode === 'login' ? 'Bem-vindo de volta' : 'Faça seu cadastro'}</h1>
          <p className="text-white/50 text-sm mt-3 font-light">
            {authMode === 'login' ? 'Faça login para pedir uma corrida.' : 'Junte-se ao app de mobilidade regional.'}
          </p>
          {authError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {authError}
            </div>
          )}
        </div>

        {authMode === 'login' ? (
          <form className="relative z-10 space-y-4" onSubmit={handleLoginPassenger}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">CPF (Acesso)</label>
              <input type="text" value={authCpf} onChange={(e) => setAuthCpf(e.target.value)} required className="w-full bg-transparent text-white outline-none font-medium text-sm" placeholder="000.000.000-00" />
            </div>

            <button type="submit" className="w-full py-4 mt-8 bg-emerald-600 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              Entrar na Conta
            </button>
            <div onClick={(e) => { e.preventDefault(); setAuthMode('register'); }} className="w-full py-4 text-center text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
              Não tem conta? Cadastre-se
            </div>
          </form>
        ) : (
          <form className="relative z-10 space-y-4" onSubmit={handleRegisterPassenger}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Nome Completo</label>
              <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} required className="w-full bg-transparent text-white outline-none font-medium text-sm" placeholder="Como quer ser chamado?" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">CPF</label>
              <input type="text" value={authCpf} onChange={(e) => setAuthCpf(e.target.value)} required className="w-full bg-transparent text-white outline-none font-mono text-sm tracking-wider" placeholder="000.000.000-00" />
            </div>

            <button type="submit" className="w-full py-4 mt-8 bg-emerald-600 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              Criar Conta Pessoal
            </button>
            <div onClick={(e) => { e.preventDefault(); setAuthMode('login'); }} className="w-full py-4 text-center text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
              Já tem conta? Fazer Login
            </div>
          </form>
        )}
      </div>
    );
  }

  // Fase 1: Onboarding do Passageiro (Termos de Uso e Dados Básicos)
  if (!hasAcceptedTerms) {
    return (
      <div className="flex flex-col h-screen bg-[#050505] text-white w-full max-w-md mx-auto p-8 relative overflow-hidden font-sans justify-center">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-center mb-10">
          <div className="text-3xl font-bold tracking-tighter mb-4">INVIAGEM<span className="text-emerald-500">.</span></div>
          <h1 className="text-2xl font-light tracking-tight">O seu app de mobilidade regional.</h1>
          <p className="text-white/50 text-sm mt-3 font-light">Para sua segurança e cumprimento da legislação local, precisamos de algumas informações.</p>
        </div>

        <form className="relative z-10 space-y-4" onSubmit={(e) => { e.preventDefault(); setHasAcceptedTerms(true); }}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Nome Completo</label>
            <input type="text" defaultValue={currentUser.name} required className="w-full bg-transparent text-white outline-none font-medium" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">CPF (Obrigatório Lei Munic. 2.468)</label>
            <input type="text" placeholder="000.000.000-00" defaultValue={currentUser.cpf} required className="w-full bg-transparent text-white outline-none font-mono tracking-wider" />
          </div>

          <div className="flex items-start gap-3 mt-6 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
            <input type="checkbox" id="terms" required className="mt-1 flex-shrink-0 w-4 h-4 rounded appearance-none border border-emerald-500/50 checked:bg-emerald-500 checked:before:content-['✓'] checked:before:text-black checked:before:flex checked:before:justify-center checked:before:items-center checked:before:text-xs" />
            <label htmlFor="terms" className="text-xs text-white/70 font-light leading-relaxed">
              Li e concordo com os Termos de Uso e Políticas de Privacidade. Autorizo o compartilhamento de dados com o IMMU para fins de fiscalização.
            </label>
          </div>

          <button type="submit" className="w-full py-4 mt-8 bg-emerald-600 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            Avançar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto relative bg-[#050505] overflow-hidden font-sans text-white">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        {(!apiKey || loadError) ? (
          <div className="w-full h-full bg-[#1a1a1a] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 p-6 text-center z-10">
              <MapPin size={48} className="mb-4 text-white/20" />
              <p className="font-medium text-white/50">{!apiKey ? 'Mapa em Modo Simulado (Sem API)' : 'Erro no Google Maps'}</p>
            </div>
          </div>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onLoad={(map) => setMapRef(map)}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
                { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
              ],
            }}
          >
            {directionsResponse && (
              <>
                <DirectionsRenderer
                  directions={directionsResponse}
                  options={{
                    suppressMarkers: true,
                    suppressPolylines: true, // Explicitly suppress default polyline to hide traffic colors
                    preserveViewport: true,
                  }}
                />
                {/* Dynamic Route Polyline */}
                <Polyline
                  key={activeRide?.id} // Force re-mount on new ride
                  path={directionsResponse.routes[0].overview_path}
                  onLoad={(polyline) => {
                    routePolylineRef.current = polyline;
                  }}
                  options={{
                    strokeColor: "#3b82f6",
                    strokeWeight: 5,
                    strokeOpacity: 1,
                    zIndex: 10
                  }}
                />

                {/* Real Traffic Layer from Google Maps API */}
                <TrafficLayerF />
              </>
            )}

            {originObj && !directionsResponse && (
              <Marker
                position={{ lat: originObj.lat, lng: originObj.lng }}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng && window.google) {
                    const newLat = e.latLng.lat();
                    const newLng = e.latLng.lng();
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
                      if (status === 'OK' && results?.[0]) {
                        const address = results[0].formatted_address;
                        const newOrigin = { lat: newLat, lng: newLng, address };
                        setOriginObj(newOrigin);
                        setOrigin(address);
                      }
                    });
                  }
                }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
              />
            )}

            {activeRide && !directionsResponse && (
              <>
                <Marker
                  position={{ lat: activeRide.origin.lat, lng: activeRide.origin.lng }}
                  icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                />
                <Marker
                  position={{ lat: activeRide.destination.lat, lng: activeRide.destination.lng }}
                  icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                />
              </>
            )}

            {carAnimPosition && (
              <>
                {/* Car Shadow */}
                <Marker
                  position={carAnimPosition}
                  zIndex={50}
                  icon={{
                    path: "M8,8 H42 V92 H8 Z",
                    scale: 0.35,
                    fillColor: "#000000",
                    fillOpacity: 0.2,
                    strokeWeight: 0,
                    rotation: carHeading,
                    anchor: new window.google.maps.Point(21, 46)
                  }}
                />
                {/* Car Body (Yellow) */}
                <Marker
                  position={carAnimPosition}
                  zIndex={51}
                  icon={{
                    path: "M10,5 Q10,0 25,0 Q40,0 40,5 V95 Q40,100 25,100 Q10,100 10,95 Z",
                    scale: 0.35,
                    fillColor: "#FFC107",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#D97706",
                    rotation: carHeading,
                    anchor: new window.google.maps.Point(25, 50)
                  }}
                />
                {/* Car Roof (Orange-Yellow) */}
                <Marker
                  position={carAnimPosition}
                  zIndex={52}
                  icon={{
                    path: "M14,35 H36 V75 H14 Z",
                    scale: 0.35,
                    fillColor: "#F59E0B",
                    fillOpacity: 1,
                    strokeWeight: 0,
                    rotation: carHeading,
                    anchor: new window.google.maps.Point(25, 50)
                  }}
                />
                {/* Car Windows (Blue) */}
                <Marker
                  position={carAnimPosition}
                  zIndex={53}
                  icon={{
                    path: "M12,20 L14,35 H36 L38,20 Q25,15 12,20 Z M14,75 L12,90 Q25,95 38,90 L36,75 Z",
                    scale: 0.35,
                    fillColor: "#3B82F6",
                    fillOpacity: 1,
                    strokeWeight: 0,
                    rotation: carHeading,
                    anchor: new window.google.maps.Point(25, 50)
                  }}
                />
                {/* Side Mirrors (Yellow) */}
                <Marker
                  position={carAnimPosition}
                  zIndex={52}
                  icon={{
                    path: "M6,25 H10 V32 H6 Z M40,25 H44 V32 H40 Z",
                    scale: 0.35,
                    fillColor: "#FFC107",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#D97706",
                    rotation: carHeading,
                    anchor: new window.google.maps.Point(25, 50)
                  }}
                />
              </>
            )}

            {!directionsResponse && nearbyCars.map(car => (
              <Marker
                key={car.id}
                position={{ lat: car.lat, lng: car.lng }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: "#ffffff",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#3b82f6"
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white/50">Carregando Mapa...</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] pointer-events-none"></div>

        {/* Auto-Center Button */}
        {activeRide && !isAutoCenter && (
          <div className="absolute top-24 right-4 z-20 pointer-events-auto">
            <button
              onClick={() => {
                setIsAutoCenter(true);
                if (carAnimPosition) setMapCenter(carAnimPosition);
              }}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              title="Centralizar no Veículo"
            >
              <Navigation size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="absolute top-0 inset-x-0 p-6 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMenu(true)}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="text-xl font-bold tracking-tighter drop-shadow-md">INVIAGEM<span className="text-blue-500">.</span></div>
        </div>
        <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-sm font-medium border border-white/10 pointer-events-auto">
          {currentUser.name.charAt(0)}
        </div>
      </header>

      {/* Side Menu / Drawer */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-white/10 z-50 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="text-xl font-bold tracking-tighter">INVIAGEM<span className="text-blue-500">.</span></div>
                <button onClick={() => setShowMenu(false)} className="text-white/40 hover:text-white">&times;</button>
              </div>

              <div className="space-y-1 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4 ml-2">Modo de Uso</p>
                <button
                  onClick={() => { setShowMenu(false); router.push('/passenger'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20"
                >
                  <UserIcon size={20} />
                  <span className="font-medium">Passageiro</span>
                </button>
                <button
                  onClick={() => { setShowMenu(false); router.push('/driver'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                >
                  <Car size={20} />
                  <span className="font-medium">Motorista</span>
                </button>

                <div className="pt-4 mt-4 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4 ml-2">Configurações</p>
                  <button
                    onClick={() => setDemoMode(!isDemoMode)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-colors ${isDemoMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                  >
                    <div className="flex items-center gap-4">
                      <ShieldAlert size={20} />
                      <span className="font-medium text-sm">Modo Simulação</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDemoMode ? 'bg-emerald-500' : 'bg-white/20'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDemoMode ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-medium">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      {currentUser.name}
                      <ShieldCheck size={14} className="text-blue-400" />
                    </p>
                    <p className="text-[10px] text-white/40 uppercase tracking-tighter">Passageiro Verificado</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="absolute inset-0 z-10 flex flex-col justify-end p-4 pb-28 pointer-events-none">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && !activeRide && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4 pointer-events-auto"
            >
              {/* Quick Actions */}
              <AnimatePresence>
                {!directionsResponse && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 10 }}
                    className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1 -mx-4 px-4 mask-fade-edges"
                  >
                    <button onClick={() => setActiveTab('ai')} className="glass-panel shrink-0 px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <MessageSquare size={14} className="text-purple-400" />
                      <span className="text-xs font-medium">IA</span>
                    </button>
                    <button onClick={() => {
                      const newDest = { lat: -23.55, lng: -46.63, address: 'Casa' };
                      setDestination('Casa'); setDestObj(newDest);
                      if (originObj) calculateRoute(originObj, newDest);
                    }} className="glass-panel shrink-0 px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <Star size={14} className="text-emerald-400" />
                      <span className="text-xs font-medium">Casa</span>
                    </button>
                    <button onClick={() => {
                      const newDest = { lat: -23.56, lng: -46.64, address: 'Trabalho' };
                      setDestination('Trabalho'); setDestObj(newDest);
                      if (originObj) calculateRoute(originObj, newDest);
                    }} className="glass-panel shrink-0 px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <Star size={14} className="text-blue-400" />
                      <span className="text-xs font-medium">Trabalho</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Booking Form */}
              <div className="glass-panel p-6 rounded-[2rem] space-y-6">
                <AnimatePresence mode="wait">
                  {!directionsResponse ? (
                    <motion.div
                      key="inputs"
                      initial={{ opacity: 0, height: 0, y: 20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 20 }}
                      className="space-y-4 relative"
                    >
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                        <div className="flex-1">
                          {isLoaded ? (
                            <Autocomplete
                              options={autocompleteOptions}
                              onLoad={setOriginAutocomplete}
                              onPlaceChanged={() => {
                                if (originAutocomplete) {
                                  const place = originAutocomplete.getPlace();
                                  if (place.geometry?.location) {
                                    const newOrigin = {
                                      lat: place.geometry.location.lat(),
                                      lng: place.geometry.location.lng(),
                                      address: place.formatted_address || place.name || ''
                                    };
                                    setOrigin(newOrigin.address);
                                    setOriginObj(newOrigin);
                                    setMapCenter({ lat: newOrigin.lat, lng: newOrigin.lng });
                                    if (destObj) {
                                      calculateRoute(newOrigin, destObj);
                                    }
                                  }
                                }
                              }}
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  placeholder="Local de partida"
                                  className="bg-transparent w-full outline-none text-sm placeholder:text-white/30 text-white pr-8"
                                  value={origin}
                                  onChange={(e) => setOrigin(e.target.value)}
                                />
                                {origin && (
                                  <button
                                    onClick={() => { setOrigin(''); setOriginObj(null); }}
                                    className="absolute right-0 text-white/30 hover:text-white transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </Autocomplete>
                          ) : (
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder="Local de partida"
                                className="bg-transparent w-full outline-none text-sm placeholder:text-white/30 text-white pr-8"
                                value={origin}
                                onChange={(e) => {
                                  setOrigin(e.target.value);
                                  if (e.target.value) {
                                    const newOrigin = { lat: -23.55, lng: -46.63, address: e.target.value };
                                    setOriginObj(newOrigin);
                                    if (destObj) calculateRoute(newOrigin, destObj);
                                  } else {
                                    setOriginObj(null);
                                  }
                                }}
                              />
                              {origin && (
                                <button
                                  onClick={() => { setOrigin(''); setOriginObj(null); }}
                                  className="absolute right-0 text-white/30 hover:text-white transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Fase 4: Dica de Embarque Seguro */}
                      {!directionsResponse && (
                        <div className="flex items-start gap-2 text-[10px] text-white/40 ml-10 mt-[-8px]">
                          <Info size={12} className="shrink-0 mt-0.5" />
                          <span>Sugestão: Aguarde em locais iluminados, evite pedir em vias expressas ou túneis.</span>
                        </div>
                      )}
                      <div className="absolute left-5 top-10 bottom-10 w-px bg-white/10"></div>
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                        <div className="flex-1">
                          {isLoaded ? (
                            <Autocomplete
                              options={autocompleteOptions}
                              onLoad={setDestAutocomplete}
                              onPlaceChanged={() => {
                                if (destAutocomplete) {
                                  const place = destAutocomplete.getPlace();
                                  if (place.geometry?.location) {
                                    const newDest = {
                                      lat: place.geometry.location.lat(),
                                      lng: place.geometry.location.lng(),
                                      address: place.formatted_address || place.name || ''
                                    };
                                    setDestination(newDest.address);
                                    setDestObj(newDest);
                                    if (originObj) {
                                      calculateRoute(originObj, newDest);
                                    }
                                  }
                                }
                              }}
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  placeholder="Para onde vamos?"
                                  className="bg-transparent w-full outline-none text-sm placeholder:text-white/30 text-white pr-8"
                                  value={destination}
                                  onChange={(e) => setDestination(e.target.value)}
                                />
                                {destination && (
                                  <button
                                    onClick={() => { setDestination(''); setDestObj(null); setDirectionsResponse(null); }}
                                    className="absolute right-0 text-white/30 hover:text-white transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </Autocomplete>
                          ) : (
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder="Para onde vamos?"
                                className="bg-transparent w-full outline-none text-sm placeholder:text-white/30 text-white pr-8"
                                value={destination}
                                onChange={(e) => {
                                  setDestination(e.target.value);
                                  if (e.target.value) {
                                    const newDest = { lat: -23.56, lng: -46.64, address: e.target.value };
                                    setDestObj(newDest);
                                    if (originObj) calculateRoute(originObj, newDest);
                                  } else {
                                    setDestObj(null);
                                    setDirectionsResponse(null);
                                  }
                                }}
                              />
                              {destination && (
                                <button
                                  onClick={() => { setDestination(''); setDestObj(null); setDirectionsResponse(null); }}
                                  className="absolute right-0 text-white/30 hover:text-white transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Phase 4: Multiple Stops Button Mode */}
                      <button className="text-[10px] text-blue-400 font-medium ml-12 flex items-center gap-1 mt-2 hover:text-blue-300 transition-colors">
                        <Map size={12} />
                        Adicionar parada extra
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
                      onClick={() => setDirectionsResponse(null)}
                    >
                      <div className="flex flex-col gap-2 overflow-hidden">
                        <div className="flex items-center gap-3 text-sm text-white/70 truncate">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0"></div>
                          <span className="truncate">{originObj?.address || origin}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium truncate">
                          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] shrink-0"></div>
                          <span className="truncate">{destObj?.address || destination}</span>
                        </div>
                      </div>
                      <div className="text-xs text-blue-400 font-medium shrink-0 ml-4 bg-blue-500/10 px-3 py-1.5 rounded-full">Editar</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Categories are now in the bottom sheet */}

                <button
                  onClick={() => setShowVehicleOptions(true)}
                  disabled={!originObj || !destObj}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  Solicitar
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {(activeTab === 'ride' || activeRide) && activeTab !== 'ai' && (
            <motion.div
              key="ride"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full pointer-events-auto"
            >
              {/* Ride Status Overlay */}
              <div className="absolute top-24 inset-x-0 flex justify-center pointer-events-none">
                <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3">
                  <Navigation size={20} className="animate-pulse text-blue-400" />
                  <span className="font-medium text-sm tracking-wide uppercase">
                    {activeRide?.status === 'MATCHING' && 'Procurando Motorista'}
                    {activeRide?.status === 'NEGOTIATING' && 'Contraproposta Recebida'}
                    {activeRide?.status === 'DRIVER_ASSIGNED' && 'Motorista a Caminho'}
                    {activeRide?.status === 'DRIVER_ARRIVING' && 'Motorista Chegando'}
                    {activeRide?.status === 'IN_PROGRESS' && 'Em Viagem'}
                    {activeRide?.status === 'COMPLETED' && 'Chegou ao Destino'}
                  </span>
                </div>
              </div>

              {/* Ride Details Bottom Sheet */}
              <div className="glass-panel rounded-[2rem] p-6 space-y-6 border-t border-white/10">
                {activeRide?.status === 'NEGOTIATING' && activeRide.lastOfferBy === 'DRIVER' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-yellow-400 mb-2">
                      <ShieldAlert size={24} />
                      <h3 className="text-xl font-bold">Contraproposta</h3>
                    </div>
                    <p className="text-sm text-white/70">Um motorista propôs um novo valor para a corrida.</p>
                    <div className="text-4xl font-bold my-4">R$ {activeRide.offeredPrice.toFixed(2).replace('.', ',')}</div>
                    <div className="flex gap-3">
                      <button onClick={handleCancelRide} className="flex-1 py-4 rounded-2xl bg-white/10 font-medium hover:bg-white/20 transition-colors">Recusar</button>
                      <button onClick={() => updateRideStatus(activeRide.id, 'DRIVER_ASSIGNED')} className="flex-1 py-4 rounded-2xl bg-blue-600 font-medium hover:bg-blue-500 transition-colors">Aceitar</button>
                    </div>
                  </div>
                ) : activeRide?.status === 'DRIVER_ARRIVING' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-light tracking-tight">João (SUV Preto)</h3>
                        <p className="text-xs text-white/50 font-mono mt-1 uppercase tracking-widest">ABC-1234 • 4.9 ★</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-medium">R$ {activeRide?.offeredPrice?.toFixed(2) || activeRide?.estimatedPrice.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Fase 2: Verificação de Segurança */}
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <ShieldCheck size={20} />
                        <span className="font-semibold text-sm">Verifique o Veículo</span>
                      </div>
                      <p className="text-xs text-white/70 text-center">
                        Antes de entrar, confirme se a placa é <span className="font-bold text-white bg-white/10 px-1 py-0.5 rounded">ABC-1234</span> e o motorista é <span className="font-bold text-white">João</span>.
                      </p>
                    </div>

                    {/* Fase 4: Cronômetro de Espera e Botão Estou Pronto */}
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 text-orange-400">
                        <Timer size={20} className="animate-pulse" />
                        <span className="font-mono text-xl font-bold">03:00</span>
                      </div>
                      <p className="text-xs text-white/50 text-center">O motorista chegou. O tempo de tolerância é de 3 minutos antes da taxa extra.</p>
                      <button
                        onClick={() => setIsReady(true)}
                        disabled={isReady}
                        className={`w-full py-3 rounded-xl font-medium transition-colors ${isReady ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500 text-black hover:bg-orange-400'}`}
                      >
                        {isReady ? 'Motorista Notificado' : 'Estou Pronto e Visível'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-light tracking-tight">
                          {activeRide?.status === 'MATCHING' ? 'Buscando...' : 'João (SUV Preto)'}
                        </h3>
                        <p className="text-xs text-white/50 font-mono mt-1 uppercase tracking-widest">
                          {activeRide?.status === 'MATCHING' ? 'Aguarde um momento' : 'ABC-1234 • 4.9 ★'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-medium">R$ {activeRide?.offeredPrice?.toFixed(2) || activeRide?.estimatedPrice.toFixed(2)}</div>
                        <div className="text-xs text-white/50 font-mono mt-1">~{activeRide?.estimatedTime} MIN</div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowChat(true)}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-white/5 border border-white/10 text-white/80 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors relative shrink-0"
                      >
                        <MessageSquare size={20} />
                        {activeRide?.messages && activeRide.messages.length > 0 && activeRide.messages[activeRide.messages.length - 1].senderId !== currentUser?.id && (
                          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border-2 border-[#1a1a1a]"></span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("ACIONAR EMERGÊNCIA: Isso ativará a central de segurança. Deseja continuar?")) {
                            alert("Emergência acionada. Redirecionando para as autoridades e gravando áudio do veículo.");
                          }
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0"
                        title="Acionar Pânico / Emergência"
                      >
                        <ShieldAlert size={20} />
                      </button>
                      <button
                        onClick={() => alert("Link de acompanhamento gerado! (Simulação: Link copiado)")}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center hover:bg-blue-500/20 transition-colors shrink-0"
                        title="Compartilhar Rota"
                      >
                        <Share2 size={20} />
                      </button>
                      {activeRide?.status === 'COMPLETED' ? (
                        <button onClick={handlePay} className="flex-1 bg-white text-black py-0 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors text-sm sm:text-base">
                          <CreditCard size={18} />
                          Pagar
                        </button>
                      ) : (
                        <button onClick={handleCancelRide} className="flex-1 bg-white/5 border border-white/10 text-white/80 hover:text-white py-0 rounded-2xl font-medium hover:bg-white/10 transition-colors text-sm sm:text-base">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel rounded-[2rem] h-[70vh] flex flex-col overflow-hidden border border-purple-500/20 pointer-events-auto"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-purple-500/5">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveTab('home')} className="text-white/50 hover:text-white transition-colors">←</button>
                  <h2 className="font-medium tracking-wide">Inviagem Concierge</h2>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              <AIConciergeContent onSelectLocation={handleSelectLocationFromAI} userLocation={originObj} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {!activeRide && activeTab !== 'ai' && (
        <nav className="absolute bottom-6 inset-x-6 z-20 pointer-events-auto">
          <div className="glass-panel rounded-full flex justify-around p-2 border border-white/10">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${activeTab === 'home' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}>
              <Search size={20} />
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}>
              <CheckCircle2 size={20} />
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-full text-white/40 hover:text-white/80 transition-colors">
              <UserIcon size={20} />
            </button>
          </div>
        </nav>
      )}
      {/* Vehicle Options Bottom Sheet */}
      <AnimatePresence>
        {showVehicleOptions && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="absolute inset-x-0 bottom-0 z-30 bg-[#111] rounded-t-[2rem] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Escolha um veículo</h2>
              <button onClick={() => setShowVehicleOptions(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">
                &times;
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {(['X', 'Comfort', 'Black', 'Moto Entrega', 'Carro Entrega'] as const).map((cat) => (
                <div
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setCustomPrice(getEstimatedPrice(cat));
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${category === cat
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Car size={24} className={category === cat ? 'text-blue-400' : 'text-white/70'} />
                    </div>
                    <div>
                      <div className="font-medium text-lg">{cat}</div>
                      <div className="text-sm text-white/50">
                        {directionsResponse
                          ? `${Math.ceil((directionsResponse.routes[0].legs[0].duration?.value || 0) / 60)} min`
                          : 'Calculando...'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    R$ {getEstimatedPrice(cat).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              {/* Phase 4: Preferences and Scheduling */}
              <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2 mask-fade-edges">
                <button
                  onClick={() => setPrefSilent(!prefSilent)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${prefSilent ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white/60'}`}
                >
                  <VolumeX size={14} /> <span className="text-xs font-medium">Viagem Silenciosa</span>
                </button>
                <button
                  onClick={() => setPrefAC(!prefAC)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${prefAC ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/60'}`}
                >
                  <Wind size={14} /> <span className="text-xs font-medium">Ar Ligado</span>
                </button>
                <button
                  onClick={() => setScheduledRide(!scheduledRide)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${scheduledRide ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 text-white/60'}`}
                >
                  <Clock size={14} /> <span className="text-xs font-medium">Agendar</span>
                </button>
              </div>

              <button
                onClick={() => setIsCustomOfferEnabled(!isCustomOfferEnabled)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-colors mb-4 ${isCustomOfferEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={20} />
                  <span className="font-medium">Fazer uma oferta (Opcional)</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isCustomOfferEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isCustomOfferEnabled ? 'right-1' : 'left-1'}`} />
                </div>
              </button>

              {isCustomOfferEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4 bg-white/5 p-4 rounded-2xl border border-white/10"
                >
                  <div className="flex justify-between items-center px-1">
                    <div className="text-sm text-white/70 font-medium">Sua oferta</div>
                    <div className="text-xs text-white/40">Base sugerida: R$ {getEstimatedPrice(category).toFixed(2).replace('.', ',')}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCustomPrice(p => Math.max(p - 5, 5))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-medium">-5</button>
                      <button onClick={() => setCustomPrice(p => Math.max(p - 1, 5))} className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors text-xl font-medium">-1</button>
                    </div>
                    <div className="text-3xl font-bold flex-1 text-center text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                      R$ {customPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCustomPrice(p => p + 1)} className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors text-xl font-medium">+1</button>
                      <button onClick={() => setCustomPrice(p => p + 5)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-medium">+5</button>
                    </div>
                  </div>
                  {customPrice < getEstimatedPrice(category) * 0.8 && (
                    <div className="text-[10px] text-red-400 text-center uppercase tracking-wider font-semibold">Oferta baixa. Pode demorar a ser aceita.</div>
                  )}
                  {customPrice >= getEstimatedPrice(category) && (
                    <div className="text-[10px] text-emerald-400 text-center uppercase tracking-wider font-semibold">Oferta excelente! Alta chance de aceite rápido.</div>
                  )}
                </motion.div>
              )}
            </div>

            <button
              onClick={handleRequestRide}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              {isCustomOfferEnabled ? 'Confirmar Oferta' : 'Solicitar Viagem'}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="absolute inset-x-0 bottom-0 z-50 bg-[#111] rounded-t-[2rem] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 h-[75vh] flex flex-col pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><MessageSquare size={20} /> Mensagens</h2>
              <button onClick={() => setShowChat(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 mb-4">
              {activeRide?.messages?.map(msg => (
                <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser?.id ? 'bg-blue-600 self-end rounded-tr-sm' : 'bg-white/10 self-start rounded-tl-sm border border-white/10'}`}>
                  {msg.text}
                </div>
              ))}
              {(!activeRide?.messages || activeRide.messages.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-white/40 text-sm">Nenhuma mensagem ainda.</div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-2 mask-fade-edges shrink-0">
              {['Estou descendo', 'Estou na portaria', 'Aguarde 2 minutinhos', 'Vestindo camiseta preta'].map(msg => (
                <button
                  key={msg}
                  onClick={() => handleSendChat(msg)}
                  className="whitespace-nowrap bg-white/5 border border-white/10 px-3 py-2 rounded-full text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>

            <div className="flex gap-2 shrink-0">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSendChat(chatMessage);
                  }
                }}
                placeholder="Sua mensagem (IA Monitorada)..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-colors text-sm"
              />
              <button
                onClick={() => handleSendChat(chatMessage)}
                className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors shrink-0"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Push / Web notifications (Mock) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-6 left-6 right-6 z-50 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between pointer-events-auto"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white mb-1">{notification.title}</span>
              <span className="text-xs text-white/70">{notification.body}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white shrink-0 ml-4">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function AIConciergeContent({ onSelectLocation, userLocation }: { onSelectLocation: (loc: string) => void, userLocation: Location | null }) {
  const { isDemoMode, setDemoMode, createRide, currentUser, sponsoredLocations, sponsors, trackAdEvent } = useStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string, locations?: any[], audioData?: string, sponsorId?: string | null }[]>([
    { role: 'model', content: 'Olá! Sou seu assistente Inviagem. Para onde vamos hoje? Posso sugerir restaurantes, parques ou eventos próximos.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const playAudio = (base64Data: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Data}`);
    audio.play();
  };

  const startSimulation = () => {
    const dest = "Parque do Ibirapuera, São Paulo";
    onSelectLocation(dest);
    setMessages(prev => [...prev,
    { role: 'user', content: 'Simular uma corrida para o Ibirapuera.' },
    { role: 'model', content: 'Ótima escolha! Defini o destino como Parque do Ibirapuera. Agora, clique em "Solicitar" na tela inicial, confirme sua oferta e depois use o menu lateral para mudar para o modo "Motorista" e aceitar a corrida!' }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      let locationContext = "";
      if (userLocation) {
        locationContext = `O usuário está presencialmente em: ${userLocation.address || 'Localização Atual'} (lat: ${userLocation.lat}, lng: ${userLocation.lng}). Concentre-se nas proximidades da cidade/bairro em que ele está e seja assertivo nas buscas de arredores. `;
      } else if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationContext = `O usuário está em lat: ${pos.coords.latitude}, lng: ${pos.coords.longitude}. Mapeie a localização nas recomendações. `;
        } catch (e) {
          console.warn("Geolocation failed for AI context", e);
        }
      }

      const currentTime = new Date().toLocaleTimeString('pt-BR');
      const mockAgenda = "Voo para Paris às 22:00 saindo de Congonhas. Jantar com investidores às 20:00 no Figueira Rubaiyat.";

      const sponsoredContext = sponsoredLocations.filter(l => l.active).map(l =>
        `ID: ${l.id} | Nome: ${l.name} | Endereço: ${l.address} | Tags: ${l.tags.join(', ')} | Descrição: ${l.description}`
      ).join('\n');

      const systemInstruction = `Você é um concierge de luxo da Inviagem. 
Regra Absoluta Nº 1: É EXPRESSAMENTE PROIBIDO listar, detalhar ou escrever sobre os locais em formato de texto comum.
Sua única fala textual e verbal deve ser "Aqui estão as opções que encontrei próximo a você:".
Todas as informações e nomes de locais reais encontrados pelo Web Search DEVEM ir EXCLUSIVAMENTE dentro do bloco \`\`\`json.
Você DEVE usar a ferramenta de busca do Google para buscar locais reais na web sobre o ambiente do usuário.

Temos os seguintes locais patrocinados (Ads):
${sponsoredContext}
Se a pergunta combinar com as tags de um local patrocinado, recomende-o fortemente e inclua a tag [SPONSORED_LOCATION: ID_DO_LOCAL].

MUITO IMPORTANTE: No final da sua resposta, você DEVE incluir um bloco de código JSON contendo os detalhes exatos dos locais que você encontrou no Google Maps. O bloco JSON deve estar obrigatoriamente entre \`\`\`json e \`\`\`.
Formato do JSON:
[
  {
    "title": "Nome exato do local",
    "rating": "Nota (ex: 4.5)",
    "reviews": "Número de avaliações (ex: 152)",
    "price": "Faixa de preço (ex: $$ ou R$ 20-40)",
    "address": "Endereço curto",
    "isOpen": true,
    "closingTime": "Horário de fechamento (ex: 22:00)",
    "reviewText": "Um trecho de avaliação real ou comentário curto",
    "category": "Categoria (ex: Restaurante brasileiro, Churrascaria)"
  }
]
Não inclua o local patrocinado neste JSON, apenas os locais orgânicos encontrados no Web Search do Google.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${locationContext}Hora atual: ${currentTime}. Agenda do usuário: ${mockAgenda}. O usuário perguntou: ${input}. Sugira locais específicos e interessantes próximos ou comente sobre a agenda se for relevante.`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemInstruction
        }
      });

      let modelText = response.text || "Desculpe, não consegui processar sua solicitação.";
      let recommendedSponsorId = null;

      const sponsorMatch = modelText.match(/\[SPONSORED_LOCATION:\s*([^\]]+)\]/);
      if (sponsorMatch) {
        recommendedSponsorId = sponsorMatch[1].trim();
        modelText = modelText.replace(sponsorMatch[0], '').trim();
      }

      let extractedLocations: any[] = [];
      const jsonMatch = modelText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          extractedLocations = JSON.parse(jsonMatch[1]);
          modelText = modelText.replace(/```json\s*([\s\S]*?)\s*```/, '').trim();
        } catch (e) {
          console.error("Failed to parse AI JSON", e);
        }
      }

      // Fallback to grounding chunks if JSON parsing fails or is empty
      if (extractedLocations.length === 0) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        extractedLocations = chunks
          .filter(chunk => chunk.maps || chunk.web)
          .map(chunk => {
            const source = chunk.maps || chunk.web;
            return {
              title: source?.title || 'Local Recomendado',
              rating: (Math.random() * 1.5 + 3.5).toFixed(1),
              reviews: Math.floor(Math.random() * 500) + 10,
              price: "$$",
              address: "Endereço não disponível",
              isOpen: true,
              closingTime: "22:00",
              reviewText: "Excelente local",
              category: "Local"
            };
          })
          .filter((loc, index, self) => index === self.findIndex((t) => t.title === loc.title));
      }

      let audioData = "";

      if (isVoiceEnabled) {
        try {
          const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: modelText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });
          audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
          if (audioData) playAudio(audioData);
        } catch (e) {
          console.error("TTS failed", e);
        }
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: modelText,
        locations: extractedLocations,
        audioData,
        sponsorId: recommendedSponsorId
      }]);

      if (recommendedSponsorId) {
        trackAdEvent(recommendedSponsorId, 'impression');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: 'Houve um erro ao processar sua solicitação. Verifique sua conexão.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Concierge Inviagem</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] text-white/30 uppercase tracking-tighter">Agenda Ativa: Voo Paris 22:00</span>
          </div>
        </div>
        <button
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`p-2 rounded-full transition-colors ${isVoiceEnabled ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}
        >
          {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {isDemoMode && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Modo Demo Ativo</span>
            </div>
            <button
              onClick={startSimulation}
              className="text-[10px] bg-emerald-500 text-black px-4 py-2 rounded-full font-bold hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              INICIAR FLUXO MANUAL
            </button>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl relative group ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/5 border border-white/10'}`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>

              {msg.role === 'model' && msg.audioData && (
                <button
                  onClick={() => playAudio(msg.audioData!)}
                  className="absolute -right-10 top-2 p-2 rounded-full bg-white/5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                >
                  <Play size={12} fill="currentColor" />
                </button>
              )}

              {msg.sponsorId && (
                <div className="mt-3">
                  {(() => {
                    const sponsorLoc = sponsoredLocations.find(l => l.id === msg.sponsorId);
                    const sponsor = sponsors.find(s => s.id === sponsorLoc?.sponsorId);
                    if (!sponsorLoc || !sponsor) return null;

                    return (
                      <div className="bg-white/5 rounded-xl border border-emerald-500/30 overflow-hidden hover:bg-white/10 transition-colors cursor-pointer" onClick={() => {
                        trackAdEvent(sponsorLoc.id, 'click');
                        onSelectLocation(sponsorLoc.address);
                      }}>
                        <div className="p-3 flex gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-white text-base leading-tight">{sponsorLoc.name}</h4>
                              <span className="bg-emerald-500 text-black text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm">Patrocinado</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs mb-1">
                              <span className="text-white">{sponsorLoc.rating}</span>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= Math.floor(sponsorLoc.rating) ? "currentColor" : "none"} />)}
                              </div>
                              <span className="text-white/40">({Math.floor(Math.random() * 500) + 100})</span>
                            </div>
                            <p className="text-xs text-white/60 truncate">{sponsorLoc.tags[0]} • {sponsorLoc.address.split(',')[0]}</p>
                            <p className="text-xs text-emerald-400 mt-0.5">Aberto <span className="text-white/40">• Fecha 23:00</span></p>
                          </div>
                          <div className="w-16 h-16 rounded-lg bg-emerald-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden border border-emerald-500/20">
                            <img src={`https://picsum.photos/seed/${sponsorLoc.id}/100/100`} alt={sponsorLoc.name} className="w-full h-full object-cover opacity-80" />
                          </div>
                        </div>
                        <div className="px-3 pb-3">
                          <button
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Car size={14} />
                            Solicitar Inviagem
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {msg.locations && msg.locations.length > 0 && !msg.sponsorId && (
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {msg.locations.map((loc, idx) => {
                    const isFood = loc.category?.toLowerCase().includes('restaurante') || loc.category?.toLowerCase().includes('churrascaria') || loc.category?.toLowerCase().includes('bar') || loc.category?.toLowerCase().includes('fogão') || loc.category?.toLowerCase().includes('espeto');

                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectLocation(loc.title)}
                        className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left cursor-pointer border border-white/10"
                      >
                        <div className="flex justify-between gap-3">
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-medium text-white text-base leading-tight mb-1">{loc.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                              <span className="text-white">{loc.rating}</span>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= parseFloat(loc.rating || '0') ? "currentColor" : "none"} />)}
                              </div>
                              <span>({loc.reviews})</span>
                              <span>•</span>
                              <span>{loc.price}</span>
                            </div>
                            <p className="text-xs text-white/60 truncate">{loc.category} • {loc.address}</p>
                            <p className="text-xs mt-0.5">
                              <span className={loc.isOpen ? "text-emerald-400" : "text-red-400"}>{loc.isOpen ? 'Aberto' : 'Fechado'}</span>
                              <span className="text-white/60"> • Fecha {loc.closingTime}</span>
                            </p>

                            {isFood && (
                              <div className="flex items-center gap-2 text-[10px] text-white/60 mt-2">
                                <span className="flex items-center gap-1"><Check size={10} className="text-emerald-400" /> Refeição no local</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Check size={10} className="text-emerald-400" /> Para viagem</span>
                              </div>
                            )}
                          </div>
                          <div className="w-20 h-20 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden border border-white/10">
                            <img src={`https://picsum.photos/seed/${idx + loc.title}/200/200`} alt={loc.title} className="w-full h-full object-cover opacity-80" />
                          </div>
                        </div>

                        {loc.reviewText && (
                          <div className="flex items-start gap-2 mt-2 pt-2 border-t border-white/10">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <UserIcon size={10} className="text-blue-400" />
                            </div>
                            <p className="text-xs text-white/60 italic">&quot;{loc.reviewText}&quot;</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-black/20 border-t border-white/10">
        <div className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte algo ao Concierge..."
              className="w-full bg-transparent outline-none px-3 text-sm pr-10"
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-2 text-white/30 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
