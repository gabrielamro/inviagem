import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
    const userId = '3b26e80d-6551-4fe3-95af-49631300078d'; // A rejected user ID from earlier

    const { error: vErr } = await supabase.from('vehicles').delete().eq('driver_id', userId);
    console.log("Vehicle delete error:", vErr);

    const { error: uErr } = await supabase.from('users').delete().eq('id', userId);
    console.log("User delete error:", uErr);
}

testDelete();
