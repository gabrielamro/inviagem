import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'ewgglooabyzilweudhoo';

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
            -- Update constraints
            ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS users_role_check;
            ALTER TABLE public.drivers ADD CONSTRAINT drivers_role_check CHECK (role IN ('DRIVER', 'ADMIN'));
        END IF;
    END $$;

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
    
    -- Note: This assumes current IDs in rides match the migrated ones.
    ALTER TABLE public.rides ADD CONSTRAINT rides_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(id);
    ALTER TABLE public.rides ADD CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);

    -- Messages (Tricky, sender can be either. Let's redirect to separate columns or keep for one side for now)
    -- For now, let's keep it simple and just allow messages to exist without strict FK if needed, 
    -- or point to drivers if they are mostly from drivers. 
    -- Actually, let's drop FK on messages for now to avoid crashes, or use separate columns.
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    
    -- Wallet Transactions
    ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
    
  `;

    console.log('Running migration...');

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Migration to separate tables completed successfully!');
        } else {
            console.error('❌ Migration Error:', result);
        }
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
    }
}

migrate();
