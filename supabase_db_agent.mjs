import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

async function runMigration() {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD ? process.env.SUPABASE_DB_PASSWORD.trim().replace(/^'|'$/g, '') : null;
    if (!dbPassword) {
        console.error('❌ ERRO: SUPABASE_DB_PASSWORD não encontrada no arquivo .env.local');
        process.exit(1);
    }
    console.log(`🔑 Senha carregada (comprimento: ${dbPassword.length} caracteres)`);

    // Opção 1: Pooler (Recomendado para IPv4)
    const poolConfigs = [
        {
            name: 'Pooler (IPv4)',
            user: 'postgres.ewgglooabyzilweudhoo',
            host: 'aws-0-sa-east-1.pooler.supabase.com',
            port: 6543,
        },
        {
            name: 'Pooler IP 2',
            user: 'postgres.ewgglooabyzilweudhoo',
            host: '52.67.1.88',
            port: 6543,
        },
        {
            name: 'Pooler IP 3',
            user: 'postgres.ewgglooabyzilweudhoo',
            host: '15.229.150.166',
            port: 6543,
        },
        {
            name: 'Pooler (Modo Sessão)',
            user: 'postgres.ewgglooabyzilweudhoo',
            host: 'aws-0-sa-east-1.pooler.supabase.com',
            port: 5432,
        },
        {
            name: 'Conexão Direta (Pode exigir IPv6)',
            user: 'postgres',
            host: 'db.ewgglooabyzilweudhoo.supabase.co',
            port: 5432,
        }
    ];

    let connected = false;

    for (const pConfig of poolConfigs) {
        if (connected) break;

        console.log(`🔌 Tentando: ${pConfig.name} [${pConfig.host}:${pConfig.port}]...`);

        const pool = new Pool({
            ...pConfig,
            database: 'postgres',
            password: dbPassword,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        try {
            const client = await pool.connect();
            console.log('✅ Conexão estabelecida!');

            const sql = `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
        COMMENT ON COLUMN users.profile_photo_url IS 'URL da foto de perfil 3D (Biometria)';
      `;

            console.log('⚙️ Executando Schema Update...');
            await client.query(sql);
            console.log('🎉 Banco de Dados atualizado com sucesso!');

            client.release();
            connected = true;
        } catch (err) {
            console.error(`❌ Falha em ${pConfig.name}:`, err.message);
            if (err.message.includes('Tenant or user not found')) {
                console.log('💡 Dica: Verifique se o "Connection Pooler" está ENABLED no painel do Supabase (Database > Connection Pooler).');
            }
        } finally {
            await pool.end();
        }
    }

    if (!connected) {
        console.error('\n🛑 O agente não conseguiu conectar ao seu Supabase.');
        console.log('Por favor, certifique-se de que a senha está correta e que o Pooler está ativo.');
    }
}

runMigration();
