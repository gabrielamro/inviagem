import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config({ path: '.env.local' });

async function run() {
    const password = '$3curityAmr550903';
    const projectRef = 'ewgglooabyzilweudhoo';

    const connections = [
        {
            name: 'Direct (via DATABASE_URL)',
            connectionString: process.env.DATABASE_URL
        },
        {
            name: 'Pooler IPv4 (Port 6543)',
            connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
        },
        {
            name: 'Pooler Direct IP (54.94.90.106)',
            connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@54.94.90.106:6543/postgres`
        }
    ];

    for (const conn of connections) {
        if (!conn.connectionString) continue;

        console.log(`🚀 Tentando conexão: ${conn.name}...`);
        const pool = new Pool({
            connectionString: conn.connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            const client = await pool.connect();
            console.log('✅ Conectado!');

            const sql = `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
        COMMENT ON COLUMN users.profile_photo_url IS 'URL da foto de perfil 3D (Biometria)';
      `;

            await client.query(sql);
            console.log('🎉 SUCESSO! A coluna profile_photo_url foi criada/verificada.');
            client.release();
            await pool.end();
            process.exit(0);
        } catch (err) {
            console.error(`❌ Erro em ${conn.name}:`, err.message);
        } finally {
            await pool.end();
        }
    }

    console.error('\n🛑 Todas as tentativas falharam. Por favor, verifique se o "Connection Pooler" está ENABLED no painel do Supabase com o modo "Transaction".');
}

run();
