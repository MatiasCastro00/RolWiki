const LAST_EMAIL_KEY = "rolkeeper-last-email";
const SUPABASE_TABLE_ID = "main";

const app = document.querySelector("#app");
const supabaseConfig = window.ROLKEEPER_SUPABASE || {};
const hasSupabaseConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
const db = hasSupabaseConfig ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;

const PRESET_SYSTEMS = [
  "D&D 5e",
  "Pathfinder 2e",
  "Call of Cthulhu",
  "Vampiro: La Mascarada",
  "Cyberpunk RED",
  "Blades in the Dark",
  "Dungeon World",
  "Mork Borg",
  "Savage Worlds",
  "Otro",
];

const PRESET_CAMPAIGN_TAGS = [
  "Fantasia oscura",
  "Alta fantasia",
  "Horror",
  "Investigacion",
  "Politica",
  "Exploracion",
  "Supervivencia",
  "Sandbox",
  "One-shot",
  "Campana larga",
  "Intriga",
  "Misterio",
  "Humor",
  "Drama",
  "Accion",
  "Ciencia ficcion",
  "Postapocaliptico",
  "Urbano",
  "Principiantes",
  "Roleo pesado",
];

const defaultState = {
  users: [],
  currentUserId: null,
  lastEmail: "",
  campaigns: [],
};

