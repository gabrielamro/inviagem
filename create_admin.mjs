import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    const { data, error } = await supabase.from('users').insert([
        {
            name: 'Admin Inviagem',
            role: 'ADMIN',
            cpf: '000.000.000-00',
            status: 'ONLINE',
            wallet_balance: 1000
        }
    ]).select();

    if (error) {
        console.error("Error creating admin:", error);
    } else {
        console.log("Admin created successfully:", data);
    }
}

createAdmin();
