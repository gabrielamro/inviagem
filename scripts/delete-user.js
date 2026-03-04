import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteUserByCpf(cpf) {
    const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('cpf', cpf)
        .select();

    if (error) {
        console.error("Erro ao deletar usuário:", error);
    } else {
        console.log("Usuário deletado com sucesso:", data);
    }
}

deleteUserByCpf('52980456268');