let state = structuredClone(defaultState);
let authMode = "login";
let activeTab = "wiki";
let editing = null;
let activeCampaignId = null;
let stateSaveTimer = null;
let dashboardSearch = "";

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function splitTags(value) {
  const seen = new Set();
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function campaignTags(campaign) {
  if (Array.isArray(campaign?.tags)) return campaign.tags.filter(Boolean);
  return splitTags(campaign?.tone);
}

function formatTags(tags) {
  return tags.length ? tags.join(", ") : "Sin tags";
}

function renderSystemOptions(selectedSystem = "") {
  const selected = selectedSystem || PRESET_SYSTEMS[0];
  const options = PRESET_SYSTEMS.includes(selected) ? PRESET_SYSTEMS : [selected, ...PRESET_SYSTEMS];
  return options
    .map((system) => `<option value="${escapeAttr(system)}" ${system === selected ? "selected" : ""}>${escapeHtml(system)}</option>`)
    .join("");
}

function renderTagChips(tags) {
  return tags
    .map(
      (tag) => `
        <span class="editable-tag">
          ${escapeHtml(tag)}
          <button type="button" data-action="remove-tag" data-tag="${escapeAttr(tag)}" aria-label="Quitar ${escapeAttr(tag)}">x</button>
        </span>
      `
    )
    .join("");
}

function renderTagPicker(tags = []) {
  const cleanTags = splitTags(tags.join(","));
  return `
    <div class="tag-picker" data-tag-picker>
      <input type="hidden" name="tags" value="${escapeAttr(cleanTags.join(","))}" />
      <div class="tag-chip-row" data-tag-chips>${renderTagChips(cleanTags)}</div>
      <label class="field">
        <span>Agregar tag</span>
        <input class="input" data-tag-input autocomplete="off" placeholder="Escribi y elegi una sugerencia" />
      </label>
      <div class="tag-suggestions hidden" data-tag-suggestions></div>
      <div class="tag-preset-row">
        ${PRESET_CAMPAIGN_TAGS.slice(0, 10)
          .map((tag) => `<button class="tag-preset" type="button" data-action="add-tag" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`)
          .join("")}
      </div>
    </div>
  `;
}

function updateTagPicker(picker, tags) {
  const cleanTags = splitTags(tags.join(","));
  picker.querySelector('input[name="tags"]').value = cleanTags.join(",");
  picker.querySelector("[data-tag-chips]").innerHTML = renderTagChips(cleanTags);
  refreshTagSuggestions(picker.querySelector("[data-tag-input]"));
}

function addTagFromPicker(input) {
  const picker = input.closest("[data-tag-picker]");
  const hidden = picker?.querySelector('input[name="tags"]');
  const value = input.value.trim().replace(/,$/, "");
  if (!picker || !hidden || !value) return;
  updateTagPicker(picker, [...splitTags(hidden.value), value]);
  input.value = "";
  hideTagSuggestions(picker);
}

function tagSuggestionsFor(picker, query = "") {
  const selected = new Set(splitTags(picker.querySelector('input[name="tags"]')?.value).map((tag) => tag.toLowerCase()));
  const normalizedQuery = query.trim().toLowerCase();
  return PRESET_CAMPAIGN_TAGS.filter((tag) => {
    if (selected.has(tag.toLowerCase())) return false;
    return !normalizedQuery || tag.toLowerCase().includes(normalizedQuery);
  });
}

function refreshTagSuggestions(input) {
  const picker = input?.closest("[data-tag-picker]");
  const panel = picker?.querySelector("[data-tag-suggestions]");
  if (!picker || !panel || document.activeElement !== input) return;

  const suggestions = tagSuggestionsFor(picker, input.value);
  panel.innerHTML = suggestions
    .map((tag) => `<button type="button" data-action="add-suggested-tag" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`)
    .join("");
  panel.classList.toggle("hidden", suggestions.length === 0);
}

function hideTagSuggestions(picker) {
  picker?.querySelector("[data-tag-suggestions]")?.classList.add("hidden");
}

function renderDisplayTags(tags) {
  return tags.length
    ? `<div class="display-tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
}

function campaignsForCurrentUser() {
  const user = currentUser();
  if (!user) return [];
  return state.campaigns.filter((campaign) =>
    campaign.members.some((member) => member.userId === user.id)
  );
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function campaignMatchesSearch(campaign, query) {
  const normalizedQuery = normalizeSearchText(query).trim();
  if (!normalizedQuery) return true;
  const searchable = [
    campaign.title,
    ...campaignTags(campaign),
  ].map(normalizeSearchText);
  return searchable.some((value) => value.includes(normalizedQuery));
}

function filteredDashboardCampaigns(campaigns) {
  return campaigns.filter((campaign) => campaignMatchesSearch(campaign, dashboardSearch));
}

function renderDashboardResults(campaigns, totalCount = campaigns.length) {
  if (!totalCount) {
    return `<section class="empty-state">
      <div>
        <h2>Todavia no hay campanas</h2>
        <p class="muted">Crea la primera y usa el link de invitacion para sumar jugadores.</p>
        <button class="button primary" data-action="new-campaign"><span class="icon">+</span>Crear campana</button>
      </div>
    </section>`;
  }

  if (!campaigns.length) {
    return `<section class="empty-state compact">
      <div>
        <h2>No hay coincidencias</h2>
        <p class="muted">Proba buscar por nombre de campana o por alguno de sus tags.</p>
      </div>
    </section>`;
  }

  return `<section class="dashboard-grid">${campaigns.map(renderCampaignCard).join("")}</section>`;
}

function refreshDashboardResults() {
  const results = document.querySelector("[data-dashboard-results]");
  if (!results) return;
  const campaigns = campaignsForCurrentUser();
  const filtered = filteredDashboardCampaigns(campaigns);
  results.innerHTML = renderDashboardResults(filtered, campaigns.length);
  const count = document.querySelector("[data-dashboard-count]");
  if (count) {
    count.textContent = `${filtered.length} de ${campaigns.length} campanas`;
  }
}

function inviteSuggestionsFor(campaign) {
  const current = currentUser();
  if (!current) return [];
  const currentMemberIds = new Set(campaign.members.map((member) => member.userId));
  const suggestions = new Map();

  for (const ownedCampaign of state.campaigns.filter((item) => item.ownerId === current.id)) {
    for (const member of ownedCampaign.members) {
      if (member.userId === current.id || currentMemberIds.has(member.userId)) continue;
      const user = state.users.find((item) => item.id === member.userId);
      if (!user?.email) continue;
      const existing = suggestions.get(user.email) || { user, campaigns: [] };
      existing.campaigns.push(ownedCampaign.title);
      suggestions.set(user.email, existing);
    }
  }

  return [...suggestions.values()].sort((left, right) => left.user.name.localeCompare(right.user.name));
}

async function boot() {
  try {
    if (!db) {
      renderSupabaseRequired();
      return;
    }
    await loadRemoteState();
    activeCampaignId = firstCampaignForCurrentUser()?.id || state.campaigns[0]?.id || null;
    render();
  } catch {
    renderSupabaseRequired();
  }
}

async function loadRemoteState() {
  await ensureCurrentProfile();
  const { data: sessionData } = await db.auth.getSession();
  const userQuery = sessionData.session
    ? db.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: true })
    : Promise.resolve({ data: [], error: null });
  const stateQuery = sessionData.session
    ? db.from("app_state").select("campaigns").eq("id", SUPABASE_TABLE_ID).maybeSingle()
    : Promise.resolve({ data: { campaigns: [] }, error: null });
  const [usersResult, stateResult] = await Promise.all([
    userQuery,
    stateQuery,
  ]);

  if (usersResult.error) throw usersResult.error;
  if (stateResult.error) throw stateResult.error;

  const campaigns = Array.isArray(stateResult.data?.campaigns) ? stateResult.data.campaigns : [];
  applyRemoteState({
    users: usersResult.data.map(profileFromRow),
    campaigns,
    currentUserId: sessionData.session?.user?.id || null,
  });
}

async function ensureCurrentProfile() {
  const { data } = await db.auth.getUser();
  const user = data.user;
  if (!user) return;

  const { data: profile, error } = await db.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (profile) return;

  const name = user.user_metadata?.name || user.email?.split("@")[0] || "Usuario";
  await upsertProfile(user.id, name, user.email);
}

function applyRemoteState(payload) {
  state = {
    ...structuredClone(defaultState),
    ...payload,
    users: Array.isArray(payload.users) ? payload.users : [],
    campaigns: Array.isArray(payload.campaigns) ? payload.campaigns : [],
    lastEmail: localStorage.getItem(LAST_EMAIL_KEY) || payload.users?.[0]?.email || defaultState.lastEmail,
  };

  if (state.currentUserId) {
    const user = currentUser();
    if (user) {
      localStorage.setItem(LAST_EMAIL_KEY, user.email);
      state.lastEmail = user.email;
    }
  }
}

function saveState() {
  window.clearTimeout(stateSaveTimer);
  stateSaveTimer = window.setTimeout(persistState, 120);
}

async function persistState() {
  if (!db || !currentUser()) return;
  try {
    const { error } = await db
      .from("app_state")
      .upsert({ id: SUPABASE_TABLE_ID, campaigns: state.campaigns, updated_at: new Date().toISOString() });

    if (error) throw error;
  } catch (error) {
    showToast("No se pudo guardar en la base de datos.");
  }
}

function profileFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function renderSupabaseRequired() {
  app.innerHTML = `
    <main class="auth-layout single">
      <section class="panel auth-card">
        <h2>Falta conectar Supabase</h2>
        <p class="muted small">
          Rolkeeper ahora puede usar un backend externo para que las cuentas funcionen en cualquier dispositivo.
        </p>
        <div class="auth-note">
          <strong>Archivo</strong>
          <span>supabase-config.js</span>
        </div>
        <p class="muted small">Pega ahi tu Project URL y anon public key de Supabase.</p>
      </section>
    </main>
  `;
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function firstCampaignForCurrentUser() {
  const user = currentUser();
  if (!user) return null;
  return state.campaigns.find((campaign) => campaign.members.some((member) => member.userId === user.id)) || null;
}

function campaignById(id) {
  return state.campaigns.find((campaign) => campaign.id === id) || null;
}

function getRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return { view: "app" };
  const params = new URLSearchParams(hash);
  if (params.has("wiki")) return { view: "wiki", id: params.get("wiki") };
  if (params.has("invite")) return { view: "invite", token: params.get("invite") };
  if (params.has("campaign")) return { view: "campaign", id: params.get("campaign") };
  return { view: "app" };
}

function setHash(params) {
  window.location.hash = params;
}

function render() {
  const route = getRoute();

  if (route.view === "wiki") {
    renderPublicWiki(route.id);
    return;
  }

  if (route.view === "invite") {
    renderInvite(route.token);
    return;
  }

  if (!currentUser()) {
    renderAuth();
    return;
  }

  if (route.view === "campaign") {
    const campaign = campaignById(route.id);
    if (campaign && isCampaignMember(campaign, currentUser().id)) {
      activeCampaignId = route.id;
      renderShell(renderCampaign());
      return;
    }

    window.location.hash = "";
  }

  renderShell(renderDashboard());
}

function renderShell(content) {
  const user = currentUser();
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <button class="brand" data-action="go-dashboard" title="Volver al tablero">
          <span class="brand-mark">R</span>
          <span>
            <span class="brand-name">Rolkeeper</span>
            <span class="brand-subtitle">Campanas, personajes y wikis</span>
          </span>
        </button>
        <div class="top-actions">
          <button class="user-pill account-button" data-action="open-account" title="Editar cuenta">
            <span class="avatar mini">${escapeHtml(user.name.slice(0, 1).toUpperCase())}</span>
            <span>${escapeHtml(user.name)} · ${escapeHtml(user.email)}</span>
          </button>
          <button class="button ghost" data-action="logout"><span class="icon">x</span>Salir</button>
        </div>
      </header>
      ${content}
    </div>
    ${renderModal()}
    <div id="toast" class="toast hidden"></div>
  `;
}

function renderAuth() {
  const isRegister = authMode === "register";
  const title = isRegister ? "Crear cuenta" : "Entrar a tu cuenta";
  const subtitle = isRegister
    ? "Tu cuenta queda guardada en este navegador."
    : "Usa tu email y contrasena para volver a tus campanas.";

  app.innerHTML = `
    <main class="auth-layout">
      <section class="intro-copy">
        <span class="eyebrow">Archivo de mesa</span>
        <h1 class="hero-title">Guarda cada partida como si fuera un mundo vivo.</h1>
        <p class="hero-lede">
          Crea campanas de rol, invita jugadores, deja que editen sus personajes y publica una wiki
          de solo lectura para compartir lore, sesiones y lugares sin exponer tus notas privadas.
        </p>
        <div class="feature-strip">
          <div class="feature-tile">
            <strong>Master primero</strong>
            <span>Control de permisos, invitaciones y contenido publico de la wiki.</span>
          </div>
          <div class="feature-tile">
            <strong>Jugadores con espacio propio</strong>
            <span>Cada usuario puede mantener su ficha narrativa y notas de personaje.</span>
          </div>
          <div class="feature-tile">
            <strong>Wiki compartible</strong>
            <span>Un link limpio para leer el mundo sin entrar al panel de edicion.</span>
          </div>
        </div>
      </section>

      <section class="panel auth-card">
        <h2>${title}</h2>
        <p class="muted small">${subtitle}</p>
        ${renderAuthTabs()}
        ${isRegister ? renderRegisterForm("register", "Crear cuenta") : renderLoginForm("login", "Entrar al tablero")}
        ${renderSocialAuth()}
        <div class="auth-note">
          <strong>Backend externo</strong>
          <span>Supabase guarda cuentas, sesiones y campanas.</span>
        </div>
      </section>
    </main>
    <div id="toast" class="toast hidden"></div>
  `;
}

function renderAuthTabs() {
  return `
    <div class="auth-switch" role="tablist" aria-label="Acceso">
      <button class="auth-tab ${authMode === "login" ? "active" : ""}" type="button" data-action="set-auth-mode" data-mode="login">
        Entrar
      </button>
      <button class="auth-tab ${authMode === "register" ? "active" : ""}" type="button" data-action="set-auth-mode" data-mode="register">
        Crear cuenta
      </button>
    </div>
  `;
}

function renderLoginForm(formType, buttonText, attributes = "") {
  return `
    <form class="form-grid" data-form="${formType}" ${attributes}>
      <label class="field">
        <span>Email</span>
        <input class="input" name="email" type="email" value="${escapeAttr(state.lastEmail || "")}" placeholder="mora@mesa.com" required />
      </label>
      <label class="field">
        <span>Contrasena</span>
        <input class="input" name="password" type="password" minlength="6" required />
      </label>
      <button class="button primary" type="submit"><span class="icon">></span>${buttonText}</button>
    </form>
  `;
}

function renderRegisterForm(formType, buttonText, attributes = "") {
  return `
    <form class="form-grid" data-form="${formType}" ${attributes}>
      <label class="field">
        <span>Nombre visible</span>
        <input class="input" name="name" placeholder="Ej: Mora" required />
      </label>
      <label class="field">
        <span>Email</span>
        <input class="input" name="email" type="email" placeholder="mora@mesa.com" required />
      </label>
      <label class="field">
        <span>Contrasena</span>
        <input class="input" name="password" type="password" minlength="6" required />
      </label>
      <label class="field">
        <span>Repetir contrasena</span>
        <input class="input" name="confirmPassword" type="password" minlength="6" required />
      </label>
      <button class="button primary" type="submit"><span class="icon">+</span>${buttonText}</button>
    </form>
  `;
}

function renderSocialAuth() {
  return `
    <div class="auth-separator"><span>o</span></div>
    <button class="button social-button" type="button" data-action="login-google">
      <span class="google-mark">G</span>
      Continuar con Google
    </button>
  `;
}

function renderDashboard() {
  const campaigns = campaignsForCurrentUser();
  const filteredCampaigns = filteredDashboardCampaigns(campaigns);

  return `
    <main class="page">
      <section class="section-head">
        <div>
          <span class="eyebrow">Tablero</span>
          <h1>Tus campanas de rol</h1>
          <p>Crea una partida, invita jugadores y decide que se publica en la wiki.</p>
        </div>
        <button class="button primary" data-action="new-campaign"><span class="icon">+</span>Nueva campana</button>
      </section>

      ${campaigns.length ? `
        <section class="dashboard-tools" aria-label="Buscar campanas">
          <label class="search-field">
            <span class="icon">B</span>
            <input
              class="input"
              data-dashboard-search
              type="search"
              value="${escapeAttr(dashboardSearch)}"
              placeholder="Buscar por nombre o tag"
              aria-label="Buscar por nombre o tag"
            />
          </label>
          <span class="muted small" data-dashboard-count>${filteredCampaigns.length} de ${campaigns.length} campanas</span>
        </section>
      ` : ""}

      <div data-dashboard-results>
        ${renderDashboardResults(filteredCampaigns, campaigns.length)}
      </div>
    </main>
  `;
}

function renderCampaignCard(campaign) {
  const role = displayRoleFor(campaign, currentUser().id);
  const tags = campaignTags(campaign);
  const image = campaign.imageUrl
    ? `<img class="campaign-card-image" src="${escapeAttr(campaign.imageUrl)}" alt="" loading="lazy" />`
    : "";
  return `
    <button class="campaign-card" data-action="open-campaign" data-id="${campaign.id}">
      ${image}
      <div class="campaign-meta">
        <span class="tag gold">${escapeHtml(campaign.system)}</span>
        <span class="tag role">Tu rol: ${escapeHtml(roleLabel(role))}</span>
        <span class="tag green">${campaign.visibility === "public" ? "Wiki publica" : "Wiki privada"}</span>
        ${tags.slice(0, 2).map((tag) => `<span class="tag violet">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div>
        <h3>${escapeHtml(campaign.title)}</h3>
        <p>${escapeHtml(campaign.description)}</p>
      </div>
      <div class="campaign-stats">
        <span>${campaign.members.length} miembros</span>
        <span>${campaign.characters.length} personajes</span>
        <span>${campaign.wiki.length} paginas</span>
      </div>
    </button>
  `;
}

function renderCampaign() {
  const campaign = campaignById(activeCampaignId);
  const role = displayRoleFor(campaign, currentUser().id);
  const canManage = canManageCampaign(campaign, currentUser().id);
  const tags = campaignTags(campaign);

  return `
    <main class="page">
      <section class="campaign-layout">
        <nav class="side-nav" aria-label="Secciones de campana">
          <div class="side-title">
            <strong>${escapeHtml(campaign.title)}</strong>
            <span class="muted small">${escapeHtml(campaign.system)} · ${escapeHtml(roleLabel(role))}</span>
          </div>
          ${navButton("wiki", "Wiki", "W")}
          ${navButton("characters", "Personajes", "P")}
          ${navButton("members", "Jugadores", "J")}
          ${navButton("invites", "Invitaciones", "I")}
          ${navButton("settings", "Ajustes", "A")}
        </nav>

        <section class="workspace">
          <header class="workspace-hero">
            <div>
              <span class="eyebrow">${escapeHtml(campaign.system)}</span>
              <h1>${escapeHtml(campaign.title)}</h1>
              <p>${escapeHtml(campaign.description)}</p>
              ${renderDisplayTags(tags)}
            </div>
            <div class="actions-row">
              <button class="button" data-action="go-dashboard"><span class="icon">&lt;</span>Tablero</button>
              <button class="button primary" data-action="open-public-wiki" data-id="${campaign.id}">
                <span class="icon">#</span>Ver wiki
              </button>
            </div>
          </header>
          ${renderCampaignTab(campaign, role, canManage)}
        </section>
      </section>
    </main>
  `;
}

function navButton(tab, label, icon) {
  return `
    <button class="nav-button ${activeTab === tab ? "active" : ""}" data-action="set-tab" data-tab="${tab}">
      <span class="icon">${icon}</span>${label}
    </button>
  `;
}

function renderCampaignTab(campaign, role, canManage) {
  if (activeTab === "characters") return renderCharactersTab(campaign, role, canManage);
  if (activeTab === "members") return renderMembersTab(campaign);
  if (activeTab === "invites") return renderInvitesTab(campaign, canManage);
  if (activeTab === "settings") return renderSettingsTab(campaign, canManage);
  return renderWikiTab(campaign, canManage);
}

function renderWikiTab(campaign, canManage) {
  const publicPages = campaign.wiki.filter((page) => page.isPublic).length;
  return `
    <div class="content-grid">
      <section class="split-panel">
        <div class="section-head">
          <div>
            <h2>Wiki de la campana</h2>
            <p>${publicPages} paginas visibles desde el link publico.</p>
          </div>
          ${
            canManage
              ? `<button class="button primary" data-action="new-wiki-page"><span class="icon">+</span>Nueva pagina</button>`
              : ""
          }
        </div>
        <div class="list">
          ${
            campaign.wiki.length
              ? campaign.wiki.map((page) => renderWikiRow(page, canManage)).join("")
              : `<div class="empty-state"><div><h2>La wiki esta vacia</h2><p class="muted">Agrega lore, lugares o resumenes de sesion.</p></div></div>`
          }
        </div>
      </section>

      <aside class="panel tool-panel">
        <h2>Vista compartida</h2>
        <p class="muted small">Solo muestra las paginas marcadas como publicas.</p>
        <div class="invite-box">
          <strong>Link de wiki</strong>
          <div class="copy-line">
            <div class="code-line">${escapeHtml(publicWikiUrl(campaign.id))}</div>
            <button class="button" data-action="copy-wiki" data-id="${campaign.id}"><span class="icon">C</span>Copiar</button>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderWikiRow(page, canManage) {
  return `
    <article class="row-item">
      <div class="campaign-meta">
        <span class="tag">${escapeHtml(page.category)}</span>
        <span class="tag ${page.isPublic ? "green" : "violet"}">${page.isPublic ? "Publica" : "Privada"}</span>
      </div>
      <h3>${escapeHtml(page.title)}</h3>
      <p>${escapeHtml(page.content.slice(0, 220))}${page.content.length > 220 ? "..." : ""}</p>
      <footer>
        <span class="muted small">Pagina de wiki</span>
        ${
          canManage
            ? `<div class="actions-row">
                <button class="button" data-action="edit-wiki" data-id="${page.id}"><span class="icon">E</span>Editar</button>
                <button class="button danger" data-action="delete-wiki" data-id="${page.id}"><span class="icon">x</span>Borrar</button>
              </div>`
            : ""
        }
      </footer>
    </article>
  `;
}

function renderCharactersTab(campaign, role, canManage) {
  const userId = currentUser().id;
  const visibleCharacters = canManage
    ? campaign.characters
    : campaign.characters.filter((character) => character.ownerId === userId);

  return `
    <div class="content-grid">
      <section class="split-panel">
        <div class="section-head">
          <div>
            <h2>Personajes</h2>
            <p>${canManage ? "Owner y editor pueden revisar todos los personajes." : "Podes editar tus propios personajes."}</p>
          </div>
          <button class="button primary" data-action="new-character"><span class="icon">+</span>Nuevo personaje</button>
        </div>
        <div class="list">
          ${
            visibleCharacters.length
              ? visibleCharacters.map((character) => renderCharacterRow(character, campaign, canManage)).join("")
              : `<div class="empty-state"><div><h2>No hay personajes visibles</h2><p class="muted">Crea tu primer personaje para esta partida.</p></div></div>`
          }
        </div>
      </section>

      <aside class="panel tool-panel">
        <h2>Resumen</h2>
        <div class="stat-grid">
          <div class="stat"><b>${campaign.characters.length}</b><span>Personajes</span></div>
          <div class="stat"><b>${campaign.members.length}</b><span>Miembros</span></div>
          <div class="stat"><b>${campaign.wiki.length}</b><span>Paginas</span></div>
        </div>
      </aside>
    </div>
  `;
}

function renderCharacterRow(character, campaign, canManage) {
  const owner = state.users.find((user) => user.id === character.ownerId);
  const canEdit = canManage || character.ownerId === currentUser().id;
  return `
    <article class="row-item">
      <div class="campaign-meta">
        <span class="tag gold">Nivel ${Number(character.level) || 1}</span>
        <span class="tag">${escapeHtml(character.className)}</span>
        <span class="tag green">${escapeHtml(character.status)}</span>
      </div>
      <h3>${escapeHtml(character.name)}</h3>
      <p>${escapeHtml(character.ancestry)} · Jugador: ${escapeHtml(owner?.name || character.playerName || "Sin asignar")}</p>
      <p>${escapeHtml(character.notes)}</p>
      <footer>
        <span class="muted small">Ficha narrativa</span>
        ${
          canEdit
            ? `<div class="actions-row">
                <button class="button" data-action="edit-character" data-id="${character.id}"><span class="icon">E</span>Editar</button>
                <button class="button danger" data-action="delete-character" data-id="${character.id}"><span class="icon">x</span>Borrar</button>
              </div>`
            : ""
        }
      </footer>
    </article>
  `;
}

function renderMembersTab(campaign) {
  return `
    <div class="content-grid">
      <section class="panel tool-panel">
        <h2>Jugadores y permisos</h2>
        <div class="members-list">
          ${campaign.members.map((member) => renderMemberRow(member, campaign)).join("")}
        </div>
      </section>
      <aside class="panel tool-panel">
        <h2>Roles</h2>
        <p class="muted small">
          Owner y editor pueden editar todo. Player puede ver la campana y editar sus personajes. Viewer queda como lectura.
        </p>
      </aside>
    </div>
  `;
}

function renderMemberRow(member, campaign) {
  const user = state.users.find((item) => item.id === member.userId);
  return `
    <div class="member-row">
      <div class="member-id">
        <span class="avatar">${escapeHtml((user?.name || "?").slice(0, 1).toUpperCase())}</span>
        <span>
          <strong>${escapeHtml(user?.name || "Usuario")}</strong>
          <span>${escapeHtml(user?.email || "sin email")}</span>
        </span>
      </div>
      <span class="tag gold">${escapeHtml(roleLabel(displayRoleFor(campaign, member.userId)))}</span>
    </div>
  `;
}

function renderInvitesTab(campaign, canManage) {
  const pending = campaign.invites.filter((invite) => !invite.usedBy);
  const suggestions = inviteSuggestionsFor(campaign);
  return `
    <div class="content-grid">
      <section class="panel tool-panel">
        <h2>Invitar jugadores</h2>
        ${
          canManage
            ? `<p class="muted small">Invita por correo y comparte el link generado. Si esa persona ya participo en otra campana tuya, aparece como sugerencia.</p>
               <form class="form-grid invite-email-form" data-form="invite-email">
                 <label class="field">
                   <span>Email del jugador</span>
                   <input class="input" name="email" type="email" list="invite-email-suggestions" placeholder="jugador@mesa.com" required />
                 </label>
                 <datalist id="invite-email-suggestions">
                   ${suggestions.map((item) => `<option value="${escapeAttr(item.user.email)}">${escapeHtml(item.user.name)}</option>`).join("")}
                 </datalist>
                 ${
                   suggestions.length
                     ? `<div class="recommendation-row">
                         ${suggestions
                           .map(
                             (item) => `
                               <button class="recommendation-chip" type="button" data-action="fill-invite-email" data-email="${escapeAttr(item.user.email)}">
                                 <strong>${escapeHtml(item.user.name)}</strong>
                                 <span>${escapeHtml(item.user.email)}</span>
                               </button>
                             `
                           )
                           .join("")}
                       </div>`
                     : ""
                 }
                 <div class="actions-row">
                   <button class="button primary" type="submit"><span class="icon">+</span>Crear invitacion</button>
                   <button class="button" type="button" data-action="new-invite"><span class="icon">#</span>Link sin correo</button>
                 </div>
               </form>`
            : `<p class="muted small">Solo owner o editor pueden generar invitaciones.</p>`
        }
        <div class="list" style="margin-top: 16px;">
          ${
            pending.length
              ? pending.map((invite) => renderInviteRow(invite)).join("")
              : `<div class="row-item"><p>No hay invitaciones pendientes.</p></div>`
          }
        </div>
      </section>

      <aside class="panel tool-panel">
        <h2>Acceso a wiki</h2>
        <p class="muted small">El link de wiki no permite editar. Sirve para compartir lore con lectores externos.</p>
        <button class="button" data-action="copy-wiki" data-id="${campaign.id}"><span class="icon">C</span>Copiar wiki</button>
      </aside>
    </div>
  `;
}

function renderInviteRow(invite) {
  const invitedUser = invite.invitedUserId ? state.users.find((user) => user.id === invite.invitedUserId) : null;
  return `
    <div class="invite-box">
      <strong>${invite.email ? `Invitacion para ${escapeHtml(invitedUser?.name || invite.email)}` : "Invitacion de jugador"}</strong>
      ${invite.email ? `<span class="muted small">${escapeHtml(invite.email)}</span>` : ""}
      <div class="copy-line">
        <div class="code-line">${escapeHtml(inviteUrl(invite.token))}</div>
        <button class="button" data-action="copy-invite" data-token="${invite.token}"><span class="icon">C</span>Copiar</button>
      </div>
    </div>
  `;
}

function renderSettingsTab(campaign, canManage) {
  return `
    <section class="panel tool-panel">
      <h2>Ajustes de campana</h2>
      ${
        canManage
          ? `<form class="form-grid" data-form="settings">
              <label class="field">
                <span>Nombre</span>
                <input class="input" name="title" value="${escapeAttr(campaign.title)}" required />
              </label>
              <label class="field">
                <span>Sistema</span>
                <select class="select" name="system" required>
                  ${renderSystemOptions(campaign.system)}
                </select>
              </label>
              <div class="field-label">Tags</div>
              ${renderTagPicker(campaignTags(campaign))}
              <label class="field">
                <span>Descripcion</span>
                <textarea class="textarea" name="description">${escapeHtml(campaign.description)}</textarea>
              </label>
              <label class="field">
                <span>URL de imagen del tablero</span>
                <input class="input" name="imageUrl" type="url" value="${escapeAttr(campaign.imageUrl?.startsWith("data:") ? "" : campaign.imageUrl || "")}" placeholder="https://..." />
              </label>
              ${campaign.imageUrl?.startsWith("data:") ? `<input type="hidden" name="existingImageUrl" value="${escapeAttr(campaign.imageUrl)}" />` : ""}
              <label class="field">
                <span>Subir imagen del tablero</span>
                <input class="input" name="imageFile" type="file" accept="image/*" />
              </label>
              ${campaign.imageUrl ? `
                <label class="check-field">
                  <input name="removeImage" type="checkbox" />
                  <span>Quitar imagen guardada</span>
                </label>
              ` : ""}
              <label class="field">
                <span>Estado de la wiki</span>
                <select class="select" name="visibility">
                  <option value="private" ${campaign.visibility === "private" ? "selected" : ""}>Privada por defecto</option>
                  <option value="public" ${campaign.visibility === "public" ? "selected" : ""}>Publica por link</option>
                </select>
              </label>
              <button class="button primary" type="submit"><span class="icon">S</span>Guardar cambios</button>
            </form>`
          : `<p class="muted">Solo owner o editor pueden cambiar los ajustes de esta campana.</p>`
      }
    </section>
  `;
}

function renderPublicWiki(campaignId) {
  const campaign = campaignById(campaignId);
  const pages = campaign?.wiki.filter((page) => page.isPublic) || [];
  const needsAuth = !currentUser() && !state.campaigns.length;

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <button class="brand" data-action="go-dashboard" title="Volver al tablero">
          <span class="brand-mark">R</span>
          <span>
            <span class="brand-name">Rolkeeper</span>
            <span class="brand-subtitle">Wiki compartida</span>
          </span>
        </button>
        <div class="top-actions">
          <button class="button" data-action="go-dashboard"><span class="icon">&lt;</span>Entrar al tablero</button>
        </div>
      </header>
      <main class="public-wiki">
        ${
          campaign
            ? `<section class="public-cover">
                <div>
                  <span class="eyebrow">${escapeHtml(campaign.system)}</span>
                  <h1>${escapeHtml(campaign.title)}</h1>
                  <p class="hero-lede">${escapeHtml(campaign.description)}</p>
                </div>
              </section>
              <section class="public-pages">
                ${
                  pages.length
                    ? pages.map(renderPublicPage).join("")
                    : `<article class="public-page"><h2>Wiki sin paginas publicas</h2><div>Todavia no se publico contenido.</div></article>`
                }
              </section>`
            : needsAuth
              ? `<section class="empty-state"><div><h2>Inicia sesion para ver la wiki</h2><p class="muted">El contenido compartido ahora se lee desde Supabase con una cuenta de Rolkeeper.</p></div></section>`
              : `<section class="empty-state"><div><h2>Wiki no encontrada</h2><p class="muted">El link no coincide con una campana guardada en Supabase.</p></div></section>`
        }
      </main>
    </div>
  `;
}

function renderPublicPage(page) {
  return `
    <article class="public-page">
      <span class="tag gold">${escapeHtml(page.category)}</span>
      <h2>${escapeHtml(page.title)}</h2>
      <div>${escapeHtml(page.content)}</div>
    </article>
  `;
}

function renderInvite(token) {
  const found = findInvite(token);
  const user = currentUser();
  const needsAuth = !user && !state.campaigns.length;

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <button class="brand" data-action="go-dashboard" title="Volver al tablero">
          <span class="brand-mark">R</span>
          <span>
            <span class="brand-name">Rolkeeper</span>
            <span class="brand-subtitle">Invitacion de campana</span>
          </span>
        </button>
      </header>
      <main class="invite-screen">
        <section class="panel invite-card">
          ${
            needsAuth
              ? `<span class="eyebrow">Invitacion</span>
                 <h1>Entra para aceptar</h1>
                 <p class="muted">La invitacion se validara despues de iniciar sesion o crear tu cuenta.</p>
                 ${renderInviteAuth(token)}`
              : found
              ? `<span class="eyebrow">Invitacion</span>
                 <h1>${escapeHtml(found.campaign.title)}</h1>
                 <p class="muted">Te estan invitando a participar como jugador.</p>
                 ${
                   user
                     ? `<p class="small muted">Vas a aceptar como ${escapeHtml(user.name)}.</p>
                        <button class="button primary" data-action="accept-invite" data-token="${escapeAttr(token)}"><span class="icon">+</span>Aceptar invitacion</button>`
                     : renderInviteAuth(token)
                 }`
              : `<h1>Invitacion no encontrada</h1>
                 <p class="muted">Puede estar usada, vencida o guardada en otro navegador.</p>
                 <button class="button" data-action="go-dashboard"><span class="icon">&lt;</span>Volver</button>`
          }
        </section>
      </main>
    </div>
    <div id="toast" class="toast hidden"></div>
  `;
}

function renderInviteAuth(token) {
  const isRegister = authMode === "register";

  return `
    <div class="invite-auth">
      ${renderAuthTabs()}
      ${
        isRegister
          ? renderRegisterForm("register-invite", "Crear cuenta y aceptar", `data-token="${escapeAttr(token)}"`)
          : renderLoginForm("login-invite", "Entrar y aceptar", `data-token="${escapeAttr(token)}"`)
      }
      ${renderSocialAuth()}
      <p class="muted small">Usa la misma cuenta en cualquier dispositivo conectado a este proyecto de Supabase.</p>
    </div>
  `;
}

function renderModal() {
  if (!editing) return "";
  if (editing.type === "account") return renderAccountModal();
  if (editing.type === "campaign") return renderCampaignModal();
  if (editing.type === "wiki") return renderWikiModal(editing.id);
  if (editing.type === "character") return renderCharacterModal(editing.id);
  return "";
}

function renderAccountModal() {
  const user = currentUser();

  return `
    <div class="modal-backdrop">
      <section class="modal-panel">
        <header class="modal-head">
          <div>
            <h2>Tu cuenta</h2>
            <p class="muted small">Actualiza tu perfil local de Rolkeeper.</p>
          </div>
          <button class="button ghost" data-action="close-modal"><span class="icon">x</span></button>
        </header>
        <form class="form-grid" data-form="account">
          <label class="field">
            <span>Nombre visible</span>
            <input class="input" name="name" value="${escapeAttr(user.name)}" required />
          </label>
          <label class="field">
            <span>Email</span>
            <input class="input" name="email" type="email" value="${escapeAttr(user.email)}" required />
          </label>
          <div class="form-divider"></div>
          <label class="field">
            <span>Contrasena actual</span>
            <input class="input" name="currentPassword" type="password" minlength="6" placeholder="Solo si cambias email o contrasena" />
          </label>
          <label class="field">
            <span>Nueva contrasena</span>
            <input class="input" name="newPassword" type="password" minlength="6" placeholder="Opcional" />
          </label>
          <label class="field">
            <span>Repetir nueva contrasena</span>
            <input class="input" name="confirmPassword" type="password" minlength="6" placeholder="Opcional" />
          </label>
          <p class="muted small">Si entraste con Google, podes cambiar tu nombre sin contrasena. Para cambiar email o contrasena usa una cuenta con password.</p>
          <button class="button primary" type="submit"><span class="icon">S</span>Guardar cuenta</button>
        </form>
      </section>
    </div>
  `;
}

function renderCampaignModal() {
  return `
    <div class="modal-backdrop">
      <section class="modal-panel">
        <header class="modal-head">
          <div>
            <h2>Nueva campana</h2>
            <p class="muted small">Crea el espacio privado de una partida.</p>
          </div>
          <button class="button ghost" data-action="close-modal"><span class="icon">x</span></button>
        </header>
        <form class="form-grid" data-form="campaign">
          <label class="field">
            <span>Nombre de la campana</span>
            <input class="input" name="title" placeholder="La corona rota" required />
          </label>
          <label class="field">
            <span>Sistema</span>
            <select class="select" name="system" required>
              ${renderSystemOptions()}
            </select>
          </label>
          <div class="field-label">Tags</div>
          ${renderTagPicker(["Fantasia oscura"])}
          <label class="field">
            <span>Descripcion</span>
            <textarea class="textarea" name="description" placeholder="Opcional"></textarea>
          </label>
          <label class="field">
            <span>URL de imagen del tablero</span>
            <input class="input" name="imageUrl" type="url" placeholder="https://..." />
          </label>
          <label class="field">
            <span>Subir imagen del tablero</span>
            <input class="input" name="imageFile" type="file" accept="image/*" />
          </label>
          <button class="button primary" type="submit"><span class="icon">+</span>Crear campana</button>
        </form>
      </section>
    </div>
  `;
}

function renderWikiModal(pageId) {
  const campaign = campaignById(activeCampaignId);
  const page = campaign.wiki.find((item) => item.id === pageId) || {
    title: "",
    category: "Lore",
    content: "",
    isPublic: true,
  };

  return `
    <div class="modal-backdrop">
      <section class="modal-panel">
        <header class="modal-head">
          <div>
            <h2>${pageId ? "Editar pagina" : "Nueva pagina"}</h2>
            <p class="muted small">Marca como publica solo la informacion que puede leer la mesa.</p>
          </div>
          <button class="button ghost" data-action="close-modal"><span class="icon">x</span></button>
        </header>
        <form class="form-grid" data-form="wiki">
          <label class="field">
            <span>Titulo</span>
            <input class="input" name="title" value="${escapeAttr(page.title)}" required />
          </label>
          <label class="field">
            <span>Categoria</span>
            <input class="input" name="category" value="${escapeAttr(page.category)}" required />
          </label>
          <label class="field">
            <span>Contenido</span>
            <textarea class="textarea" name="content" required>${escapeHtml(page.content)}</textarea>
          </label>
          <label class="field">
            <span>Visibilidad</span>
            <select class="select" name="isPublic">
              <option value="true" ${page.isPublic ? "selected" : ""}>Publica en la wiki</option>
              <option value="false" ${!page.isPublic ? "selected" : ""}>Privada de owner/editor</option>
            </select>
          </label>
          <button class="button primary" type="submit"><span class="icon">S</span>Guardar pagina</button>
        </form>
      </section>
    </div>
  `;
}

function renderCharacterModal(characterId) {
  const campaign = campaignById(activeCampaignId);
  const character = campaign.characters.find((item) => item.id === characterId) || {
    name: "",
    ownerId: currentUser().id,
    className: "",
    ancestry: "",
    level: 1,
    status: "Activa",
    notes: "",
  };
  const canManage = canManageCampaign(campaign, currentUser().id);

  return `
    <div class="modal-backdrop">
      <section class="modal-panel">
        <header class="modal-head">
          <div>
            <h2>${characterId ? "Editar personaje" : "Nuevo personaje"}</h2>
            <p class="muted small">Ficha narrativa editable por su jugador o por owner/editor.</p>
          </div>
          <button class="button ghost" data-action="close-modal"><span class="icon">x</span></button>
        </header>
        <form class="form-grid" data-form="character">
          <label class="field">
            <span>Nombre</span>
            <input class="input" name="name" value="${escapeAttr(character.name)}" required />
          </label>
          <label class="field">
            <span>Jugador asignado</span>
            <select class="select" name="ownerId" ${canManage ? "" : "disabled"}>
              ${campaign.members
                .map((member) => {
                  const user = state.users.find((item) => item.id === member.userId);
                  return `<option value="${member.userId}" ${character.ownerId === member.userId ? "selected" : ""}>${escapeHtml(user?.name || "Usuario")}</option>`;
                })
                .join("")}
            </select>
          </label>
          <label class="field">
            <span>Clase o arquetipo</span>
            <input class="input" name="className" value="${escapeAttr(character.className)}" required />
          </label>
          <label class="field">
            <span>Linaje</span>
            <input class="input" name="ancestry" value="${escapeAttr(character.ancestry)}" required />
          </label>
          <label class="field">
            <span>Nivel</span>
            <input class="input" name="level" type="number" min="1" value="${Number(character.level) || 1}" required />
          </label>
          <label class="field">
            <span>Estado</span>
            <select class="select" name="status">
              ${["Activa", "Herida", "Retirada", "Perdida"].map((status) => `<option ${character.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Notas</span>
            <textarea class="textarea" name="notes">${escapeHtml(character.notes)}</textarea>
          </label>
          <button class="button primary" type="submit"><span class="icon">S</span>Guardar personaje</button>
        </form>
      </section>
    </div>
  `;
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form");
  if (!form) return;
  event.preventDefault();

  form.querySelectorAll("[data-tag-input]").forEach(addTagFromPicker);
  const data = Object.fromEntries(new FormData(form).entries());
  const formType = form.dataset.form;

  if (formType === "login") {
    if (await loginUser(data.email, data.password)) {
      render();
      showToast("Sesion iniciada.");
    }
    return;
  }

  if (formType === "register") {
    if (await registerUser(data.name, data.email, data.password, data.confirmPassword)) {
      render();
      showToast("Cuenta creada.");
    }
    return;
  }

  if (formType === "login-invite") {
    if (await loginUser(data.email, data.password)) {
      acceptInvite(form.dataset.token);
    }
    return;
  }

  if (formType === "register-invite") {
    if (await registerUser(data.name, data.email, data.password, data.confirmPassword)) {
      acceptInvite(form.dataset.token);
    }
    return;
  }

  if (formType === "account") {
    if (await saveAccount(data)) {
      editing = null;
      render();
      showToast("Cuenta actualizada.");
    }
    return;
  }

  if (formType === "campaign") {
    const imageUrl = await campaignImageFromData(data);
    if (imageUrl === null) return;
    data.imageUrl = imageUrl;
    createCampaign(data);
    editing = null;
    saveState();
    setHash(`campaign=${activeCampaignId}`);
    render();
    showToast("Campana creada.");
    return;
  }

  if (formType === "wiki") {
    saveWikiPage(data);
    editing = null;
    saveState();
    render();
    showToast("Pagina guardada.");
    return;
  }

  if (formType === "character") {
    saveCharacter(data);
    editing = null;
    saveState();
    render();
    showToast("Personaje guardado.");
    return;
  }

  if (formType === "settings") {
    const imageUrl = await campaignImageFromData(data);
    if (imageUrl === null) return;
    data.imageUrl = imageUrl;
    saveSettings(data);
    saveState();
    render();
    showToast("Ajustes guardados.");
    return;
  }

  if (formType === "invite-email") {
    createInvite(data.email);
    return;
  }
});

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === "go-dashboard") {
    editing = null;
    activeTab = "wiki";
    window.location.hash = "";
    render();
  }

  if (action === "logout") {
    try {
      await db.auth.signOut();
    } catch {
      // The local token is cleared even if the session was already gone.
    }
    state.currentUserId = null;
    window.location.hash = "";
    authMode = "login";
    render();
  }

  if (action === "set-auth-mode") {
    authMode = target.dataset.mode === "register" ? "register" : "login";
    render();
  }

  if (action === "login-google") {
    await loginWithGoogle();
  }

  if (action === "add-tag") {
    const picker = target.closest("[data-tag-picker]");
    const hidden = picker?.querySelector('input[name="tags"]');
    if (picker && hidden) {
      updateTagPicker(picker, [...splitTags(hidden.value), target.dataset.tag]);
    }
  }

  if (action === "remove-tag") {
    const picker = target.closest("[data-tag-picker]");
    const hidden = picker?.querySelector('input[name="tags"]');
    if (picker && hidden) {
      updateTagPicker(
        picker,
        splitTags(hidden.value).filter((tag) => tag.toLowerCase() !== target.dataset.tag.toLowerCase())
      );
    }
  }

  if (action === "add-suggested-tag") {
    const picker = target.closest("[data-tag-picker]");
    const hidden = picker?.querySelector('input[name="tags"]');
    const input = picker?.querySelector("[data-tag-input]");
    if (picker && hidden) {
      updateTagPicker(picker, [...splitTags(hidden.value), target.dataset.tag]);
      if (input) input.value = "";
      hideTagSuggestions(picker);
    }
  }

  if (action === "fill-invite-email") {
    const input = document.querySelector('form[data-form="invite-email"] input[name="email"]');
    if (input) {
      input.value = target.dataset.email;
      input.focus();
    }
  }

  if (action === "open-account") {
    editing = { type: "account" };
    render();
  }

  if (action === "new-campaign") {
    editing = { type: "campaign" };
    render();
  }

  if (action === "open-campaign") {
    activeCampaignId = id;
    activeTab = "wiki";
    setHash(`campaign=${id}`);
  }

  if (action === "set-tab") {
    activeTab = target.dataset.tab;
    render();
  }

  if (action === "close-modal") {
    editing = null;
    render();
  }

  if (action === "new-wiki-page") {
    editing = { type: "wiki", id: null };
    render();
  }

  if (action === "edit-wiki") {
    editing = { type: "wiki", id };
    render();
  }

  if (action === "delete-wiki") {
    deleteWikiPage(id);
  }

  if (action === "new-character") {
    editing = { type: "character", id: null };
    render();
  }

  if (action === "edit-character") {
    editing = { type: "character", id };
    render();
  }

  if (action === "delete-character") {
    deleteCharacter(id);
  }

  if (action === "new-invite") {
    createInvite();
  }

  if (action === "copy-invite") {
    copyText(inviteUrl(target.dataset.token), "Invitacion copiada.");
  }

  if (action === "copy-wiki") {
    copyText(publicWikiUrl(id || activeCampaignId), "Link de wiki copiado.");
  }

  if (action === "open-public-wiki") {
    setHash(`wiki=${id}`);
  }

  if (action === "accept-invite") {
    acceptInvite(target.dataset.token);
  }
});

document.addEventListener("keydown", (event) => {
  const input = event.target.closest("[data-tag-input]");
  if (!input) return;

  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    addTagFromPicker(input);
  }
});

document.addEventListener("input", (event) => {
  const dashboardInput = event.target.closest("[data-dashboard-search]");
  if (dashboardInput) {
    dashboardSearch = dashboardInput.value;
    refreshDashboardResults();
    return;
  }

  const input = event.target.closest("[data-tag-input]");
  if (!input) return;
  refreshTagSuggestions(input);
});

document.addEventListener("focusin", (event) => {
  const input = event.target.closest("[data-tag-input]");
  if (!input) return;
  refreshTagSuggestions(input);
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-tag-picker]")) return;
  document.querySelectorAll("[data-tag-picker]").forEach(hideTagSuggestions);
});

window.addEventListener("hashchange", render);

async function loginUser(email, password) {
  try {
    const { error } = await db.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw error;
    await loadRemoteState();
    activeCampaignId = firstCampaignForCurrentUser()?.id || null;
    activeTab = "wiki";
    return true;
  } catch (error) {
    showToast(error.message);
    return false;
  }
}

async function registerUser(name, email, password, confirmPassword) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) {
    showToast("Escribi un nombre visible.");
    return false;
  }

  if (!cleanEmail) {
    showToast("Escribi un email valido.");
    return false;
  }

  if (state.users.some((user) => user.email === cleanEmail)) {
    showToast("Ya existe una cuenta con ese email.");
    return false;
  }

  if (!isValidPassword(password)) {
    showToast("La contrasena debe tener al menos 6 caracteres.");
    return false;
  }

  if (password !== confirmPassword) {
    showToast("Las contrasenas no coinciden.");
    return false;
  }

  try {
    const { data, error } = await db.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { name: cleanName },
      },
    });

    if (error) throw error;
    if (!data.session) {
      showToast("Cuenta creada. Revisa tu email para confirmarla antes de entrar.");
      return false;
    }

    await upsertProfile(data.user.id, cleanName, cleanEmail);
    await loadRemoteState();
    activeCampaignId = firstCampaignForCurrentUser()?.id || null;
    activeTab = "wiki";
    return true;
  } catch (error) {
    showToast(error.message);
    return false;
  }
}

async function loginWithGoogle() {
  try {
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });

    if (error) throw error;
  } catch (error) {
    showToast(error.message);
  }
}

async function saveAccount(data) {
  const cleanName = String(data.name || "").trim();
  const cleanEmail = normalizeEmail(data.email);
  const newPassword = String(data.newPassword || "");

  if (!cleanName || !cleanEmail) {
    showToast("Nombre y email son obligatorios.");
    return false;
  }

  if (newPassword && !isValidPassword(newPassword)) {
    showToast("La nueva contrasena debe tener al menos 6 caracteres.");
    return false;
  }

  if (newPassword && newPassword !== data.confirmPassword) {
    showToast("La nueva contrasena no coincide.");
    return false;
  }

  try {
    const user = currentUser();
    const isChangingAuth = cleanEmail !== user.email || Boolean(newPassword);

    if (isChangingAuth) {
      if (!data.currentPassword) {
        throw new Error("Escribi tu contrasena actual para cambiar email o contrasena.");
      }

      const { error: passwordError } = await db.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (passwordError) {
        throw new Error("La contrasena actual no coincide.");
      }

      const updates = {};
      if (cleanEmail !== user.email) updates.email = cleanEmail;
      if (newPassword) updates.password = newPassword;
      const { error: authError } = await db.auth.updateUser(updates);
      if (authError) throw authError;
    }

    await upsertProfile(user.id, cleanName, cleanEmail);
    updateLocalCharacterNames(user.id, cleanName);
    await persistState();
    await loadRemoteState();
    return true;
  } catch (error) {
    showToast(error.message);
    return false;
  }
}

function isValidPassword(password) {
  return String(password || "").length >= 6;
}

async function upsertProfile(userId, name, email) {
  const { error } = await db.from("profiles").upsert({
    id: userId,
    name,
    email,
  });
  if (error) throw error;
}

function updateLocalCharacterNames(userId, name) {
  for (const campaign of state.campaigns) {
    for (const character of campaign.characters) {
      if (character.ownerId === userId) {
        character.playerName = name;
      }
    }
  }
}

async function campaignImageFromData(data) {
  if (data.removeImage) return "";

  const file = data.imageFile;
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      showToast("Elegi un archivo de imagen.");
      return null;
    }
    try {
      return await readFileAsDataUrl(file);
    } catch {
      showToast("No se pudo leer la imagen.");
      return null;
    }
  }

  return String(data.imageUrl || data.existingImageUrl || "").trim();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function createCampaign(data) {
  const campaign = {
    id: uid("camp"),
    ownerId: currentUser().id,
    title: data.title.trim(),
    system: data.system.trim(),
    tags: splitTags(data.tags),
    tone: formatTags(splitTags(data.tags)),
    description: data.description.trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    visibility: "private",
    createdAt: Date.now(),
    members: [{ userId: currentUser().id, role: "master" }],
    invites: [],
    wiki: [
      {
        id: uid("wiki"),
        title: "Resumen de la campana",
        category: "Inicio",
        isPublic: true,
        content: data.description.trim(),
      },
    ],
    characters: [],
  };

  state.campaigns.unshift(campaign);
  activeCampaignId = campaign.id;
  activeTab = "wiki";
}

function saveWikiPage(data) {
  const campaign = campaignById(activeCampaignId);
  const existing = editing.id ? campaign.wiki.find((page) => page.id === editing.id) : null;
  const payload = {
    title: data.title.trim(),
    category: data.category.trim(),
    content: data.content.trim(),
    isPublic: data.isPublic === "true",
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    campaign.wiki.unshift({ id: uid("wiki"), ...payload });
  }
}

function saveCharacter(data) {
  const campaign = campaignById(activeCampaignId);
  const existing = editing.id ? campaign.characters.find((character) => character.id === editing.id) : null;
  const canManage = canManageCampaign(campaign, currentUser().id);
  const ownerId = canManage ? data.ownerId : existing?.ownerId || currentUser().id;
  const owner = state.users.find((user) => user.id === ownerId);
  const payload = {
    ownerId,
    playerName: owner?.name || currentUser().name,
    name: data.name.trim(),
    className: data.className.trim(),
    ancestry: data.ancestry.trim(),
    level: Number(data.level) || 1,
    status: data.status,
    notes: data.notes.trim(),
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    campaign.characters.unshift({ id: uid("char"), ...payload });
  }
}

function saveSettings(data) {
  const campaign = campaignById(activeCampaignId);
  Object.assign(campaign, {
    title: data.title.trim(),
    system: data.system.trim(),
    tags: splitTags(data.tags),
    tone: formatTags(splitTags(data.tags)),
    description: data.description.trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    visibility: data.visibility,
  });
}

function deleteWikiPage(id) {
  const campaign = campaignById(activeCampaignId);
  campaign.wiki = campaign.wiki.filter((page) => page.id !== id);
  saveState();
  render();
  showToast("Pagina borrada.");
}

function deleteCharacter(id) {
  const campaign = campaignById(activeCampaignId);
  campaign.characters = campaign.characters.filter((character) => character.id !== id);
  saveState();
  render();
  showToast("Personaje borrado.");
}

function createInvite(email = "") {
  const campaign = campaignById(activeCampaignId);
  const cleanEmail = normalizeEmail(email);
  const invitedUser = cleanEmail ? state.users.find((user) => user.email === cleanEmail) : null;

  campaign.invites.unshift({
    token: uid("invite"),
    role: "player",
    email: cleanEmail || null,
    invitedUserId: invitedUser?.id || null,
    createdAt: Date.now(),
    usedBy: null,
  });
  saveState();
  render();
  showToast(cleanEmail ? `Invitacion creada para ${cleanEmail}. Copia el link para enviarselo.` : "Invitacion generada.");
}

function acceptInvite(token) {
  const found = findInvite(token);
  const user = currentUser();
  if (!found || !user) {
    render();
    return;
  }

  if (found.invite.email && normalizeEmail(user.email) !== normalizeEmail(found.invite.email)) {
    showToast(`Esta invitacion es para ${found.invite.email}.`);
    return;
  }

  const alreadyMember = found.campaign.members.some((member) => member.userId === user.id);
  if (!alreadyMember) {
    found.campaign.members.push({ userId: user.id, role: found.invite.role });
  }

  found.invite.usedBy = user.id;
  saveState();
  activeCampaignId = found.campaign.id;
  activeTab = "characters";
  setHash(`campaign=${found.campaign.id}`);
  render();
  showToast("Ya sos parte de la campana.");
}

function findInvite(token) {
  for (const campaign of state.campaigns) {
    const invite = campaign.invites.find((item) => item.token === token && !item.usedBy);
    if (invite) return { campaign, invite };
  }
  return null;
}

function roleFor(campaign, userId) {
  return campaign.members.find((member) => member.userId === userId)?.role || "viewer";
}

function displayRoleFor(campaign, userId) {
  if (campaign?.ownerId === userId) return "owner";
  const role = roleFor(campaign, userId);
  if (role === "master" || role === "editor") return "editor";
  if (role === "player") return "player";
  return "viewer";
}

function canManageCampaign(campaign, userId) {
  const displayRole = displayRoleFor(campaign, userId);
  return displayRole === "owner" || displayRole === "editor";
}

function isCampaignMember(campaign, userId) {
  return Boolean(campaign?.members.some((member) => member.userId === userId));
}

function roleLabel(role) {
  return {
    owner: "Owner",
    master: "Owner",
    editor: "Editor",
    player: "Player",
    viewer: "Viewer",
  }[role] || role;
}

function publicWikiUrl(campaignId) {
  return `${window.location.origin}${window.location.pathname}#wiki=${campaignId}`;
}

function inviteUrl(token) {
  return `${window.location.origin}${window.location.pathname}#invite=${token}`;
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    showToast(text);
  }
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.add("hidden"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

boot();
