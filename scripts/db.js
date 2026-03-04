require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function main() {
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    const projectRef = 'ewgglooabyzilweudhoo';

    if (!token) {
        console.error("ERRO: SUPABASE_ACCESS_TOKEN não encontrado no .env.local");
        process.exit(1);
    }

    // Parse arguments
    const args = process.argv.slice(2);
    let query = '';

    if (args[0] === '--query') {
        query = args[1];
    } else if (args[0] === '--file') {
        const filePath = args[1];
        if (!fs.existsSync(filePath)) {
            console.error(`ERRO: Arquivo ${filePath} não encontrado`);
            process.exit(1);
        }
        query = fs.readFileSync(filePath, 'utf8');
    } else {
        console.error("Uso: node db.js --query 'SELECT 1' ou node db.js --file ./schema.sql");
        process.exit(1);
    }

    try {
        console.log("🟢 Enviando comando SQL para o Supabase via Management API...");
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        // A resposta costuma vir vazia se for CREATE/INSERT, ou um JSON array para SELECT
        const text = await response.text();
        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = text;
            }
        }

        console.log("✅ SQL executado com sucesso na nuvem.");
        if (data) {
            console.log(data);
        }
    } catch (err) {
        console.error("❌ Falha na execução do SQL:", err.message);
    }
}

main();
