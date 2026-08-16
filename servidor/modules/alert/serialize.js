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
    guardians_on_the_way: a.guardians.filter((g) => g.onTheWayAt).length,
    guardians_notified: a.guardians.filter((g) => g.notifiedAt).length,
    // O número do pitch: quanto tempo levou entre a palavra dita e alguém
    // que se importa dizer "estou indo".
    first_on_the_way_at: a.guardians.map((g) => g.onTheWayAt).filter(Boolean).sort()[0] || null
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
    guardians: a.guardians.map((g) => ({
      guardian_id: g.id, name: g.name, phone_e164: g.phone, relationship: g.relationship,
      priority: g.priority, notified_at: g.notifiedAt, opened_at: g.openedAt, on_the_way_at: g.onTheWayAt
    }))
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
