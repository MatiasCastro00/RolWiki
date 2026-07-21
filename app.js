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

const WIKI_CARD_TYPES = {
  personaje: {
    label: "Personaje",
    icon: "♙",
    description: "Habitantes, protagonistas, aliados y antagonistas.",
    fields: [
      ["Rol u oficio", "role", "Ej: Monarca de Luminar"],
      ["Afiliación", "affiliation", "Ej: Corona de Nédrakar"],
      ["Estado", "status", "Ej: Activo, desaparecido"],
    ],
  },
  ecologia: {
    label: "Ecología",
    icon: "♧",
    description: "Ecosistemas, biomas y equilibrios naturales.",
    fields: [
      ["Bioma", "biome", "Ej: Bosque templado"],
      ["Clima", "climate", "Ej: Húmedo y frío"],
      ["Equilibrio", "balance", "Ej: Frágil"],
    ],
  },
  reino: {
    label: "Reino",
    icon: "♜",
    description: "Naciones, culturas, gobiernos y territorios.",
    fields: [
      ["Capital", "capital", "Ej: Luminar"],
      ["Gobernante", "ruler", "Ej: Aureon el Radiante"],
      ["Población", "population", "Ej: 280.000 habitantes"],
    ],
  },
  mapa: {
    label: "Mapa",
    icon: "⌁",
    description: "Mapas regionales, urbanos y de exploración.",
    fields: [
      ["Región", "region", "Ej: Costa occidental"],
      ["Escala", "scale", "Ej: 1 hex = 10 km"],
      ["Puntos de interés", "landmarks", "Separados por comas"],
    ],
  },
  fauna: {
    label: "Fauna",
    icon: "♞",
    description: "Criaturas, bestias y especies del mundo.",
    fields: [
      ["Hábitat", "habitat", "Ej: Pantanos de Sendaria"],
      ["Temperamento", "temperament", "Ej: Territorial"],
      ["Rareza", "rarity", "Ej: Inusual"],
    ],
  },
  flora: {
    label: "Flora",
    icon: "⚘",
    description: "Plantas, hongos y recursos botánicos.",
    fields: [
      ["Hábitat", "habitat", "Ej: Bosque profundo"],
      ["Usos", "uses", "Ej: Medicina, alquimia"],
      ["Rareza", "rarity", "Ej: Rara"],
    ],
  },
  objeto: {
    label: "Objeto",
    icon: "⚔",
    description: "Artefactos, armas, reliquias y recursos.",
    fields: [
      ["Portador", "owner", "Ej: Aureon el Radiante"],
      ["Origen", "origin", "Ej: Forjas de Luminar"],
      ["Poderes", "powers", "Ej: Borra recuerdos"],
    ],
  },
  ubicacion: {
    label: "Ubicación",
    icon: "⌖",
    description: "Ciudades, regiones, edificios y lugares.",
    fields: [
      ["Región", "region", "Ej: Reino de Luminar"],
      ["Clase de lugar", "placeKind", "Ej: Ciudad fortificada"],
      ["Población", "population", "Ej: 24.000 habitantes"],
    ],
  },
  trasfondo: {
    label: "Trasfondo",
    icon: "⌛",
    description: "Historia, acontecimientos, eras y leyendas.",
    fields: [
      ["Era", "era", "Ej: Tercera Edad"],
      ["Evento", "event", "Ej: La Guerra del Olvido"],
      ["Consecuencias", "impact", "Ej: Caída de la corona"],
    ],
  },
  mundo: {
    label: "Mundo",
    icon: "◎",
    description: "Cosmología, reglas del mundo e ideas centrales.",
    fields: [
      ["Cosmología", "cosmology", "Ej: Nueve planos conectados"],
      ["Lenguas", "languages", "Ej: Común, luminar"],
      ["Tono", "tone", "Ej: Fantasía melancólica"],
    ],
  },
  nota: {
    label: "Nota libre",
    icon: "✎",
    description: "Ideas, apuntes y contenido sin una estructura fija.",
    fields: [
      ["Tema", "topic", "Ej: Misterio pendiente"],
      ["Fuente", "source", "Ej: Sesión 12"],
    ],
  },
};

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
let wikiView = "home";
let selectedWikiCardId = null;
let wikiSearch = "";
let wikiFolder = "all";

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
      <div>
        <div class="campaign-title-row">
          <h3>${escapeHtml(campaign.title)}</h3>
          <span class="campaign-system">${escapeHtml(campaign.system)}</span>
        </div>
        <div class="campaign-hover-info">
          <span>${escapeHtml(roleLabel(role))} / ${campaign.visibility === "public" ? "Publica" : "Privada"}</span>
          ${tags.length ? `<div class="campaign-tag-row">${tags.slice(0, 4).map((tag) => `<span class="tag violet">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        </div>
        <p>${escapeHtml(campaign.description)}</p>
      </div>
      <div class="campaign-card-footer">
        <div class="campaign-stats">
          <span>${campaign.members.length} miembros</span>
          <span>${campaign.characters.length} personajes</span>
          <span>${campaign.wiki.length} paginas</span>
        </div>
      </div>
    </button>
  `;
}

function renderCampaign() {
  const campaign = campaignById(activeCampaignId);
  const role = displayRoleFor(campaign, currentUser().id);
  const canManage = canManageCampaign(campaign, currentUser().id);
  const tags = campaignTags(campaign);

  if (activeTab === "wiki") {
    return renderWikiWorkspace(campaign, canManage);
  }

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

function renderWikiWorkspace(campaign, canManage) {
  const cards = wikiCardsFor(campaign);
  return `
    <main class="wiki-app-shell">
      <header class="wiki-commandbar">
        <button class="wiki-world-switch" data-action="go-dashboard" title="Volver al tablero">
          <span class="wiki-world-mark">${escapeHtml(campaign.title.slice(0, 1).toUpperCase())}</span>
          <span><strong>${escapeHtml(campaign.title)}</strong><small>${cards.length} fichas conectadas</small></span>
        </button>
        <nav class="wiki-primary-nav" aria-label="Navegación de la campaña">
          <button class="${wikiView === "home" ? "active" : ""}" data-action="set-wiki-view" data-view="home">⌂ Inicio</button>
          <button class="${wikiView === "cards" ? "active" : ""}" data-action="set-wiki-view" data-view="cards">◈ Tarjetas</button>
          <button data-action="set-tab" data-tab="characters">♙ Personajes</button>
          <button data-action="set-tab" data-tab="members">♧ Jugadores</button>
          <button data-action="set-tab" data-tab="settings">⚙ Ajustes</button>
        </nav>
        <div class="wiki-command-actions">
          <button class="wiki-icon-button" data-action="open-public-wiki" data-id="${campaign.id}" title="Vista pública">↗</button>
          ${canManage ? `<button class="button wiki-create-button" data-action="new-wiki-page"><span>＋</span>Nueva ficha</button>` : ""}
        </div>
      </header>
      ${wikiView === "cards" ? renderWikiLibrary(campaign, canManage) : renderWikiHome(campaign, canManage)}
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

function wikiCardsFor(campaign) {
  return (campaign?.wiki || []).map((page) => ({
    ...page,
    title: page.title || "Sin título",
    type: page.type || wikiTypeFromLegacyCategory(page.category),
    description: page.description ?? page.content ?? "",
    aliases: Array.isArray(page.aliases) ? page.aliases : [],
    folder: page.folder || WIKI_CARD_TYPES[page.type]?.label || page.category || "Notas",
    properties: page.properties && typeof page.properties === "object" ? page.properties : {},
    relations: Array.isArray(page.relations) ? page.relations : [],
    modifiedAt: page.modifiedAt || page.createdAt || Date.now(),
    createdAt: page.createdAt || page.modifiedAt || Date.now(),
  }));
}

function wikiTypeFromLegacyCategory(category) {
  const normalized = normalizeSearchText(category || "");
  const match = Object.entries(WIKI_CARD_TYPES).find(([key, value]) =>
    normalized.includes(normalizeSearchText(value.label)) || normalized.includes(key)
  );
  return match?.[0] || "nota";
}

function wikiType(card) {
  return WIKI_CARD_TYPES[card?.type] || WIKI_CARD_TYPES.nota;
}

function cardAllText(card) {
  return [card.title, ...(card.aliases || []), card.description, ...Object.values(card.properties || {})]
    .join(" ")
    .toLowerCase();
}

function wikiRelations(cards) {
  const edges = new Map();
  const addEdge = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const key = [sourceId, targetId].sort().join("::");
    if (!edges.has(key)) edges.set(key, { sourceId, targetId });
  };

  for (const card of cards) {
    const haystack = normalizeSearchText(cardAllText(card));
    for (const other of cards) {
      if (card.id === other.id) continue;
      const names = [other.title, ...(other.aliases || [])].map(normalizeSearchText).filter((name) => name.length > 2);
      if (names.some((name) => haystack.includes(name))) addEdge(card.id, other.id);
    }
    for (const targetId of card.relations || []) addEdge(card.id, targetId);
  }
  return [...edges.values()];
}

