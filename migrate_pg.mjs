import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    const sql = `
    -- 1. Create passengers table
    CREATE TABLE IF NOT EXISTS public.passengers (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      cpf text UNIQUE,
      wallet_balance numeric(10,2) DEFAULT 0.00,
      location geography(point),
      address_text text,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
    );

    -- 2. Rename users to drivers if it exists
    DO $$ 
    BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE public.users RENAME TO drivers;
        END IF;
    END $$;

    -- Update driver constraints
    ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_role_check;
    ALTER TABLE public.drivers ADD CONSTRAINT drivers_role_check CHECK (role IN ('DRIVER', 'ADMIN'));

    -- 3. Move existing passengers data
    INSERT INTO public.passengers (id, name, cpf, wallet_balance, location, address_text, created_at)
    SELECT id, name, cpf, wallet_balance, location, address_text, created_at
    FROM public.drivers
    WHERE role = 'PASSENGER'
    ON CONFLICT (id) DO NOTHING;

    DELETE FROM public.drivers WHERE role = 'PASSENGER';

    -- 4. Update Foreign Keys
    -- Vehicles
    ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_driver_id_fkey;
    ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;

    -- Rides
    ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_passenger_id_fkey;
    ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_driver_id_fkey;
    ALTER TABLE public.rides ADD CONSTRAINT rides_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(id);
    ALTER TABLE public.rides ADD CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);

    -- Messages
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    -- Note: sender_id will now be just a UUID without strict FK validation across two tables for now, 
    -- as Postgres doesn't easily support FK to two tables for one column.
    
    -- Wallet Transactions
    ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
    `;

    try {
        await client.connect();
        await client.query(sql);
        console.log('✅ Base de dados migrada para tabelas separadas (passengers e drivers)!');
    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
