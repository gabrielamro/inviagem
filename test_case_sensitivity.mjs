import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgglooabyzilweudhoo.supabase.co';
const supabaseAnonKey = 'sb_publishable_pEI1gxugJPDctskPMrwGtg_JbeFP5Ad';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFlow() {
    console.log('--- TESTE DE CASE-SENSITIVITY ---');

    const namesToTest = ['driver-documents', 'DRIVER-DOCUMENTS', 'driver-docs', 'DRIVER-DOCS'];

    for (const name of namesToTest) {
        console.log(`\nTestando bucket: "${name}"`);
        const { data, error } = await supabase.storage
            .from(name)
            .upload(`test_${Date.now()}.txt`, 'Conteúdo de teste', { upsert: true });

        if (error) {
            console.error(`❌ Erro em "${name}":`, error.message);
        } else {
            console.log(`✅ SUCESSO! O bucket correto é: "${name}"`);
            console.log('Dados do upload:', data);
            return;
        }
    }

    console.log('\nNenhum dos nomes funcionou. Verifique se o bucket é PUBLIC e se tem as POLICIES de INSERT habilitadas.');
}

testFlow();
