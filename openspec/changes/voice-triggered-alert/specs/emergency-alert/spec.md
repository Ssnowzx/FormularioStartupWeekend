# Alerta de emergência acionado por voz

## ADDED: Reconhecimento da palavra-chave no aparelho

O aparelho reconhece uma frase escolhida pela usuária, **localmente**, sem enviar áudio a
lugar nenhum.

- A frase é escolhida numa lista curada, não digitada. O reconhecimento offline só casa
  palavras que existem no vocabulário do modelo: uma palavra inventada nunca dispararia, e
  ela só descobriria isso na hora errada.
- A frase tem duas palavras. Uma palavra só dispara com a televisão ligada.
- O reconhecedor é criado com uma gramática de dois itens — a frase e `[unk]` — de modo que
  quase todo o resto da sala colapsa em `[unk]` em vez de virar palpite.
- Só resultados finais contam. Resultados parciais oscilam entre hipóteses enquanto a frase
  ainda está sendo dita.
- Confiança mínima de 0,70 por palavra, comparação tolerante a acento e a erro de grafia
  (Levenshtein com orçamento por tamanho do token), e 60 segundos de cooldown depois de
  qualquer disparo.

**Dado pessoal persistido:** a frase secreta, em armazenamento privado do aplicativo.
Justificativa: sem ela não há gatilho. Ela **nunca** é transmitida, e o servidor não tem
rota que a receba nem coluna onde guardá-la — é a decisão de privacidade mais forte do
produto.

**Caminho degradado:** o reconhecimento funciona sem rede, sem plano de dados e em modo
avião. O modelo está embarcado no aplicativo.

## ADDED: Abertura do alerta

- O primeiro POST sai **imediatamente**, sem esperar por posição. Recusar um alerta por
  falta de coordenada seria trocar vida por completude de dado.
- O aparelho envia: identificador de idempotência gerado por ele, tipo de gatilho, nível de
  bateria e a última posição conhecida, se houver.
- Um mesmo aparelho com alerta já aberto recebe de volta o mesmo alerta. A frase dita duas
  vezes não abre duas ocorrências.

**Dado pessoal persistido:** bateria no acionamento — a central precisa saber se vai perder
o rastro em minutos. Opcional; o alerta abre sem ele.

**Caminho degradado:** sem rede, o evento entra numa fila em disco e é reenviado com
backoff exponencial. Cada ponto carrega o instante em que foi capturado, então a entrega
tardia reconstrói o trajeto real em vez de amontoá-lo no momento da entrega.

## ADDED: Janela de cancelamento

- A usuária pode cancelar por **15 segundos**, contados pelo relógio do servidor.
- O cancelamento é silencioso: três toques na tecla `C`. Sem som, sem vibração, sem aviso
  na tela.
- **A janela não atrasa a central.** O alerta vai para a tela na hora, com a contagem
  correndo à vista do operador. Segurar o alerta "para ter certeza" é o tipo de otimização
  que mata gente.
- Passada a janela, ou depois que a central assume, só a central encerra.

## ADDED: Rastreio durante a ocorrência

- Posições a cada 15 segundos, **e apenas enquanto o alerta estiver ativo**. Não existe
  rastreamento contínuo neste produto, e o banco não tem onde guardar uma posição que não
  esteja atrelada a uma ocorrência.
- O serviço só passa a declarar o tipo `location` no instante do disparo — declarado desde
  o início, o ícone de localização ficaria aceso o tempo todo, sinalizando que aquilo não é
  a calculadora que diz ser.

**Dado pessoal persistido:** latitude, longitude e raio de erro. É o dado que faz a viatura
chegar, e o que mais machuca se vazar. Colunas anuláveis de propósito, para permitir
apagamento por redação (`UPDATE ... SET lat=NULL`), já que o usuário do banco não tem
`DELETE`. O raio de erro é exibido junto da posição — o erro do GPS fica honesto na tela em
vez de virar um ponto falsamente preciso.

## ADDED: Central de atendimento

- Ocorrências chegam ao painel por fluxo de eventos do servidor, em menos de um segundo,
  com aviso sonoro gerado na própria página.
- Por baixo do fluxo, uma recarga a cada 20 segundos: se o fluxo morrer sem avisar, a tela
  se conserta sozinha.
- O operador vê nome, telefone, cidade, referência de endereço, bateria, trajeto e Anjos, e
  move a ocorrência entre recebida, em atendimento e resolvida.
- O mapa é desenhado localmente em SVG, sem nenhuma requisição a terceiros: a página abre
  inteira sem internet, e a localização dela não vaza num cabeçalho `Referer` para um
  servidor de mapas.

**Dado pessoal persistido:** nome, telefone, cidade e referência de endereço da usuária.
Justificativa, por campo: sem nome o operador não despacha nem conversa; o telefone é o
único retorno de contato durante a ocorrência e o primeiro recurso quando o GPS falha; a
cidade define qual central recebe; a referência existe porque o GPS urbano erra de 20 a 50
metros e a central precisa de uma âncora humana. **A referência é o campo de maior risco do
banco e só se preenche com autorização dela.**

**Caminho degradado:** os alertas abertos vivem em memória e o banco é gravado em
best-effort. O aparelho recebe confirmação mesmo com o banco fora, e o painel continua
inteiro, exibindo que está sem banco.

## ADDED: Rede de Anjos

- Anjos são cadastrados pela central e **aprovados pela usuária**; o vínculo só nasce desse
  aceite.
- Ao acionar um Anjo, o servidor cria um token de uso restrito **por ocorrência**, válido
  por 12 horas, entregue por link de WhatsApp montado no painel.
- A página do Anjo mostra o primeiro nome dela, a posição e um único botão: "Estou a
  caminho". A confirmação volta para a central em tempo real.
- Token desconhecido, expirado ou revogado responde **404, nunca 401 ou 403** — não se
  confirma a existência de um token para quem não o tem.

**Dado pessoal persistido:** nome, telefone e relação do Anjo. O telefone é o único canal
de entrega do aviso; a relação define ordem de acionamento, porque quem está a 200 metros
vale mais que quem está a 30 quilômetros. A própria existência do vínculo já revela a rede
de apoio dela, e por isso vive sob o mesmo usuário de banco restrito.

## ADDED: Vínculo do aparelho

- O aparelho troca um código de convite de uso único, com validade de 24 horas, por um
  token de 256 bits.
- Códigos e tokens vão ao banco apenas como sha256. O valor legível existe uma única vez:
  na resposta que o cria.
- O token viaja em cabeçalho `Authorization`, nunca em query string — URLs vão para log de
  acesso, histórico do navegador e cabeçalho `Referer`.
- **O código de convite não é enviado por mensagem para a usuária.** Ele aparece na tela do
  cadastro para ser digitado presencialmente. No modelo de ameaça deste produto o agressor
  lê o celular dela, e um código lido entrega o aplicativo inteiro.
