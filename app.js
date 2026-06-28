/* =========================================================================
   LeadSignal AI — logique de la page
   ========================================================================= */
(function () {
  "use strict";

  const CFG = window.LEADSIGNAL_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);

  /* ---------------- État ---------------- */
  let niches = []; // liste des niches saisies

  /* ---------------- Références DOM ---------------- */
  const form         = $("#leadForm");
  const companyNameInput = $("#companyNameInput");
  const companyNameHelp  = $("#companyNameHelp");
  const serviceDescInput = $("#serviceDescInput");
  const serviceDescHelp  = $("#serviceDescHelp");
  const nicheInput   = $("#nicheInput");
  const addNicheBtn  = $("#addNicheBtn");
  const nicheList    = $("#nicheList");
  const nicheEmpty   = $("#nicheEmpty");
  const nicheHelp    = $("#nicheHelp");
  const locationInput= $("#locationInput");
  const locHelp      = $("#locHelp");
  const maxLeadsInput= $("#maxLeadsInput");
  const maxLeadsRange= $("#maxLeadsRange");
  const leadsHelp    = $("#leadsHelp");
  const submitBtn    = $("#submitBtn");

  const loadingView  = $("#loadingView");
  const loadingMsg   = $("#loadingMsg");
  const resultsView  = $("#resultsView");
  const errorView    = $("#errorView");
  const errorMsg     = $("#errorMsg");
  const rawJson      = $("#rawJson");
  const newRunBtn    = $("#newRunBtn");
  const retryBtn     = $("#retryBtn");

  /* ======================================================================
     1) NICHES — ajout / édition / suppression
     ====================================================================== */

  function renderNiches() {
    nicheList.innerHTML = "";
    nicheEmpty.hidden = niches.length > 0;

    niches.forEach((value, index) => {
      const li = document.createElement("li");
      li.className = "chip";

      const label = document.createElement("span");
      label.className = "chip__label";
      label.textContent = value;
      label.title = "Cliquer pour modifier";
      label.addEventListener("click", () => startEdit(li, index));

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "chip__btn";
      edit.setAttribute("aria-label", `Modifier ${value}`);
      edit.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
      edit.addEventListener("click", () => startEdit(li, index));

      const del = document.createElement("button");
      del.type = "button";
      del.className = "chip__btn";
      del.setAttribute("aria-label", `Supprimer ${value}`);
      del.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      del.addEventListener("click", () => removeNiche(index, li));

      li.append(label, edit, del);
      nicheList.appendChild(li);
    });
  }

  function addNiche(raw) {
    const value = (raw || "").trim();
    if (!value) return;
    // anti-doublon (insensible à la casse)
    if (niches.some((n) => n.toLowerCase() === value.toLowerCase())) {
      showFieldError(nicheHelp, `« ${value} » est déjà dans la liste.`);
      return;
    }
    niches.push(value);
    clearFieldError(nicheHelp);
    nicheInput.value = "";
    renderNiches();
    nicheInput.focus();
  }

  function removeNiche(index, li) {
    li.classList.add("is-leaving");
    setTimeout(() => {
      niches.splice(index, 1);
      renderNiches();
    }, 170);
  }

  function startEdit(li, index) {
    if (li.classList.contains("is-editing")) return;
    li.classList.add("is-editing");
    li.innerHTML = "";

    const input = document.createElement("input");
    input.className = "chip__edit";
    input.value = niches[index];
    input.setAttribute("aria-label", "Modifier la niche");
    li.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const v = input.value.trim();
      if (!v) { renderNiches(); return; } // vide → on annule
      const dup = niches.some((n, i) => i !== index && n.toLowerCase() === v.toLowerCase());
      if (dup) { showFieldError(nicheHelp, `« ${v} » existe déjà.`); renderNiches(); return; }
      niches[index] = v;
      clearFieldError(nicheHelp);
      renderNiches();
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { renderNiches(); }
    });
  }

  addNicheBtn.addEventListener("click", () => addNiche(nicheInput.value));
  nicheInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addNiche(nicheInput.value); }
  });

  /* ======================================================================
     2) Nombre de leads — sync range <-> number
     ====================================================================== */
  const lMin = (CFG.maxLeads && CFG.maxLeads.min) || 1;
  const lMax = (CFG.maxLeads && CFG.maxLeads.max) || 1000;
  const lDef = (CFG.maxLeads && CFG.maxLeads.default) || 100;
  [maxLeadsInput, maxLeadsRange].forEach((el) => { el.min = lMin; el.max = lMax; el.value = lDef; });

  maxLeadsRange.addEventListener("input", () => { maxLeadsInput.value = maxLeadsRange.value; });
  maxLeadsInput.addEventListener("input", () => {
    let v = parseInt(maxLeadsInput.value, 10);
    if (!isNaN(v)) maxLeadsRange.value = Math.min(Math.max(v, lMin), lMax);
  });

  /* ======================================================================
     3) Validation
     ====================================================================== */
  function showFieldError(el, msg) { el.textContent = msg; el.hidden = false; }
  function clearFieldError(el) { el.textContent = ""; el.hidden = true; }

  function validate() {
    let ok = true;
    clearFieldError(companyNameHelp); clearFieldError(serviceDescHelp);
    clearFieldError(nicheHelp); clearFieldError(locHelp); clearFieldError(leadsHelp);

    if (!companyNameInput.value.trim()) { showFieldError(companyNameHelp, "Indiquez le nom de votre entreprise."); ok = false; }
    if (!serviceDescInput.value.trim()) { showFieldError(serviceDescHelp, "Décrivez le service proposé."); ok = false; }
    if (niches.length === 0) { showFieldError(nicheHelp, "Ajoutez au moins une entreprise ciblée."); ok = false; }
    if (!locationInput.value.trim()) { showFieldError(locHelp, "Indiquez une zone géographique."); ok = false; }

    const n = parseInt(maxLeadsInput.value, 10);
    if (isNaN(n) || n < lMin || n > lMax) {
      showFieldError(leadsHelp, `Entrez un nombre entre ${lMin} et ${lMax}.`); ok = false;
    }
    return ok;
  }

  /* ======================================================================
     4) Soumission → écran d'attente → appel n8n
     ====================================================================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      sourceCompany: {
        name: companyNameInput.value.trim(),
        serviceDescription: serviceDescInput.value.trim(),
      },
      targetBusinesses: niches.slice(),
      location: locationInput.value.trim(),
      maxLeads: parseInt(maxLeadsInput.value, 10),
      requestedAt: new Date().toISOString(),
    };

    showView("loading");
    startPipelineAnimation();

    try {
      const data = CFG.demoMode ? await runDemo() : await callN8n(payload);
      stopPipelineAnimation(true);
      renderResults(data);
      showView("results");
    } catch (err) {
      stopPipelineAnimation(false);
      errorMsg.textContent = err && err.message ? err.message : "Erreur inconnue.";
      showView("error");
    }
  });

  async function callN8n(payload) {
    if (!CFG.webhookUrl || CFG.webhookUrl.includes("VOTRE-INSTANCE")) {
      throw new Error("Webhook n8n non configuré. Renseignez « webhookUrl » dans config.js (voir N8N_SETUP.md).");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CFG.requestTimeoutMs || 180000);

    try {
      const res = await fetch(CFG.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Le serveur n8n a répondu ${res.status} ${res.statusText}.`);

      // n8n peut renvoyer du JSON ou du texte ; on tente le JSON.
      const text = await res.text();
      try { return JSON.parse(text); }
      catch { return { raw: text }; }
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") throw new Error("Le délai d'attente a été dépassé. Le run est peut-être trop long pour un appel synchrone.");
      if (err instanceof TypeError) throw new Error("Impossible de joindre n8n (réseau ou CORS). Vérifiez l'URL et la config CORS du webhook.");
      throw err;
    }
  }

  /* ======================================================================
     5) Écran d'attente animé (pipeline + messages)
     ====================================================================== */
  const PIPELINE_STEPS = document.querySelectorAll(".pipeline__step");
  const WAIT_MESSAGES = [
    "Connexion au moteur d'intelligence.",
    "Exploration de Google Maps en cours…",
    "Lecture des avis clients les moins bien notés…",
    "Détection des signaux de douleur opérationnelle…",
    "Calcul des scores d'intention d'achat…",
    "Classement des leads (hot / warm / maybe / cold)…",
    "Préparation des briefs commerciaux…",
    "Presque terminé — finalisation du rapport…",
  ];
  let stepTimer = null, msgTimer = null, curStep = 0, curMsg = 0;

  function startPipelineAnimation() {
    curStep = 0; curMsg = 0;
    PIPELINE_STEPS.forEach((s) => s.classList.remove("is-active", "is-done"));
    loadingMsg.textContent = WAIT_MESSAGES[0];
    if (PIPELINE_STEPS[0]) PIPELINE_STEPS[0].classList.add("is-active");

    // avance les étapes une à une (s'arrête à l'avant-dernière en attendant la vraie réponse)
    stepTimer = setInterval(() => {
      if (curStep < PIPELINE_STEPS.length - 1) {
        PIPELINE_STEPS[curStep].classList.remove("is-active");
        PIPELINE_STEPS[curStep].classList.add("is-done");
        curStep++;
        PIPELINE_STEPS[curStep].classList.add("is-active");
      }
    }, 2200);

    // fait défiler les messages en boucle douce
    msgTimer = setInterval(() => {
      curMsg = (curMsg + 1) % WAIT_MESSAGES.length;
      loadingMsg.style.opacity = "0";
      setTimeout(() => { loadingMsg.textContent = WAIT_MESSAGES[curMsg]; loadingMsg.style.opacity = "1"; }, 200);
    }, 2600);
  }

  function stopPipelineAnimation(success) {
    clearInterval(stepTimer); clearInterval(msgTimer);
    if (success) {
      PIPELINE_STEPS.forEach((s) => { s.classList.remove("is-active"); s.classList.add("is-done"); });
    }
  }

  /* ======================================================================
     6) RENDU DES RÉSULTATS
     Forme du JSON n8n — un lead (objet) OU plusieurs (tableau / {leads:[]}).
     Champs par lead :
       service_type, specific_category, reputation_score, popularity_volume,
       tags_as_string (séparés par des virgules),
       business_context: { relevancy_justification, primary_pain_point,
                           personalized_pitch }
     ====================================================================== */

  // petit utilitaire de création d'élément (textContent = sûr contre l'injection)
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function normalizeLeads(data) {
    if (!data || typeof data !== "object") return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.leads)) return data.leads;
    if (Array.isArray(data.data)) return data.data;
    if (data.service_type || data.business_context || data.specific_category) return [data];
    return [];
  }

  // "4.8 stars over 167 reviews" -> { rating: 4.8, reviews: 167 }
  function parseReputation(s) {
    const out = { rating: null, reviews: null };
    if (!s || typeof s !== "string") return out;
    const r = s.match(/([\d]+(?:[.,]\d+)?)\s*stars?/i) || s.match(/^\s*([\d]+(?:[.,]\d+)?)/);
    if (r) out.rating = parseFloat(r[1].replace(",", "."));
    const v = s.match(/(\d[\d\s,.]*)\s*reviews?/i);
    if (v) out.reviews = parseInt(v[1].replace(/[^\d]/g, ""), 10);
    return out;
  }

  function popularityClass(p) {
    const v = (p || "").toLowerCase();
    if (v.includes("high") || v.includes("élev") || v.includes("eleve")) return "is-high";
    if (v.includes("low") || v.includes("faible")) return "is-low";
    return "is-medium";
  }

  function buildLeadCard(lead, index) {
    const ctx = lead.business_context || {};
    const name = lead.business_name || lead.name || lead.title || lead.place_name ||
                 lead.specific_category || ("Lead #" + (index + 1));
    const rep = parseReputation(lead.reputation_score);

    const card = el("article", "lead");
    card.style.animationDelay = (index * 60) + "ms";

    // --- en-tête : nom + catégorie + réputation ---
    const head = el("div", "lead__head");
    const headMain = el("div", "lead__head-main");
    headMain.appendChild(el("h3", "lead__name", name));
    const cat = [lead.service_type, lead.specific_category].filter(Boolean).join(" · ");
    if (cat) headMain.appendChild(el("p", "lead__cat", cat));
    head.appendChild(headMain);

    if (rep.rating != null) {
      const repBox = el("div", "lead__rep");
      const stars = el("div", "lead__stars");
      stars.appendChild(el("span", "lead__star", "★"));
      stars.appendChild(el("span", null, rep.rating.toFixed(1)));
      repBox.appendChild(stars);
      if (rep.reviews != null) repBox.appendChild(el("span", "lead__reviews", rep.reviews + " avis"));
      head.appendChild(repBox);
    }
    card.appendChild(head);

    // --- badges : popularité + tags ---
    const badges = el("div", "lead__badges");
    if (lead.popularity_volume) {
      const pop = el("span", "badge badge--pop " + popularityClass(lead.popularity_volume));
      pop.appendChild(el("span", "badge__dot"));
      pop.appendChild(el("span", null, "Popularité : " + lead.popularity_volume));
      badges.appendChild(pop);
    }
    (lead.tags_as_string || "").split(",").map((t) => t.trim()).filter(Boolean)
      .forEach((t) => badges.appendChild(el("span", "badge badge--tag", t)));
    if (badges.children.length) card.appendChild(badges);

    // --- douleur principale ---
    if (ctx.primary_pain_point) {
      const pain = el("div", "lead__pain");
      pain.appendChild(el("span", "lead__pain-label", "Douleur principale"));
      pain.appendChild(el("p", "lead__pain-text", ctx.primary_pain_point));
      card.appendChild(pain);
    }

    // --- pourquoi ce lead (justification) ---
    if (ctx.relevancy_justification) {
      const block = el("div", "lead__block");
      block.appendChild(el("span", "lead__block-label", "Pourquoi ce lead"));
      block.appendChild(el("p", "lead__block-text", ctx.relevancy_justification));
      card.appendChild(block);
    }

    // --- pitch personnalisé + bouton copier ---
    if (ctx.personalized_pitch) {
      const pitch = el("div", "lead__pitch");
      const ph = el("div", "lead__pitch-head");
      ph.appendChild(el("span", "lead__pitch-label", "Pitch personnalisé"));
      const copyBtn = el("button", "lead__copy", "Copier");
      copyBtn.type = "button";
      copyBtn.addEventListener("click", () => {
        const done = () => {
          copyBtn.textContent = "Copié ✓"; copyBtn.classList.add("is-copied");
          setTimeout(() => { copyBtn.textContent = "Copier"; copyBtn.classList.remove("is-copied"); }, 1600);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(ctx.personalized_pitch).then(done).catch(done);
        else done();
      });
      ph.appendChild(copyBtn);
      pitch.appendChild(ph);
      pitch.appendChild(el("p", "lead__pitch-text", ctx.personalized_pitch));
      card.appendChild(pitch);
    }

    return card;
  }

  function renderResults(data) {
    rawJson.textContent = JSON.stringify(data, null, 2);

    const summary = $("#resultsSummary");
    const list = $("#resultsList");
    const title = $("#results-title");
    summary.innerHTML = "";
    list.innerHTML = "";

    const leads = normalizeLeads(data);

    if (leads.length === 0) {
      title.textContent = "Résultats";
      const empty = el("div", "results__empty");
      empty.appendChild(el("p", null, "Réponse reçue, mais aucun lead exploitable n'a été trouvé dans le JSON."));
      empty.appendChild(el("p", "results__empty-hint", "Dépliez « Voir la réponse JSON brute » ci-dessous pour inspecter la structure."));
      list.appendChild(empty);
      return;
    }

    // titre dynamique
    title.textContent = leads.length > 1 ? (leads.length + " leads qualifiés") : "1 lead qualifié";

    // récap : nb de leads, note moyenne, avis analysés
    const reps = leads.map((l) => parseReputation(l.reputation_score));
    const rated = reps.filter((r) => r.rating != null);
    const avg = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : null;
    const totalReviews = reps.reduce((a, r) => a + (r.reviews || 0), 0);

    const stats = [[String(leads.length), leads.length > 1 ? "leads qualifiés" : "lead qualifié"]];
    if (avg != null) stats.push(["★ " + avg.toFixed(1), "note moyenne"]);
    if (totalReviews > 0) stats.push([totalReviews.toLocaleString("fr-FR"), "avis analysés"]);

    stats.forEach(([v, l]) => {
      const c = el("div", "stat-card");
      c.appendChild(el("div", "stat-card__val", v));
      c.appendChild(el("div", "stat-card__lbl", l));
      summary.appendChild(c);
    });

    leads.forEach((lead, i) => list.appendChild(buildLeadCard(lead, i)));
  }

  /* ======================================================================
     7) Mode démo (sans n8n)
     ====================================================================== */
  function runDemo() {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        demo: true,
        note: "Réponse simulée (demoMode = true). Remplacez par le vrai webhook n8n.",
        echo: {
          sourceCompany: { name: companyNameInput.value.trim(), serviceDescription: serviceDescInput.value.trim() },
          targetBusinesses: niches.slice(),
          location: locationInput.value.trim(),
          maxLeads: parseInt(maxLeadsInput.value, 10),
        },
      }), 6500);
    });
  }

  /* ======================================================================
     8) Navigation entre vues
     ====================================================================== */
  function showView(name) {
    const views = { loading: loadingView, results: resultsView, error: errorView };
    form.closest(".panel").hidden = (name !== "form");
    Object.values(views).forEach((v) => (v.hidden = true));
    if (views[name]) views[name].scrollIntoView({ behavior: "smooth", block: "start" });
    if (name === "loading") loadingView.hidden = false;
    if (name === "results") resultsView.hidden = false;
    if (name === "error")   errorView.hidden = false;
  }

  function resetToForm() {
    [loadingView, resultsView, errorView].forEach((v) => (v.hidden = true));
    form.closest(".panel").hidden = false;
    form.closest(".panel").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  newRunBtn.addEventListener("click", resetToForm);
  retryBtn.addEventListener("click", resetToForm);

  /* ---------------- Init ---------------- */
  renderNiches();
})();