function wikiGraphPositions(cards) {
  const centerX = 50;
  const centerY = 50;
  return cards.map((card, index) => {
    if (index === 0) return { id: card.id, x: centerX, y: centerY };
    const ring = Math.floor((index - 1) / 8) + 1;
    const ringIndex = (index - 1) % 8;
    const count = Math.min(8, cards.length - 1 - (ring - 1) * 8);
    const angle = -Math.PI / 2 + (ringIndex / Math.max(count, 1)) * Math.PI * 2 + ring * 0.28;
    const radiusX = Math.min(15 + ring * 18, 43);
    const radiusY = Math.min(12 + ring * 16, 39);
    return { id: card.id, x: centerX + Math.cos(angle) * radiusX, y: centerY + Math.sin(angle) * radiusY };
  });
}

function renderWikiGraph(cards, compact = false) {
  if (!cards.length) {
    return `<div class="wiki-graph-empty"><span>◇</span><strong>El mapa está vacío</strong><small>Las conexiones aparecerán cuando una ficha mencione a otra.</small></div>`;
  }
  const sorted = [...cards].sort((a, b) => (b.modifiedAt || 0) - (a.modifiedAt || 0)).slice(0, compact ? 18 : 36);
  const positions = wikiGraphPositions(sorted);
  const positionById = new Map(positions.map((position) => [position.id, position]));
  const edges = wikiRelations(sorted).filter((edge) => positionById.has(edge.sourceId) && positionById.has(edge.targetId));
  return `
    <div class="wiki-graph ${compact ? "compact" : ""}" aria-label="Mapa de relaciones de la wiki">
      <svg class="wiki-graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${edges.map((edge) => {
          const from = positionById.get(edge.sourceId);
          const to = positionById.get(edge.targetId);
          return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
        }).join("")}
      </svg>
      ${sorted.map((card, index) => {
        const position = positionById.get(card.id);
        const type = wikiType(card);
        return `<button class="wiki-node ${index < 3 ? "featured" : ""}" style="left:${position.x}%;top:${position.y}%" data-action="select-wiki-card" data-id="${card.id}" title="Abrir ${escapeAttr(card.title)}">
          <span class="wiki-node-icon">${type.icon}</span><span>${escapeHtml(card.title)}</span>
        </button>`;
      }).join("")}
      <div class="wiki-graph-legend"><span>${sorted.length} nodos</span><span>${edges.length} conexiones</span></div>
    </div>
  `;
}

