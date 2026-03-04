import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgglooabyzilweudhoo.supabase.co';
const supabaseAnonKey = 'sb_publishable_pEI1gxugJPDctskPMrwGtg_JbeFP5Ad';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- VERIFICANDO DADOS DO MOTORISTA NO BANCO ---');

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, cpf, cnh_url, driver_status')
        .eq('cpf', '52980456268');

    if (userError) {
        console.error('Erro ao buscar usuário:', userError.message);
        return;
    }

    if (users.length === 0) {
        console.log('Nenhum usuário encontrado com este CPF.');
    } else {
        console.log('Usuários encontrados:', users);

        for (const user of users) {
            const { data: vehicles, error: vehError } = await supabase
                .from('vehicles')
                .select('*')
                .eq('driver_id', user.id);

            if (vehError) {
                console.error(`Erro ao buscar veículos para ${user.name}:`, vehError.message);
            } else {
                console.log(`Veículos de ${user.name}:`, vehicles);
            }
        }
    }
}

checkData();
