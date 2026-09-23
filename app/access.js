/* Accès apprenants — jetons signés (HMAC-SHA256), vérifiables sans serveur.
   Le formateur génère un lien ; le jeton encode la date d'expiration + une signature. */
(function () {
  const cfg = window.QCU_ACCESS || {};
  const enc = (s) => new TextEncoder().encode(s);

  function daysSinceEpoch(d) {
    d = d || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }
  function dayToDate(day) { return new Date(day * 86400000); }

  async function hmacHex(msg) {
    const key = await crypto.subtle.importKey(
      "raw", enc(cfg.secret || ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc(msg));
    return [...new Uint8Array(sig)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  function randNonce() {
    const a = new Uint8Array(5); crypto.getRandomValues(a);
    return [...a].map((x) => (x % 36).toString(36)).join("");
  }
  async function makeToken(expiryDay, nonce) {
    const sig = (await hmacHex("acces|" + expiryDay + "|" + nonce)).slice(0, 12);
    return expiryDay.toString(36) + "." + nonce + "-" + sig;   // EXP.NONCE-SIG (unique à chaque génération)
  }

  // { token, expiryDay } — valable jusqu'à (expiryDay) exclu, soit "days" jours pleins
  async function generateToken(days) {
    days = days || cfg.linkDays || 26;
    const expiryDay = daysSinceEpoch() + days;
    return { token: await makeToken(expiryDay, randNonce()), expiryDay };
  }

  // renvoie { expiryDay } si le jeton est authentique ET non expiré, sinon null
  async function verifyToken(token) {
    if (!token || token.indexOf("-") < 0) return null;
    const dash = token.lastIndexOf("-");
    const head = token.slice(0, dash), sig = token.slice(dash + 1);
    const dot = head.indexOf(".");
    if (dot < 0) return null;
    const expiryDay = parseInt(head.slice(0, dot), 36);
    const nonce = head.slice(dot + 1);
    if (!(expiryDay > 0)) return null;
    const expected = (await hmacHex("acces|" + expiryDay + "|" + nonce)).slice(0, 12);
    if (sig !== expected) return null;              // signature invalide (forgé)
    if (daysSinceEpoch() >= expiryDay) return null; // expiré
    return { expiryDay };
  }

  // URL du quiz (racine du site), depuis n'importe quelle page (index ou admin)
  function quizBase() {
    return location.origin + location.pathname.replace(/[^/]*$/, "");
  }

  async function generateLink(days) {
    const { token, expiryDay } = await generateToken(days);
    return { link: quizBase() + "?acces=" + token, token, expiryDay, expiryDate: dayToDate(expiryDay) };
  }

  window.QCU_ACCESS_LIB = { cfg, daysSinceEpoch, dayToDate, generateToken, verifyToken, generateLink, quizBase };
})();