function renderWikiHome(campaign, canManage) {
  const cards = wikiCardsFor(campaign);
  const recent = [...cards].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 5);
  return `
    <section class="wiki-home">
      <div class="wiki-home-copy">
        <span class="wiki-kicker">ARCHIVO VIVO · ${escapeHtml(campaign.system)}</span>
        <h1>De nuevo en acción.</h1>
        <p>¿Adónde te llevará tu imaginación hoy?</p>
        <div class="wiki-quick-actions">
          ${canManage ? `<button data-action="new-wiki-page">＋ Crear una ficha</button>` : ""}
          <button data-action="set-wiki-view" data-view="cards">▦ Explorar tarjetas</button>
          <button data-action="open-public-wiki" data-id="${campaign.id}">↗ Vista compartida</button>
        </div>
        <div class="wiki-recent-head"><span>RECIENTES</span><button data-action="set-wiki-view" data-view="cards">Ver todas</button></div>
        <div class="wiki-recent-list">
          ${recent.length ? recent.map((card) => renderWikiRecent(card)).join("") : canManage ? `
            <button class="wiki-empty-card" data-action="new-wiki-page"><span>＋</span><strong>Crear la primera ficha</strong><small>Personajes, lugares, reinos y todo tu mundo.</small></button>` : `
            <div class="wiki-empty-card"><span>◇</span><strong>La wiki está vacía</strong><small>Un editor puede crear la primera ficha.</small></div>`}
        </div>
      </div>
      <div class="wiki-map-panel">
        <div class="wiki-map-head"><span>MAPA DE RELACIONES</span><small>Conexiones detectadas por menciones</small></div>
        ${renderWikiGraph(cards, true)}
      </div>
    </section>
  `;
}

