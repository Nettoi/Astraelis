var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
import { DurableObject } from "cloudflare:workers";

// ../../packages/shared/src/constantes.ts
var JOUEURS_MAX = 4;
var SIGNAL_OCTETS_MAX = 16384;

// ../../packages/shared/src/code-salon.ts
var ALPHABET_CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
var LONGUEUR_CODE = 6;
function genererCode(octets = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  let code = "";
  while (code.length < LONGUEUR_CODE) {
    for (const o of octets(LONGUEUR_CODE * 2)) {
      if (o < 240 && code.length < LONGUEUR_CODE) code += ALPHABET_CODE[o % ALPHABET_CODE.length];
    }
  }
  return code;
}
__name(genererCode, "genererCode");
function normaliserCode(saisie) {
  const code = saisie.toUpperCase().replace(/[\s-]/g, "");
  return new RegExp(`^[${ALPHABET_CODE}]{${LONGUEUR_CODE}}$`).test(code) ? code : null;
}
__name(normaliserCode, "normaliserCode");

// src/logique-salon.ts
function admettre(participants, role) {
  const hote = participants.some((p) => p.role === "hote");
  if (role === "hote") return hote ? { ok: false, raison: "hote-deja-present" } : { ok: true };
  if (!hote) return { ok: false, raison: "pas-d-hote" };
  if (participants.length >= JOUEURS_MAX) return { ok: false, raison: "salon-complet" };
  return { ok: true };
}
__name(admettre, "admettre");
function aLArrivee(participants, nouveau) {
  const hote = participants.find((p) => p.role === "hote") ?? (nouveau.role === "hote" ? nouveau : void 0);
  const envois = [
    { a: nouveau.id, message: { t: "accueil", id: nouveau.id, role: nouveau.role, hote: hote?.id ?? null } },
  ];
  if (nouveau.role === "invite" && hote)
    envois.push({ a: hote.id, message: { t: "arrivee", id: nouveau.id } });
  return envois;
}
__name(aLArrivee, "aLArrivee");
function auDepart(restants, parti) {
  return restants.map((p) => ({ a: p.id, message: { t: "depart", id: parti.id } }));
}
__name(auDepart, "auDepart");
function relayer(participants, de, brut) {
  if (brut.length > SIGNAL_OCTETS_MAX)
    return [{ a: de.id, message: { t: "erreur", raison: "message-invalide" } }];
  let message;
  try {
    message = JSON.parse(brut);
  } catch {
    message = null;
  }
  const m = message;
  const dest = participants.find((p) => p.id === m?.a);
  const autorise = dest !== void 0 && dest.id !== de.id && (de.role === "hote" || dest.role === "hote");
  if (m?.t !== "signal" || !autorise)
    return [{ a: de.id, message: { t: "erreur", raison: "message-invalide" } }];
  return [{ a: dest.id, message: { t: "signal", de: de.id, donnees: m.donnees } }];
}
__name(relayer, "relayer");

// src/index.ts
var CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS" };
var Salon = class extends DurableObject {
  static {
    __name(this, "Salon");
  }
  participants() {
    return this.ctx.getWebSockets().map((ws) => {
      const [id, role] = this.ctx.getTags(ws);
      return { id, role };
    });
  }
  envoyer(envois) {
    for (const { a, message } of envois) {
      for (const ws of this.ctx.getWebSockets(a)) ws.send(JSON.stringify(message));
    }
  }
  async fetch(requete) {
    if (requete.headers.get("upgrade") !== "websocket")
      return new Response("WebSocket attendu", { status: 426 });
    const role = new URL(requete.url).searchParams.get("role") === "hote" ? "hote" : "invite";
    const [client, serveur] = Object.values(new WebSocketPair());
    const avant = this.participants();
    const admission = admettre(avant, role);
    if (!admission.ok) {
      serveur.accept();
      serveur.send(JSON.stringify({ t: "erreur", raison: admission.raison }));
      serveur.close(4e3, admission.raison);
      return new Response(null, { status: 101, webSocket: client });
    }
    const nouveau = { id: crypto.randomUUID().slice(0, 8), role };
    this.ctx.acceptWebSocket(serveur, [nouveau.id, role]);
    this.envoyer(aLArrivee(avant, nouveau));
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, brut) {
    const [id, role] = this.ctx.getTags(ws);
    this.envoyer(relayer(this.participants(), { id, role }, typeof brut === "string" ? brut : ""));
  }
  async webSocketClose(ws) {
    const [id, role] = this.ctx.getTags(ws);
    this.envoyer(
      auDepart(
        this.participants().filter((p) => p.id !== id),
        { id, role },
      ),
    );
  }
};
var src_default = {
  async fetch(requete, env) {
    const url = new URL(requete.url);
    if (requete.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/api/sante") return Response.json({ ok: true }, { headers: CORS });
    if (url.pathname === "/api/salons" && requete.method === "POST") {
      return Response.json({ code: genererCode() }, { headers: CORS });
    }
    const m = url.pathname.match(/^\/api\/salons\/([^/]+)$/);
    if (m) {
      const code = normaliserCode(decodeURIComponent(m[1]));
      if (!code) return new Response("Code invalide", { status: 400, headers: CORS });
      return env.SALONS.get(env.SALONS.idFromName(code)).fetch(requete);
    }
    return new Response("Introuvable", { status: 404, headers: CORS });
  },
};

// ../../node_modules/.pnpm/wrangler@4.158.0_@cloudflare+workers-types@5.20261107.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {}
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/.pnpm/wrangler@4.158.0_@cloudflare+workers-types@5.20261107.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause),
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true",
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-8QGooq/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default,
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/.pnpm/wrangler@4.158.0_@cloudflare+workers-types@5.20261107.1/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    },
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [...__facade_middleware__, finalMiddleware]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-8QGooq/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function (request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function (type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(Date.now(), init.cron ?? "", () => {});
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    },
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(Date.now(), init.cron ?? "", () => {});
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(request, this.env, this.ctx, this.#dispatcher, this.#fetchDispatcher);
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export { Salon, __INTERNAL_WRANGLER_MIDDLEWARE__, middleware_loader_entry_default as default };
//# sourceMappingURL=index.js.map
