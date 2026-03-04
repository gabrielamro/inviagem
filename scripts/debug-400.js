const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugUpdate() {
    console.log("Tentando obter um usuario para teste...");
    const { data: users, error: fetchErr } = await supabase.from('users').select('id, name, driver_status').limit(1);

    if (fetchErr || !users || users.length === 0) {
        console.log("Erro ao buscar usuarios ou nenhum usuario encontrado:", fetchErr);
        return;
    }

    const testUser = users[0];
    console.log("Testando com usuario:", testUser);

    const payload = {
        driver_status: 'REJECTED',
        rejection_reason: 'Teste de recusa'
    };

    console.log("Enviando payload:", payload);
    const { data, error } = await supabase.from('users').update(payload).eq('id', testUser.id);

    if (error) {
        console.log("❌ ERRO DO SUPABASE (400 Bad Request):", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ SUCESSO! Update funcionou.");
    }
}

debugUpdate();
