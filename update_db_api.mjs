import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'ewgglooabyzilweudhoo';

async function executeSql() {
    if (!token) {
        console.error('❌ Falha: SUPABASE_ACCESS_TOKEN não encontrado.');
        return;
    }

    const sql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
    COMMENT ON COLUMN users.profile_photo_url IS 'URL da foto de perfil 3D (Biometria)';
  `;

    console.log('🚀 Enviando SQL via Supabase Management API...');

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Sucesso! O banco de dados foi atualizado.');
        } else {
            console.error('❌ Erro da API:', result);
            console.log('Tentando via agente de DB local devido a erro na API de Management.');
        }
    } catch (err) {
        console.error('❌ Erro de conexão:', err.message);
    }
}

executeSql();
