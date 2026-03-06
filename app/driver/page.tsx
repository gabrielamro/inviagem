'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore, Ride, Hotspot } from '@/lib/store';
import { MapPin, Navigation, CreditCard, MessageSquare, ShieldAlert, Star, Search, Car, CheckCircle2, User as UserIcon, ArrowRight, Menu, X, Volume2, VolumeX, Play, Flame, Power, Map, DollarSign, Settings, Check, AlertCircle, ShieldCheck, Mic, Video, Target, Home, TrendingUp, AlertTriangle, Coffee, Gift, AlertOctagon, Wrench, Droplets, ChevronUp, ChevronDown, Eye, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, TrafficLayerF, OverlayViewF, Polyline, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -23.5505, // São Paulo
  lng: -46.6333,
};

const libraries: ("places" | "geometry" | "visualization")[] = ["places", "geometry", "visualization"];

export default function DriverApp() {
  console.log("DRIVER_APP_LOADED_PORT_3020");
  const router = useRouter();
  const { users, currentUser, setCurrentUser, rides, updateRideStatus, updateDriverStatus, updateRidePrice, isDemoMode, setDemoMode, updateUserLocation, addChatMessage, hotspots, updateDriverClearance, addWalletBalance, registerUser, loginUser, submitDriverDocs, deleteDriverAccount } = useStore();
  const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'settings' | 'benefits' | 'wallet'>('home');

  // Auth & Docs state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authCpf, setAuthCpf] = useState('');
  const [authError, setAuthError] = useState('');

  // Vehicle Docs states
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('4');
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false);
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  const [cnhFileName, setCnhFileName] = useState('');
  const [cnhFile, setCnhFile] = useState<File | null>(null);
  const [cnhPreviewUrl, setCnhPreviewUrl] = useState<string | null>(null);
  const [crlvFileName, setCrlvFileName] = useState('');
  const [crlvFile, setCrlvFile] = useState<File | null>(null);
  const [crlvPreviewUrl, setCrlvPreviewUrl] = useState<string | null>(null);
  const [docZipFileName, setDocZipFileName] = useState('');
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [isBiometryActive, setIsBiometryActive] = useState(false);
  const [biometryStep, setBiometryStep] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [docFeedback, setDocFeedback] = useState<{ type: 'error' | 'success' | 'warning', message: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isRideInfoExpanded, setIsRideInfoExpanded] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(18); // Default to 18 for drive mode
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [hotspotRouteResponse, setHotspotRouteResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [carAnimPosition, setCarAnimPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [carHeading, setCarHeading] = useState(0);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [surgePricingZones, setSurgePricingZones] = useState<{ id: number, lat: number, lng: number, value: number }[]>([]);
  const [heatmapLayer, setHeatmapLayer] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [isAutoCenter, setIsAutoCenter] = useState(true);
  const [isDriveMode, setIsDriveMode] = useState(true);
  const [currentManeuver, setCurrentManeuver] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Fase 1 & 2 States
  const [isGoingHome, setIsGoingHome] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isDashcamActive, setIsDashcamActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dailyGoal = 300;
  const currentEarnings = 142.50;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  const isOnline = currentUser?.status === 'ONLINE';

  // Find incoming ride request
  const incomingRide = rides.find(r =>
    r.status === 'MATCHING' ||
    (r.status === 'NEGOTIATING' && r.lastOfferBy === 'PASSENGER')
  );
  // Find active ride for this driver
  const activeRide = rides.find(r => r.driverId === currentUser?.id && !['COMPLETED', 'PAID', 'CANCELLED'].includes(r.status));

  const handleFindBestSpot = () => {
    if (!currentUser?.location || !window.google) return;

    const currentLoc = new window.google.maps.LatLng(currentUser.location.lat, currentUser.location.lng);
    let nearest: Hotspot | null = null;
    let minDistance = Infinity;

    const activeHotspots = hotspots.filter(h => h.active);
    for (const hotspot of activeHotspots) {
      const hotspotLoc = new window.google.maps.LatLng(hotspot.lat, hotspot.lng);
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(currentLoc, hotspotLoc);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = hotspot;
      }
    }

    if (nearest) {
      setActiveHotspot(nearest.id);

      // Calculate route to hotspot
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: currentLoc,
          destination: { lat: nearest.lat, lng: nearest.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setHotspotRouteResponse(result);
            setMapCenter({ lat: nearest.lat, lng: nearest.lng });
            setMapZoom(14);
            setIsAutoCenter(false);
          }
        }
      );
    } else {
      alert("Nenhuma zona de alta demanda encontrada próxima.");
    }
  };

  const clearHotspotRoute = () => {
    setActiveHotspot(null);
    setHotspotRouteResponse(null);
    setIsAutoCenter(true);
  };

  // Get current location and watch for changes
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (isAutoCenter && !activeRide) {
            setMapCenter(pos);
          }
          if (currentUser) {
            updateUserLocation(currentUser.id, { ...pos, address: 'Localização em tempo real' });
          }
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [currentUser, updateUserLocation, isAutoCenter, activeRide]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      // Fallback log
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'biometry.jpg', { type: 'image/jpeg' });
            setBiometryStep('SCANNING');
            stopCamera();
            setTimeout(() => {
              setProfilePhotoFile(file);
              setProfilePreviewUrl(URL.createObjectURL(file));
              setBiometryStep('SUCCESS');
              setTimeout(() => {
                setIsBiometryActive(false);
                setBiometryStep('IDLE');
              }, 1500);
            }, 2000);
          }
        }, 'image/jpeg');
      }
    }
  };

  useEffect(() => {
    if (isBiometryActive && biometryStep === 'IDLE') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isBiometryActive, biometryStep]);

  // Removido o login automático para permitir o fluxo real de cadastro e login
  // useEffect(() => {
  //   if (!currentUser || currentUser.role !== 'DRIVER') {
  //     const driver = users.find(u => u.role === 'DRIVER');
  //     if (driver) {
  //       setCurrentUser(driver);
  //     }
  //   }
  // }, [users, currentUser, setCurrentUser]);

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const newUser = await registerUser({
      name: authName,
      role: 'DRIVER',
      cpf: authCpf,
      driverStatus: 'PENDING_DOCS',
      walletBalance: 0,
      status: 'OFFLINE'
    });
    if (newUser) {
      setCurrentUser(newUser);
    } else {
      setAuthError('Erro ao criar conta. O CPF já existe na base?');
    }
  };

  const handleLoginDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authCpf) {
      setAuthError("Por favor, digite seu CPF.");
      return;
    }
    const foundDriver = await loginUser(authCpf, 'DRIVER');
    if (foundDriver) {
      setCurrentUser(foundDriver);
    } else {
      setAuthError("Nenhum motorista encontrado com este CPF.");
    }
  };

  const handleCRLVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocFeedback(null);
    if (!file || file.type !== 'application/pdf') {
      setDocFeedback({ type: 'error', message: "Por favor, anexe o CRLV Eletrônico no formato original (.pdf)." });
      return;
    }

    try {
      setIsParsingPDF(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-document', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setCrlvFile(file);

      // Auto-preenchimento
      if (data.plate) setVehiclePlate(data.plate);
      if (data.year) setVehicleYear(data.year);
      if (data.brand) setVehicleBrand(data.brand);
      if (data.model) setVehicleModel(data.model);
      if (data.color) setVehicleColor(data.color);
      if (data.capacity) setVehicleCapacity(data.capacity);

      setDocFeedback({ type: 'success', message: "✨ A Inteligência Artificial preencheu as informações do seu carro!" });

      // Criar preview se for PDF (blob url)
      const url = URL.createObjectURL(file);
      setCrlvPreviewUrl(url);
      setCrlvFile(file);
      setCrlvFileName(file.name);

    } catch (err: any) {
      // Força o anexo mesmo se a IA falhar
      setCrlvFile(file);
      setCrlvFileName(file.name);
      const url = URL.createObjectURL(file);
      setCrlvPreviewUrl(url);
      setDocFeedback({ type: 'warning', message: "Arquivo anexado! A IA não conseguiu ler os dados automaticamente, mas o arquivo foi salvo para conferência manual." });
      console.error(err);
    } finally {
      setIsParsingPDF(false);
      e.target.value = ''; // Reseta o input do html escondido
    }
  };

  const handleCNHUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocFeedback(null);
    if (!file) return;

    // Gerar preview url
    const url = URL.createObjectURL(file);
    setCnhPreviewUrl(url);

    if (file.type !== 'application/pdf') {
      // Se for imagem, apenas anexa para análise manual do admin posteriormente, mas avisa
      if (file.type.startsWith('image/')) {
        setCnhFileName(file.name);
        setCnhFile(file);
        setDocFeedback({ type: 'success', message: "Foto da CNH anexada. Ela passará por análise manual técnica." });
        return;
      }
      setDocFeedback({ type: 'error', message: "Para validação instantânea, use o PDF da CNH Digital." });
      return;
    }

    try {
      setIsParsingPDF(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-document', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha na análise automática da CNH.");
      }

      setCnhFileName(file.name);
      setCnhFile(file);
      setDocFeedback({ type: 'success', message: `✨ CNH Validada: ${data.message}` });

    } catch (err: any) {
      // Se falhar o parse, ainda assim anexamos o arquivo para o admin ver
      setCnhFileName(file.name);
      setCnhFile(file);
      setDocFeedback({ type: 'warning', message: "Foto da CNH anexada. Analisaremos manualmente o documento." });
      console.error(err);
    } finally {
      setIsParsingPDF(false);
      e.target.value = '';
    }
  };

  const handleCertidaoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocFeedback(null);
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setDocFeedback({ type: 'error', message: "Para validação automática, anexe a Certidão em PDF original." });
      return;
    }

    try {
      setIsParsingPDF(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-document', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha na análise da Certidão.");
      }

      setDocZipFileName(file.name);
      setCertificationFile(file);

      if (data.isUncertain || data.isPositive) {
        setDocFeedback({
          type: 'warning',
          message: "Documento anexado! A IA não confirmou o 'Nada Consta' de forma automática, por isso ele passará por uma análise técnica manual."
        });
      } else {
        setDocFeedback({
          type: 'success',
          message: `✨ Certidão Validada: ${data.message}`
        });
      }

    } catch (err: any) {
      setDocFeedback({ type: 'error', message: err.message || "Erro ao processar Certidão." });
      console.error(err);
    } finally {
      setIsParsingPDF(false);
      e.target.value = '';
    }
  };

  const handleSendChat = () => {
    if (!chatMessage.trim() || !activeRide || !currentUser) return;
    addChatMessage(activeRide.id, currentUser.id, chatMessage);
    setChatMessage('');
  };

  const toggleOnline = () => {
    if (!currentUser) return;
    const newStatus = !isOnline;
    updateDriverStatus(currentUser.id, newStatus ? 'ONLINE' : 'OFFLINE');
  };

  // Handle Drive Mode changes - MOVED TO BUTTON HANDLER

  // Calculate route for active ride
  useEffect(() => {
    if (activeRide && isLoaded && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: activeRide.origin.address,
        destination: activeRide.destination.address,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }).then(result => {
        setDirectionsResponse(result);
      }).catch(err => console.error("Error calculating driver route:", err));
    } else if (directionsResponse !== null) {
      setTimeout(() => setDirectionsResponse(null), 0);
    }
  }, [activeRide, isLoaded, directionsResponse]);

  // Car Animation Logic (same as passenger)
  useEffect(() => {
    if (activeRide?.status === 'IN_PROGRESS' && directionsResponse && activeRide.startTime && window.google) {
      const path = directionsResponse.routes[0].overview_path;
      const totalDuration = (activeRide.estimatedTime || 5) * 2000;

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

          if (index < totalPoints - 1) {
            const heading = window.google.maps.geometry.spherical.computeHeading(currentPoint, nextPoint);
            setCarHeading(heading);

            if (isDriveMode && mapRef) {
              mapRef.setHeading(heading);
              mapRef.setTilt(45);
            }
          }

          // Find current step for maneuver
          const steps = directionsResponse.routes[0].legs[0].steps;
          let distanceCovered = 0;
          const totalDistance = directionsResponse.routes[0].legs[0].distance?.value || 1;
          const currentDistance = progress * totalDistance;

          for (let i = 0; i < steps.length; i++) {
            distanceCovered += steps[i].distance?.value || 0;
            if (currentDistance <= distanceCovered) {
              // We are in this step
              if (steps[i].instructions) {
                // Strip HTML tags from instructions
                const cleanInstructions = steps[i].instructions.replace(/<[^>]*>?/gm, '');
                setCurrentManeuver(cleanInstructions);
              }
              break;
            }
          }

          const newPos = { lat, lng };
          setCarAnimPosition(newPos);

          // Update route polyline to erase traveled path
          if (routePolylineRef.current) {
            const remainingPath = [newPos, ...path.slice(nextIndex)];
            routePolylineRef.current.setPath(remainingPath);
          }

          if (isAutoCenter) {
            setMapCenter(newPos);
          }
        }

        if (progress < 1) {
          animId = requestAnimationFrame(animate);
        }
      };

      animId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animId);
    } else if (carAnimPosition !== null) {
      setTimeout(() => setCarAnimPosition(null), 0);
    }
  }, [activeRide?.status, activeRide?.startTime, activeRide?.estimatedTime, directionsResponse, carAnimPosition, isAutoCenter, isDriveMode, mapRef]);

  // Heatmap Logic - MOVED TO BUTTON HANDLER

  useEffect(() => {
    if (isLoaded && mapRef && window.google && showHeatmap && surgePricingZones.length > 0) {
      // Generate points clustered around the surge zones
      const points: google.maps.LatLng[] = [];

      surgePricingZones.forEach(zone => {
        // The higher the value, the more points (denser/redder)
        const numPoints = Math.floor(zone.value * 30);
        for (let i = 0; i < numPoints; i++) {
          // Gaussian-like distribution around the zone center
          const r = (Math.random() + Math.random() + Math.random() - 1.5) * 0.015;
          const theta = Math.random() * 2 * Math.PI;
          points.push(new window.google.maps.LatLng(
            zone.lat + r * Math.cos(theta),
            zone.lng + r * Math.sin(theta)
          ));
        }
      });

      const layer = new window.google.maps.visualization.HeatmapLayer({
        data: points,
        map: mapRef,
        radius: 60,
        opacity: 0.4,
        gradient: [
          'rgba(255, 255, 255, 0)',
          'rgba(255, 200, 0, 0.3)',
          'rgba(255, 100, 0, 0.5)',
          'rgba(255, 0, 0, 0.7)'
        ]
      });
      setTimeout(() => setHeatmapLayer(layer), 0);

      return () => {
        layer.setMap(null);
      };
    } else if (heatmapLayer) {
      heatmapLayer.setMap(null);
      setTimeout(() => setHeatmapLayer(null), 0);
    }
  }, [isLoaded, mapRef, showHeatmap, surgePricingZones]);

  const handleAccept = (rideId: string) => {
    if (!currentUser) return;
    updateRideStatus(rideId, 'DRIVER_ASSIGNED', currentUser.id);
    updateDriverStatus(currentUser.id, 'IN_RIDE');
  };

  const handleCounterOffer = (rideId: string, currentPrice: number, increment: number) => {
    if (!currentUser) return;
    updateRidePrice(rideId, currentPrice + increment, 'DRIVER', currentUser.id);
  };

  const handleReject = (rideId: string) => {
    updateRideStatus(rideId, 'NO_DRIVER');
  };

  const handleArrived = () => {
    if (activeRide) updateRideStatus(activeRide.id, 'DRIVER_ARRIVING');
  };

  const handleStartTrip = () => {
    if (activeRide) updateRideStatus(activeRide.id, 'IN_PROGRESS');
  };

  const handleCompleteTrip = () => {
    if (activeRide && currentUser) {
      updateRideStatus(activeRide.id, 'COMPLETED');
      updateDriverStatus(currentUser.id, 'ONLINE');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col h-screen bg-[#050505] text-white max-w-md mx-auto relative overflow-hidden font-sans justify-center p-8">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="text-3xl font-bold tracking-tighter mb-4">INVIAGEM<span className="text-emerald-500">.</span><span className="text-white/50 text-sm ml-2">Motorista</span></div>
          <h1 className="text-2xl font-light tracking-tight">{authMode === 'login' ? 'Bem-vindo de volta' : 'Faça seu cadastro'}</h1>
          <p className="text-white/50 text-sm mt-3 font-light">
            {authMode === 'login' ? 'Faça login para continuar ganhando.' : 'Junte-se à revolução da mobilidade em Manaus.'}
          </p>
          {authError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {authError}
            </div>
          )}
        </div>

        {authMode === 'login' ? (
          <form className="relative z-10 space-y-4" onSubmit={handleLoginDriver}>
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
          <form className="relative z-10 space-y-4" onSubmit={handleRegisterDriver}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Nome Completo</label>
              <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} required className="w-full bg-transparent text-white outline-none font-medium text-sm" placeholder="Como quer ser chamado?" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">CPF</label>
              <input type="text" value={authCpf} onChange={(e) => setAuthCpf(e.target.value)} required className="w-full bg-transparent text-white outline-none font-mono text-sm tracking-wider" placeholder="000.000.000-00" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:border-emerald-500/50 transition-colors opacity-50 cursor-not-allowed">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Telefone / Senha</label>
              <input type="text" disabled className="w-full bg-transparent text-white outline-none font-medium text-sm" placeholder="Autenticação por Biometria Facial" />
            </div>

            <button type="submit" className="w-full py-4 mt-8 bg-emerald-600 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              Criar Conta e Enviar Documentos
            </button>
            <div onClick={(e) => { e.preventDefault(); setAuthMode('login'); }} className="w-full py-4 text-center text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
              Já tem conta? Fazer Login
            </div>
          </form>
        )}
      </div>
    );
  }

  // Fase 1: Bloqueio de Segurança Documental (IMMU)
  if (currentUser.driverStatus === 'PENDING_DOCS' || currentUser.driverStatus === 'UNDER_REVIEW' || currentUser.driverStatus === 'REJECTED') {
    return (
      <div className="flex flex-col h-screen bg-[#050505] text-white max-w-md mx-auto relative overflow-y-auto p-6 font-sans">
        <div className="mb-8 mt-6">
          <div className="text-xl font-bold tracking-tighter mb-2">INVIAGEM<span className="text-emerald-500">.</span></div>
          <h1 className="text-2xl font-bold">Quase lá, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-white/50 text-sm mt-2">Para seguir a regulamentação municipal de Manaus (Lei 2.468), precisamos dos seus documentos operacionais.</p>
        </div>

        {/* PASSO 1: BIOMETRIA (FORÇADO NO TOPO ABSOLUTO PARA GARANTIR VISIBILIDADE) */}
        <div className="bg-emerald-500/10 p-5 rounded-3xl border-2 border-emerald-500/40 mb-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="text-emerald-500" size={28} />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight uppercase">PASSO 1: FOTO 3D</h3>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest opacity-70">Validação Biométrica</p>
            </div>
          </div>

          {profilePreviewUrl ? (
            <div className="relative aspect-square w-full max-w-[180px] mx-auto mb-4 rounded-full border-4 border-emerald-500 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <img src={profilePreviewUrl} alt="Selfie" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setIsBiometryActive(true)}
                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white"
              >
                Trocar Foto
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsBiometryActive(true)}
              className="w-full py-5 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
            >
              <UserIcon size={20} /> INICIAR BIOMETRIA AGORA
            </button>
          )}

          {profilePhotoFile && (
            <div className="mt-4 p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} /> IDENTIDADE CONFIRMADA
            </div>
          )}
        </div>

        {/* Modal de Biometria */}
        <AnimatePresence>
          {isBiometryActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center"
            >
              <h2 className="text-xl font-bold mb-2">BIOMETRIA 3D</h2>
              <p className="text-xs text-white/50 mb-12">Posicione seu rosto dentro do círculo.</p>

              <div className="relative w-72 h-72 mb-16">
                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                <div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/30 animate-spin" />

                <div className="absolute inset-4 rounded-full overflow-hidden bg-black flex items-center justify-center border border-white/10 group">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-[1.2] -scale-x-100"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {biometryStep === 'IDLE' && (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] z-10 transition-colors"
                    >
                      Tirar Foto Agora
                    </button>
                  )}
                  {biometryStep === 'SCANNING' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
                      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase animate-pulse">Analisando...</span>
                    </div>
                  )}
                  {biometryStep === 'SUCCESS' && (
                    <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <Check size={32} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sucesso</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBiometryActive(false)}
                className="px-8 py-3 rounded-full bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest"
              >
                CANCELAR
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {currentUser.driverStatus === 'UNDER_REVIEW' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-xl font-bold text-orange-400 mb-2">Em Análise Técnica</h2>
            <p className="text-white/50 text-sm max-w-[280px] mb-10">As informações do seu veículo, CNH e certidões criminais estão em processamento pelo time de análise. Avisaremos quando sua conta for desbloqueada.</p>

            <div className="flex flex-col gap-4 w-full mt-10">
              <button
                onClick={async () => {
                  if (window.confirm("⚠️ Deseja cancelar o envio e recomeçar o cadastro? Isso apagará seus dados atuais para que você possa enviar novos arquivos.")) {
                    const success = await deleteDriverAccount(currentUser.id);
                    if (success) {
                      setCurrentUser(null);
                    }
                  }
                }}
                className="w-full py-4 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> CANCELAR E REVER DOCUMENTOS
              </button>

              <button
                onClick={() => setCurrentUser(null)}
                className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                SAIR DA CONTA
              </button>
            </div>
          </div>
        ) : (
          <form
            className="flex-1 flex flex-col gap-5 pb-12"
            onSubmit={async (e) => {
              e.preventDefault();
              setDocFeedback(null);

              if (!cnhFileName) {
                setDocFeedback({ type: 'error', message: "Por favor, anexe sua CNH para continuar." });
                return;
              }
              if (!docZipFileName) {
                setDocFeedback({ type: 'error', message: "Por favor, anexe suas Certidões Criminais para continuar." });
                return;
              }

              if (parseInt(vehicleYear) < 2019) {
                setDocFeedback({ type: 'error', message: "Atenção! Conforme Lei Municipal nº 2.468 do IMMU, seu veículo de cadastro excede o limite (Ano mínimo: 2019)." });
                return;
              }

              if (!profilePhotoFile) {
                window.alert("⚠️ Realize a Biometria Facial antes de enviar.");
                return;
              }

              setIsSubmittingDocs(true);
              const success = await submitDriverDocs(currentUser.id, {
                plate: vehiclePlate,
                brand: vehicleBrand,
                model: vehicleModel,
                color: vehicleColor,
                year: vehicleYear,
                capacity: vehicleCapacity
              }, {
                cnh: cnhFile || undefined,
                crlv: crlvFile || undefined,
                certification: certificationFile || undefined,
                profile: profilePhotoFile || undefined
              });
              setIsSubmittingDocs(false);
            }}
          >

            {/* Mensagem de Recusa */}
            {currentUser.driverStatus === 'REJECTED' && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon size={18} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Cadastro Recusado</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed italic">
                  "{currentUser.rejectionReason || 'Documentos inconsistentes com a regulamentação.'}"
                </p>
                <div className="h-px bg-red-500/20 my-1" />
                <p className="text-[10px] text-red-400/70">Atualize os campos abaixo com as informações corretas e envie novamente para análise.</p>
              </div>
            )}

            {/* Feedback Visual */}
            {docFeedback && (
              <div className={`p-4 rounded-xl border text-sm flex gap-3 items-start ${docFeedback.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                docFeedback.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                {docFeedback.type === 'error' ? <AlertTriangle size={20} className="shrink-0" /> :
                  docFeedback.type === 'warning' ? <AlertOctagon size={20} className="shrink-0" /> :
                    <CheckCircle2 size={20} className="shrink-0" />}
                <p>{docFeedback.message}</p>
              </div>
            )}

            {/* 1.1 Dados Pessoais e CNH com EAR */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="text-emerald-500" size={20} />
                <h3 className="font-bold text-sm">Validar CNH e CPF</h3>
              </div>
              <p className="text-[10px] text-white/50 mb-3 leading-relaxed">Você entrou como {currentUser.name} ({currentUser.cpf}). Anexe sua CNH (Foto ou PDF).</p>

              <label className={`w-full py-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3 border ${cnhFileName ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/10 hover:bg-white/20 border-transparent text-white'}`}>
                {cnhFileName ? (
                  <><CheckCircle2 size={16} /> CNH Anexada: {cnhFileName}</>
                ) : (
                  <>📸 Enviar Arquivo CNH + EAR</>
                )}
                <input type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={handleCNHUpload} />
              </label>

              {cnhPreviewUrl && (
                <button
                  type="button"
                  onClick={() => window.open(cnhPreviewUrl, '_blank')}
                  className="w-full mt-2 py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Eye size={14} /> Visualizar CNH Anexada
                </button>
              )}
            </div>

            {/* 1.2 Registro do Veículo e Limites do IMMU */}
            <div className="bg-white/5 p-4 rounded-2xl border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Car className="text-emerald-500" size={20} />
                <h3 className="font-bold text-sm">Veículo & CRLV Digital</h3>
              </div>
              <p className="text-[10px] text-white/50 mb-3 leading-relaxed">Art. da Lei Exige Vistoria. Apenas carros com 5 anos de fabricação e porta-malas condizente para passageiros.</p>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-black/50 p-2 rounded-lg">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Placa Oficial</label>
                  <input type="text" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} required placeholder="XXX-0000" className="w-full bg-transparent text-white outline-none font-mono text-xs uppercase" />
                </div>
                <div className="bg-black/50 p-2 rounded-lg">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Ano Fab.</label>
                  <input type="number" min="2012" max="2026" value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} required placeholder="2020" className="w-full bg-transparent text-white outline-none font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-black/50 p-2 rounded-lg">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Marca</label>
                  <input type="text" value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} required placeholder="Fiat, GM..." className="w-full bg-transparent text-white outline-none text-xs" />
                </div>
                <div className="bg-black/50 p-2 rounded-lg">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Modelo</label>
                  <input type="text" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} required placeholder="Mobi, Onix..." className="w-full bg-transparent text-white outline-none text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/50 p-2 rounded-lg">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Cor Predom.</label>
                  <input type="text" value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} required placeholder="Prata, Preto..." className="w-full bg-transparent text-white outline-none text-xs" />
                </div>
                <div className="bg-black/50 p-2 rounded-lg">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 block mb-1">Passageiros (Máx 7)</label>
                  <input type="number" min="1" max="7" value={vehicleCapacity} onChange={e => setVehicleCapacity(e.target.value)} required className="w-full bg-transparent text-white outline-none text-xs" />
                </div>
              </div>
              <label className="w-full py-3 bg-white/10 rounded-xl text-xs font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4 group">
                {isParsingPDF ? (
                  <span className="animate-pulse">🤖 Lendo Documento Oficial (PDF)...</span>
                ) : (
                  <>
                    📄 Upload Extrato CRLV PDF
                    <span className="text-[9px] text-emerald-400 opacity-70 group-hover:opacity-100">(Auto-Completar)</span>
                  </>
                )}
                <input type="file" className="hidden" accept=".pdf" onChange={handleCRLVUpload} disabled={isParsingPDF} />
              </label>

              {crlvPreviewUrl && (
                <button
                  type="button"
                  onClick={() => window.open(crlvPreviewUrl, '_blank')}
                  className="w-full mt-2 py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <Eye size={14} /> Visualizar CRLV Anexado
                </button>
              )}
            </div>

            {/* 1.3 Auditoria Criminal / Extratos Negativos */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="text-emerald-500" size={20} />
                <h3 className="font-bold text-sm">Termos LGPD + Certidões Negativas</h3>
              </div>
              <p className="text-[10px] text-white/50 mb-3 leading-relaxed">Emita suas certidões (PDF) gratuitas nos links oficiais do Governo:</p>

              <div className="flex flex-col gap-2 mb-4 bg-black/30 p-3 rounded-xl border border-white/5">
                <a href="https://sistemas.trf1.jus.br/certidao/#/solicitacao" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 flex justify-between items-center group">
                  <span>1. Certidão Federal (TRF1)</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-transform transform translate-x-1">→</span>
                </a>
                <a href="https://www.gov.br/pf/pt-br/assuntos/antecedentes-criminais" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 flex justify-between items-center group">
                  <span>2. Antecedentes (Polícia Federal)</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-transform transform translate-x-1">→</span>
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <label className={`w-full py-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer border ${docZipFileName ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/10 hover:bg-white/20 border-transparent text-white'}`}>
                  {isParsingPDF ? (
                    <span className="animate-pulse">🤖 Validando Certidões...</span>
                  ) : docZipFileName ? (
                    <><CheckCircle2 size={16} /> Certidões Anexadas: {docZipFileName}</>
                  ) : (
                    <>📑 Anexar Certidões (Nada Consta)</>
                  )}
                  <input type="file" className="hidden" accept=".pdf" onChange={handleCertidaoUpload} disabled={isParsingPDF} />
                </label>

              </div>
            </div>


            <div className="flex items-start gap-3 mt-4 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <input type="checkbox" id="lgpd-opt" required className="mt-1 flex-shrink-0 w-4 h-4 rounded appearance-none border border-emerald-500/50 checked:bg-emerald-500 checked:before:content-['✓'] checked:before:text-black checked:before:flex checked:before:justify-center checked:before:items-center checked:before:text-xs" />
              <label htmlFor="lgpd-opt" className="text-[9px] text-white/70 font-light leading-relaxed">
                Dou fé de apresentar meus verdadeiros documentos sob as penas da falsidade (Art. 299 CP). Autorizo criptografia da LGPD e integração nativa com Relatórios Fiscais da Secretaria de Segurança de Manaus, repassando logs de transações.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingDocs}
              className={`w-full py-4 mt-6 rounded-2xl font-bold uppercase tracking-widest text-sm transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)] flex-shrink-0 ${isSubmittingDocs ? 'bg-emerald-800 text-white/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            >
              {isSubmittingDocs ? 'Processando Autenticação Jurídica...' : 'Assinar Termos & Enviar Para Análise'}
            </button>
          </form>
        )
        }
      </div >
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white max-w-md mx-auto relative overflow-hidden font-sans">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        {!apiKey ? (
          <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center text-white/50 p-6 text-center">
            <MapPin size={48} className="mb-4 opacity-50" />
            <p className="font-medium">Chave da API do Google Maps não configurada.</p>
            <p className="text-xs mt-2">Adicione NEXT_PUBLIC_GOOGLE_MAPS_API_KEY nas variáveis de ambiente.</p>
          </div>
        ) : loadError ? (
          <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center text-white/50 p-6 text-center">
            <ShieldAlert size={48} className="mb-4 opacity-50 text-red-400" />
            <p className="font-medium">Erro ao carregar o mapa.</p>
            <p className="text-xs mt-2">Verifique se a chave da API é válida e se a Maps JavaScript API está ativada no Google Cloud Console.</p>
          </div>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={(map) => {
              setMapRef(map);
              if (isDriveMode) {
                map.setTilt(45);
                map.setHeading(carHeading);
              }
            }}
            onDragStart={() => setIsAutoCenter(false)}
            options={{
              mapId: "DEMO_MAP_ID",
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: "greedy",
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                  featureType: "administrative.locality",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "geometry",
                  stylers: [{ color: "#263c3f" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#6b9a76" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#1f2835" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#f3d19c" }],
                },
                {
                  featureType: "transit",
                  elementType: "geometry",
                  stylers: [{ color: "#2f3948" }],
                },
                {
                  featureType: "transit.station",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#515c6d" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#17263c" }],
                },
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
              </>
            )}

            {/* Traffic Layer Removed as requested */}

            {/* Hotspots Visualization */}
            {hotspots.filter(h => h.active).map(hotspot => (
              <div key={hotspot.id}>
                <Circle
                  center={{ lat: hotspot.lat, lng: hotspot.lng }}
                  radius={hotspot.radius}
                  options={{
                    fillColor: '#10b981', // Emerald 500
                    fillOpacity: 0.15,
                    strokeColor: '#10b981',
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    clickable: false,
                  }}
                />
                <OverlayViewF
                  position={{ lat: hotspot.lat, lng: hotspot.lng }}
                  mapPaneName="overlayMouseTarget"
                >
                  <div className="bg-emerald-500 text-black px-2 py-1 rounded-full text-xs font-bold shadow-md transform -translate-x-1/2 -translate-y-1/2 border border-white/20 whitespace-nowrap flex items-center gap-1">
                    <TrendingUp size={12} />
                    {hotspot.multiplier}x
                  </div>
                </OverlayViewF>
              </div>
            ))}

            {/* Route to Hotspot */}
            {hotspotRouteResponse && (
              <DirectionsRenderer
                directions={hotspotRouteResponse}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#10b981', // Emerald for opportunity route
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    zIndex: 5
                  }
                }}
              />
            )}

            {showHeatmap && surgePricingZones.map((zone) => (
              <OverlayViewF
                key={`surge-${zone.id}`}
                position={{ lat: zone.lat, lng: zone.lng }}
                mapPaneName="overlayMouseTarget"
              >
                <div className="bg-[#d9534f] text-white px-2 py-1 rounded-full text-xs font-bold shadow-md transform -translate-x-1/2 -translate-y-1/2 border border-white/20 whitespace-nowrap">
                  +R$ {zone.value.toFixed(2).replace('.', ',')}
                </div>
              </OverlayViewF>
            ))}

            {activeRide && !carAnimPosition && (
              <>
                <Marker
                  position={{ lat: activeRide.origin.lat, lng: activeRide.origin.lng }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#3b82f6",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                  }}
                />
                <Marker
                  position={{ lat: activeRide.destination.lat, lng: activeRide.destination.lng }}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 1.5,
                    anchor: new window.google.maps.Point(12, 24)
                  }}
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
                    anchor: new window.google.maps.Point(21, 46) // Offset shadow
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

            {/* Hotspots Visualization */}
            {hotspots.filter(h => h.active).map(hotspot => (
              <div key={hotspot.id}>
                <Circle
                  center={{ lat: hotspot.lat, lng: hotspot.lng }}
                  radius={hotspot.radius}
                  options={{
                    fillColor: '#10b981', // Emerald 500
                    fillOpacity: 0.15,
                    strokeColor: '#10b981',
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    clickable: false,
                  }}
                />
                <OverlayViewF
                  position={{ lat: hotspot.lat, lng: hotspot.lng }}
                  mapPaneName="overlayMouseTarget"
                >
                  <div className="bg-emerald-500 text-black px-2 py-1 rounded-full text-xs font-bold shadow-md transform -translate-x-1/2 -translate-y-1/2 border border-white/20 whitespace-nowrap flex items-center gap-1">
                    <TrendingUp size={12} />
                    {hotspot.multiplier}x
                  </div>
                </OverlayViewF>
              </div>
            ))}

            {/* Route to Hotspot */}
            {hotspotRouteResponse && (
              <DirectionsRenderer
                directions={hotspotRouteResponse}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: '#10b981', // Emerald for opportunity route
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    zIndex: 5
                  }
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white/50">Carregando Mapa...</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] pointer-events-none"></div>
      </div>

      {/* Header */}
      <header className="absolute top-0 inset-x-0 p-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMenu(true)}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="text-xl font-bold tracking-tighter drop-shadow-md">INVIAGEM<span className="text-emerald-500">.</span></div>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => {
              const newShowHeatmap = !showHeatmap;
              setShowHeatmap(newShowHeatmap);

              if (newShowHeatmap && mapCenter) {
                // Generate zones
                const zones = Array.from({ length: 5 }).map((_, i) => {
                  const latOffset = (Math.random() - 0.5) * 0.05;
                  const lngOffset = (Math.random() - 0.5) * 0.05;
                  const value = Math.floor(Math.random() * 8) + 1 + (Math.random() > 0.5 ? 0.25 : 0.75);
                  return {
                    id: i,
                    lat: mapCenter.lat + latOffset,
                    lng: mapCenter.lng + lngOffset,
                    value: value
                  };
                });
                setSurgePricingZones(zones);
              } else {
                setSurgePricingZones([]);
              }
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${showHeatmap ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'glass-panel border-white/10 hover:bg-white/10 text-white/70'}`}
            title="Mapa de Calor de Demanda"
          >
            <Flame size={20} />
          </button>

          {!activeRide && (
            <button
              onClick={activeHotspot ? clearHotspotRoute : handleFindBestSpot}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${activeHotspot ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'glass-panel border-white/10 hover:bg-white/10 text-emerald-400'}`}
              title={activeHotspot ? "Cancelar Rota" : "Encontrar Melhor Local"}
            >
              {activeHotspot ? <X size={20} /> : <TrendingUp size={20} />}
            </button>
          )}

          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-sm font-medium border border-white/10">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* Fase 1: Dashboard de Metas e Filtros Rápidos */}
      {!activeRide && activeTab === 'home' && (
        <div className="absolute top-24 inset-x-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="glass-panel p-3 rounded-2xl border border-white/10 pointer-events-auto flex flex-col gap-2 bg-black/40 backdrop-blur-md">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/70 flex items-center gap-1"><Target size={12} /> Meta Diária</span>
              <span className="text-xs font-bold text-emerald-400">R$ {currentEarnings.toFixed(2)} / R$ {dailyGoal.toFixed(2)}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(currentEarnings / dailyGoal) * 100}%` }}></div>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto mt-1">
            <button
              onClick={() => setIsGoingHome(!isGoingHome)}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold transition-colors border ${isGoingHome ? 'bg-blue-600/90 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'glass-panel border-white/10 text-white/70 hover:bg-white/10'}`}
            >
              <Home size={14} />
              {isGoingHome ? 'Destino: Casa' : 'Filtro Destino'}
            </button>
            <button
              onClick={() => setAutoAccept(!autoAccept)}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold transition-colors border ${autoAccept ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'glass-panel border-white/10 text-white/70 hover:bg-white/10'}`}
            >
              <TrendingUp size={14} />
              {autoAccept ? 'Auto-Aceitar ON' : 'Radar Ganhos'}
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold transition-colors border ${isPaused ? 'bg-orange-600/90 border-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'glass-panel border-white/10 text-white/70 hover:bg-white/10'}`}
            >
              <Coffee size={14} />
              {isPaused ? 'Em Pausa (15m)' : 'Pausa Café'}
            </button>
          </div>
        </div>
      )}

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
                <div className="text-xl font-bold tracking-tighter">INVIAGEM<span className="text-emerald-500">.</span></div>
                <button onClick={() => setShowMenu(false)} className="text-white/40 hover:text-white">&times;</button>
              </div>

              <div className="space-y-1 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4 ml-2">Modo de Uso</p>
                <button
                  onClick={() => { setShowMenu(false); router.push('/passenger'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                >
                  <UserIcon size={20} />
                  <span className="font-medium">Passageiro</span>
                </button>
                <button
                  onClick={() => { setShowMenu(false); router.push('/driver'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                >
                  <Car size={20} />
                  <span className="font-medium">Motorista</span>
                </button>
                <button
                  onClick={() => { setActiveTab('wallet'); setShowMenu(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-colors mt-2"
                >
                  <DollarSign size={20} />
                  <span className="font-medium">Carteira Inviagem</span>
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
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-tighter">Driver Partner</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative pt-24 pb-28 pointer-events-none">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && !activeRide && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-6 space-y-12 relative pointer-events-none"
            >
              <div className="relative pointer-events-auto mt-auto mb-8 w-full flex justify-center">
                {currentUser.walletBalance !== undefined && currentUser.walletBalance < 0 && isOnline ? (
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="relative px-8 py-4 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-500 border border-red-500/50 bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] w-full"
                  >
                    <AlertTriangle size={24} className="animate-pulse" />
                    <span className="text-sm font-mono uppercase tracking-widest font-bold">
                      Saldo Negativo (Bloqueado)
                    </span>
                    <span className="text-[10px] text-white">Você deve taxas ao App/Prefeitura. Regularize.</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleOnline}
                    className={`relative px-8 py-4 rounded-full flex items-center justify-center gap-3 transition-all duration-500 border border-white/10 backdrop-blur-xl ${isOnline
                      ? (isPaused ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 shadow-[0_0_20px_rgba(234,88,12,0.2)]' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]')
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                  >
                    <Power size={24} className={isOnline && !isPaused ? 'animate-pulse' : ''} />
                    <span className="text-sm font-mono uppercase tracking-widest font-bold">
                      {isOnline ? (isPaused ? 'Pausado' : 'Online') : 'Ficar Online'}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-center text-white/40 max-w-[250px] text-xs font-light leading-relaxed">
                {isOnline
                  ? (isPaused ? 'Você está em pausa.' : 'Aguardando solicitações...')
                  : 'Fique online para receber corridas.'}
              </p>

              {/* Incoming Request Modal */}
              <AnimatePresence>
                {isOnline && incomingRide && (
                  <motion.div
                    key="incoming"
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="absolute inset-x-4 bottom-0 glass-panel rounded-[2rem] p-6 border border-emerald-500/30 z-50 flex flex-col gap-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] pointer-events-auto"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-emerald-400 font-medium tracking-wide">Nova Solicitação</h3>
                        <p className="text-white/50 text-xs font-mono mt-1 uppercase tracking-widest">{incomingRide.category} • 2.5 KM</p>

                        {/* Fase 2: Badges de Segurança */}
                        <div className="flex gap-2 mt-3">
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-500/30">
                            <ShieldCheck size={10} /> Verificado
                          </span>
                          {incomingRide.estimatedPrice > 30 && (
                            <span className="bg-orange-500/20 text-orange-400 text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-orange-500/30">
                              <AlertTriangle size={10} /> Zona Laranja
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-light">
                          R$ {(incomingRide.offeredPrice || incomingRide.estimatedPrice).toFixed(2).replace('.', ',')}
                        </div>
                        {incomingRide.offeredPrice && incomingRide.offeredPrice !== incomingRide.estimatedPrice && (
                          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Oferta do Passageiro</div>
                        )}
                        <div className="text-xs text-white/50 font-mono mt-1 uppercase tracking-widest">~{incomingRide.estimatedTime} MIN</div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Origem</p>
                          <p className="font-medium text-sm">{incomingRide.origin.address}</p>
                        </div>
                      </div>
                      <div className="w-px h-4 bg-white/10 ml-1"></div>
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-white mt-1.5"></div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Destino</p>
                          <p className="font-medium text-sm">{incomingRide.destination.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReject(incomingRide.id)}
                          className="flex-1 py-4 rounded-2xl bg-white/5 text-white/80 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10"
                        >
                          <X size={20} />
                          Recusar
                        </button>
                        <button
                          onClick={() => handleAccept(incomingRide.id)}
                          className="flex-1 py-4 rounded-2xl bg-emerald-500 text-black font-medium flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
                        >
                          <Check size={20} />
                          Aceitar
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCounterOffer(incomingRide.id, incomingRide.offeredPrice || incomingRide.estimatedPrice, 2)}
                          className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-medium border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          + R$ 2,00
                        </button>
                        <button
                          onClick={() => handleCounterOffer(incomingRide.id, incomingRide.offeredPrice || incomingRide.estimatedPrice, 5)}
                          className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-medium border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          + R$ 5,00
                        </button>
                        <button
                          onClick={() => handleCounterOffer(incomingRide.id, incomingRide.offeredPrice || incomingRide.estimatedPrice, 10)}
                          className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-medium border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          + R$ 10,00
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Active Ride View */}
          {activeRide && (
            <motion.div
              key="active-ride"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col absolute inset-0 z-10 pointer-events-none"
            >
              {/* Map Placeholder */}
              <div className="flex-1 relative overflow-hidden pointer-events-none">
                {/* Drive Mode Maneuver HUD */}
                {isDriveMode && currentManeuver && activeRide?.status === 'IN_PROGRESS' && (
                  <div className="absolute top-36 left-4 right-20 z-20 pointer-events-none">
                    <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-4">
                      <Navigation size={32} className="shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold uppercase tracking-wider opacity-80">Próxima Manobra</p>
                        <p className="text-lg font-medium leading-tight">{currentManeuver}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Re-center Button */}
                {!isAutoCenter && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
                    <button
                      onClick={() => {
                        setIsAutoCenter(true);
                        if (carAnimPosition) setMapCenter(carAnimPosition);
                      }}
                      className="bg-white text-blue-600 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Navigation size={16} className="fill-current" />
                      Re-center
                    </button>
                  </div>
                )}

                <div className="absolute top-24 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
                  {/* Drive Mode Button */}
                  <button
                    onClick={() => {
                      const newMode = !isDriveMode;
                      setIsDriveMode(newMode);
                      if (mapRef) {
                        if (newMode) {
                          mapRef.setTilt(45);
                          mapRef.setHeading(carHeading);
                          setMapZoom(18);
                        } else {
                          mapRef.setTilt(0);
                          mapRef.setHeading(0);
                          setMapZoom(15);
                        }
                      }
                    }}
                    className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors shadow-lg ${isDriveMode ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black/60 text-white/50 border-white/10 hover:bg-white/10'}`}
                    title="Modo Direção (GPS 3D)"
                  >
                    <Map size={20} />
                  </button>

                  {/* Fase 3: Alertas na Via */}
                  {activeRide.status === 'IN_PROGRESS' && (
                    <button className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors shadow-lg" title="Reportar Buraco/Perigo">
                      <AlertOctagon size={20} />
                    </button>
                  )}

                  {/* External Navigation Buttons */}
                  {(activeRide.status === 'DRIVER_ASSIGNED' || activeRide.status === 'IN_PROGRESS') && (
                    <>
                      <button
                        onClick={() => {
                          const dest = activeRide.status === 'DRIVER_ASSIGNED' ? activeRide.origin : activeRide.destination;
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
                        }}
                        className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors shadow-lg"
                        title="Abrir no Google Maps"
                      >
                        <Map size={20} />
                      </button>
                      <button
                        onClick={() => {
                          const dest = activeRide.status === 'DRIVER_ASSIGNED' ? activeRide.origin : activeRide.destination;
                          window.open(`https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`, '_blank');
                        }}
                        className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-white/10 transition-colors shadow-lg"
                        title="Abrir no Waze"
                      >
                        <Navigation size={20} />
                      </button>
                    </>
                  )}
                </div>

                <div className="absolute top-24 left-4 z-10 pointer-events-auto">
                  <span className="font-medium text-xs tracking-widest uppercase bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-emerald-400 shadow-lg">
                    {activeRide.status === 'DRIVER_ASSIGNED' && 'Navegando até o Local'}
                    {activeRide.status === 'DRIVER_ARRIVING' && 'Passageiro Embarcando'}
                    {activeRide.status === 'IN_PROGRESS' && 'A Caminho do Destino'}
                    {activeRide.status === 'COMPLETED' && 'Aguardando Pagamento'}
                  </span>
                </div>
              </div>

              {/* Controls Bottom Sheet */}
              <div className="glass-panel rounded-t-[2rem] p-5 space-y-4 z-20 border-t border-white/10 pointer-events-auto transition-all duration-300">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setIsRideInfoExpanded(!isRideInfoExpanded)}
                >
                  <div>
                    <h3 className="text-lg font-light tracking-tight">Nome do Passageiro</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest">Cartão</p>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck size={8} /> Verificado
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 hover:bg-white/10 transition-colors" onClick={(e) => { e.stopPropagation(); /* alert */ }}>
                      <AlertCircle size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors">
                      {isRideInfoExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isRideInfoExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Fase 2: Ferramentas de Segurança e Chat */}
                      <div className="flex gap-2 mb-2 pt-2">
                        <button
                          onClick={() => setIsRecordingAudio(!isRecordingAudio)}
                          className={`flex-1 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-colors ${isRecordingAudio ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
                        >
                          <Mic size={18} className={isRecordingAudio ? 'animate-pulse' : ''} />
                          <span className="text-[9px] uppercase tracking-wider font-bold">Áudio</span>
                        </button>
                        <button
                          onClick={() => setIsDashcamActive(!isDashcamActive)}
                          className={`flex-1 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 border transition-colors ${isDashcamActive ? 'bg-blue-500/20 border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
                        >
                          <Video size={18} className={isDashcamActive ? 'animate-pulse' : ''} />
                          <span className="text-[9px] uppercase tracking-wider font-bold">Dashcam</span>
                        </button>
                        <button
                          onClick={() => setShowChat(true)}
                          className="flex-1 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 border bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors relative"
                        >
                          <MessageSquare size={18} />
                          <span className="text-[9px] uppercase tracking-wider font-bold">Chat</span>
                          {activeRide?.messages && activeRide.messages.length > 0 && activeRide.messages[activeRide.messages.length - 1].senderId !== currentUser?.id && (
                            <span className="absolute top-2 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          )}
                        </button>
                      </div>

                      <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                          <p className="text-sm truncate text-white/80">{activeRide.origin.address}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          <p className="text-sm truncate text-white/80">{activeRide.destination.address}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeRide.status === 'DRIVER_ASSIGNED' && (
                  <button onClick={handleArrived} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-medium hover:bg-emerald-400 transition-colors">
                    Cheguei no Local
                  </button>
                )}
                {activeRide.status === 'DRIVER_ARRIVING' && (
                  <button onClick={handleStartTrip} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-medium hover:bg-blue-400 transition-colors">
                    Iniciar Viagem
                  </button>
                )}
                {activeRide.status === 'IN_PROGRESS' && (
                  <button onClick={handleCompleteTrip} className="w-full bg-white text-black py-4 rounded-2xl font-medium hover:bg-neutral-200 transition-colors">
                    Finalizar Viagem
                  </button>
                )}
                {activeRide.status === 'COMPLETED' && (
                  <div className="w-full glass-panel text-emerald-400 py-4 rounded-2xl font-medium text-center border-emerald-500/30">
                    Aguardando Pagamento...
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-8 h-full overflow-y-auto pointer-events-auto bg-[#050505]"
            >
              <h2 className="text-2xl font-light tracking-tight">Ganhos</h2>

              <div className="glass-panel p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                <span className="text-xs font-mono uppercase tracking-widest text-white/50">Saldo Disponível</span>
                <span className="text-5xl font-light tracking-tighter text-emerald-400">R$ 450,00</span>
                <button className="mt-4 bg-white text-black px-8 py-3 rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors">
                  Sacar
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Atividade Recente</h3>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-panel p-5 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-medium text-sm">Viagem Concluída</p>
                      <p className="text-xs text-white/40 font-mono mt-1">HOJE, 14:30</p>
                    </div>
                    <span className="text-emerald-400 font-medium">+ R$ 25,50</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-6 py-6 space-y-8 h-full overflow-y-auto pointer-events-auto bg-[#050505]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-light tracking-tight">Carteira Inviagem</h2>
              </div>

              <div className={`p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden ${(currentUser.walletBalance || 0) < 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/20'}`}>
                <p className="text-xs uppercase tracking-widest text-white/50 mb-2 font-mono">Saldo Disponível</p>
                <span className={`text-5xl font-light tracking-tighter ${(currentUser.walletBalance || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>R$ {(currentUser.walletBalance || 0).toFixed(2).replace('.', ',')}</span>
                {(currentUser.walletBalance || 0) < 0 && (
                  <p className="text-[10px] text-red-400 mt-2 max-w-[200px]">Seu acesso está bloqueado devido as taxas acumuladas do App (9%) ou IMMU (1%). Efetue um depósito para regularizar.</p>
                )}
                <button
                  onClick={() => addWalletBalance(currentUser.id, 50)}
                  className="mt-6 bg-white text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Adicionar R$ 50 (PIX)
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">Extrato e Taxas Devidas</h3>
                <div className="glass-panel p-5 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Taxa Operacional (App)</p>
                    <p className="text-xs text-white/40 font-mono mt-1">Acúmulo Diário - 9%</p>
                  </div>
                  <span className="text-red-400 font-medium whitespace-nowrap">- R$ 0,00</span>
                </div>
                <div className="glass-panel p-5 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Tributo Municipal (IMMU)</p>
                    <p className="text-xs text-white/40 font-mono mt-1">Lei 2.468 / Retenção 1%</p>
                  </div>
                  <span className="text-red-400 font-medium whitespace-nowrap">- R$ 0,00</span>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'benefits' && (
            <motion.div
              key="benefits"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-8 h-full overflow-y-auto pointer-events-auto bg-[#050505]"
            >
              <h2 className="text-2xl font-light tracking-tight">Clube de Benefícios</h2>

              <div className="grid grid-cols-1 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Droplets size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Posto Parceiro Ipiranga</h3>
                        <p className="text-xs text-white/50 mt-1">10% OFF no Etanol/Gasolina</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/70">1.2 km</span>
                  </div>
                  <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white text-sm py-2 rounded-xl transition-colors border border-white/10">Gerar QR Code</button>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Wrench size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Oficina do Zé</h3>
                        <p className="text-xs text-white/50 mt-1">Troca de óleo com 15% OFF</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/70">3.5 km</span>
                  </div>
                  <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white text-sm py-2 rounded-xl transition-colors border border-white/10">Ver no Mapa</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hotspot Info Card */}
      <AnimatePresence>
        {activeHotspot && !activeRide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-6 right-6 z-20 pointer-events-auto"
          >
            <div className="bg-[#111] border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <TrendingUp size={16} />
                  <span className="font-bold text-sm uppercase tracking-wider">Oportunidade Detectada</span>
                </div>
                <h3 className="font-medium text-white">
                  {hotspots.find(h => h.id === activeHotspot)?.name}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  {hotspots.find(h => h.id === activeHotspot)?.message}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">
                  {hotspots.find(h => h.id === activeHotspot)?.multiplier}x
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">Tarifa</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {!activeRide && (
        <nav className="absolute bottom-6 inset-x-6 z-20 pointer-events-auto">
          <div className="glass-panel rounded-full flex justify-around p-2 border border-white/10">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${activeTab === 'home' ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white/80'}`}>
              <Map size={20} />
            </button>
            <button onClick={() => setActiveTab('earnings')} className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${activeTab === 'earnings' ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white/80'}`}>
              <DollarSign size={20} />
            </button>
            <button onClick={() => setActiveTab('benefits')} className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${activeTab === 'benefits' ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white/80'}`}>
              <Gift size={20} />
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-3 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-emerald-400' : 'text-white/40 hover:text-white/80'}`}>
              <Settings size={20} />
            </button>
          </div>
        </nav>
      )}
      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && activeRide && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col pointer-events-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Chat com Passageiro</h2>
              <button onClick={() => setShowChat(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {activeRide.messages?.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <span className="text-[10px] opacity-50 mt-1 block text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!activeRide.messages || activeRide.messages.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
                  Nenhuma mensagem ainda.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatMessage.trim()}
                  className="bg-emerald-500 text-black p-3 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
