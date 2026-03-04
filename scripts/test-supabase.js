import { createClient } from '@supabase/supabase-js';
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('users').insert([{
        name: 'Teste Driver',
        role: 'DRIVER',
        cpf: '123.456.789-00',
        driver_status: 'PENDING_DOCS',
        wallet_balance: 0,
        status: 'OFFLINE'
    }]).select().single();

    if (error) {
        console.error("FAIL:", error);
    } else {
        console.log("SUCCESS:", data);
    }
}
run();
