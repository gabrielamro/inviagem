import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function runAnalysis() {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD ? process.env.SUPABASE_DB_PASSWORD.trim().replace(/^'|'$/g, '') : null;
    if (!dbPassword) {
        console.error('❌ ERRO: SUPABASE_DB_PASSWORD não encontrada no arquivo .env.local');
        process.exit(1);
    }
    console.log(`🔍 Iniciando análise do Banco de Dados...`);

    const pConfig = {
        user: 'postgres',
        host: 'db.ewgglooabyzilweudhoo.supabase.co',
        port: 5432,
        database: 'postgres',
        password: dbPassword,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    };

    const pool = new Pool(pConfig);

    try {
        const client = await pool.connect();
        console.log('✅ Conexão estabelecida com sucesso!');

        console.log('\n📊 TABELAS NO SCHEMA PUBLIC:');
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        const tablesRes = await client.query(tablesQuery);
        const tables = tablesRes.rows.map(r => r.table_name);

        if (tables.length === 0) {
            console.log('Nenhuma tabela encontrada no schema public.');
        } else {
            console.log(`Encontradas ${tables.length} tabelas no total: ${tables.join(', ')}`);

            for (const table of tables) {
                // Get Columns
                const colsQuery = `
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = $1
                    ORDER BY ordinal_position;
                `;
                const colsRes = await client.query(colsQuery, [table]);

                // Get Row Count
                let count = 0;
                try {
                    const countRes = await client.query(`SELECT count(*) as total FROM public."${table}"`);
                    count = countRes.rows[0].total;
                } catch (e) {
                    console.log(`Erro ao contar linhas da tabela ${table}: ${e.message}`);
                }

                console.log(`\n📌 Tabela: [ ${table} ] - Registros Totais: ${count}`);
                const colsInfo = colsRes.rows.map(c => `  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`).join('\n');
                console.log(colsInfo);
            }

            // Checking for specific expected columns
            console.log('\n🔎 VERIFICAÇÕES ESPECÍFICAS:');
            if (tables.includes('users')) {
                const checkUserCols = await client.query(`
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('profile_photo_url', 'id')
                `);
                const userCols = checkUserCols.rows.map(r => r.column_name);
                if (userCols.includes('profile_photo_url')) {
                    console.log('✅ Tabela users: Coluna profile_photo_url existe. (Suporte para Biometria ok)');
                } else {
                    console.log('⚠️ Tabela users: Coluna profile_photo_url FALTANDO!');
                }
            } else {
                console.log('⚠️ Tabela users NÃO ENCONTRADA no schema public!');
            }
        }

        client.release();
        console.log('\n🏁 Análise concluída.');
    } catch (err) {
        console.error(`❌ Falha ao analisar o banco de dados:`, err.message);
    } finally {
        await pool.end();
    }
}

runAnalysis();
