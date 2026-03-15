import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPassengers() {
    const { data, error } = await supabase.from('passengers').select('*');
    if (error) {
        console.error('Error fetching passengers:', error);
    } else {
        console.log('Passengers:', data);
    }
}

checkPassengers();
