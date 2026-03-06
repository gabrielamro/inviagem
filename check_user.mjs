import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUser() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('cpf', '52980456268');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('User found:', data);
    }
}

checkUser();
