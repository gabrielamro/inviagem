const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkVehicleColumn() {
    console.log("Checking for 'vehicles' table columns...");
    const { error } = await supabase.from('vehicles').update({ crlv_url: null }).eq('driver_id', '00000000-0000-0000-0000-000000000000');
    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        console.log("❌ Column 'crlv_url' in table 'vehicles' is MISSING.");
    } else {
        console.log("✅ Column 'crlv_url' in table 'vehicles' exists.");
    }
}

checkVehicleColumn();
