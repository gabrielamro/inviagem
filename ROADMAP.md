# Roadmap de Produto: Inviagem App

Este documento consolida a visão de desenvolvimento e polimento da plataforma Inviagem, focando em experiência do usuário (UX), estabilidade e funcionalidades avançadas de mobilidade.

## 1. Consolidação da Experiência de Navegação (Curto Prazo)

O foco imediato é garantir que a interação com o mapa e a rota seja fluida e intuitiva.

- [x] **Visualização de Rota Limpa:** Implementação da linha azul de trajeto que apaga conforme o progresso (Concluído).
- [x] **Ícone de Veículo Realista:** Substituição da seta por um modelo de carro 3D (Concluído).
- [x] **Oferta Personalizada Opcional:** Fluxo de negociação de preço flexível (Concluído).
- [ ] **Ajuste Fino de Endereço (Drag & Drop):** Permitir que o usuário arraste o pino no mapa para ajustar a localização exata de embarque/desembarque.
- [ ] **Sinalização de Trânsito Inteligente:** Mostrar alertas visuais de congestionamento apenas nos trechos críticos, sem poluir o mapa com linhas verdes desnecessárias.

## 2. Polimento de Interface e Usabilidade (Médio Prazo)

Melhorias visuais e de feedback para o usuário.

- **Animações de Transição:** Suavizar a entrada e saída de menus e painéis (Bottom Sheets).
- **Feedback Hápitco:** Adicionar vibração (em dispositivos móveis) ao interagir com elementos chave (aceitar corrida, arrastar pino).
- **Modo Noturno Automático:** Sincronizar o tema do mapa com o horário do dia automaticamente.
- **Acessibilidade:** Melhorar contrastes e adicionar etiquetas ARIA para leitores de tela.

## 3. Funcionalidades Avançadas (Longo Prazo)

Expansão das capacidades da plataforma.

- **Múltiplas Paradas:** Permitir adicionar pontos de parada intermediários na rota.
- **Compartilhamento de Rota em Tempo Real:** Link público para amigos acompanharem a viagem (Web View).
- **Integração com Transporte Público:** Opção multimodal (carro até o metrô, etc).
- **Gamificação para Motoristas:** Sistema de níveis e recompensas por boa conduta e avaliações.

## 4. Infraestrutura e Segurança

- **Validação de Identidade:** Integração com APIs de verificação de documentos.
- **Botão de Pânico Real:** Integração com serviços de emergência locais.
- **Otimização de Bateria:** Melhorar o consumo de energia do rastreamento GPS em segundo plano.

## 5. Funcionalidade Estratégica: Mapa de Calor e Zonas de Alta Demanda (Hotspots)

Funcionalidade para direcionar motoristas para áreas com maior potencial de ganhos, gerenciada dinamicamente pelo administrador.

### App do Motorista
- **Botão "Melhor Local":** Novo botão flutuante no mapa que, ao ser clicado:
    - Identifica a Zona de Alta Demanda (Hotspot) ativa mais próxima da localização atual do motorista.
    - Traça uma rota automática até o centro dessa zona.
    - Exibe um card informativo com o potencial de ganho extra (ex: "Zona Sul: +20% por corrida").
- **Visualização de Área:** Exibir no mapa um círculo ou polígono translúcido indicando a área de alta demanda.

### Painel Admin
- **Gestão de Hotspots:** Interface de mapa para criar, editar e remover zonas de alta demanda.
- **Parametrização Dinâmica:**
    - Definir raio de abrangência (km).
    - Definir multiplicador de tarifa ou bônus fixo para corridas iniciadas na área.
    - Definir horário de ativação/desativação (ex: "Sexta-feira, 18h às 22h").
    - Definir mensagem personalizada para o motorista (ex: "Alta demanda de saída de shows").

---
*Última atualização: 27 de Fevereiro de 2026*
