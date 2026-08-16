/**
 * Fluxo em tempo real para a central (Server-Sent Events).
 *
 * Unidirecional de propósito: as ações da operadora são POST comuns. WebSocket
 * pagaria bidirecionalidade que ninguém usa, custaria uma dependência nova e
 * exigiria escrever reconexão à mão — o EventSource reconecta sozinho.
 */

const MAX_OUVINTES = 20;

/* ================================================================== *
 *  Fluxo em tempo real (SSE)                                          *
 * ================================================================== */

export function criarFluxo() {
  const ouvintes = new Set();

  return {
    ouvintes,
    conectar(res) {
      if (ouvintes.size >= MAX_OUVINTES) { res.status(503).end(); return null; }
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Sem isto o nginx bufferiza e o alerta chega tarde na tela.
        "X-Accel-Buffering": "no"
      });
      res.write("retry: 3000\n\n");
      const cliente = { res };
      ouvintes.add(cliente);
      return cliente;
    },
    desconectar(cliente) { ouvintes.delete(cliente); },
    emitir(tipo, dados) {
      const bloco = `event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`;
      for (const c of [...ouvintes]) {
        try { c.res.write(bloco); } catch { ouvintes.delete(c); }
      }
    }
  };
}
