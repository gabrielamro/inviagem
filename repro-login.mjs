import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin(cpf) {
    console.log(`Testing login for CPF: ${cpf}`);
    const { data, error } = await supabase
      .from('passengers')
      .select('*')
      .eq('cpf', cpf)
      .single();
    
    if (error) {
        console.error('Login error:', error.message);
    } else {
        console.log('Login success:', data.name);
    }
}

async function run() {
    await testLogin('52980456268');
    await testLogin('529.804.562-68');
}

run();
