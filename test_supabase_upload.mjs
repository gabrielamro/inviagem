import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgglooabyzilweudhoo.supabase.co';
const supabaseAnonKey = 'sb_publishable_pEI1gxugJPDctskPMrwGtg_JbeFP5Ad';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFlow() {
    console.log('--- DIAGNÓSTICO DE STORAGE (SCRATCHPAD) ---');

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('Erro ao conectar ao Storage:', bucketError.message);
        return;
    }

    console.log('Buckets encontrados:', buckets.map(b => b.name));

    const hasBucket = buckets.some(b => b.name === 'driver-documents');

    if (!hasBucket) {
        console.error('❌ ERRO CRÍTICO: O bucket "driver-documents" NÃO EXISTE.');
        console.log('--- TENTANDO CRIAR AUTOMATICAMENTE ---');

        const { data: newBucket, error: createError } = await supabase.storage.createBucket('driver-documents', {
            public: true
        });

        if (createError) {
            console.error('❌ FALHA NA CRIAÇÃO AUTOMÁTICA:', createError.message);
            console.log('--- CONFIGURAÇÃO MANUAL NECESSÁRIA ---');
            console.log('1. Acesse: https://supabase.com/dashboard/project/ewgglooabyzilweudhoo/storage');
            console.log('2. Clique em "New Bucket"');
            console.log('3. Nome: driver-documents');
            console.log('4. Marque "Public bucket"');
            console.log('5. Salve.');
        } else {
            console.log('✅ SUCESSO! O bucket foi criado automaticamente agora.');
        }
    } else {
        console.log('✅ O bucket "driver-documents" já existe. O problema pode ser nas POLICIES.');

        console.log('--- TESTANDO UPLOAD DE ARQUIVO ---');
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('driver-documents')
            .upload('debug_test.txt', 'Teste de permissão', { upsert: true });

        if (uploadError) {
            console.error('❌ ERRO NO UPLOAD:', uploadError.message);
            console.log('DICA: Você deve criar uma POLICY de "INSERT" e "SELECT" para o bucket "driver-documents" no painel do Supabase.');
        } else {
            console.log('✅ UPLOAD FUNCIONANDO! O problema não é o código nem o bucket.');
        }
    }
}

testFlow();
