import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

async function run() {
    console.log('\n🌌 \x1b[1m\x1b[35mUnified Cloud Agent (GitHub + Supabase)\x1b[0m');
    console.log('-------------------------------------------');

    try {
        // --- GITHUB ---
        console.log('\n💠 [1/2] Verificando GitHub SSO...');
        try {
            const ghStatus = execSync('gh auth status', { encoding: 'utf8' });
            console.log('✅ GitHub está autenticado.');
        } catch (e) {
            console.log('⚠️ GitHub CLI não autenticado.');
            const loginGh = await ask('❓ Deseja logar no GitHub via SSO agora? (s/n): ');
            if (loginGh.toLowerCase() === 's') {
                console.log('💡 Execute: \x1b[33mgh auth login\x1b[0m');
            }
        }

        // --- SUPABASE ---
        console.log('\n💠 [2/2] Verificando Supabase SSO...');
        try {
            // Tenta usar npx para o CLI local
            execSync('npx supabase --version', { stdio: 'ignore' });
            console.log('✅ Supabase CLI detectado.');

            const loginSup = await ask('❓ Deseja conectar o Supabase ao seu SSO do GitHub? (s/n): ');
            if (loginSup.toLowerCase() === 's') {
                console.log('\n🔗 \x1b[1mIniciando fluxo de login do Supabase...\x1b[0m');
                console.log('Como você já logou no GitHub, o navegador deve autorizar automaticamente.');
                console.log('💡 Execute no terminal: \x1b[33mnpx supabase login\x1b[0m');
            }
        } catch (e) {
            console.log('⚠️ Supabase CLI não encontrado localmente.');
            const installSup = await ask('❓ Deseja instalar o Supabase CLI agora? (s/n): ');
            if (installSup.toLowerCase() === 's') {
                console.log('⏳ Instalando...');
                execSync('npm install supabase --save-dev', { stdio: 'inherit' });
                console.log('✅ Supabase CLI instalado!');
            }
        }

        console.log('\n✨ \x1b[32mProcesso de Verificação Completo!\x1b[0m');
        console.log('Para gerenciar o banco de dados via agente, use o comando: \x1b[36mnpx supabase link\x1b[0m');

    } catch (err) {
        console.error('\n🛑 Erro no agente:', err.message);
    } finally {
        rl.close();
    }
}

run();
