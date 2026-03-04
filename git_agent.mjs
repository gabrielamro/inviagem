import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

async function run() {
    console.log('\n🚀 \x1b[1m\x1b[36mGit & SSO Agent Iniciado\x1b[0m');
    console.log('-------------------------------------------');

    try {
        // 1. Verificar Git
        console.log('🔍 Verificando Git...');
        const gitVersion = execSync('git --version').toString().trim();
        console.log(`✅ ${gitVersion} detectado.`);

        // 2. Verificar se já é um repositório
        let isRepo = false;
        try {
            execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
            isRepo = true;
            console.log('📂 Repositório local já inicializado.');
        } catch (e) {
            console.log('📂 O diretório atual não é um repositório Git.');
            const init = await ask('❓ Deseja inicializar o Git agora? (s/n): ');
            if (init.toLowerCase() === 's') {
                execSync('git init');
                console.log('✅ Git inicializado!');
                isRepo = true;
            }
        }

        if (isRepo) {
            // 3. Configurar Identidade
            const currentName = execSync('git config user.name').toString().trim();
            const currentEmail = execSync('git config user.email').toString().trim();

            console.log(`\n👤 Identidade Atual: ${currentName || 'Não definida'} <${currentEmail || 'Não definida'}>`);
            const changeIdent = await ask('❓ Deseja atualizar sua identidade (nome/email)? (s/n): ');

            if (changeIdent.toLowerCase() === 's') {
                const name = await ask('Digite seu nome: ');
                const email = await ask('Digite seu email: ');
                execSync(`git config user.name "${name}"`);
                execSync(`git config user.email "${email}"`);
                console.log('✅ Identidade atualizada!');
            }

            // 4. SSO / GitHub CLI
            console.log('\n🔑 Verificando GitHub CLI para suporte SSO...');
            try {
                execSync('gh --version', { stdio: 'ignore' });
                console.log('✅ GitHub CLI detectado.');
                const login = await ask('❓ Deseja realizar login via SSO agora? (s/n): ');
                if (login.toLowerCase() === 's') {
                    console.log('💡 Execute o comando abaixo no terminal:');
                    console.log('\x1b[33mgh auth login --with-sso\x1b[0m');
                }
            } catch (e) {
                console.log('⚠️ GitHub CLI não encontrado. Ele é recomendado para SSO.');
                const installGh = await ask('❓ Deseja tentar instalar o GitHub CLI via Winget? (s/n): ');
                if (installGh.toLowerCase() === 's') {
                    console.log('⏳ Instalando... isso pode demorar um pouco.');
                    try {
                        execSync('winget install GitHub.cli', { stdio: 'inherit' });
                        console.log('✅ GitHub CLI instalado com sucesso!');
                    } catch (err) {
                        console.error('❌ Falha ao instalar via Winget. Por favor, instale manualmente: https://cli.github.com/');
                    }
                }
            }

            // 5. Remote
            console.log('\n🌐 Verificando Remote...');
            try {
                const remotes = execSync('git remote -v').toString().trim();
                if (remotes) {
                    console.log(`📡 Remotes atuais:\n${remotes}`);
                } else {
                    console.log('⚠️ Nenhum remote configurado.');
                    const remoteUrl = await ask('❓ Digite a URL do repositório remoto (ou pressione Enter para pular): ');
                    if (remoteUrl) {
                        execSync(`git remote add origin ${remoteUrl}`);
                        console.log('✅ Remote "origin" adicionado!');
                    }
                }
            } catch (e) {
                console.error('❌ Erro ao verificar remotes.');
            }
        }

        console.log('\n✨ \x1b[32mConfiguração concluída!\x1b[0m');
        console.log('Para conectar ao SSO, certifique-se de que o Git Credential Manager ou GH CLI está autorizado.');

    } catch (err) {
        console.error('\n🛑 Ocorreu um erro no agente:');
        console.error(err.message);
    } finally {
        rl.close();
    }
}

run();
