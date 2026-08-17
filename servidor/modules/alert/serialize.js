/**
 * O que sai do estado interno para as telas.
 *
 * Duas formas: resumo (fila e eventos) e detalhe (a ocorrência aberta). O
 * resumo não carrega telefone nem referência de endereço — esses só aparecem
 * quando a operadora abre a ocorrência de fato.
 */

/* ================================================================== *
 *  Serialização para as telas                                         *
 * ================================================================== */

export const ultimaPosicao = (a) => a.locations.length ? a.locations[a.locations.length - 1] : null;

export function resumoDoAlerta(a) {
  return {
    alert_id: a.publicId,
    status: a.status,
    trigger: a.triggerKind,
    opened_at: a.openedAt.toISOString(),
    cancel_until: a.cancelUntil.toISOString(),
    battery_pct: a.batteryPct ?? null,
    user: { display_name: a.usuaria.displayName, city: a.usuaria.city },
    last_location: ultimaPosicao(a),
    // Os dois números do pitch: quanto tempo entre a palavra dita e a central
    // assumir, e entre assumir e alguém sair para o endereço.
    acknowledged_at: a.acknowledgedAt || null,
    first_dispatch_at: a.dispatches.length ? a.dispatches[0].at : null,
    dispatches: a.dispatches.length,
    outcome: a.outcome || null
  };
}

export function detalheDoAlerta(a) {
  return {
    ...resumoDoAlerta(a),
    user: {
      display_name: a.usuaria.displayName,
      phone_e164: a.usuaria.phone,
      city: a.usuaria.city,
      reference_note: a.usuaria.referenceNote
    },
    locations: a.locations,
    events: a.events,
    dispatch_log: a.dispatches
  };
}

export function anotar(estado, fluxo, a, kind, actor, { actorRef = null, note = null } = {}) {
  const evento = { kind, actor, actor_ref: actorRef, note, created_at: new Date().toISOString() };
  a.events.push(evento);
  if (a.dbId) {
    estado.gravar(
      "INSERT INTO alert_event (alert_id, kind, actor, actor_ref, note) VALUES (?,?,?,?,?)",
      [a.dbId, kind, actor, actorRef, note]);
  }
  return evento;
}
