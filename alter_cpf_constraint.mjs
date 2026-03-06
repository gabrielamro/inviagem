import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'ewgglooabyzilweudhoo'; // from update_db_api.mjs

async function updateDb() {
    const sql = `
    DO $$ 
    DECLARE
        const_name text;
    BEGIN
        SELECT constraint_name INTO const_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_type = 'UNIQUE' AND constraint_name LIKE '%cpf%';
        
        IF const_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || const_name;
        END IF;
        
        BEGIN
            ALTER TABLE public.users ADD CONSTRAINT users_cpf_role_key UNIQUE (cpf, role);
        EXCEPTION WHEN duplicate_object THEN
            
        END;
    END $$;
  `;

    console.log('Enviando via Supabase API...');

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
            console.log('✅ Duplicidade de CPF + Role liberada com sucesso!');
        } else {
            console.error('❌ Erro da API:', result);
        }
    } catch (err) {
        console.error('❌ Erro de conexo:', err.message);
    }
}

updateDb();
