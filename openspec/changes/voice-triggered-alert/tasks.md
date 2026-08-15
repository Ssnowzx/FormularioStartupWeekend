# Tarefas

Estado em 15/08/2026, fim da sessão de implementação.

## Feitas — críticas para a demo

- [x] Toolchain Android do zero (JDK 21 paralelo ao 25, cmdline-tools, SDK 36) — 0:20
- [x] Projeto Gradle escrito à mão, sem Android Studio, e `assembleDebug` verde — 0:30
- [x] `schema_alerts.sql`: 9 tabelas, justificativa por coluna pessoal, usuário `mer_alerts`
      separado e cego para `respostas` — 1:00
- [x] `alerts.js` montado no `server.js` com 2 linhas de diff, sem tocar no que funcionava — 0:45
- [x] API do aparelho: vínculo por convite, disparo, posições em lote, cancelamento — 1:30
- [x] API da central + SSE com heartbeat e poll de segurança de 20s — 1:30
- [x] Tokens de Anjo por ocorrência e montagem do link `wa.me` — 0:45
- [x] `dispatch.html`: fila ao vivo, detalhe, trilha em SVG local, bipe por WebAudio — 2:00
- [x] `guardian.html`: página do Anjo, um botão, sem nada de terceiros — 0:45
- [x] `enroll.html`: cadastro de usuária e Anjos, código de vínculo em tela — 1:00
- [x] `simulator.html`: o seguro da demonstração — 0:45
- [x] Calculadora funcional em Compose, código oculto `271828`, `FLAG_SECURE` — 1:15
- [x] `ListenerService`: foreground service, notificação `IMPORTANCE_MIN`, promoção do tipo
      para `location` só no disparo — 1:00
- [x] Vosk com gramática, `AudioRecord` próprio, modelo copiado para `filesDir` — 1:30
- [x] Casamento tolerante da frase: normalização, Levenshtein por tamanho, confiança, cooldown — 0:45
- [x] Disparo com fila JSONL e backoff; localização Fused com fallback — 1:15
- [x] Onboarding com "fale a frase agora" como critério de aceitação — 1:00
- [x] Verificação ponta a ponta no navegador, com capturas de cada passo — 0:45

## Feitas — nice-to-have que valeram o custo

- [x] Rota `/app` servindo o APK, para instalar sem cabo — 0:15
- [x] Reidratação dos 50 alertas mais recentes ao reiniciar o servidor — 0:20
- [x] Número "até o primeiro Anjo a caminho" no topo da central — 0:20
- [x] `baixar-modelo.sh`, para o modelo de 51 MB ficar fora do git — 0:15

## Pendentes — críticas, mas dependem de aparelho e de gente

- [ ] **Instalar o APK num celular Android real e rodar o fluxo inteiro.** Nada substitui
      isto: é onde aparecem o fabricante que mata serviço em background, o Play Protect e a
      qualidade real do reconhecimento na sala. **Fazer na noite anterior, nunca no palco.**
- [ ] Testar com a tela apagada e com o celular dentro da bolsa, a 1 metro
- [ ] Deixar o serviço 30 minutos rodando e conferir que não morreu
- [ ] Isenção de otimização de bateria e autostart do fabricante, no aparelho da demo
- [ ] Ensaio cronometrado do roteiro, duas vezes, uma delas com a wifi desligada
- [ ] Vídeo de 60s do fluxo completo, salvo no disco — o plano B de última instância
- [ ] Subir na VPS: `schema_alerts.sql`, `.env`, `proxy_buffering off` no nginx

## Roadmap declarado — não prometer como pronto

- [ ] Áudio como prova (buffer circular + assinatura). Bloqueado pelo bloco jurídico
- [ ] Religar o serviço após reiniciar o celular (exige overlay ou toque da usuária)
- [ ] `EncryptedSharedPreferences` no lugar das preferências em claro
- [ ] Multi-operador, atribuição de ocorrência, papéis na central
- [ ] Rotina agendada de redação por retenção (o mecanismo existe, o agendamento não)
