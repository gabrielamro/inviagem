# 📚 HISTÓRICO DE PROMPTS E MEMÓRIA — INVIAGEM

Este arquivo é mantido pelo **Agente de Memória** (`/memoria`) e supervisionado pelo **Gerente de Projetos** (`/gestor`). Ele registra todas as perguntas e decisões importantes feitas para a IA.

---

### 🗓️ [22/03/2026 - 12:15]
- **Agente Responsável:** Gestor e Memória
- **Pergunta / Solicitação do Usuário:** "Crie um agente que memorize todas as perguntas feitas para IA, ele fica vinculado a um gerente de projetos."
- **Contexto:** Criação da estrutura de Agentes de Gestão e Memória no projeto Inviagem.
- **Ações Realizadas:**
  1. Criação do workflow `.agent/workflows/gestor.md` (Agente Gerente de Projetos).
  2. Criação do workflow `.agent/workflows/memoria.md` (Agente de Memória).
  3. Inicialização de `PROMPTS.md` para armazenamento centralizado de memória.
- **Observações:** O sistema agora conta com uma hierarquia onde o Gestor coordena as tarefas e o Agente de Memória garante que nada seja esquecido.

---

### 🗓️ [22/03/2026 - 12:17]
- **Agente Responsável:** Gestor e Memória
- **Pergunta / Solicitação do Usuário:** "vamos subir o codigo para o Git"
- **Contexto:** Sincronização dos novos agentes e mudanças recentes com o repositório remoto.
- **Ações Realizadas:**
  1. Verificação do status do Git (ramo `master`, remoto `origin`).
  2. Adição de todos os arquivos modificados e novos (`.agent/workflows/*`, `PROMPTS.md`).
  3. Commit das alterações.
  4. Push para o repositório remoto: `https://github.com/gabrielamro/inviagem.git`.
- **Observações:** Primeira sincronização após a implementação da estrutura de agentes de gestão.

---