function renderWikiRecent(card) {
  const type = wikiType(card);
  return `<button class="wiki-recent-card" data-action="select-wiki-card" data-id="${card.id}">
    ${renderWikiThumb(card)}
    <span class="wiki-recent-copy"><strong>${escapeHtml(card.title)}</strong><small>${type.label} · ${escapeHtml(card.folder)}</small></span>
    <span class="wiki-time">${relativeWikiTime(card.modifiedAt)}</span>
    <span class="wiki-row-arrow">›</span>
  </button>`;
}

function relativeWikiTime(timestamp) {
  const difference = Math.max(0, Date.now() - Number(timestamp || 0));
  const minutes = Math.floor(difference / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function renderWikiThumb(card, className = "") {
  const type = wikiType(card);
  return card.imageUrl
    ? `<img class="wiki-thumb ${className}" src="${escapeAttr(card.imageUrl)}" alt="" loading="lazy" />`
    : `<span class="wiki-thumb wiki-thumb-fallback ${className}" data-wiki-type="${card.type}">${type.icon}</span>`;
}

function filteredWikiCards(campaign) {
  const query = normalizeSearchText(wikiSearch).trim();
  return wikiCardsFor(campaign).filter((card) => {
    const matchesFolder = wikiFolder === "all" || card.folder === wikiFolder || card.type === wikiFolder;
    const matchesQuery = !query || normalizeSearchText(cardAllText(card)).includes(query);
    return matchesFolder && matchesQuery;
  });
}

function renderWikiLibrary(campaign, canManage) {
  const allCards = wikiCardsFor(campaign);
  const cards = filteredWikiCards(campaign);
  const folders = [...new Set(allCards.map((card) => card.folder).filter(Boolean))].sort();
  const selected = allCards.find((card) => card.id === selectedWikiCardId) || cards[0] || null;
  if (selected && selectedWikiCardId !== selected.id) selectedWikiCardId = selected.id;

  return `
    <section class="wiki-library">
      <aside class="wiki-folder-sidebar">
        <label class="wiki-search"><span>⌕</span><input data-wiki-search type="search" value="${escapeAttr(wikiSearch)}" placeholder="Buscar en la wiki" aria-label="Buscar en la wiki" /></label>
        <div class="wiki-tree-title"><span>BIBLIOTECA</span><small>${allCards.length}</small></div>
        <button class="wiki-folder ${wikiFolder === "all" ? "active" : ""}" data-action="filter-wiki-folder" data-folder="all"><span>▤</span>Todas las fichas<small>${allCards.length}</small></button>
        ${folders.map((folder) => {
          const count = allCards.filter((card) => card.folder === folder).length;
          return `<button class="wiki-folder ${wikiFolder === folder ? "active" : ""}" data-action="filter-wiki-folder" data-folder="${escapeAttr(folder)}"><span>▱</span>${escapeHtml(folder)}<small>${count}</small></button>`;
        }).join("")}
        <div class="wiki-tree-divider"></div>
        <button class="wiki-folder" data-action="set-wiki-view" data-view="home"><span>⌂</span>Inicio</button>
        <button class="wiki-folder" data-action="open-public-wiki" data-id="${campaign.id}"><span>↗</span>Wiki pública</button>
      </aside>
      <section class="wiki-card-column">
        <div class="wiki-list-head">
          <div><span>${wikiFolder === "all" ? "TODAS LAS FICHAS" : escapeHtml(wikiFolder).toUpperCase()}</span><small>${cards.length} resultados</small></div>
          ${canManage ? `<button class="wiki-round-add" data-action="new-wiki-page" aria-label="Nueva ficha">＋</button>` : ""}
        </div>
        <div class="wiki-card-list">
          ${cards.length ? cards.map((card) => renderWikiLibraryRow(card, card.id === selected?.id)).join("") : `<div class="wiki-no-results"><span>⌕</span><strong>Sin resultados</strong><small>Probá con otro término o carpeta.</small></div>`}
        </div>
      </section>
      <section class="wiki-inspector">
        ${selected ? renderWikiInspector(selected, allCards, canManage) : `<div class="wiki-inspector-empty"><span>◇</span><h2>Seleccioná una ficha</h2><p>Sus propiedades y relaciones aparecerán acá.</p></div>`}
      </section>
    </section>
  `;
}

function renderWikiLibraryRow(card, isSelected) {
  const type = wikiType(card);
  const relations = wikiRelations(wikiCardsFor(campaignById(activeCampaignId))).filter((edge) => edge.sourceId === card.id || edge.targetId === card.id).length;
  return `<button class="wiki-library-row ${isSelected ? "active" : ""}" data-action="select-wiki-card" data-id="${card.id}">
    ${renderWikiThumb(card)}
    <span><strong>${escapeHtml(card.title)}</strong><small>${type.icon} ${type.label} · ${relations} relaciones</small></span>
    <span>›</span>
  </button>`;
}

function renderWikiInspector(card, allCards, canManage) {
  const type = wikiType(card);
  const edges = wikiRelations(allCards).filter((edge) => edge.sourceId === card.id || edge.targetId === card.id);
  const related = edges.map((edge) => allCards.find((item) => item.id === (edge.sourceId === card.id ? edge.targetId : edge.sourceId))).filter(Boolean);
  const properties = Object.entries(card.properties || {}).filter(([, value]) => String(value || "").trim());
  return `
    <article class="wiki-card-detail">
      <header class="wiki-detail-head">
        <div><span class="wiki-detail-type">${type.icon} ${type.label}</span><h1>${escapeHtml(card.title)}</h1></div>
        ${canManage ? `<div class="wiki-detail-actions"><button data-action="edit-wiki" data-id="${card.id}" title="Editar">✎</button><button class="danger" data-action="delete-wiki" data-id="${card.id}" title="Eliminar">×</button></div>` : ""}
      </header>
      <div class="wiki-detail-grid">
        <div class="wiki-detail-main">
          ${card.aliases.length ? `<div class="wiki-property-row"><span>ALIASES</span><div>${card.aliases.map((alias) => `<em>${escapeHtml(alias)}</em>`).join("")}</div></div>` : ""}
          <div class="wiki-property-row"><span>CARPETA</span><div><em>▱ ${escapeHtml(card.folder)}</em></div></div>
          ${properties.map(([key, value]) => `<div class="wiki-property-row"><span>${escapeHtml(propertyLabel(type, key).toUpperCase())}</span><div><strong>${linkMentions(value, allCards, card.id)}</strong></div></div>`).join("")}
          <section class="wiki-description"><span>DESCRIPCIÓN</span><p>${linkMentions(card.description || "Sin descripción todavía.", allCards, card.id)}</p></section>
        </div>
        <div class="wiki-detail-media">${card.imageUrl ? `<img src="${escapeAttr(card.imageUrl)}" alt="Imagen de ${escapeAttr(card.title)}" />` : `<div class="wiki-portrait-placeholder" data-wiki-type="${card.type}"><span>${type.icon}</span><small>Sin imagen</small></div>`}</div>
      </div>
      <section class="wiki-relations-section">
        <div class="wiki-relations-head"><span>RELACIONES</span><small>${related.length} conexiones</small></div>
        <div class="wiki-relation-chips">${related.length ? related.map((item) => `<button data-action="select-wiki-card" data-id="${item.id}">${wikiType(item).icon} ${escapeHtml(item.title)}</button>`).join("") : `<small>Las relaciones se crean automáticamente cuando esta ficha menciona el nombre o alias de otra.</small>`}</div>
      </section>
      <footer class="wiki-detail-footer"><span>${card.isPublic ? "◉ Visible en la wiki pública" : "◌ Solo equipo de campaña"}</span><span>Actualizada ${relativeWikiTime(card.modifiedAt)}</span></footer>
    </article>
  `;
}

function propertyLabel(type, key) {
  return type.fields.find(([, fieldKey]) => fieldKey === key)?.[0] || key;
}

function linkMentions(value, cards, currentId) {
  const matches = cards
    .filter((card) => card.id !== currentId)
    .flatMap((card) => [card.title, ...(card.aliases || [])].map((name) => ({ card, name })))
    .filter(({ name }) => name && name.length > 2)
    .sort((a, b) => b.name.length - a.name.length);
  if (!matches.length) return escapeHtml(value).replaceAll("\n", "<br />");
  const uniqueMatches = matches.filter(({ name }, index) =>
    matches.findIndex((candidate) => normalizeSearchText(candidate.name) === normalizeSearchText(name)) === index
  );
  const pattern = new RegExp(`(${uniqueMatches.map(({ name }) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return String(value)
    .split(pattern)
    .map((part) => {
      const match = uniqueMatches.find(({ name }) => normalizeSearchText(name) === normalizeSearchText(part));
      return match
        ? `<button class="wiki-inline-link" data-action="select-wiki-card" data-id="${escapeAttr(match.card.id)}">${escapeHtml(part)}</button>`
        : escapeHtml(part);
    })
    .join("")
    .replaceAll("\n", "<br />");
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
  const pages = campaign ? wikiCardsFor(campaign).filter((page) => page.isPublic) : [];
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
                    ? pages.map((page) => renderPublicPage(page, pages)).join("")
                    : `<article class="public-page"><h2>Wiki sin fichas públicas</h2><div>Todavía no se publicó contenido.</div></article>`
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

function renderPublicPage(page, cards = []) {
  const type = wikiType(page);
  return `
    <article class="public-page">
      ${page.imageUrl ? `<img class="public-page-image" src="${escapeAttr(page.imageUrl)}" alt="" loading="lazy" />` : ""}
      <div class="public-page-body">
        <span class="tag gold">${type.icon} ${escapeHtml(type.label)}</span>
        <h2>${escapeHtml(page.title)}</h2>
        ${page.aliases.length ? `<p class="public-aliases">También conocido como ${page.aliases.map(escapeHtml).join(", ")}</p>` : ""}
        <div>${escapeHtml(page.description)}</div>
      </div>
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
  if (editing.type === "wiki-type") return renderWikiTypeModal();
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

function renderWikiTypeModal() {
  return `
    <div class="modal-backdrop wiki-modal-backdrop">
      <section class="modal-panel wiki-type-modal">
        <header class="modal-head">
          <div>
            <span class="wiki-modal-kicker">NUEVA FICHA</span>
            <h2>Elegí un tipo</h2>
            <p class="muted small">Cada tipo incluye propiedades propias. Podés cambiarlo más adelante.</p>
          </div>
          <button class="button ghost" data-action="close-modal" aria-label="Cerrar">×</button>
        </header>
        <label class="wiki-type-search"><span>⌕</span><input data-wiki-type-search type="search" placeholder="Buscar tipos..." aria-label="Buscar tipos" /></label>
        <div class="wiki-type-grid">
          ${Object.entries(WIKI_CARD_TYPES).map(([key, type]) => `<button class="wiki-type-card" data-action="choose-wiki-type" data-wiki-type="${key}" data-type-label="${escapeAttr(type.label)}">
            <span>${type.icon}</span><strong>${type.label}</strong><small>${type.description}</small>
          </button>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderWikiModal(pageId) {
  const campaign = campaignById(activeCampaignId);
  const existingPage = campaign.wiki.find((item) => item.id === pageId);
  const page = existingPage ? wikiCardsFor({ wiki: [existingPage] })[0] : {
    title: "",
    type: editing.wikiType || "nota",
    description: "",
    aliases: [],
    folder: WIKI_CARD_TYPES[editing.wikiType || "nota"].label,
    properties: {},
    relations: [],
    imageUrl: "",
    isPublic: true,
  };
  const type = wikiType(page);
  const folders = [...new Set(wikiCardsFor(campaign).map((card) => card.folder).filter(Boolean))];
  const relatedNames = wikiCardsFor(campaign)
    .filter((card) => page.relations.includes(card.id))
    .map((card) => card.title)
    .join(", ");

  return `
    <div class="modal-backdrop wiki-modal-backdrop">
      <section class="modal-panel wiki-editor-modal">
        <header class="modal-head">
          <div>
            <span class="wiki-modal-kicker">${type.icon} ${type.label.toUpperCase()}</span>
            <h2>${pageId ? "Editar ficha" : `Nueva ficha de ${type.label.toLowerCase()}`}</h2>
            <p class="muted small">Los nombres y alias mencionados generarán conexiones en el mapa.</p>
          </div>
          <button class="button ghost" data-action="close-modal" aria-label="Cerrar">×</button>
        </header>
        <form class="form-grid wiki-card-form" data-form="wiki">
          <input type="hidden" name="type" value="${page.type}" />
          <div class="wiki-form-columns">
            <div class="wiki-form-main">
              <label class="field">
                <span>Nombre de la ficha</span>
                <input class="input wiki-title-input" name="title" value="${escapeAttr(page.title)}" placeholder="Ej: Aureon el Radiante" required />
              </label>
              <label class="field">
                <span>Aliases <small>separados por comas</small></span>
                <input class="input" name="aliases" value="${escapeAttr(page.aliases.join(", "))}" placeholder="Ej: El Monarca Luminar, Aureon" />
              </label>
              <div class="wiki-form-pair">
                <label class="field">
                  <span>Carpeta</span>
                  <input class="input" name="folder" list="wiki-folder-options" value="${escapeAttr(page.folder)}" placeholder="Ej: Personajes/Realeza" />
                  <datalist id="wiki-folder-options">${folders.map((folder) => `<option value="${escapeAttr(folder)}"></option>`).join("")}</datalist>
                </label>
                <label class="field">
                  <span>Visibilidad</span>
                  <select class="select" name="isPublic">
                    <option value="true" ${page.isPublic ? "selected" : ""}>Pública</option>
                    <option value="false" ${!page.isPublic ? "selected" : ""}>Privada</option>
                  </select>
                </label>
              </div>
              <div class="wiki-dynamic-fields">
                ${type.fields.map(([label, key, placeholder]) => `<label class="field"><span>${label}</span><input class="input" name="property_${key}" value="${escapeAttr(page.properties[key] || "")}" placeholder="${escapeAttr(placeholder)}" /></label>`).join("")}
              </div>
              <label class="field">
                <span>Descripción</span>
                <textarea class="textarea wiki-description-input" name="description" placeholder="Contá qué lugar ocupa esta ficha en el mundo..." required>${escapeHtml(page.description)}</textarea>
              </label>
              <label class="field">
                <span>Relaciones manuales <small>opcional, por nombre y separadas por comas</small></span>
                <input class="input" name="relationNames" value="${escapeAttr(relatedNames)}" placeholder="Ej: Luminar, Daga del olvido" />
              </label>
            </div>
            <aside class="wiki-image-fields">
              <div class="wiki-image-preview">
                ${page.imageUrl ? `<img src="${escapeAttr(page.imageUrl)}" alt="Vista previa" />` : `<span>${type.icon}</span><small>Imagen de la ficha</small>`}
              </div>
              <label class="field"><span>Subir imagen</span><input class="input" name="imageFile" type="file" accept="image/*" /></label>
              <label class="field"><span>o usar una URL</span><input class="input" name="imageUrl" type="url" value="${escapeAttr(page.imageUrl)}" placeholder="https://..." /></label>
              <input type="hidden" name="existingImageUrl" value="${escapeAttr(page.imageUrl)}" />
              ${page.imageUrl ? `<label class="check-field"><input type="checkbox" name="removeImage" />Quitar imagen</label>` : ""}
            </aside>
          </div>
          <div class="wiki-form-footer">
            <button class="button" type="button" data-action="${pageId ? "close-modal" : "back-to-wiki-types"}">${pageId ? "Cancelar" : "← Cambiar tipo"}</button>
            <button class="button primary" type="submit"><span class="icon">✓</span>Guardar ficha</button>
          </div>
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
    const imageUrl = await wikiImageFromData(data);
    if (imageUrl === null) return;
    data.imageUrl = imageUrl;
    saveWikiPage(data);
    editing = null;
    wikiView = "cards";
    saveState();
    render();
    showToast("Ficha guardada.");
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
    wikiView = "home";
    selectedWikiCardId = null;
    wikiSearch = "";
    wikiFolder = "all";
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
    editing = { type: "wiki-type" };
    render();
  }

  if (action === "choose-wiki-type") {
    editing = { type: "wiki", id: null, wikiType: target.dataset.wikiType };
    render();
  }

  if (action === "back-to-wiki-types") {
    editing = { type: "wiki-type" };
    render();
  }

  if (action === "set-wiki-view") {
    wikiView = target.dataset.view === "cards" ? "cards" : "home";
    render();
  }

  if (action === "select-wiki-card") {
    selectedWikiCardId = id;
    wikiView = "cards";
    render();
  }

  if (action === "filter-wiki-folder") {
    wikiFolder = target.dataset.folder || "all";
    selectedWikiCardId = null;
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
  if (event.key === "Escape" && editing) {
    editing = null;
    render();
    return;
  }
  const input = event.target.closest("[data-tag-input]");
  if (!input) return;

  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    addTagFromPicker(input);
  }
});

document.addEventListener("change", (event) => {
  const fileInput = event.target.closest('.wiki-card-form input[name="imageFile"]');
  const file = fileInput?.files?.[0];
  const preview = fileInput?.closest(".wiki-image-fields")?.querySelector(".wiki-image-preview");
  if (!file || !preview || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    preview.innerHTML = `<img src="${escapeAttr(String(reader.result || ""))}" alt="Vista previa" />`;
  });
  reader.readAsDataURL(file);
});

document.addEventListener("input", (event) => {
  const dashboardInput = event.target.closest("[data-dashboard-search]");
  if (dashboardInput) {
    dashboardSearch = dashboardInput.value;
    refreshDashboardResults();
    return;
  }

  const wikiInput = event.target.closest("[data-wiki-search]");
  if (wikiInput) {
    wikiSearch = wikiInput.value;
    const selectionStart = wikiInput.selectionStart;
    render();
    const nextInput = document.querySelector("[data-wiki-search]");
    nextInput?.focus();
    nextInput?.setSelectionRange(selectionStart, selectionStart);
    return;
  }

  const typeInput = event.target.closest("[data-wiki-type-search]");
  if (typeInput) {
    const query = normalizeSearchText(typeInput.value);
    document.querySelectorAll(".wiki-type-card").forEach((card) => {
      card.classList.toggle("hidden", !normalizeSearchText(card.dataset.typeLabel).includes(query));
    });
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

async function wikiImageFromData(data) {
  if (data.removeImage) return "";
  const file = data.imageFile;
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      showToast("Elegí un archivo de imagen.");
      return null;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast("La imagen debe pesar menos de 4 MB.");
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
        title: "Resumen de la campaña",
        type: "mundo",
        category: "Mundo",
        aliases: [],
        folder: "Mundo",
        properties: { tone: formatTags(splitTags(data.tags)) },
        description: data.description.trim(),
        isPublic: true,
        content: data.description.trim(),
        relations: [],
        imageUrl: String(data.imageUrl || "").trim(),
        createdAt: Date.now(),
        modifiedAt: Date.now(),
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
  const type = WIKI_CARD_TYPES[data.type] ? data.type : "nota";
  const properties = {};
  for (const [, key] of WIKI_CARD_TYPES[type].fields) {
    const value = String(data[`property_${key}`] || "").trim();
    if (value) properties[key] = value;
  }
  const relationNames = splitTags(data.relationNames || "");
  const relationIds = wikiCardsFor(campaign)
    .filter((card) => relationNames.some((name) =>
      [card.title, ...(card.aliases || [])].some((candidate) => normalizeSearchText(name) === normalizeSearchText(candidate))
    ))
    .map((card) => card.id);
  const payload = {
    title: data.title.trim(),
    type,
    category: WIKI_CARD_TYPES[type].label,
    aliases: splitTags(data.aliases || ""),
    folder: String(data.folder || WIKI_CARD_TYPES[type].label).trim(),
    properties,
    description: data.description.trim(),
    content: data.description.trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    relations: relationIds,
    isPublic: data.isPublic === "true",
    modifiedAt: Date.now(),
  };

  if (existing) {
    Object.assign(existing, payload);
    selectedWikiCardId = existing.id;
  } else {
    const id = uid("wiki");
    campaign.wiki.unshift({ id, createdAt: Date.now(), ...payload });
    selectedWikiCardId = id;
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
  if (selectedWikiCardId === id) selectedWikiCardId = campaign.wiki[0]?.id || null;
  saveState();
  render();
  showToast("Ficha borrada.");
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
