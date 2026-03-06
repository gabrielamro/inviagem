import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Manaus boundaries (rough estimate for simulation)
const MANAUS_SAFE_ZONE = {
    latMin: -3.15,
    latMax: -2.95,
    lngMin: -60.10,
    lngMax: -59.85
};

async function simulateTraffic() {
    console.log('🚀 Iniciando Simulador de Tráfego Inviagem (Fix Geolocation)...');

    // Get some online drivers to simulate
    const { data: drivers, error } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('status', 'ONLINE')
        .limit(3);

    if (error || !drivers || drivers.length === 0) {
        console.error('❌ Nenhum motorista ONLINE encontrado para simular. Certifique-se de que existam motoristas com status ONLINE na tabela drivers.');
        return;
    }

    console.log(`📡 Simulando movimento para: ${drivers.map(d => d.name).join(', ')}`);

    let iteration = 0;
    const interval = setInterval(async () => {
        iteration++;

        for (const driver of drivers) {
            // Random movement logic
            let lat, lng;

            if (iteration > 5 && (driver.name.includes('Teste') || iteration % 2 === 0)) {
                // Force Geo-Fence Breach (North of Manaus)
                lat = -2.85;
                lng = -60.00;
                console.log(`⚠️ ALERTA: Forçando quebra de perímetro (MANAUS_SAFE_ZONE) para ${driver.name}`);
            } else {
                // Normal movement within Manaus
                lat = MANAUS_SAFE_ZONE.latMin + Math.random() * (MANAUS_SAFE_ZONE.latMax - MANAUS_SAFE_ZONE.latMin);
                lng = MANAUS_SAFE_ZONE.lngMin + Math.random() * (MANAUS_SAFE_ZONE.lngMax - MANAUS_SAFE_ZONE.lngMin);
            }

            // POINT(longitude latitude) for PostGIS
            const wktPoint = `POINT(${lng} ${lat})`;

            const { error: updateError } = await supabase
                .from('drivers')
                .update({
                    location: wktPoint,
                    address_text: `Simulação Rota - Iteração ${iteration}`
                })
                .eq('id', driver.id);

            if (updateError) console.error(`❌ Erro PostGIS ${driver.name}:`, updateError.message);
            else console.log(`📍 ${driver.name} movido para: ${lat.toFixed(4)}, ${lng.toFixed(4)} (PostGIS OK)`);
        }

        if (iteration >= 15) {
            console.log('✅ Simulação de Auditoria concluída.');
            clearInterval(interval);
        }
    }, 5000); // Every 5 seconds
}

simulateTraffic();
