/**
 * Helpers que as três interfaces usam.
 *
 * Módulo ES carregado com <script type="module">. O que estiver aqui precisa
 * fazer sentido para o formulário público, para a central e para o site — se
 * só serve a um deles, mora no módulo dele.
 */

export const $ = (id) => document.getElementById(id);

/** Escapa antes de entrar em innerHTML. Toda string vinda do servidor passa aqui. */
export const esc = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** "3min 07s" desde um instante ISO. Usado em cronômetro de ocorrência. */
export function decorrido(desde) {
  const segundos = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 1000));
  const minutos = Math.floor(segundos / 60);
  return minutos ? `${minutos}min ${String(segundos % 60).padStart(2, "0")}s` : `${segundos}s`;
}

/**
 * E.164 para o formato que se lê em voz alta.
 * A operadora dita este número no rádio: "(49) 99912-3456" se lê,
 * "5549999123456" se erra.
 */
export function fone(e164) {
  if (!e164) return null;
  const n = String(e164).replace(/\D/g, "").replace(/^55/, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return e164;
}

/** fetch de JSON que trata erro do servidor como exceção com a mensagem dele. */
export async function pedir(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) }
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw Object.assign(new Error(dados.erro || `Falhou (${resposta.status})`), { status: resposta.status });
  return dados;
}

/**
 * Liga a tela de login à sessão do núcleo.
 *
 * As duas áreas protegidas — painel da pesquisa e central — fazem exatamente
 * isto, e faziam cada uma com sua cópia.
 */
export function ligarLogin({ formulario, usuario, senha, botao, erro, aoEntrar }) {
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    botao.disabled = true;
    erro.hidden = true;
    try {
      const { role } = await pedir("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ usuario: usuario.value, senha: senha.value })
      });
      aoEntrar(role);
    } catch (e) {
      erro.textContent = e.message;
      erro.hidden = false;
    } finally {
      botao.disabled = false;
    }
  });
}

export async function sessaoAtual() {
  try {
    return await (await fetch("/api/auth/session")).json();
  } catch {
    return { ok: false, role: null };
  }
}

export async function sair() {
  await fetch("/api/auth/logout", { method: "POST" });
  location.reload();
}
