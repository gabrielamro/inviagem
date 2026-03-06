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

async function setupSpatialIndices() {
    const sql = `
    -- 1. Create GIST index for driver locations if it doesn't exist
    CREATE INDEX IF NOT EXISTS drivers_location_idx ON public.drivers USING GIST (location);

    -- 2. Create GIST index for passenger locations
    CREATE INDEX IF NOT EXISTS passengers_location_idx ON public.passengers USING GIST (location);

    -- 3. Ensure tables are in the realtime publication
    -- First, remove old 'users' if it was there (it might error if it was renamed, but let's be safe)
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.users;
    
    -- Add new tables to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.passengers;
    `;

    try {
        await client.connect();
        await client.query(sql);
        console.log('✅ Índices espaciais e Realtime configurados para Drivers e Passengers!');
    } catch (err) {
        console.error('❌ Erro na configuração do banco:', err.message);
    } finally {
        await client.end();
    }
}

setupSpatialIndices();
