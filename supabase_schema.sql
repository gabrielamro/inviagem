-- ==============================================================================
-- INVIAGEM - SCRIPT DE INICIALIZAÇÃO DE BANCO DE DADOS (SUPABASE)
-- Execute este script inteiro de uma vez no SQL Editor do seu painel Supabase.
-- ==============================================================================

-- 0. Extensão Geoespacial (PostGIS)
-- Essencial para o cálculo de rotas, hotspots e buscas por motoristas próximos.
create extension if not exists postgis;

-- ==============================================================================
-- 1. TABELAS CENTRAIS GLOBAIS
-- ==============================================================================

-- 1.1 TABELA DE USUÁRIOS (Passageiros, Motoristas e Admins)
create table public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null check (role in ('PASSENGER', 'DRIVER', 'ADMIN')),
  cpf text unique,
  driver_status text check (driver_status in ('PENDING_DOCS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
  wallet_balance numeric(10,2) default 0.00,
  status text default 'OFFLINE' check (status in ('OFFLINE', 'ONLINE', 'IN_RIDE')),
  location geography(point), -- Latitude e Longitude (PostGIS)
  address_text text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 1.2 TABELA DE VEÍCULOS (CRLV e Vínculos de Compliance - IMMU)
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.users(id) on delete cascade not null,
  plate text not null unique,
  model text not null,
  brand text not null,
  color text not null,
  manufacturing_year int not null check (manufacturing_year >= 2019), -- Regra dos 5 anos base 2024
  maximum_capacity int default 4 check (maximum_capacity <= 7),
  crlv_document_url text, -- Link para o Storage onde o documento real descansa
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 1.3 LOGS DE LGPD (Registro imutável de Termos Aceitos - Prova Cível)
create table public.lgpd_terms_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  term_version text not null default 'v1.0-IMMU',
  ip_address text,
  accepted_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. TABELAS DE OPERAÇÃO E DINHEIRO (As Mais Estressadas)
-- ==============================================================================

-- 2.1 TABELA DE CORRIDAS (O Motor da Negociação)
create table public.rides (
  id uuid default gen_random_uuid() primary key,
  passenger_id uuid references public.users(id) not null,
  driver_id uuid references public.users(id),
  origin_lat numeric not null,
  origin_lng numeric not null,
  origin_address text not null,
  dest_lat numeric not null,
  dest_lng numeric not null,
  dest_address text not null,
  category text not null,
  status text not null default 'MATCHING' check (status in ('CREATED', 'MATCHING', 'NEGOTIATING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED', 'NO_DRIVER')),
  estimated_price numeric(10,2) not null,
  offered_price numeric(10,2) not null,
  last_offer_by text check (last_offer_by in ('PASSENGER', 'DRIVER')),
  estimated_time int, -- Em minutos
  start_time bigint, -- Timestamp no clique de "Iniciar Viagem" do motorista
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2.2 TABELA DE MENSAGENS / BATE-PAPO
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references public.rides(id) on delete cascade not null,
  sender_id uuid references public.users(id) not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2.3 TABELA DE AUDITORIA FINANCEIRA (Cofre da Prefeitura e App)
create table public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  ride_id uuid references public.rides(id),
  amount numeric(10,2) not null, -- Pode ser Positivo (Recarga Pix) ou Negativo (Déficit de Viagem)
  transaction_type text not null check (transaction_type in ('DEPOSIT', 'TAKE_RATE_APP', 'TAX_IMMU_MANAUS')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. HABILITANDO OS WEBSOCKETS (Sincronização em Tempo Real na Tela do Cliente)
-- ==============================================================================

-- Diz para o PostgreSQL "cuspir" cada mudança nas tabelas pela conexão WS do Supabase
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.vehicles;

-- ==============================================================================
-- (OPCIONAL DE SEGURANÇA): CRIAR BUCKET PRIVADO MOCADO
-- O bucket dos PDFs será feito via SQL para garantir criptografia e travas (RLS)
-- ==============================================================================
insert into storage.buckets (id, name, public) 
values ('driver-docs', 'driver-docs', false)
on conflict (id) do nothing;
