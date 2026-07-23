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

const WIKI_CONTENT_TYPES = {
  text: { label: "Texto", icon: "☰", title: "Descripción", placeholder: "Escribí el contenido de esta sección..." },
  image: { label: "Imagen", icon: "▧", title: "Galería", placeholder: "Pie de imagen o notas..." },
  map: { label: "Mapa", icon: "⌖", title: "Mapa", placeholder: "Leyenda, escala y puntos de interés..." },
  familyTree: { label: "Árbol familiar", icon: "♧", title: "Árbol familiar", placeholder: "Una relación por línea. Ej: Aureon → Lyra (hija)" },
  timeline: { label: "Línea de tiempo", icon: "↝", title: "Línea de tiempo", placeholder: "Un evento por línea. Ej: 1423 — La caída de Luminar" },
  statBlock5e: { label: "Estadísticas 5e", icon: "⚔", title: "Estadísticas 5e", placeholder: "CA 15 · PG 44 · Velocidad 30 pies\nFUE 16 · DES 12 · CON 14 · INT 10 · SAB 13 · CAR 11\nAcciones, rasgos y reacciones..." },
  characterSheet5e: { label: "Hoja de personaje", icon: "♙", title: "Hoja de personaje 5e", placeholder: "Clase y nivel, características, competencias, equipo, conjuros y rasgos..." },
};

const WIKI_PROPERTY_PRESETS = [
  { label: "Estado", icon: "●" },
  { label: "Rol", icon: "♙" },
  { label: "Raza", icon: "♞" },
  { label: "Ubicacion", icon: "⌖" },
  { label: "Faccion", icon: "⚑" },
  { label: "Alineamiento", icon: "✦" },
  { label: "Tema", icon: "◎" },
  { label: "Fecha", icon: "⌛" },
  { label: "Momento historico", icon: "⌛" },
  { label: "Relaciones", icon: "⛓" },
  { label: "Familiar", icon: "⛓" },
  { label: "Fuente", icon: "✎" },
  { label: "Secreto", icon: "◈" },
  { label: "Peligro", icon: "⚠" },
];

const WIKI_PROPERTY_ICONS = ["◆", "●", "✦", "♙", "♞", "⚑", "⌖", "⌛", "◎", "✎", "⛓", "◈", "⚠", "⚔", "⚘", "☾", "☀", "♜"];

const DND5E_ABILITIES = [
  ["str", "Fuerza", "FUE"],
  ["dex", "Destreza", "DES"],
  ["con", "Constitucion", "CON"],
  ["int", "Inteligencia", "INT"],
  ["wis", "Sabiduria", "SAB"],
  ["cha", "Carisma", "CAR"],
];

const DND5E_SKILLS = [
  ["acrobatics", "Acrobacias", "dex"],
  ["animalHandling", "Trato con animales", "wis"],
  ["arcana", "Arcanos", "int"],
  ["athletics", "Atletismo", "str"],
  ["deception", "Engano", "cha"],
  ["history", "Historia", "int"],
  ["insight", "Perspicacia", "wis"],
  ["intimidation", "Intimidacion", "cha"],
  ["investigation", "Investigacion", "int"],
  ["medicine", "Medicina", "wis"],
  ["nature", "Naturaleza", "int"],
  ["perception", "Percepcion", "wis"],
  ["performance", "Interpretacion", "cha"],
  ["persuasion", "Persuasion", "cha"],
  ["religion", "Religion", "int"],
  ["sleightOfHand", "Juego de manos", "dex"],
  ["stealth", "Sigilo", "dex"],
  ["survival", "Supervivencia", "wis"],
];

const DND5E_CLASS_SAVES = {
  barbaro: ["str", "con"], bardo: ["dex", "cha"], clerigo: ["wis", "cha"], druida: ["int", "wis"],
  guerrero: ["str", "con"], monje: ["str", "dex"], paladin: ["wis", "cha"], explorador: ["str", "dex"],
  picaro: ["dex", "int"], hechicero: ["con", "cha"], brujo: ["wis", "cha"], mago: ["int", "wis"],
  artifice: ["con", "int"],
};

const DND5E_ATTACK_ABILITIES = [
  ["str", "Fuerza"],
  ["dex", "Destreza"],
  ["con", "Constitucion"],
  ["int", "Inteligencia"],
  ["wis", "Sabiduria"],
  ["cha", "Carisma"],
];

const DND5E_DAMAGE_TYPES = [
  "Contundente", "Perforante", "Cortante", "Acido", "Frio", "Fuego", "Fuerza", "Relampago",
  "Necrotico", "Veneno", "Psiquico", "Radiante", "Trueno",
];

const DND5E_SPELL_CLASSES = ["Artifice", "Bardo", "Brujo", "Clerigo", "Druida", "Explorador", "Hechicero", "Mago", "Paladin"];

const DND5E_SPELL_LIBRARY = [
  { name: "Acid Splash", level: 0, classes: ["Artifice", "Hechicero", "Mago"] },
  { name: "Blade Ward", level: 0, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Chill Touch", level: 0, classes: ["Brujo", "Hechicero", "Mago"] },
  { name: "Dancing Lights", level: 0, classes: ["Bardo", "Hechicero", "Mago"] },
  { name: "Druidcraft", level: 0, classes: ["Druida"] },
  { name: "Eldritch Blast", level: 0, classes: ["Brujo"] },
  { name: "Fire Bolt", level: 0, classes: ["Artifice", "Hechicero", "Mago"] },
  { name: "Guidance", level: 0, classes: ["Artifice", "Clerigo", "Druida"] },
  { name: "Light", level: 0, classes: ["Artifice", "Bardo", "Clerigo", "Hechicero", "Mago"] },
  { name: "Mage Hand", level: 0, classes: ["Artifice", "Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Mending", level: 0, classes: ["Artifice", "Bardo", "Clerigo", "Druida", "Hechicero", "Mago"] },
  { name: "Minor Illusion", level: 0, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Poison Spray", level: 0, classes: ["Brujo", "Druida", "Hechicero", "Mago"] },
  { name: "Prestidigitation", level: 0, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Produce Flame", level: 0, classes: ["Druida"] },
  { name: "Ray of Frost", level: 0, classes: ["Artifice", "Hechicero", "Mago"] },
  { name: "Resistance", level: 0, classes: ["Artifice", "Clerigo", "Druida"] },
  { name: "Sacred Flame", level: 0, classes: ["Clerigo"] },
  { name: "Shillelagh", level: 0, classes: ["Druida"] },
  { name: "Shocking Grasp", level: 0, classes: ["Artifice", "Hechicero", "Mago"] },
  { name: "Spare the Dying", level: 0, classes: ["Clerigo"] },
  { name: "Thaumaturgy", level: 0, classes: ["Clerigo"] },
  { name: "True Strike", level: 0, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Alarm", level: 1, classes: ["Artifice", "Explorador", "Mago"] },
  { name: "Animal Friendship", level: 1, classes: ["Bardo", "Druida", "Explorador"] },
  { name: "Bane", level: 1, classes: ["Bardo", "Clerigo"] },
  { name: "Bless", level: 1, classes: ["Clerigo", "Paladin"] },
  { name: "Burning Hands", level: 1, classes: ["Hechicero", "Mago"] },
  { name: "Charm Person", level: 1, classes: ["Bardo", "Druida", "Hechicero", "Mago"] },
  { name: "Cure Wounds", level: 1, classes: ["Artifice", "Bardo", "Clerigo", "Druida", "Explorador", "Paladin"] },
  { name: "Detect Magic", level: 1, classes: ["Artifice", "Bardo", "Clerigo", "Druida", "Explorador", "Paladin", "Hechicero", "Mago"] },
  { name: "Disguise Self", level: 1, classes: ["Bardo", "Hechicero", "Mago"] },
  { name: "Entangle", level: 1, classes: ["Druida"] },
  { name: "Faerie Fire", level: 1, classes: ["Artifice", "Bardo", "Druida"] },
  { name: "Feather Fall", level: 1, classes: ["Artifice", "Bardo", "Hechicero", "Mago"] },
  { name: "Find Familiar", level: 1, classes: ["Mago"] },
  { name: "Guiding Bolt", level: 1, classes: ["Clerigo"] },
  { name: "Healing Word", level: 1, classes: ["Bardo", "Clerigo", "Druida"] },
  { name: "Hex", level: 1, classes: ["Brujo"] },
  { name: "Identify", level: 1, classes: ["Artifice", "Bardo", "Mago"] },
  { name: "Mage Armor", level: 1, classes: ["Hechicero", "Mago"] },
  { name: "Magic Missile", level: 1, classes: ["Hechicero", "Mago"] },
  { name: "Shield", level: 1, classes: ["Hechicero", "Mago"] },
  { name: "Sleep", level: 1, classes: ["Bardo", "Hechicero", "Mago"] },
  { name: "Thunderwave", level: 1, classes: ["Bardo", "Druida", "Hechicero", "Mago"] },
  { name: "Aid", level: 2, classes: ["Clerigo", "Paladin"] },
  { name: "Alter Self", level: 2, classes: ["Hechicero", "Mago"] },
  { name: "Barkskin", level: 2, classes: ["Druida", "Explorador"] },
  { name: "Blur", level: 2, classes: ["Hechicero", "Mago"] },
  { name: "Calm Emotions", level: 2, classes: ["Bardo", "Clerigo"] },
  { name: "Darkness", level: 2, classes: ["Brujo", "Hechicero", "Mago"] },
  { name: "Enhance Ability", level: 2, classes: ["Bardo", "Clerigo", "Druida", "Hechicero"] },
  { name: "Flaming Sphere", level: 2, classes: ["Druida", "Mago"] },
  { name: "Hold Person", level: 2, classes: ["Bardo", "Clerigo", "Druida", "Hechicero", "Mago"] },
  { name: "Invisibility", level: 2, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Lesser Restoration", level: 2, classes: ["Artifice", "Bardo", "Clerigo", "Druida", "Paladin", "Explorador"] },
  { name: "Moonbeam", level: 2, classes: ["Druida"] },
  { name: "Misty Step", level: 2, classes: ["Brujo", "Hechicero", "Mago"] },
  { name: "Pass without Trace", level: 2, classes: ["Druida", "Explorador"] },
  { name: "Scorching Ray", level: 2, classes: ["Hechicero", "Mago"] },
  { name: "Silence", level: 2, classes: ["Bardo", "Clerigo", "Explorador"] },
  { name: "Spiritual Weapon", level: 2, classes: ["Clerigo"] },
  { name: "Web", level: 2, classes: ["Hechicero", "Mago"] },
  { name: "Counterspell", level: 3, classes: ["Brujo", "Hechicero", "Mago"] },
  { name: "Dispel Magic", level: 3, classes: ["Bardo", "Clerigo", "Druida", "Paladin", "Brujo", "Hechicero", "Mago"] },
  { name: "Fear", level: 3, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Fireball", level: 3, classes: ["Hechicero", "Mago"] },
  { name: "Fly", level: 3, classes: ["Brujo", "Hechicero", "Mago"] },
  { name: "Haste", level: 3, classes: ["Hechicero", "Mago"] },
  { name: "Lightning Bolt", level: 3, classes: ["Hechicero", "Mago"] },
  { name: "Mass Healing Word", level: 3, classes: ["Clerigo"] },
  { name: "Plant Growth", level: 3, classes: ["Bardo", "Druida", "Explorador"] },
  { name: "Revivify", level: 3, classes: ["Clerigo", "Paladin"] },
  { name: "Spirit Guardians", level: 3, classes: ["Clerigo"] },
  { name: "Tiny Hut", level: 3, classes: ["Bardo", "Mago"] },
  { name: "Water Breathing", level: 3, classes: ["Druida", "Explorador", "Hechicero", "Mago"] },
  { name: "Banishment", level: 4, classes: ["Clerigo", "Paladin", "Brujo", "Hechicero", "Mago"] },
  { name: "Blight", level: 4, classes: ["Druida", "Brujo", "Hechicero", "Mago"] },
  { name: "Confusion", level: 4, classes: ["Bardo", "Druida", "Hechicero", "Mago"] },
  { name: "Dimension Door", level: 4, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Freedom of Movement", level: 4, classes: ["Bardo", "Clerigo", "Druida", "Explorador"] },
  { name: "Greater Invisibility", level: 4, classes: ["Bardo", "Hechicero", "Mago"] },
  { name: "Polymorph", level: 4, classes: ["Bardo", "Druida", "Hechicero", "Mago"] },
  { name: "Wall of Fire", level: 4, classes: ["Druida", "Hechicero", "Mago"] },
  { name: "Cloudkill", level: 5, classes: ["Hechicero", "Mago"] },
  { name: "Commune", level: 5, classes: ["Clerigo"] },
  { name: "Cone of Cold", level: 5, classes: ["Hechicero", "Mago"] },
  { name: "Dominate Person", level: 5, classes: ["Bardo", "Hechicero", "Mago"] },
  { name: "Flame Strike", level: 5, classes: ["Clerigo"] },
  { name: "Greater Restoration", level: 5, classes: ["Bardo", "Clerigo", "Druida"] },
  { name: "Mass Cure Wounds", level: 5, classes: ["Bardo", "Clerigo", "Druida"] },
  { name: "Raise Dead", level: 5, classes: ["Bardo", "Clerigo", "Paladin"] },
  { name: "Scrying", level: 5, classes: ["Bardo", "Clerigo", "Druida", "Brujo", "Mago"] },
  { name: "Wall of Stone", level: 5, classes: ["Druida", "Hechicero", "Mago"] },
  { name: "Chain Lightning", level: 6, classes: ["Hechicero", "Mago"] },
  { name: "Disintegrate", level: 6, classes: ["Hechicero", "Mago"] },
  { name: "Globe of Invulnerability", level: 6, classes: ["Hechicero", "Mago"] },
  { name: "Heal", level: 6, classes: ["Clerigo", "Druida"] },
  { name: "Heroes' Feast", level: 6, classes: ["Clerigo", "Druida"] },
  { name: "Mass Suggestion", level: 6, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Sunbeam", level: 6, classes: ["Druida", "Hechicero", "Mago"] },
  { name: "Teleport", level: 7, classes: ["Bardo", "Hechicero", "Mago"] },
  { name: "Fire Storm", level: 7, classes: ["Clerigo", "Druida", "Hechicero"] },
  { name: "Plane Shift", level: 7, classes: ["Clerigo", "Druida", "Brujo", "Hechicero", "Mago"] },
  { name: "Regenerate", level: 7, classes: ["Bardo", "Clerigo", "Druida"] },
  { name: "Resurrection", level: 7, classes: ["Bardo", "Clerigo"] },
  { name: "Reverse Gravity", level: 7, classes: ["Druida", "Hechicero", "Mago"] },
  { name: "Dominate Monster", level: 8, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Earthquake", level: 8, classes: ["Clerigo", "Druida", "Hechicero"] },
  { name: "Holy Aura", level: 8, classes: ["Clerigo"] },
  { name: "Power Word Stun", level: 8, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Sunburst", level: 8, classes: ["Druida", "Hechicero", "Mago"] },
  { name: "Astral Projection", level: 9, classes: ["Clerigo", "Brujo", "Mago"] },
  { name: "Foresight", level: 9, classes: ["Bardo", "Druida", "Brujo", "Mago"] },
  { name: "Gate", level: 9, classes: ["Clerigo", "Hechicero", "Mago"] },
  { name: "Mass Heal", level: 9, classes: ["Clerigo"] },
  { name: "Meteor Swarm", level: 9, classes: ["Hechicero", "Mago"] },
  { name: "Power Word Kill", level: 9, classes: ["Bardo", "Brujo", "Hechicero", "Mago"] },
  { name: "Time Stop", level: 9, classes: ["Hechicero", "Mago"] },
  { name: "True Resurrection", level: 9, classes: ["Clerigo", "Druida"] },
  { name: "Wish", level: 9, classes: ["Hechicero", "Mago"] },
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
let wikiView = "home";
let selectedWikiCardId = null;
let wikiSearch = "";
let wikiFolder = "all";
let wikiGraphRuntime = null;
let wikiGraphClickSuppressedUntil = 0;
const wikiGraphNodeMemory = new Map();
let selectedMapId = null;
let mapSearch = "";
let mapDrawMode = false;
let mapRuntime = null;

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
  teardownWikiGraphs();
  teardownMapRuntime();
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
      renderShell(renderCampaign(), { hideTopbar: true });
      return;
    }

    window.location.hash = "";
  }

  renderShell(renderDashboard());
}

function renderShell(content, options = {}) {
  const user = currentUser();
  app.innerHTML = `
    <div class="app-shell ${options.hideTopbar ? "campaign-shell" : ""}">
      ${options.hideTopbar ? "" : `<header class="topbar">
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
      </header>`}
      ${content}
    </div>
    ${renderModal()}
    <div id="toast" class="toast hidden"></div>
  `;
  initializeWikiGraphs();
  initializeMapRuntime();
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

  if (["wiki", "maps", "characters", "members", "settings"].includes(activeTab)) {
    return renderWikiWorkspace(campaign, role, canManage);
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
            </div>
          </header>
          ${renderCampaignTab(campaign, role, canManage)}
        </section>
      </section>
    </main>
  `;
}

function renderWikiWorkspace(campaign, role, canManage) {
  const cards = wikiCardsFor(campaign);
  const isWikiHome = activeTab === "wiki" && wikiView === "home";
  const isWikiCards = activeTab === "wiki" && wikiView === "cards";
  let content = "";
  if (activeTab === "characters") content = renderWikiCharactersPage(campaign, role, canManage);
  else if (activeTab === "maps") content = renderMapsPage(campaign, role, canManage);
  else if (activeTab === "members") content = renderWikiMembersPage(campaign, canManage);
  else if (activeTab === "settings") content = renderWikiSettingsPage(campaign, role, canManage);
  else content = wikiView === "cards" ? renderWikiLibrary(campaign, canManage) : renderWikiHome(campaign, canManage);

  return `
    <main class="wiki-app-shell">
      <header class="wiki-commandbar">
        <button class="wiki-world-switch" data-action="go-dashboard" title="Volver al tablero">
          <span class="wiki-world-mark">${escapeHtml(campaign.title.slice(0, 1).toUpperCase())}</span>
          <span><strong>${escapeHtml(campaign.title)}</strong><small>${cards.length} fichas conectadas</small></span>
        </button>
        <nav class="wiki-primary-nav" aria-label="Navegación de la campaña">
          <button class="${isWikiHome ? "active" : ""}" data-action="set-wiki-view" data-view="home">⌂ Inicio</button>
          <button class="${isWikiCards ? "active" : ""}" data-action="set-wiki-view" data-view="cards">◈ Tarjetas</button>
          <button data-action="open-public-wiki" data-id="${campaign.id}">↗ Wiki</button>
          <button class="${activeTab === "maps" ? "active" : ""}" data-action="set-tab" data-tab="maps">⌖ Mapas</button>
          <button class="${activeTab === "characters" ? "active" : ""}" data-action="set-tab" data-tab="characters">♙ Personajes</button>
          <button class="${activeTab === "members" ? "active" : ""}" data-action="set-tab" data-tab="members">♧ Jugadores</button>
          <button class="${activeTab === "settings" ? "active" : ""}" data-action="set-tab" data-tab="settings">⚙ Ajustes</button>
        </nav>
      </header>
      ${content}
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

function isWikiImageIcon(icon) {
  return /^(data:image\/|https?:\/\/)/i.test(String(icon || "").trim());
}

function renderWikiPropertyIcon(icon, className = "") {
  const safeIcon = String(icon || "◆").trim() || "◆";
  return isWikiImageIcon(safeIcon)
    ? `<img class="wiki-property-image-icon ${className}" src="${escapeAttr(safeIcon)}" alt="" />`
    : `<span class="wiki-property-glyph-icon ${className}">${escapeHtml(safeIcon)}</span>`;
}

function normalizedWikiPropertyItems(page) {
  if (Array.isArray(page?.propertyItems)) {
    return page.propertyItems.map((item, index) => ({
      id: item.id || `property-${index}`,
      icon: String(item.icon || "◆"),
      label: String(item.label || "Propiedad"),
      value: String(item.value || ""),
    }));
  }
  const type = WIKI_CARD_TYPES[page?.type] || WIKI_CARD_TYPES.nota;
  return Object.entries(page?.properties || {}).map(([key, value], index) => ({
    id: `legacy-property-${index}`,
    icon: "◆",
    label: propertyLabel(type, key),
    value: String(value || ""),
  }));
}

function dnd5eModifier(score) {
  return Math.floor((Math.max(1, Math.min(30, Number(score) || 10)) - 10) / 2);
}

function dnd5eProficiencyBonus(level) {
  return 2 + Math.floor((Math.max(1, Math.min(20, Number(level) || 1)) - 1) / 4);
}

function signedDnd5e(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function defaultStatBlock5e() {
  return {
    subtitle: "Criatura Mediana, sin alineamiento",
    armorClass: "10",
    hitPoints: "1 (1d8 - 3)",
    speed: "30 pies",
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: "",
    skills: "",
    senses: "Percepcion pasiva 10",
    languages: "—",
    challenge: "0 (10 PX)",
    traits: "",
    actions: "",
    reactions: "",
  };
}

function normalizedStatBlock5e(block) {
  const defaults = defaultStatBlock5e();
  const stat = block?.stat && typeof block.stat === "object" ? block.stat : {};
  return {
    ...defaults,
    ...stat,
    abilities: Object.fromEntries(DND5E_ABILITIES.map(([key]) => [
      key,
      Math.max(1, Math.min(30, Number(stat.abilities?.[key]) || 10)),
    ])),
    traits: String(stat.traits || (!block?.stat ? block?.text || "" : "")),
  };
}

function defaultCharacterSheet5e() {
  return {
    characterName: "", className: "", level: 1, background: "", playerName: "", race: "", alignment: "", experience: "",
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProficiencies: [], skillProficiencies: [], inspiration: false,
    armorBase: 10, armorBonus: 0, speed: 30, maxHp: "", currentHp: "", temporaryHp: "", hitDice: "", deathSuccesses: 0, deathFailures: 0,
    attacks: "", weapons: [], spellcastingAbility: "int", spells: Object.fromEntries(Array.from({ length: 10 }, (_, level) => [level, []])),
    personality: "", ideals: "", bonds: "", flaws: "", proficiencies: "", features: "",
  };
}

function normalizedCharacterSheet5e(block) {
  const defaults = defaultCharacterSheet5e();
  const sheet = block?.sheet && typeof block.sheet === "object" ? block.sheet : {};
  const abilities = Object.fromEntries(DND5E_ABILITIES.map(([key]) => [key, Math.max(1, Math.min(30, Number(sheet.abilities?.[key]) || 10))]));
  const spells = Object.fromEntries(Array.from({ length: 10 }, (_, level) => [level, (Array.isArray(sheet.spells?.[level]) ? sheet.spells[level] : []).map((spell, spellIndex) => ({
    id: String(spell?.id || `spell-${level}-${spellIndex}`),
    name: String(spell?.name || ""),
    notes: String(spell?.notes || ""),
  })).filter((spell) => spell.name.trim())]));
  const weapons = (Array.isArray(sheet.weapons) ? sheet.weapons : []).map((weapon, weaponIndex) => ({
    id: String(weapon?.id || `weapon-${weaponIndex}`),
    name: String(weapon?.name || ""),
    damageDice: String(weapon?.damageDice || ""),
    ability: DND5E_ATTACK_ABILITIES.some(([key]) => key === weapon?.ability) ? weapon.ability : "str",
    proficient: Boolean(weapon?.proficient ?? true),
    bonus: Number(weapon?.bonus) || 0,
    damageType: DND5E_DAMAGE_TYPES.includes(weapon?.damageType) ? weapon.damageType : "Cortante",
    notes: String(weapon?.notes || ""),
  })).filter((weapon) => weapon.name.trim() || weapon.damageDice.trim());
  return {
    ...defaults,
    ...sheet,
    level: Math.max(1, Math.min(20, Number(sheet.level) || 1)),
    abilities,
    weapons,
    spells,
    spellcastingAbility: DND5E_ABILITIES.some(([key]) => key === sheet.spellcastingAbility) ? sheet.spellcastingAbility : "int",
    saveProficiencies: Array.isArray(sheet.saveProficiencies) ? sheet.saveProficiencies.filter((key) => DND5E_ABILITIES.some(([ability]) => ability === key)) : [],
    skillProficiencies: Array.isArray(sheet.skillProficiencies) ? sheet.skillProficiencies.filter((key) => DND5E_SKILLS.some(([skill]) => skill === key)) : [],
    features: String(sheet.features || (!block?.sheet ? block?.text || "" : "")),
  };
}

function normalizedWikiContentBlocks(page) {
  if (Array.isArray(page?.contentBlocks)) {
    return page.contentBlocks.map((block, index) => ({
      id: block.id || `block-${index}`,
      type: WIKI_CONTENT_TYPES[block.type] ? block.type : "text",
      title: String(block.title || WIKI_CONTENT_TYPES[block.type]?.title || "Sección"),
      text: String(block.text || ""),
      url: String(block.url || ""),
      sheet: block.type === "characterSheet5e" ? normalizedCharacterSheet5e(block) : undefined,
      stat: block.type === "statBlock5e" ? normalizedStatBlock5e(block) : undefined,
    }));
  }
  const legacyText = String(page?.description ?? page?.content ?? "");
  return legacyText ? [{ id: "legacy-description", type: "text", title: "Descripción", text: legacyText, url: "" }] : [];
}

function wikiCardsFor(campaign) {
  return (campaign?.wiki || []).map((page) => ({
    ...page,
    title: page.title || "Sin título",
    type: page.type || wikiTypeFromLegacyCategory(page.category),
    description: page.description ?? page.content ?? "",
    aliases: [...new Set([page.title || "Sin título", ...(Array.isArray(page.aliases) ? page.aliases : [])])],
    folder: page.folder || WIKI_CARD_TYPES[page.type]?.label || page.category || "Notas",
    properties: page.properties && typeof page.properties === "object" ? page.properties : {},
    propertyItems: normalizedWikiPropertyItems(page),
    contentBlocks: normalizedWikiContentBlocks(page),
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
  return [
    card.title,
    ...(card.aliases || []),
    card.description,
    ...normalizedWikiPropertyItems(card).flatMap((item) => [item.label, item.value]),
    ...normalizedWikiContentBlocks(card).flatMap((block) => [block.title, block.text]),
  ]
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
    <div class="wiki-graph ${compact ? "compact" : ""}" data-wiki-graph aria-label="Mapa de relaciones de la wiki">
      <svg class="wiki-graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${edges.map((edge) => {
          const from = positionById.get(edge.sourceId);
          const to = positionById.get(edge.targetId);
          return `<line data-source="${escapeAttr(edge.sourceId)}" data-target="${escapeAttr(edge.targetId)}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
        }).join("")}
      </svg>
      ${sorted.map((card, index) => {
        const position = positionById.get(card.id);
        const type = wikiType(card);
        const imageUrl = String(card.imageUrl || "").trim();
        const hasImage = Boolean(imageUrl);
        const nodeVisual = hasImage
          ? `<img class="wiki-node-image" src="${escapeAttr(imageUrl)}" alt="" loading="lazy" draggable="false" />`
          : `<span class="wiki-node-icon">${type.icon}</span>`;
        return `<button class="wiki-node ${hasImage ? "has-image" : ""} ${index < 3 ? "featured" : ""}" style="left:${position.x}%;top:${position.y}%" data-action="select-wiki-card" data-id="${card.id}" data-node-id="${card.id}" data-x="${position.x}" data-y="${position.y}" title="Arrastrar o abrir ${escapeAttr(card.title)}">
          ${nodeVisual}<span class="wiki-node-name">${escapeHtml(card.title)}</span>
        </button>`;
      }).join("")}
      <div class="wiki-graph-legend"><span>${sorted.length} nodos</span><span>${edges.length} conexiones</span></div>
    </div>
  `;
}

function wikiGraphNodeKey(id) {
  return `${activeCampaignId || "wiki"}:${id}`;
}

function clampGraphValue(value, min = 5, max = 95) {
  return Math.min(max, Math.max(min, value));
}

function initializeWikiGraphs() {
  const graphs = [...document.querySelectorAll("[data-wiki-graph]")].map(setupWikiGraph).filter(Boolean);
  if (!graphs.length) return;

  let previousTime = performance.now();
  const tick = (time) => {
    const delta = Math.min(2, Math.max(0.35, (time - previousTime) / 16.67));
    previousTime = time;
    graphs.forEach((graphState) => stepWikiGraph(graphState, delta, time));
    wikiGraphRuntime.frame = requestAnimationFrame(tick);
  };

  wikiGraphRuntime = {
    frame: requestAnimationFrame(tick),
    graphs,
  };
}

function teardownWikiGraphs() {
  if (!wikiGraphRuntime) return;
  cancelAnimationFrame(wikiGraphRuntime.frame);
  wikiGraphRuntime = null;
}

function teardownMapRuntime() {
  mapRuntime = null;
}

function initializeMapRuntime() {
  const viewport = document.querySelector("[data-map-viewport]");
  if (!viewport) return;
  const world = viewport.querySelector("[data-map-world]");
  const canvas = viewport.querySelector("[data-map-canvas]");
  const drawing = viewport.querySelector("[data-map-drawing]");
  if (!world || !canvas || !drawing) return;
  const state = { scale: 1, x: 0, y: 0, gesture: null };
  const apply = () => { world.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`; };
  const fitCanvas = () => {
    const image = canvas.querySelector("[data-map-image]");
    if (!image?.naturalWidth || !image?.naturalHeight) return;
    const rect = viewport.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const width = Math.min(rect.width, rect.height * ratio);
    const height = width / ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.left = `${(rect.width - width) / 2}px`;
    canvas.style.top = `${(rect.height - height) / 2}px`;
  };
  const image = canvas.querySelector("[data-map-image]");
  if (image) {
    if (image.complete) fitCanvas();
    else image.addEventListener("load", fitCanvas, { once: true });
  }
  const zoomBy = (factor) => {
    const next = Math.max(0.5, Math.min(3.5, state.scale * factor));
    const rect = viewport.getBoundingClientRect();
    const anchorX = rect.width / 2;
    const anchorY = rect.height / 2;
    state.x = anchorX - (anchorX - state.x) * (next / state.scale);
    state.y = anchorY - (anchorY - state.y) * (next / state.scale);
    state.scale = next;
    apply();
  };
  mapRuntime = { zoomBy, reset: () => { state.scale = 1; state.x = 0; state.y = 0; apply(); } };

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest(".map-point, .map-upload-button")) return;
    const isDrawing = viewport.dataset.canDraw === "true";
    const rect = canvas.getBoundingClientRect();
    const toPoint = (clientX, clientY) => ({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    });
    state.gesture = isDrawing
      ? { kind: "draw", pointerId: event.pointerId, points: [toPoint(event.clientX, event.clientY)] }
      : { kind: "pan", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: state.x, originY: state.y };
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  viewport.addEventListener("pointermove", (event) => {
    const gesture = state.gesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (gesture.kind === "pan") {
      state.x = gesture.originX + event.clientX - gesture.startX;
      state.y = gesture.originY + event.clientY - gesture.startY;
      apply();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    gesture.points.push({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
    drawing.innerHTML = `${drawing.innerHTML.replace(/<polyline class="map-current-stroke"[^>]*\/>/, "")}<polyline class="map-current-stroke" points="${gesture.points.map((point) => `${point.x * 10},${point.y * 10}`).join(" ")}" />`;
  });

  const finish = (event) => {
    const gesture = state.gesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (gesture.kind === "draw" && gesture.points.length > 1) {
      const campaign = campaignById(activeCampaignId);
      const map = mapsFor(campaign).find((item) => item.id === viewport.dataset.mapId);
      if (map) {
        map.playerStrokes = [...(map.playerStrokes || []), { id: uid("stroke"), createdAt: Date.now(), points: gesture.points.map((point) => ({ x: Math.max(0, Math.min(100, point.x)), y: Math.max(0, Math.min(100, point.y)) })) }];
        saveState();
        window.setTimeout(() => { if (activeTab === "maps") render(); }, (mapSettings(campaign).strokeDuration + 1) * 1000);
      }
    }
    state.gesture = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener("pointerup", finish);
  viewport.addEventListener("pointercancel", finish);
}

function setupWikiGraph(graph) {
  const nodeElements = [...graph.querySelectorAll(".wiki-node[data-node-id]")];
  if (!nodeElements.length) return null;

  const nodes = new Map(
    nodeElements.map((element, index) => {
      const id = element.dataset.nodeId;
      const remembered = wikiGraphNodeMemory.get(wikiGraphNodeKey(id));
      const x = remembered?.x ?? Number(element.dataset.x || 50);
      const y = remembered?.y ?? Number(element.dataset.y || 50);
      element.style.left = `${x}%`;
      element.style.top = `${y}%`;
      return [id, { id, element, index, x, y, vx: 0, vy: 0, dragging: false }];
    })
  );

  const edges = [...graph.querySelectorAll(".wiki-graph-lines line")]
    .map((line) => ({ line, sourceId: line.dataset.source, targetId: line.dataset.target }))
    .filter((edge) => nodes.has(edge.sourceId) && nodes.has(edge.targetId));

  const graphState = { graph, nodes, edges, dragging: null };
  graph.addEventListener("pointerdown", (event) => startWikiNodeDrag(event, graphState));
  renderWikiGraphFrame(graphState);
  return graphState;
}

function startWikiNodeDrag(event, graphState) {
  const nodeElement = event.target.closest(".wiki-node[data-node-id]");
  if (!nodeElement || !graphState.graph.contains(nodeElement)) return;

  const node = graphState.nodes.get(nodeElement.dataset.nodeId);
  if (!node) return;

  const rect = graphState.graph.getBoundingClientRect();
  const pointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
  const pointerY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
  graphState.dragging = {
    node,
    pointerId: event.pointerId,
    offsetX: node.x - pointerX,
    offsetY: node.y - pointerY,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };

  node.dragging = true;
  node.vx = 0;
  node.vy = 0;
  nodeElement.classList.add("dragging");
  nodeElement.setPointerCapture(event.pointerId);
  event.preventDefault();

  nodeElement.addEventListener("pointermove", handleWikiNodeDragMove);
  nodeElement.addEventListener("pointerup", stopWikiNodeDrag);
  nodeElement.addEventListener("pointercancel", stopWikiNodeDrag);

  function handleWikiNodeDragMove(moveEvent) {
    if (moveEvent.pointerId !== graphState.dragging?.pointerId) return;
    const moveRect = graphState.graph.getBoundingClientRect();
    const nextX = ((moveEvent.clientX - moveRect.left) / Math.max(moveRect.width, 1)) * 100 + graphState.dragging.offsetX;
    const nextY = ((moveEvent.clientY - moveRect.top) / Math.max(moveRect.height, 1)) * 100 + graphState.dragging.offsetY;
    node.x = clampGraphValue(nextX);
    node.y = clampGraphValue(nextY);
    node.vx = 0;
    node.vy = 0;
    graphState.dragging.moved ||= Math.hypot(moveEvent.clientX - graphState.dragging.startX, moveEvent.clientY - graphState.dragging.startY) > 4;
    wikiGraphNodeMemory.set(wikiGraphNodeKey(node.id), { x: node.x, y: node.y });
    renderWikiGraphFrame(graphState);
    moveEvent.preventDefault();
  }

  function stopWikiNodeDrag(upEvent) {
    if (upEvent.pointerId !== graphState.dragging?.pointerId) return;
    if (graphState.dragging.moved) wikiGraphClickSuppressedUntil = Date.now() + 220;
    node.dragging = false;
    nodeElement.classList.remove("dragging");
    nodeElement.releasePointerCapture(upEvent.pointerId);
    nodeElement.removeEventListener("pointermove", handleWikiNodeDragMove);
    nodeElement.removeEventListener("pointerup", stopWikiNodeDrag);
    nodeElement.removeEventListener("pointercancel", stopWikiNodeDrag);
    graphState.dragging = null;
  }
}

function stepWikiGraph(graphState, delta, time) {
  const nodes = [...graphState.nodes.values()];
  const centerForce = 0.0028 * delta;
  const linkForce = 0.0019 * delta;
  const repelForce = 0.15 * delta;

  for (const node of nodes) {
    if (node.dragging) continue;
    node.vx += (50 - node.x) * centerForce;
    node.vy += (50 - node.y) * centerForce;
    node.vx += Math.sin(time * 0.0006 + node.index * 1.7) * 0.004 * delta;
    node.vy += Math.cos(time * 0.0005 + node.index * 1.3) * 0.004 * delta;
  }

  for (const edge of graphState.edges) {
    const source = graphState.nodes.get(edge.sourceId);
    const target = graphState.nodes.get(edge.targetId);
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(0.1, Math.hypot(dx, dy));
    const pull = (distance - 13) * linkForce;
    const forceX = (dx / distance) * pull;
    const forceY = (dy / distance) * pull;
    if (!source.dragging) {
      source.vx += forceX;
      source.vy += forceY;
    }
    if (!target.dragging) {
      target.vx -= forceX;
      target.vy -= forceY;
    }
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(0.1, Math.hypot(dx, dy));
      if (distance > 18) continue;
      const push = ((18 - distance) / 18) * repelForce;
      const forceX = (dx / distance) * push;
      const forceY = (dy / distance) * push;
      if (!a.dragging) {
        a.vx -= forceX;
        a.vy -= forceY;
      }
      if (!b.dragging) {
        b.vx += forceX;
        b.vy += forceY;
      }
    }
  }

  for (const node of nodes) {
    if (node.dragging) continue;
    node.vx *= 0.91;
    node.vy *= 0.91;
    node.x = clampGraphValue(node.x + node.vx);
    node.y = clampGraphValue(node.y + node.vy);
    wikiGraphNodeMemory.set(wikiGraphNodeKey(node.id), { x: node.x, y: node.y });
  }

  renderWikiGraphFrame(graphState);
}

function renderWikiGraphFrame(graphState) {
  for (const node of graphState.nodes.values()) {
    node.element.style.left = `${node.x}%`;
    node.element.style.top = `${node.y}%`;
  }
  for (const edge of graphState.edges) {
    const source = graphState.nodes.get(edge.sourceId);
    const target = graphState.nodes.get(edge.targetId);
    edge.line.setAttribute("x1", source.x);
    edge.line.setAttribute("y1", source.y);
    edge.line.setAttribute("x2", target.x);
    edge.line.setAttribute("y2", target.y);
  }
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
          <button data-action="set-wiki-view" data-view="cards">▦ Explorar tarjetas</button>
        </div>
        <div class="wiki-recent-head"><span>RECIENTES</span><button data-action="set-wiki-view" data-view="cards">Ver todas</button></div>
        <div class="wiki-recent-list">
          ${recent.length ? recent.map((card) => renderWikiRecent(card)).join("") : canManage ? `
            <button class="wiki-empty-card" data-action="set-wiki-view" data-view="cards"><span>▦</span><strong>Ir a Tarjetas</strong><small>Creá y organizá las fichas de tu mundo desde la biblioteca.</small></button>` : `
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

function wikiFoldersFor(campaign) {
  const savedFolders = Array.isArray(campaign?.wikiFolders) ? campaign.wikiFolders : [];
  const cardFolders = wikiCardsFor(campaign).map((card) => card.folder);
  const uniqueFolders = new Map();
  for (const value of [...savedFolders, ...cardFolders]) {
    const folder = String(value || "").trim();
    const key = normalizeSearchText(folder);
    if (folder && key && !uniqueFolders.has(key)) uniqueFolders.set(key, folder);
  }
  return [...uniqueFolders.values()].sort((left, right) => left.localeCompare(right, "es"));
}

function renderWikiFolderOptions(campaign, selectedFolder) {
  return [...new Set([...wikiFoldersFor(campaign), "Sin carpeta"])]
    .map((folder) => `<option value="${escapeAttr(folder)}" ${folder === selectedFolder ? "selected" : ""}>${escapeHtml(folder)}</option>`)
    .join("");
}

function filteredWikiCards(campaign) {
  const query = normalizeSearchText(wikiSearch).trim();
  return wikiCardsFor(campaign).filter((card) => {
    const matchesFolder = wikiFolder === "all" || card.folder === wikiFolder;
    const matchesQuery = !query || normalizeSearchText(cardAllText(card)).includes(query);
    return matchesFolder && matchesQuery;
  });
}

function renderWikiLibrary(campaign, canManage) {
  const allCards = wikiCardsFor(campaign);
  const cards = filteredWikiCards(campaign);
  const folders = wikiFoldersFor(campaign);
  const selected = cards.find((card) => card.id === selectedWikiCardId) || cards[0] || null;
  if (selected && selectedWikiCardId !== selected.id) selectedWikiCardId = selected.id;

  return `
    <section class="wiki-library">
      <aside class="wiki-folder-sidebar">
        <label class="wiki-search"><span>⌕</span><input data-wiki-search type="search" value="${escapeAttr(wikiSearch)}" placeholder="Buscar en la wiki" aria-label="Buscar en la wiki" /></label>
        <div class="wiki-tree-title"><span>CARPETAS</span><small>${folders.length}</small></div>
        <button class="wiki-folder ${wikiFolder === "all" ? "active" : ""}" data-action="filter-wiki-folder" data-folder="all"><span>▤</span>Todas las fichas<small>${allCards.length}</small></button>
        ${folders.map((folder) => {
          const count = allCards.filter((card) => card.folder === folder).length;
          return `<button class="wiki-folder ${wikiFolder === folder ? "active" : ""}" data-action="filter-wiki-folder" data-folder="${escapeAttr(folder)}"><span>▱</span>${escapeHtml(folder)}<small>${count}</small></button>`;
        }).join("")}
        ${canManage ? `<button class="wiki-new-folder" data-action="new-wiki-folder"><span>＋</span>Nueva carpeta</button>` : ""}
      </aside>
      <section class="wiki-card-column">
        <div class="wiki-list-head">
          <div><span>${wikiFolder === "all" ? "TODAS LAS FICHAS" : escapeHtml(wikiFolder).toUpperCase()}</span><small>${cards.length} resultados</small></div>
          ${canManage ? `<button class="button wiki-create-button" data-action="new-wiki-page"><span>＋</span>Nueva ficha</button>` : ""}
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
  const campaign = campaignById(activeCampaignId);
  const type = wikiType(card);
  const edges = wikiRelations(allCards).filter((edge) => edge.sourceId === card.id || edge.targetId === card.id);
  const related = edges.map((edge) => allCards.find((item) => item.id === (edge.sourceId === card.id ? edge.targetId : edge.sourceId))).filter(Boolean);
  const properties = normalizedWikiPropertyItems(card).filter((item) => item.value.trim());
  const contentBlocks = normalizedWikiContentBlocks(card);
  const linkedMap = mapsFor(campaign).find((map) => map.cardId === card.id);
  return `
    <article class="wiki-card-detail">
      <header class="wiki-detail-head">
        <div><span class="wiki-detail-type">${type.icon} ${type.label}</span><h1>${escapeHtml(card.title)}</h1></div>
        ${canManage ? `<div class="wiki-detail-actions"><button data-action="edit-wiki" data-id="${card.id}" title="Editar" aria-label="Editar ${escapeAttr(card.title)}">✎</button><button class="danger" data-action="delete-wiki" data-id="${card.id}" title="Eliminar" aria-label="Eliminar ${escapeAttr(card.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" /></svg></button></div>` : ""}
      </header>
      <div class="wiki-detail-grid">
        <div class="wiki-detail-main">
          ${card.aliases.length ? `<div class="wiki-property-row"><span>ALIASES</span><div>${card.aliases.map((alias) => `<em>${escapeHtml(alias)}</em>`).join("")}</div></div>` : ""}
          <div class="wiki-property-row wiki-folder-property"><span>CARPETA</span><div>${canManage ? `<label class="wiki-folder-move"><span>▱</span><select data-wiki-folder-move data-id="${card.id}" aria-label="Mover ${escapeAttr(card.title)} a otra carpeta">${renderWikiFolderOptions(campaign, card.folder)}</select></label>` : `<em>▱ ${escapeHtml(card.folder)}</em>`}</div></div>
          ${properties.map((item) => `<div class="wiki-property-row"><span><b>${renderWikiPropertyIcon(item.icon)}</b>${escapeHtml(item.label.toUpperCase())}</span><div>${linkedMap && normalizeSearchText(item.label) === "mapa" ? `<button class="wiki-inline-link" data-action="go-to-map" data-id="${linkedMap.id}">Abrir mapa</button>` : `<strong>${linkMentions(item.value, allCards, card.id)}</strong>`}</div></div>`).join("")}
          <div class="wiki-content-viewer">
            ${contentBlocks.length ? contentBlocks.map((block) => renderWikiContentBlock(block, allCards, card.id)).join("") : `<section class="wiki-description"><span>CONTENIDO</span><p>Sin contenido todavía.</p></section>`}
          </div>
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

function dnd5eSpellLibraryByLevel(level) {
  return DND5E_SPELL_LIBRARY
    .filter((spell) => spell.level === level)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function dnd5eSpellNotes(name) {
  const notes = {
    "Acid Splash": "Ataque menor de acido contra una o dos criaturas cercanas. Requiere salvacion de Destreza y causa dano de acido.",
    "Blade Ward": "Te proteges hasta tu proximo turno y reduces el dano fisico de armas que recibas.",
    "Chill Touch": "Ataque magico a distancia con energia necrotica. Dificulta que el objetivo recupere puntos de golpe por un turno.",
    "Dancing Lights": "Crea luces pequenas que puedes mover para iluminar, senalar o distraer.",
    "Druidcraft": "Efectos naturales menores: predecir clima, abrir flores, crear sensaciones o pequenas marcas de la naturaleza.",
    "Eldritch Blast": "Ataque magico a distancia de fuerza. Es el truco ofensivo clasico del brujo y escala con el nivel.",
    "Fire Bolt": "Ataque magico a distancia que lanza fuego y puede prender objetos inflamables no llevados.",
    "Guidance": "Tocas a una criatura y le das un pequeno bono a una prueba de caracteristica.",
    "Light": "Un objeto emite luz brillante y tenue durante un tiempo.",
    "Mage Hand": "Crea una mano espectral para manipular objetos ligeros a distancia.",
    "Mending": "Repara una rotura o rasgadura pequena en un objeto.",
    "Minor Illusion": "Crea un sonido o una imagen pequena para enganar, distraer o ambientar una escena.",
    "Poison Spray": "Una criatura cercana debe resistir veneno o recibe dano de veneno.",
    "Prestidigitation": "Trucos magicos menores: limpiar, ensuciar, calentar, enfriar, aromatizar o crear pequenos efectos sensoriales.",
    "Produce Flame": "Creas fuego en la mano para iluminar o lanzarlo como ataque de fuego.",
    "Ray of Frost": "Ataque magico a distancia de frio. Reduce la velocidad del objetivo por un turno.",
    "Resistance": "Tocas a una criatura y le das un pequeno bono a una tirada de salvacion.",
    "Sacred Flame": "Luz sagrada golpea a una criatura. Requiere salvacion de Destreza y causa dano radiante.",
    "Shillelagh": "Imbuyes un baston o garrote para atacar usando tu caracteristica magica y mejorar su dano.",
    "Shocking Grasp": "Ataque magico cuerpo a cuerpo de relampago. Puede impedir reacciones del objetivo por un turno.",
    "Spare the Dying": "Estabiliza a una criatura moribunda a toque.",
    "Thaumaturgy": "Manifestaciones divinas menores: voz potente, temblores, puertas que se abren, luces o senales dramaticas.",
    "True Strike": "Te concentras en un objetivo para preparar un ataque con ventaja en tu siguiente turno.",
    "Alarm": "Protege una zona y te avisa cuando una criatura entra.",
    "Animal Friendship": "Intentas calmar o encantar a una bestia para que no te ataque.",
    "Bane": "Varios enemigos hacen salvacion de Carisma; si fallan, restan a ataques y salvaciones.",
    "Bless": "Varios aliados suman un bono a ataques y tiradas de salvacion.",
    "Burning Hands": "Cono de fuego desde tus manos. Requiere salvacion de Destreza y causa dano de fuego.",
    "Charm Person": "Intentas encantar a un humanoide para que te trate amistosamente.",
    "Cure Wounds": "Curas puntos de golpe a una criatura que tocas.",
    "Detect Magic": "Percibes magia cercana y puedes identificar su escuela si la ves.",
    "Disguise Self": "Cambias tu apariencia con una ilusion durante un tiempo.",
    "Entangle": "Plantas y raices dificultan un area. Puede apresar criaturas con salvacion de Fuerza.",
    "Faerie Fire": "Marca criaturas u objetos con luz. Los ataques contra criaturas afectadas tienen ventaja.",
    "Feather Fall": "Varias criaturas caen lentamente y evitan o reducen el peligro de una caida.",
    "Find Familiar": "Invocas un familiar espiritual con forma animal que puede ayudarte y explorar.",
    "Guiding Bolt": "Ataque magico a distancia de dano radiante. El siguiente ataque contra el objetivo gana ventaja.",
    "Healing Word": "Curas a distancia con una palabra magica como accion adicional.",
    "Hex": "Maldices a una criatura: tus ataques le hacen dano extra y eliges una caracteristica para perjudicar.",
    "Identify": "Aprendes propiedades magicas de un objeto o efecto que examinas.",
    "Mage Armor": "Una criatura sin armadura obtiene una clase de armadura base magica.",
    "Magic Missile": "Proyectiles de fuerza que impactan automaticamente contra uno o varios objetivos.",
    "Shield": "Reaccion defensiva que sube mucho tu CA hasta tu siguiente turno y bloquea Magic Missile.",
    "Sleep": "Duerme criaturas en un area segun sus puntos de golpe actuales.",
    "Thunderwave": "Onda de trueno en area cercana. Empuja y causa dano de trueno si fallan salvacion.",
    "Aid": "Aumenta temporalmente los puntos de golpe maximos y actuales de varios aliados.",
    "Alter Self": "Cambias tu cuerpo para adaptarte: respiracion acuatica, apariencia o armas naturales.",
    "Barkskin": "La piel de una criatura se endurece y mantiene una CA minima mientras dure.",
    "Blur": "Tu imagen se distorsiona y dificulta que te acierten ataques.",
    "Calm Emotions": "Suprime miedo/encanto o calma hostilidad en un grupo.",
    "Darkness": "Crea oscuridad magica que bloquea vision normal y muchas luces.",
    "Enhance Ability": "Da ventaja en pruebas de una caracteristica y un beneficio menor relacionado.",
    "Flaming Sphere": "Esfera de fuego movil que dana criaturas cercanas o impactadas.",
    "Hold Person": "Paraliza a un humanoide si falla salvacion de Sabiduria.",
    "Invisibility": "Vuelve invisible a una criatura hasta que ataque, lance un conjuro ofensivo o termine el efecto.",
    "Lesser Restoration": "Elimina una condicion o enfermedad comun de una criatura.",
    "Moonbeam": "Columna de luz que dana a criaturas en el area y afecta especialmente a cambiaformas.",
    "Misty Step": "Te teletransportas una distancia corta a un espacio que puedas ver como accion adicional.",
    "Pass without Trace": "Tu grupo recibe un gran bono a Sigilo y deja menos rastros.",
    "Scorching Ray": "Lanzas varios rayos de fuego como ataques magicos a distancia.",
    "Silence": "Crea una zona donde no hay sonido; impide conjuros con componente verbal dentro.",
    "Spiritual Weapon": "Creas un arma magica flotante que ataca como accion adicional.",
    "Web": "Llena un area de telaranas dificiles de atravesar; puede restringir criaturas.",
    "Counterspell": "Reaccion para intentar interrumpir un conjuro que otra criatura esta lanzando.",
    "Dispel Magic": "Termina efectos magicos activos sobre una criatura, objeto o zona.",
    "Fear": "Cono de terror; criaturas que fallan salvacion sueltan objetos y huyen.",
    "Fireball": "Explosion de fuego en area grande. Requiere salvacion de Destreza.",
    "Fly": "Una criatura obtiene velocidad de vuelo mientras dure el conjuro.",
    "Haste": "Acelera a una criatura: mas velocidad, defensa y una accion limitada extra.",
    "Lightning Bolt": "Linea de relampago que dana a criaturas en su trayecto.",
    "Mass Healing Word": "Curas a varias criaturas a distancia como accion adicional.",
    "Plant Growth": "Hace crecer vegetacion para dificultar movimiento o mejorar tierras durante largo plazo.",
    "Revivify": "Devuelve a la vida a una criatura que murio hace muy poco.",
    "Spirit Guardians": "Espiritus rodean al lanzador, ralentizan enemigos y les causan dano.",
    "Tiny Hut": "Crea una cupula segura para descansar, opaca desde fuera y comoda dentro.",
    "Water Breathing": "Permite a varias criaturas respirar bajo el agua durante largo tiempo.",
    "Banishment": "Envias temporalmente a una criatura a otro plano o espacio extradimensional.",
    "Blight": "Drena energia vital de una criatura o planta con dano necrotico.",
    "Confusion": "Altera la mente de criaturas en area y puede hacerlas actuar al azar.",
    "Dimension Door": "Teletransporte largo del lanzador, con opcion de llevar a una criatura cercana.",
    "Freedom of Movement": "Una criatura ignora terreno dificil y resiste restricciones al movimiento.",
    "Greater Invisibility": "Vuelve invisible a una criatura aunque ataque o lance conjuros.",
    "Polymorph": "Transforma a una criatura en una bestia si falla o acepta el efecto.",
    "Wall of Fire": "Muro ardiente que bloquea, divide y dana a quienes se acerquen o lo crucen.",
    "Cloudkill": "Nube venenosa movil que dana a criaturas dentro del area.",
    "Commune": "Haces preguntas a una entidad divina y recibes respuestas breves.",
    "Cone of Cold": "Cono amplio de frio intenso con salvacion de Constitucion.",
    "Dominate Person": "Controlas mentalmente a un humanoide si falla salvacion de Sabiduria.",
    "Flame Strike": "Columna de fuego divino que causa dano de fuego y radiante.",
    "Greater Restoration": "Elimina efectos graves como agotamiento, petrificacion, maldiciones o reducciones importantes.",
    "Mass Cure Wounds": "Cura a varias criaturas en un area.",
    "Raise Dead": "Devuelve a la vida a una criatura muerta recientemente, con limitaciones.",
    "Scrying": "Observas a distancia a una criatura o lugar si el objetivo falla la salvacion.",
    "Wall of Stone": "Crea paneles de piedra que pueden bloquear, encerrar o formar estructuras.",
    "Chain Lightning": "Relampago que salta desde un objetivo principal a otros cercanos.",
    "Disintegrate": "Rayo destructivo de fuerza; si reduce a 0 puede desintegrar el objetivo.",
    "Globe of Invulnerability": "Barrera que bloquea conjuros de niveles bajos lanzados desde fuera.",
    "Heal": "Restaura muchos puntos de golpe y elimina varias condiciones.",
    "Heroes' Feast": "Banquete magico que fortalece al grupo y lo protege contra veneno y miedo.",
    "Mass Suggestion": "Implantas una orden razonable en varias criaturas por largo tiempo.",
    "Sunbeam": "Rayo de luz radiante repetible que dana y puede cegar.",
    "Teleport": "Transporta al grupo a un destino conocido, con riesgo segun familiaridad.",
    "Fire Storm": "Llamas en varias zonas conectadas que causan dano de fuego.",
    "Plane Shift": "Viajas a otro plano o intentas desterrar a una criatura con ataque y salvacion.",
    "Regenerate": "Cura con el tiempo y permite recuperar partes del cuerpo perdidas.",
    "Resurrection": "Devuelve a la vida a una criatura muerta hace mas tiempo que Raise Dead.",
    "Reverse Gravity": "Invierte la gravedad en una zona y hace caer hacia arriba a las criaturas.",
    "Dominate Monster": "Controlas mentalmente a una criatura de cualquier tipo si falla salvacion.",
    "Earthquake": "Sacudida enorme que derriba, abre grietas y puede danar estructuras.",
    "Holy Aura": "Aura protectora para aliados: ventaja en salvaciones y desventaja a ataques enemigos.",
    "Power Word Stun": "Aturde a una criatura con pocos puntos de golpe actuales, sin tirada inicial.",
    "Sunburst": "Estallido de luz solar que dana y puede cegar en area grande.",
    "Astral Projection": "Proyecta cuerpos astrales para viajar por el Plano Astral.",
    "Foresight": "Otorga percepcion sobrenatural: ventaja para el aliado y desventaja para atacantes.",
    "Gate": "Abre un portal planar o llama a una criatura especifica desde otro plano.",
    "Mass Heal": "Distribuye una gran cantidad de curacion entre varias criaturas.",
    "Meteor Swarm": "Cuatro impactos enormes que explotan y causan dano masivo de fuego y contundente.",
    "Power Word Kill": "Mata instantaneamente a una criatura con pocos puntos de golpe actuales.",
    "Time Stop": "Detienes el tiempo brevemente y tomas varios turnos seguidos con restricciones.",
    "True Resurrection": "Devuelve a la vida con restauracion completa, incluso sin cuerpo si se cumplen condiciones.",
    "Wish": "El conjuro mas flexible: replica conjuros o produce efectos excepcionales con riesgo a criterio del DM.",
  };
  const mechanics = {
    "Acid Splash": "Dano: 1d6 acido. Mejora como truco a 2d6 nivel 5, 3d6 nivel 11 y 4d6 nivel 17.",
    "Blade Ward": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Chill Touch": "Dano: 1d8 necrotico. Mejora como truco a 2d8 nivel 5, 3d8 nivel 11 y 4d8 nivel 17.",
    "Dancing Lights": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Druidcraft": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Eldritch Blast": "Dano: 1d10 fuerza por rayo. Mejora como truco: 2 rayos nivel 5, 3 nivel 11 y 4 nivel 17.",
    "Fire Bolt": "Dano: 1d10 fuego. Mejora como truco a 2d10 nivel 5, 3d10 nivel 11 y 4d10 nivel 17.",
    "Guidance": "Dano: sin dano directo. Bono: +1d4 a una prueba. Mejora: no escala con nivel.",
    "Light": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Mage Hand": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Mending": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Minor Illusion": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Poison Spray": "Dano: 1d12 veneno. Mejora como truco a 2d12 nivel 5, 3d12 nivel 11 y 4d12 nivel 17.",
    "Prestidigitation": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Produce Flame": "Dano: 1d8 fuego si se lanza como ataque. Mejora como truco a 2d8 nivel 5, 3d8 nivel 11 y 4d8 nivel 17.",
    "Ray of Frost": "Dano: 1d8 frio. Mejora como truco a 2d8 nivel 5, 3d8 nivel 11 y 4d8 nivel 17.",
    "Resistance": "Dano: sin dano directo. Bono: +1d4 a una salvacion. Mejora: no escala con nivel.",
    "Sacred Flame": "Dano: 1d8 radiante. Mejora como truco a 2d8 nivel 5, 3d8 nivel 11 y 4d8 nivel 17.",
    "Shillelagh": "Dano: el arma usa 1d8 y tu caracteristica magica. Mejora: no escala con nivel.",
    "Shocking Grasp": "Dano: 1d8 relampago. Mejora como truco a 2d8 nivel 5, 3d8 nivel 11 y 4d8 nivel 17.",
    "Spare the Dying": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Thaumaturgy": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "True Strike": "Dano: sin dano directo. Mejora: no escala con nivel.",
    "Alarm": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Animal Friendship": "Dano: sin dano directo. A mayor nivel: +1 bestia objetivo por cada slot superior.",
    "Bane": "Dano: sin dano directo. Penaliza 1d4. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Bless": "Dano: sin dano directo. Bono: +1d4. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Burning Hands": "Dano: 3d6 fuego en cono. A mayor nivel: +1d6 por cada slot superior.",
    "Charm Person": "Dano: sin dano directo. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Cure Wounds": "Curacion: 1d8 + modificador magico. A mayor nivel: +1d8 por cada slot superior.",
    "Detect Magic": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Disguise Self": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Entangle": "Dano: sin dano directo. Controla area con salvacion de Fuerza. A mayor nivel: no gana efecto por slot superior.",
    "Faerie Fire": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Feather Fall": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Find Familiar": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Guiding Bolt": "Dano: 4d6 radiante. A mayor nivel: +1d6 por cada slot superior.",
    "Healing Word": "Curacion: 1d4 + modificador magico. A mayor nivel: +1d4 por cada slot superior.",
    "Hex": "Dano: +1d6 necrotico cuando golpeas al objetivo. A mayor nivel: aumenta duracion, no los dados.",
    "Identify": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Mage Armor": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Magic Missile": "Dano: 3 dardos de 1d4+1 fuerza. A mayor nivel: +1 dardo por cada slot superior.",
    "Shield": "Dano: sin dano directo. Defensa: +5 CA hasta tu siguiente turno. A mayor nivel: no gana efecto por slot superior.",
    "Sleep": "Afecta 5d8 puntos de golpe. A mayor nivel: +2d8 por cada slot superior.",
    "Thunderwave": "Dano: 2d8 trueno. A mayor nivel: +1d8 por cada slot superior.",
    "Aid": "Aumenta PG maximos y actuales en 5. A mayor nivel: +5 PG por cada slot superior.",
    "Alter Self": "Dano: armas naturales 1d6. A mayor nivel: no gana efecto por slot superior.",
    "Barkskin": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Blur": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Calm Emotions": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Darkness": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Enhance Ability": "Dano: sin dano directo. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Flaming Sphere": "Dano: 2d6 fuego. A mayor nivel: +1d6 por cada slot superior.",
    "Hold Person": "Dano: sin dano directo. A mayor nivel: +1 humanoide objetivo por cada slot superior.",
    "Invisibility": "Dano: sin dano directo. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Lesser Restoration": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Moonbeam": "Dano: 2d10 radiante. A mayor nivel: +1d10 por cada slot superior.",
    "Misty Step": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Pass without Trace": "Dano: sin dano directo. Bono: +10 a Sigilo. A mayor nivel: no gana efecto por slot superior.",
    "Scorching Ray": "Dano: 3 rayos de 2d6 fuego. A mayor nivel: +1 rayo por cada slot superior.",
    "Silence": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Spiritual Weapon": "Dano: 1d8 fuerza + modificador magico. A mayor nivel: +1d8 por cada 2 niveles de slot superiores.",
    "Web": "Dano: sin dano directo. Controla y puede restringir. A mayor nivel: no gana efecto por slot superior.",
    "Counterspell": "Dano: sin dano directo. A mayor nivel: interrumpe automaticamente conjuros de nivel igual o menor al slot usado.",
    "Dispel Magic": "Dano: sin dano directo. A mayor nivel: disipa automaticamente efectos de nivel igual o menor al slot usado.",
    "Fear": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Fireball": "Dano: 8d6 fuego. A mayor nivel: +1d6 por cada slot superior.",
    "Fly": "Dano: sin dano directo. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Haste": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Lightning Bolt": "Dano: 8d6 relampago. A mayor nivel: +1d6 por cada slot superior.",
    "Mass Healing Word": "Curacion: 1d4 + modificador magico a varias criaturas. A mayor nivel: +1d4 por cada slot superior.",
    "Plant Growth": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Revivify": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Spirit Guardians": "Dano: 3d8 radiante o necrotico. A mayor nivel: +1d8 por cada slot superior.",
    "Tiny Hut": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Water Breathing": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Banishment": "Dano: sin dano directo. A mayor nivel: +1 criatura objetivo por cada slot superior.",
    "Blight": "Dano: 8d8 necrotico. A mayor nivel: +1d8 por cada slot superior.",
    "Confusion": "Dano: sin dano directo. A mayor nivel: aumenta el radio del area.",
    "Dimension Door": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Freedom of Movement": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Greater Invisibility": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Polymorph": "Dano: depende de la forma elegida. A mayor nivel: no gana efecto por slot superior.",
    "Wall of Fire": "Dano: 5d8 fuego. A mayor nivel: +1d8 por cada slot superior.",
    "Cloudkill": "Dano: 5d8 veneno. A mayor nivel: +1d8 por cada slot superior.",
    "Commune": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Cone of Cold": "Dano: 8d8 frio. A mayor nivel: +1d8 por cada slot superior.",
    "Dominate Person": "Dano: sin dano directo. A mayor nivel: aumenta la duracion.",
    "Flame Strike": "Dano: 4d6 fuego + 4d6 radiante. A mayor nivel: +1d6 fuego o radiante por cada slot superior.",
    "Greater Restoration": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Mass Cure Wounds": "Curacion: 3d8 + modificador magico a varias criaturas. A mayor nivel: +1d8 por cada slot superior.",
    "Raise Dead": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Scrying": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Wall of Stone": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Chain Lightning": "Dano: 10d8 relampago. A mayor nivel: +1 objetivo secundario por cada slot superior.",
    "Disintegrate": "Dano: 10d6 + 40 fuerza. A mayor nivel: +3d6 por cada slot superior.",
    "Globe of Invulnerability": "Dano: sin dano directo. A mayor nivel: bloquea conjuros de nivel mas alto segun el slot usado.",
    "Heal": "Curacion: 70 PG. A mayor nivel: +10 PG por cada slot superior.",
    "Heroes' Feast": "Dano: sin dano directo. Beneficio: +2d10 PG maximos. A mayor nivel: no gana efecto por slot superior.",
    "Mass Suggestion": "Dano: sin dano directo. A mayor nivel: aumenta la duracion.",
    "Sunbeam": "Dano: 6d8 radiante. A mayor nivel: no gana efecto por slot superior.",
    "Teleport": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Fire Storm": "Dano: 7d10 fuego. A mayor nivel: no gana efecto por slot superior.",
    "Plane Shift": "Dano: sin dano directo. Puede desterrar con ataque y salvacion. A mayor nivel: no gana efecto por slot superior.",
    "Regenerate": "Curacion: 4d8 + 15 inicial y luego recuperacion continua. A mayor nivel: no gana efecto por slot superior.",
    "Resurrection": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Reverse Gravity": "Dano: por caida segun altura y entorno. A mayor nivel: no gana efecto por slot superior.",
    "Dominate Monster": "Dano: sin dano directo. A mayor nivel: aumenta la duracion.",
    "Earthquake": "Dano: variable por grietas, caidas y estructuras. A mayor nivel: no gana efecto por slot superior.",
    "Holy Aura": "Dano: sin dano directo. Puede cegar a atacantes concretos. A mayor nivel: no gana efecto por slot superior.",
    "Power Word Stun": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Sunburst": "Dano: 12d6 radiante. A mayor nivel: no gana efecto por slot superior.",
    "Astral Projection": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Foresight": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Gate": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Mass Heal": "Curacion: reparte 700 PG. A mayor nivel: no gana efecto por slot superior.",
    "Meteor Swarm": "Dano: 20d6 fuego + 20d6 contundente. A mayor nivel: no gana efecto por slot superior.",
    "Power Word Kill": "Dano: no tira dados; mata si el objetivo esta bajo el umbral de PG. A mayor nivel: no gana efecto por slot superior.",
    "Time Stop": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "True Resurrection": "Dano: sin dano directo. A mayor nivel: no gana efecto por slot superior.",
    "Wish": "Dano/curacion: variable segun el efecto elegido. A mayor nivel: no aplica, es de nivel 9.",
  };
  const description = notes[name] || "Descripcion breve pendiente. Completa alcance, componentes, tirada o salvacion y efecto en tu mesa.";
  return mechanics[name] ? `${description}\n${mechanics[name]}` : description;
}

function dnd5eSpellPicker(index, level) {
  const spells = dnd5eSpellLibraryByLevel(level);
  return `<details class="dnd5e-spell-picker">
    <summary>Biblioteca rapida</summary>
    <div>${DND5E_SPELL_CLASSES.map((className) => {
      const classSpells = spells.filter((spell) => spell.classes.includes(className));
      if (!classSpells.length) return "";
      return `<details><summary>${className} <span>${classSpells.length}</span></summary><div>${classSpells.map((spell) => `<button type="button" data-action="load-5e-spell" data-block-index="${index}" data-spell-level="${level}" data-spell-name="${escapeAttr(spell.name)}" data-spell-notes="${escapeAttr(dnd5eSpellNotes(spell.name))}">${escapeHtml(spell.name)}</button>`).join("")}</div></details>`;
    }).join("")}</div>
  </details>`;
}

function characterWeaponEditorRow(blockIndex, weapon, rowKey) {
  const prefix = `block_sheet_${blockIndex}_weapon_${rowKey}`;
  return `<div class="dnd5e-weapon-editor-row" data-5e-weapon-row>
    <input type="hidden" name="${prefix}_id" value="${escapeAttr(weapon.id || uid("weapon"))}" />
    <label><span>Arma</span><input name="${prefix}_name" value="${escapeAttr(weapon.name || "")}" placeholder="Espada larga" /></label>
    <label><span>Dado de golpe</span><input name="${prefix}_damageDice" value="${escapeAttr(weapon.damageDice || "")}" placeholder="1d8" /></label>
    <label><span>Bonificador</span><select name="${prefix}_ability">${DND5E_ATTACK_ABILITIES.map(([key, label]) => `<option value="${key}" ${(weapon.ability || "str") === key ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <label><span>Tipo</span><select name="${prefix}_damageType">${DND5E_DAMAGE_TYPES.map((type) => `<option value="${escapeAttr(type)}" ${(weapon.damageType || "Cortante") === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></label>
    <label class="dnd5e-weapon-proficient"><input name="${prefix}_proficient" type="checkbox" ${(weapon.proficient ?? true) ? "checked" : ""} /><span>Competente</span></label>
    <label><span>Extra</span><input name="${prefix}_bonus" type="number" value="${Number(weapon.bonus) || 0}" /></label>
    <label class="dnd5e-weapon-notes"><span>Notas</span><input name="${prefix}_notes" value="${escapeAttr(weapon.notes || "")}" placeholder="Alcance, municion, propiedades..." /></label>
    <button type="button" data-action="remove-5e-weapon" aria-label="Quitar arma">×</button>
  </div>`;
}

function renderCharacterSheet5e(block) {
  const sheet = normalizedCharacterSheet5e(block);
  const proficiency = dnd5eProficiencyBonus(sheet.level);
  const abilityModifier = (key) => dnd5eModifier(sheet.abilities[key]);
  const armorClass = (Number(sheet.armorBase) || 10) + abilityModifier("dex") + (Number(sheet.armorBonus) || 0);
  const skillValue = (key, ability) => abilityModifier(ability) + (sheet.skillProficiencies.includes(key) ? proficiency : 0);
  const passivePerception = 10 + skillValue("perception", "wis");
  const safeText = (value, fallback = "-") => escapeHtml(String(value || fallback)).replaceAll("\n", "<br />");
  const spellAbilityModifier = abilityModifier(sheet.spellcastingAbility);
  const spellSaveDc = 8 + proficiency + spellAbilityModifier;
  const spellAttackBonus = proficiency + spellAbilityModifier;
  const weaponRows = sheet.weapons.map((weapon) => {
    const ability = DND5E_ATTACK_ABILITIES.find(([key]) => key === weapon.ability) || DND5E_ATTACK_ABILITIES[0];
    const total = abilityModifier(ability[0]) + (weapon.proficient ? proficiency : 0) + (Number(weapon.bonus) || 0);
    const damageMod = abilityModifier(ability[0]);
    return `<tr><td>${escapeHtml(weapon.name || "Arma")}</td><td>${signedDnd5e(total)}</td><td>${escapeHtml(weapon.damageDice || "-")}${damageMod ? ` ${signedDnd5e(damageMod)}` : ""} ${escapeHtml(weapon.damageType || "")}</td><td>${escapeHtml(ability[1])}${weapon.notes ? `<br /><small>${safeText(weapon.notes, "")}</small>` : ""}</td></tr>`;
  }).join("");

  return `<div class="dnd5e-sheet dnd5e-sheet-view">
    <div class="dnd5e-sheet-banner">
      <div class="dnd5e-character-name"><strong>${safeText(sheet.characterName, "Personaje sin nombre")}</strong><small>NOMBRE DEL PERSONAJE</small></div>
      <div class="dnd5e-identity-grid">
        <span><b>${safeText(sheet.className)} ${sheet.level}</b><small>CLASE Y NIVEL</small></span>
        <span><b>${safeText(sheet.background)}</b><small>TRASFONDO</small></span>
        <span><b>${safeText(sheet.playerName)}</b><small>JUGADOR</small></span>
        <span><b>${safeText(sheet.race)}</b><small>RAZA</small></span>
        <span><b>${safeText(sheet.alignment)}</b><small>ALINEAMIENTO</small></span>
        <span><b>${safeText(sheet.experience)}</b><small>EXPERIENCIA</small></span>
      </div>
    </div>
    <nav class="dnd5e-page-tabs"><button class="active" type="button" data-action="set-5e-sheet-page" data-page="main">Ficha principal</button><button type="button" data-action="set-5e-sheet-page" data-page="spells">Ataques y conjuros</button></nav>
    <div data-5e-page-panel="main"><div class="dnd5e-sheet-grid">
      <div class="dnd5e-abilities">${DND5E_ABILITIES.map(([key, label]) => `<div class="dnd5e-ability"><small>${label.toUpperCase()}</small><strong>${signedDnd5e(abilityModifier(key))}</strong><span>${sheet.abilities[key]}</span></div>`).join("")}</div>
      <div class="dnd5e-checks">
        <div class="dnd5e-inspiration"><span class="${sheet.inspiration ? "active" : ""}">${sheet.inspiration ? "X" : ""}</span><b>INSPIRACION</b></div>
        <div class="dnd5e-proficiency"><strong>${signedDnd5e(proficiency)}</strong><span>BONO DE COMPETENCIA</span></div>
        <section class="dnd5e-paper-box"><h4>TIRADAS DE SALVACION</h4>${DND5E_ABILITIES.map(([key, label]) => `<div class="dnd5e-check-row"><i class="${sheet.saveProficiencies.includes(key) ? "trained" : ""}"></i><b>${signedDnd5e(abilityModifier(key) + (sheet.saveProficiencies.includes(key) ? proficiency : 0))}</b><span>${label}</span></div>`).join("")}</section>
        <details class="dnd5e-paper-box dnd5e-skills"><summary>HABILIDADES <small>desplegar</small></summary><div>${DND5E_SKILLS.map(([key, label, ability]) => `<div class="dnd5e-check-row"><i class="${sheet.skillProficiencies.includes(key) ? "trained" : ""}"></i><b>${signedDnd5e(skillValue(key, ability))}</b><span>${label} <small>(${DND5E_ABILITIES.find(([item]) => item === ability)?.[2]})</small></span></div>`).join("")}</div></details>
        <div class="dnd5e-passive"><strong>${passivePerception}</strong><span>SABIDURIA PASIVA (PERCEPCION)</span></div>
      </div>
      <div class="dnd5e-main-sheet">
        <div class="dnd5e-combat-row">
          <div><strong>${armorClass}</strong><span>CLASE DE ARMADURA</span></div>
          <div><strong>${signedDnd5e(abilityModifier("dex"))}</strong><span>INICIATIVA</span></div>
          <div><strong>${Number(sheet.speed) || 30}</strong><span>VELOCIDAD (PIES)</span></div>
        </div>
        <div class="dnd5e-hp-grid">
          <div><small>PG MAXIMOS</small><strong>${safeText(sheet.maxHp)}</strong></div>
          <div><small>PG ACTUALES</small><strong>${safeText(sheet.currentHp)}</strong></div>
          <div><small>PG TEMPORALES</small><strong>${safeText(sheet.temporaryHp)}</strong></div>
          <div><small>DADOS DE GOLPE</small><strong>${safeText(sheet.hitDice)}</strong></div>
          <div class="dnd5e-death-save"><small>SALVACIONES EXITOSAS</small><span>${Array.from({ length: 3 }, (_, slot) => `<i class="${slot < Number(sheet.deathSuccesses) ? "filled" : ""}"></i>`).join("")}</span></div>
          <div class="dnd5e-death-save"><small>SALVACIONES FALLIDAS</small><span>${Array.from({ length: 3 }, (_, slot) => `<i class="${slot < Number(sheet.deathFailures) ? "filled" : ""}"></i>`).join("")}</span></div>
        </div>
        <div class="dnd5e-notes-grid">
          ${[["Rasgos de personalidad", sheet.personality], ["Ideales", sheet.ideals], ["Vinculos", sheet.bonds], ["Defectos", sheet.flaws], ["Otras competencias e idiomas", sheet.proficiencies], ["Rasgos y capacidades", sheet.features]].map(([label, value]) => `<section class="dnd5e-paper-box"><div>${safeText(value, "Sin completar")}</div><h4>${label.toUpperCase()}</h4></section>`).join("")}
        </div>
      </div>
    </div></div>
    <div class="dnd5e-spell-page" data-5e-page-panel="spells" hidden>
      <div class="dnd5e-spell-head"><section><strong>${DND5E_ABILITIES.find(([key]) => key === sheet.spellcastingAbility)?.[2]}</strong><span>CARACTERISTICA MAGICA</span></section><section><strong>${spellSaveDc}</strong><span>CD SALVACION</span></section><section><strong>${signedDnd5e(spellAttackBonus)}</strong><span>BONO DE ATAQUE</span></section></div>
      <section class="dnd5e-paper-box dnd5e-attacks">${weaponRows ? `<table><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th><th>Mod.</th></tr></thead><tbody>${weaponRows}</tbody></table>` : `<div>${safeText(sheet.attacks, "Sin armas cargadas")}</div>`}<h4>ARMAS Y ATAQUES</h4></section>
      <div class="dnd5e-spell-levels">${Array.from({ length: 10 }, (_, level) => `<details class="dnd5e-spell-level" ${level === 0 ? "open" : ""}><summary><b>${level === 0 ? "Trucos" : `Nivel ${level}`}</b><span>${sheet.spells[level].length} conjuros</span></summary><div>${sheet.spells[level].map((spell) => `<details class="dnd5e-spell"><summary>${escapeHtml(spell.name)}</summary><p>${safeText(spell.notes, "Sin notas")}</p></details>`).join("") || `<p class="dnd5e-empty-spells">Sin conjuros en este nivel.</p>`}</div></details>`).join("")}</div>
    </div>
  </div>`;
}

function renderStatBlock5e(block, cards, currentId) {
  const stat = normalizedStatBlock5e(block);
  const detailRows = [
    ["Tiradas de salvacion", stat.savingThrows],
    ["Habilidades", stat.skills],
    ["Sentidos", stat.senses],
    ["Idiomas", stat.languages],
    ["Desafio", stat.challenge],
  ].filter(([, value]) => String(value || "").trim());
  const proseSection = (title, value) => String(value || "").trim()
    ? `<section class="dnd5e-statblock-section"><h3>${title}</h3><div>${linkMentions(value, cards, currentId)}</div></section>`
    : "";
  return `<article class="dnd5e-statblock">
    <header>
      <h2>${escapeHtml(block.title || "Criatura sin nombre")}</h2>
      <p>${escapeHtml(stat.subtitle)}</p>
    </header>
    <div class="dnd5e-stat-rule"></div>
    <dl class="dnd5e-statblock-vitals">
      <div><dt>Clase de Armadura</dt><dd>${escapeHtml(stat.armorClass)}</dd></div>
      <div><dt>Puntos de Golpe</dt><dd>${escapeHtml(stat.hitPoints)}</dd></div>
      <div><dt>Velocidad</dt><dd>${escapeHtml(stat.speed)}</dd></div>
    </dl>
    <div class="dnd5e-stat-rule"></div>
    <div class="dnd5e-statblock-abilities">
      ${DND5E_ABILITIES.map(([key, , short]) => `<div><b>${short}</b><span>${stat.abilities[key]} (${signedDnd5e(dnd5eModifier(stat.abilities[key]))})</span></div>`).join("")}
    </div>
    <div class="dnd5e-stat-rule"></div>
    ${detailRows.length ? `<dl class="dnd5e-statblock-details">${detailRows.map(([label, value]) => `<div><dt>${label}</dt><dd>${linkMentions(value, cards, currentId)}</dd></div>`).join("")}</dl>` : ""}
    ${proseSection("Rasgos", stat.traits)}
    ${proseSection("Acciones", stat.actions)}
    ${proseSection("Reacciones", stat.reactions)}
  </article>`;
}

function wikiPropertyValue(card, labels) {
  const labelSet = labels.map(normalizeSearchText);
  return normalizedWikiPropertyItems(card)
    .find((item) => labelSet.some((label) => normalizeSearchText(item.label).includes(label)))?.value || "";
}

function wikiHistoryMoment(card) {
  return wikiPropertyValue(card, ["momento historico", "cronologia", "periodo", "epoca", "fecha", "ano", "año"]);
}

function isWikiFamilyProperty(item) {
  const label = normalizeSearchText(item.label);
  return label.includes("familiar") || label.includes("familia") || label.includes("parentesco");
}

function wikiCardsFromPropertyValue(value, cards) {
  const normalizedValue = normalizeSearchText(value);
  return [...new Map(cards
    .flatMap((card) => [card.title, ...(card.aliases || [])].map((name) => ({ card, name })))
    .filter(({ name }) => normalizeSearchText(name).length > 2 && normalizedValue.includes(normalizeSearchText(name)))
    .sort((a, b) => b.name.length - a.name.length)
    .map(({ card }) => [card.id, card])).values()];
}

function wikiFamilyConnections(cards) {
  return cards.flatMap((card) => normalizedWikiPropertyItems(card)
    .filter(isWikiFamilyProperty)
    .flatMap((item) => wikiCardsFromPropertyValue(item.value, cards).map((target) => ({ sourceId: card.id, target, item })))
    .filter((connection) => connection.target.id !== card.id)
    .map((connection) => ({ ...connection, targetId: connection.target.id })));
}

function renderWikiFamilyTree(card, cards) {
  const connections = wikiFamilyConnections(cards);
  const connected = new Map();
  connections.forEach((connection) => {
    if (!connected.has(connection.sourceId)) connected.set(connection.sourceId, []);
    if (!connected.has(connection.targetId)) connected.set(connection.targetId, []);
    connected.get(connection.sourceId).push({ id: connection.targetId, item: connection.item });
    connected.get(connection.targetId).push({ id: connection.sourceId, item: connection.item });
  });
  const byId = new Map(cards.map((item) => [item.id, item]));
  const levels = [[{ id: card.id, item: null }]];
  const seen = new Set([card.id]);
  while (levels.at(-1)?.length && levels.length < 6) {
    const next = [];
    levels.at(-1).forEach((entry) => (connected.get(entry.id) || []).forEach((neighbor) => {
      if (!seen.has(neighbor.id)) {
        seen.add(neighbor.id);
        next.push(neighbor);
      }
    }));
    if (!next.length) break;
    levels.push(next);
  }
  if (levels.length === 1) {
    return `<div class="wiki-family-empty">Agregá una propiedad <strong>Familiar</strong> y escribí el nombre o alias de otra ficha para construir este árbol.</div>`;
  }
  return `<div class="wiki-family-tree" aria-label="Árbol familiar de ${escapeAttr(card.title)}">
    ${levels.map((generation, index) => `<div class="wiki-family-generation ${index === 0 ? "root" : ""}"><small>${index === 0 ? "FICHA PRINCIPAL" : index === 1 ? "FAMILIA VINCULADA" : `FAMILIA · NIVEL ${index}`}</small><div>${generation.map((entry) => {
      const relative = byId.get(entry.id);
      if (!relative) return "";
      return `<button type="button" data-action="select-wiki-card" data-id="${escapeAttr(relative.id)}"><span>${wikiType(relative).icon}</span><strong>${escapeHtml(relative.title)}</strong>${entry.item?.value ? `<em>${escapeHtml(entry.item.label)}</em>` : ""}</button>`;
    }).join("")}</div></div>`).join("")}
  </div>`;
}

function renderWikiTimeline(card, block, cards, currentId) {
  const moment = wikiHistoryMoment(card);
  const events = String(block.text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  return `<section class="wiki-content-block wiki-content-timeline"><div class="wiki-content-heading"><span>↝ LÍNEA DE TIEMPO</span><h2>${escapeHtml(block.title || "Línea de tiempo")}</h2></div><div class="wiki-timeline-placement"><span>UBICACIÓN EN LA HISTORIA DEL MUNDO</span><strong>${moment ? linkMentions(moment, cards, currentId) : "Sin fecha o período definido"}</strong><small>${moment ? `Los hechos de ${escapeHtml(card.title)} se sitúan en este momento.` : "Agregá una propiedad Fecha, Período o Momento histórico a esta ficha."}</small></div><ol>${events.map((line) => `<li>${linkMentions(line, cards, currentId)}</li>`).join("") || "<li>Agregá un hecho por línea para detallar los eventos de esta ficha.</li>"}</ol></section>`;
}

function renderWikiContentBlock(block, cards, currentId) {
  const type = WIKI_CONTENT_TYPES[block.type] || WIKI_CONTENT_TYPES.text;
  const title = escapeHtml(block.title || type.title);
  const text = linkMentions(block.text || "", cards, currentId);
  if (block.type === "map") {
    const campaign = campaignForWikiCard(currentId);
    const linkedMap = mapsFor(campaign).find((map) => map.cardId === currentId);
    const canManage = campaign ? canManageCampaign(campaign, currentUser()?.id) : false;
    const mapImage = mapImageFor(campaign, linkedMap);
    return `<section class="wiki-content-block wiki-content-map">
      <div class="wiki-content-heading"><span>${type.icon} ${escapeHtml(type.label.toUpperCase())}</span><h2>${title}</h2></div>
      ${mapImage ? `<button class="wiki-map-preview" data-action="go-to-map" data-id="${linkedMap.id}"><img src="${escapeAttr(mapImage)}" alt="${escapeAttr(block.title || type.label)}" loading="lazy" /></button>` : `<div class="wiki-content-placeholder"><span>${type.icon}</span><small>${linkedMap ? "TodavÃ­a no hay imagen cargada para este mapa." : "CreÃ¡ un mapa interactivo para esta ficha."}</small>${renderWikiMapUploadControl(linkedMap, canManage)}</div>`}
      ${block.text ? `<p>${text}</p>` : ""}
    </section>`;
  }
  if (block.type === "image" || block.type === "map") {
    return `<section class="wiki-content-block wiki-content-${block.type}">
      <div class="wiki-content-heading"><span>${type.icon} ${escapeHtml(type.label.toUpperCase())}</span><h2>${title}</h2></div>
      ${block.url ? `<img src="${escapeAttr(block.url)}" alt="${escapeAttr(block.title || type.label)}" loading="lazy" />` : `<div class="wiki-content-placeholder"><span>${type.icon}</span><small>Agregá una imagen para este ${block.type === "map" ? "mapa" : "bloque"}.</small></div>`}
      ${block.text ? `<p>${text}</p>` : ""}
    </section>`;
  }
  if (block.type === "timeline") {
    return renderWikiTimeline(cards.find((card) => card.id === currentId) || { title: "Esta ficha", propertyItems: [] }, block, cards, currentId);
  }
  if (block.type === "familyTree") {
    const card = cards.find((item) => item.id === currentId) || { id: currentId, title: "Esta ficha", propertyItems: [] };
    return `<section class="wiki-content-block wiki-content-family"><div class="wiki-content-heading"><span>${type.icon} ${escapeHtml(type.label.toUpperCase())}</span><h2>${title}</h2></div>${renderWikiFamilyTree(card, cards)}</section>`;
  }
  if (block.type === "characterSheet5e") {
    return `<section class="wiki-content-block wiki-content-sheet wiki-content-character-sheet"><div class="wiki-content-heading"><span>${type.icon} ${escapeHtml(type.label.toUpperCase())}</span><h2>${title}</h2></div>${renderCharacterSheet5e(block)}</section>`;
  }
  if (block.type === "statBlock5e") {
    return `<section class="wiki-content-block wiki-content-statblock">${renderStatBlock5e(block, cards, currentId)}</section>`;
  }
  return `<section class="wiki-content-block wiki-description"><div class="wiki-content-heading"><span>${type.icon} ${escapeHtml(type.label.toUpperCase())}</span><h2>${title}</h2></div><p>${text || "Sin texto todavía."}</p></section>`;
}

function renderWikiSectionShell({ section, kicker, title, description, sidebar, main, aside, primaryAction = "" }) {
  return `
    <section class="wiki-management-page ${section ? `wiki-${section}-page` : ""}">
      <aside class="wiki-management-sidebar">
        <div class="wiki-section-title">
          <span>${escapeHtml(kicker)}</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
        ${renderWikiSectionNav(section)}
        ${sidebar || ""}
      </aside>
      <section class="wiki-management-main">
        <div class="wiki-section-toolbar">
          <div><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(title)}</strong></div>
          ${primaryAction}
        </div>
        ${main}
      </section>
      ${aside ? `<aside class="wiki-management-aside">${aside}</aside>` : ""}
    </section>
  `;
}

function renderWikiSectionNav(activeSection) {
  const items = [
    ["home", "⌂", "Inicio", "set-wiki-view", "home"],
    ["cards", "◈", "Tarjetas", "set-wiki-view", "cards"],
    ["characters", "♙", "Personajes", "set-tab", "characters"],
    ["members", "♧", "Jugadores", "set-tab", "members"],
    ["settings", "⚙", "Ajustes", "set-tab", "settings"],
  ];
  return `
    <div class="wiki-section-nav">
      ${items.map(([key, icon, label, action, value]) => {
        const attributes = action === "set-tab" ? `data-tab="${value}"` : `data-view="${value}"`;
        return `<button class="${activeSection === key ? "active" : ""}" data-action="${action}" ${attributes}><span>${icon}</span>${label}</button>`;
      }).join("")}
    </div>
  `;
}

function renderWikiMetric(label, value) {
  return `<div class="wiki-section-metric"><b>${escapeHtml(String(value))}</b><span>${escapeHtml(label)}</span></div>`;
}

function renderWikiCharactersPage(campaign, role, canManage) {
  const userId = currentUser().id;
  const visibleCharacters = canManage
    ? campaign.characters
    : campaign.characters.filter((character) => character.ownerId === userId);
  const main = visibleCharacters.length
    ? `<div class="wiki-record-list">${visibleCharacters.map((character) => renderWikiCharacterRecord(character, campaign, canManage)).join("")}</div>`
    : `<div class="wiki-panel-empty"><span>♙</span><h2>No hay personajes visibles</h2><p>Crea el primero para empezar a poblar esta campana.</p></div>`;
  const sidebar = `
    <div class="wiki-section-metrics">
      ${renderWikiMetric("personajes", campaign.characters.length)}
      ${renderWikiMetric("visibles", visibleCharacters.length)}
      ${renderWikiMetric("rol", roleLabel(role))}
    </div>
  `;
  const aside = `
    <div class="wiki-info-panel">
      <span>PERMISOS</span>
      <p>${canManage ? "Owner y editor pueden revisar todos los personajes de la campana." : "Podes editar los personajes que te pertenecen."}</p>
    </div>
    <div class="wiki-info-panel">
      <span>ARCHIVO</span>
      <p>${wikiCardsFor(campaign).length} fichas de wiki disponibles para conectar el trasfondo con los personajes.</p>
    </div>
  `;
  return renderWikiSectionShell({
    section: "characters",
    kicker: "PERSONAJES",
    title: "Personajes",
    description: "Fichas narrativas de la mesa, ordenadas con el mismo marco de campaña.",
    sidebar,
    main,
    aside,
    primaryAction: `<button class="button wiki-create-button" data-action="new-character"><span>＋</span>Nuevo personaje</button>`,
  });
}

function renderWikiCharacterRecord(character, campaign, canManage) {
  const owner = state.users.find((user) => user.id === character.ownerId);
  const canEdit = canManage || character.ownerId === currentUser().id;
  return `
    <article class="wiki-record-card">
      <div class="wiki-record-mark">♙</div>
      <div class="wiki-record-body">
        <div class="wiki-record-meta">
          <span>Nivel ${Number(character.level) || 1}</span>
          <span>${escapeHtml(character.className)}</span>
          <span>${escapeHtml(character.status)}</span>
        </div>
        <h2>${escapeHtml(character.name)}</h2>
        <p>${escapeHtml(character.ancestry)} · Jugador: ${escapeHtml(owner?.name || character.playerName || "Sin asignar")}</p>
        ${character.notes ? `<p class="wiki-record-notes">${escapeHtml(character.notes)}</p>` : ""}
      </div>
      ${
        canEdit
          ? `<div class="wiki-record-actions">
              <button data-action="edit-character" data-id="${character.id}" title="Editar">✎</button>
              <button class="danger" data-action="delete-character" data-id="${character.id}" title="Borrar">×</button>
            </div>`
          : ""
      }
    </article>
  `;
}

function renderWikiMembersPage(campaign, canManage) {
  const pending = campaign.invites.filter((invite) => !invite.usedBy);
  const suggestions = inviteSuggestionsFor(campaign);
  const main = `
    <div class="wiki-record-list">
      ${campaign.members.map((member) => renderWikiMemberRecord(member, campaign)).join("")}
    </div>
  `;
  const sidebar = `
    <div class="wiki-section-metrics">
      ${renderWikiMetric("jugadores", campaign.members.length)}
      ${renderWikiMetric("invitaciones", pending.length)}
      ${renderWikiMetric("wiki", campaign.visibility === "public" ? "publica" : "privada")}
    </div>
  `;
  const aside = `
    <div class="wiki-info-panel">
      <span>ROLES</span>
      <p>Owner y editor pueden editar todo. Player puede ver la campana y editar sus personajes. Viewer queda como lectura.</p>
    </div>
    <div class="wiki-info-panel">
      <span>INVITAR</span>
      ${
        canManage
          ? `<form class="wiki-invite-form" data-form="invite-email">
              <label class="field">
                <span>Email del jugador</span>
                <input class="input" name="email" type="email" list="invite-email-suggestions" placeholder="jugador@mesa.com" required />
              </label>
              <datalist id="invite-email-suggestions">
                ${suggestions.map((item) => `<option value="${escapeAttr(item.user.email)}">${escapeHtml(item.user.name)}</option>`).join("")}
              </datalist>
              ${suggestions.length ? `
                <div class="recommendation-row">
                  ${suggestions.map((item) => `
                    <button class="recommendation-chip" type="button" data-action="fill-invite-email" data-email="${escapeAttr(item.user.email)}">
                      <strong>${escapeHtml(item.user.name)}</strong>
                      <span>${escapeHtml(item.user.email)}</span>
                    </button>
                  `).join("")}
                </div>` : ""}
              <div class="actions-row">
                <button class="button primary" type="submit"><span class="icon">+</span>Crear invitacion</button>
                <button class="button" type="button" data-action="new-invite"><span class="icon">#</span>Link sin correo</button>
              </div>
            </form>`
          : `<p>Solo owner o editor pueden generar invitaciones.</p>`
      }
    </div>
    <div class="wiki-info-panel">
      <span>PENDIENTES</span>
      <div class="wiki-pending-list">
        ${pending.length ? pending.map((invite) => renderInviteRow(invite)).join("") : `<p>No hay invitaciones pendientes.</p>`}
      </div>
      <button class="button" data-action="copy-wiki" data-id="${campaign.id}"><span class="icon">C</span>Copiar wiki</button>
    </div>
  `;
  return renderWikiSectionShell({
    section: "members",
    kicker: "JUGADORES",
    title: "Jugadores",
    description: "Miembros, permisos e invitaciones en el mismo escritorio del mundo.",
    sidebar,
    main,
    aside,
  });
}

function renderWikiMemberRecord(member, campaign) {
  const user = state.users.find((item) => item.id === member.userId);
  return `
    <article class="wiki-record-card compact">
      <div class="avatar">${escapeHtml((user?.name || "?").slice(0, 1).toUpperCase())}</div>
      <div class="wiki-record-body">
        <h2>${escapeHtml(user?.name || "Usuario")}</h2>
        <p>${escapeHtml(user?.email || "sin email")}</p>
      </div>
      <span class="wiki-role-chip">${escapeHtml(roleLabel(displayRoleFor(campaign, member.userId)))}</span>
    </article>
  `;
}

function mapsFor(campaign) {
  return Array.isArray(campaign?.maps) ? campaign.maps : [];
}

function mapCardFor(campaign, map) {
  return wikiCardsFor(campaign).find((card) => card.id === map?.cardId) || null;
}

function mapSettings(campaign) {
  return {
    playersCanDraw: Boolean(campaign?.mapSettings?.playersCanDraw),
    strokeDuration: Math.max(10, Math.min(3600, Number(campaign?.mapSettings?.strokeDuration) || 90)),
  };
}

function mapImageFor(campaign, map) {
  return map?.imageUrl || "";
}

function renderMapUploadControl(map, canManage) {
  if (!map || !canManage) return "";
  return `<label class="button map-upload-button" title="Subir imagen del mapa">Imagen<input data-map-image-file data-map-id="${map.id}" type="file" accept="image/*" /></label>`;
}

function renderWikiMapUploadControl(map, canManage) {
  if (!map || !canManage) return "";
  return `<label class="button wiki-map-upload-button">Cargar mapa<input data-map-image-file data-map-id="${map.id}" type="file" accept="image/*" /></label>`;
}

function campaignForWikiCard(cardId) {
  return state.campaigns.find((campaign) => wikiCardsFor(campaign).some((card) => card.id === cardId)) || null;
}

function ensureWikiMapBlock(card) {
  if (!card || normalizedWikiContentBlocks(card).some((block) => block.type === "map")) return;
  card.contentBlocks = [
    ...normalizedWikiContentBlocks(card),
    { id: uid("block"), type: "map", title: WIKI_CONTENT_TYPES.map.title, text: "", url: "" },
  ];
}

function cleanupMapStrokes(campaign) {
  const duration = mapSettings(campaign).strokeDuration * 1000;
  let changed = false;
  for (const map of mapsFor(campaign)) {
    const strokes = map.playerStrokes || [];
    const active = strokes.filter((stroke) => Date.now() - Number(stroke.createdAt || 0) < duration);
    if (active.length !== strokes.length) changed = true;
    map.playerStrokes = active;
  }
  return changed;
}

function renderMapsPage(campaign, role, canManage) {
  if (cleanupMapStrokes(campaign)) saveState();
  const maps = mapsFor(campaign);
  const query = normalizeSearchText(mapSearch);
  const visibleMaps = maps.filter((map) => normalizeSearchText(mapCardFor(campaign, map)?.title || "").includes(query));
  const selected = visibleMaps.find((map) => map.id === selectedMapId) || visibleMaps[0] || null;
  if (selected && selectedMapId !== selected.id) selectedMapId = selected.id;
  const settings = mapSettings(campaign);
  const isPlayer = role === "player";

  const sidebar = `
    <label class="map-search"><span>⌕</span><input data-map-search type="search" value="${escapeAttr(mapSearch)}" placeholder="Buscar mapas" /></label>
    <div class="map-browser-head"><span>MAPAS</span><small>${visibleMaps.length}</small></div>
    <div class="map-browser-list">
      ${visibleMaps.length ? visibleMaps.map((map) => {
        const card = mapCardFor(campaign, map);
        return `<button class="map-browser-item ${map.id === selected?.id ? "active" : ""}" data-action="select-map" data-id="${map.id}">
          <span class="map-browser-icon">⌖</span><span><strong>${escapeHtml(card?.title || "Tarjeta eliminada")}</strong><small>${(map.points || []).length} puntos interactivos</small></span>
        </button>`;
      }).join("") : `<div class="map-browser-empty">${maps.length ? "No hay coincidencias." : "Todavía no hay mapas."}</div>`}
    </div>
    ${canManage ? `<button class="button primary map-new-button" data-action="new-map"><span class="icon">+</span>Crear mapa</button>` : ""}
  `;

  const main = selected
    ? renderMapStage(campaign, selected, canManage, isPlayer, settings)
    : `<div class="map-empty-stage"><span>⌖</span><h2>${canManage ? "Creá el primer mapa" : "No hay mapas para explorar"}</h2><p>${canManage ? "Elegí una tarjeta con imagen para convertirla en un mapa navegable." : "Cuando el equipo agregue un mapa aparecerá aquí."}</p>${canManage ? `<button class="button primary" data-action="new-map">Crear mapa</button>` : ""}</div>`;

  return `
    <section class="maps-workspace">
      <aside class="maps-browser">${sidebar}</aside>
      <section class="maps-main">
        <header class="maps-header"><div><span>ATLAS DE LA PARTIDA</span><h1>${escapeHtml(selected ? mapCardFor(campaign, selected)?.title || "Mapa" : "Mapas")}</h1></div>
          ${selected ? `<div class="map-tools"><button class="map-tool" data-action="map-zoom-out" title="Alejar">−</button><button class="map-tool" data-action="map-reset" title="Restablecer vista">⌖</button><button class="map-tool" data-action="map-zoom-in" title="Acercar">+</button>${isPlayer && settings.playersCanDraw ? `<button class="button ${mapDrawMode ? "primary" : ""}" data-action="toggle-map-draw">✎ ${mapDrawMode ? "Dibujando" : "Dibujar"}</button>` : ""}</div>` : ""}
        </header>
        ${main}
        ${selected ? `<footer class="map-status">${canManage ? "Click derecho sobre el mapa para añadir un punto interactivo." : isPlayer && settings.playersCanDraw ? `Podés navegar y ${mapDrawMode ? "dibujar" : "activar Dibujo"}; los trazos se borran en ${settings.strokeDuration}s.` : "Podés navegar el mapa con arrastre y zoom."}</footer>` : ""}
      </section>
    </section>
  `;
}

function renderMapStage(campaign, map, canManage, isPlayer, settings) {
  const card = mapCardFor(campaign, map);
  const points = (map.points || []).map((point) => ({ ...point, card: wikiCardsFor(campaign).find((item) => item.id === point.cardId) })).filter((point) => point.card);
  const strokes = (map.playerStrokes || []).filter((stroke) => Date.now() - Number(stroke.createdAt || 0) < settings.strokeDuration * 1000);
  const mapImage = mapImageFor(campaign, map);
  const image = mapImage ? `<img class="map-image" data-map-image draggable="false" src="${escapeAttr(mapImage)}" alt="Mapa ${escapeAttr(card?.title || "Mapa")}" />` : `<div class="map-placeholder-art"><span>⌖</span><strong>${escapeHtml(card?.title || "Mapa")}</strong><small>Subí una imagen para usarla como mapa.</small></div>`;
  return `<div class="map-viewport" data-map-viewport data-map-id="${map.id}" data-can-manage="${canManage}" data-can-draw="${isPlayer && settings.playersCanDraw && mapDrawMode}" style="--stroke-duration:${settings.strokeDuration}s">${renderMapUploadControl(map, canManage)}
    <div class="map-world" data-map-world><div class="map-canvas" data-map-canvas>${image}
      <svg class="map-drawing-layer" data-map-drawing viewBox="0 0 1000 1000" preserveAspectRatio="none">${strokes.map((stroke) => `<polyline class="map-player-stroke" points="${stroke.points.map((point) => `${Number(point.x) * 10},${Number(point.y) * 10}`).join(" ")}" style="animation-delay:-${Math.max(0, (Date.now() - stroke.createdAt) / 1000)}s" />`).join("")}</svg>
      ${points.map((point) => `<button class="map-point" style="left:${Number(point.x)}%;top:${Number(point.y)}%" data-action="open-map-card" data-id="${point.card.id}" title="${escapeAttr(point.card.title)}"><span>${escapeHtml(wikiType(point.card).icon)}</span><b>${escapeHtml(point.card.title)}</b></button>`).join("")}
    </div></div>
    <div class="map-hint">Arrastrá para mover · Rueda para zoom</div>
  </div>`;
}

function renderWikiSettingsPage(campaign, role, canManage) {
  const form = canManage
    ? `<form class="wiki-settings-form" data-form="settings">
        <div class="wiki-form-pair">
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
        </div>
        <div class="field-label">Tags</div>
        ${renderTagPicker(campaignTags(campaign))}
        <label class="field">
          <span>Descripcion</span>
          <textarea class="textarea" name="description">${escapeHtml(campaign.description)}</textarea>
        </label>
        <div class="wiki-form-pair">
          <label class="field">
            <span>URL de imagen del tablero</span>
            <input class="input" name="imageUrl" type="url" value="${escapeAttr(campaign.imageUrl?.startsWith("data:") ? "" : campaign.imageUrl || "")}" placeholder="https://..." />
          </label>
          <label class="field">
            <span>Subir imagen del tablero</span>
            <input class="input" name="imageFile" type="file" accept="image/*" />
          </label>
        </div>
        ${campaign.imageUrl?.startsWith("data:") ? `<input type="hidden" name="existingImageUrl" value="${escapeAttr(campaign.imageUrl)}" />` : ""}
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
        <div class="wiki-map-settings">
          <span>MAPAS DE JUGADORES</span>
          <label class="check-field"><input name="playersCanDrawMaps" type="checkbox" ${mapSettings(campaign).playersCanDraw ? "checked" : ""} /><span>Permitir que los jugadores dibujen trazos temporales</span></label>
          <label class="field"><span>Duración de los trazos (segundos)</span><input class="input" name="mapStrokeDuration" type="number" min="10" max="3600" value="${mapSettings(campaign).strokeDuration}" /></label>
        </div>
        <button class="button primary" type="submit"><span class="icon">S</span>Guardar cambios</button>
      </form>`
    : `<div class="wiki-panel-empty compact"><span>⚙</span><h2>Solo lectura</h2><p>Solo owner o editor pueden cambiar los ajustes de esta campana.</p></div>`;
  const sidebar = `
    <div class="wiki-section-metrics">
      ${renderWikiMetric("rol", roleLabel(role))}
      ${renderWikiMetric("miembros", campaign.members.length)}
      ${renderWikiMetric("fichas", wikiCardsFor(campaign).length)}
    </div>
  `;
  const aside = `
    <div class="wiki-campaign-preview">
      ${campaign.imageUrl ? `<img src="${escapeAttr(campaign.imageUrl)}" alt="" />` : `<div><span>${escapeHtml(campaign.title.slice(0, 1).toUpperCase())}</span></div>`}
      <strong>${escapeHtml(campaign.title)}</strong>
      <small>${escapeHtml(campaign.system)} · ${campaign.visibility === "public" ? "Wiki publica" : "Wiki privada"}</small>
      <p>${escapeHtml(campaign.description || "Sin descripcion.")}</p>
    </div>
  `;
  return renderWikiSectionShell({
    section: "settings",
    kicker: "AJUSTES",
    title: "Ajustes",
    description: "Configuracion central de la campana y su wiki compartida.",
    sidebar,
    main: form,
    aside,
  });
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
  const contentBlocks = normalizedWikiContentBlocks(page);
  return `
    <article class="public-page">
      ${page.imageUrl ? `<img class="public-page-image" src="${escapeAttr(page.imageUrl)}" alt="" loading="lazy" />` : ""}
      <div class="public-page-body">
        <span class="tag gold">${type.icon} ${escapeHtml(type.label)}</span>
        <h2>${escapeHtml(page.title)}</h2>
        ${page.aliases.length ? `<p class="public-aliases">También conocido como ${page.aliases.map(escapeHtml).join(", ")}</p>` : ""}
        <div class="wiki-content-viewer">${contentBlocks.map((block) => renderWikiContentBlock(block, cards, page.id)).join("") || `<p>Sin contenido todavía.</p>`}</div>
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
  if (editing.type === "wiki-folder") return renderWikiFolderModal();
  if (editing.type === "wiki-type") return renderWikiTypeModal();
  if (editing.type === "wiki") return renderWikiModal(editing.id);
  if (editing.type === "delete-wiki") return renderWikiDeleteModal(editing.id);
  if (editing.type === "character") return renderCharacterModal(editing.id);
  if (editing.type === "new-map") return renderNewMapModal();
  if (editing.type === "map-point") return renderMapPointModal();
  if (editing.type === "map-card-preview") return renderMapCardPreviewModal(editing.cardId);
  return "";
}

function renderNewMapModal() {
  const campaign = campaignById(activeCampaignId);
  const linkedIds = new Set(mapsFor(campaign).map((map) => map.cardId));
  const cards = wikiCardsFor(campaign).filter((card) => !linkedIds.has(card.id));
  return `<div class="modal-backdrop"><section class="modal-panel map-modal"><header class="modal-head"><div><h2>Crear mapa</h2><p class="muted small">Elegí la tarjeta que representa este mapa. Su nombre e imagen serán la base del atlas.</p></div><button class="button ghost" data-action="close-modal">×</button></header>
    ${cards.length ? `<div class="map-card-picker">${cards.map((card) => `<button data-action="create-map-from-card" data-id="${card.id}">${renderWikiThumb(card)}<span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(wikiType(card).label)}${card.imageUrl ? " · con imagen" : " · sin imagen"}</small></span></button>`).join("")}</div>` : `<p class="muted">Todas las tarjetas ya tienen un mapa asociado. Creá otra tarjeta para continuar.</p>`}
  </section></div>`;
}

function renderMapPointModal() {
  const campaign = campaignById(activeCampaignId);
  const cards = wikiCardsFor(campaign);
  return `<div class="modal-backdrop"><section class="modal-panel map-modal"><header class="modal-head"><div><h2>Vincular punto interactivo</h2><p class="muted small">Buscá una tarjeta y vinculala a esta posición.</p></div><button class="button ghost" data-action="close-modal">×</button></header>
    <label class="map-search modal-search"><span>⌕</span><input data-map-link-search type="search" placeholder="Buscar tarjetas" autofocus /></label>
    <div class="map-card-picker" data-map-link-list>${cards.map((card) => `<button data-action="add-map-point" data-id="${card.id}">${renderWikiThumb(card)}<span><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(wikiType(card).label)}</small></span></button>`).join("")}</div>
  </section></div>`;
}

function renderMapCardPreviewModal(cardId) {
  const campaign = campaignById(activeCampaignId);
  const card = wikiCardsFor(campaign).find((item) => item.id === cardId);
  if (!card) return "";
  const linkedMap = mapsFor(campaign).find((map) => map.cardId === card.id);
  return `<div class="modal-backdrop"><section class="modal-panel map-card-preview-modal"><header class="modal-head"><div><span class="wiki-modal-kicker">${escapeHtml(wikiType(card).label)}</span><h2>${escapeHtml(card.title)}</h2></div><button class="button ghost" data-action="close-modal">×</button></header>
    ${card.imageUrl ? `<img src="${escapeAttr(card.imageUrl)}" alt="" />` : ""}<p>${escapeHtml(card.description || "Sin descripción todavía.")}</p>
    <div class="actions-row"><button class="button" data-action="select-wiki-card" data-id="${card.id}">Ver tarjeta</button>${linkedMap ? `<button class="button primary" data-action="go-to-map" data-id="${linkedMap.id}">Ir a este mapa</button>` : ""}</div>
  </section></div>`;
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

function renderWikiFolderModal() {
  const campaign = campaignById(activeCampaignId);
  return `
    <div class="modal-backdrop">
      <section class="modal-panel wiki-folder-modal">
        <header class="modal-head">
          <div>
            <span class="wiki-modal-kicker">ORGANIZACIÓN</span>
            <h2>Nueva carpeta</h2>
            <p class="muted small">Después vas a poder mover fichas a esta carpeta desde Tarjetas.</p>
          </div>
          <button class="button ghost" data-action="close-modal" aria-label="Cerrar">×</button>
        </header>
        <form class="form-grid" data-form="wiki-folder">
          <label class="field"><span>Nombre de la carpeta</span><input class="input" name="name" placeholder="Ej: Reinos, Personajes o Lugares" autocomplete="off" required /></label>
          ${wikiFoldersFor(campaign).length ? `<p class="muted small">Ya existen: ${wikiFoldersFor(campaign).map(escapeHtml).join(", ")}.</p>` : ""}
          <div class="wiki-confirm-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button primary" type="submit"><span class="icon">＋</span>Crear carpeta</button></div>
        </form>
      </section>
    </div>`;
}

function renderWikiDeleteModal(pageId) {
  const campaign = campaignById(activeCampaignId);
  const page = wikiCardsFor(campaign).find((item) => item.id === pageId);
  if (!page) return "";
  return `
    <div class="modal-backdrop">
      <section class="modal-panel wiki-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="wiki-delete-title">
        <div class="wiki-confirm-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" /></svg></div>
        <span class="wiki-modal-kicker">ELIMINAR FICHA</span>
        <h2 id="wiki-delete-title">¿Seguro que querés eliminar “${escapeHtml(page.title)}”?</h2>
        <p>Esta acción quitará la ficha y sus conexiones de la campaña. No se puede deshacer.</p>
        <div class="wiki-confirm-actions"><button class="button" data-action="close-modal">Cancelar</button><button class="button danger" data-action="confirm-delete-wiki" data-id="${page.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Z" /></svg>Eliminar ficha</button></div>
      </section>
    </div>`;
}

function wikiEditorPropertyItems(page, type) {
  const items = normalizedWikiPropertyItems(page);
  for (const [label] of type.fields) {
    if (!items.some((item) => normalizeSearchText(item.label) === normalizeSearchText(label))) {
      items.push({ id: uid("property"), icon: "◆", label, value: "" });
    }
  }
  return items;
}

function wikiAliasChip(alias, index) {
  return `<span class="wiki-alias-chip" data-alias-chip><input type="hidden" name="alias_${index}" value="${escapeAttr(alias)}" /><span>${escapeHtml(alias)}</span><button type="button" data-action="remove-wiki-alias" aria-label="Quitar alias ${escapeAttr(alias)}">×</button></span>`;
}

function wikiPropertyPicker(type, properties) {
  const existing = new Set(properties.map((item) => normalizeSearchText(item.label)));
  const typePresets = type.fields.map(([label]) => ({ label, icon: "◆" }));
  const choices = [...typePresets, ...WIKI_PROPERTY_PRESETS]
    .filter((item, index, list) => list.findIndex((candidate) => normalizeSearchText(candidate.label) === normalizeSearchText(item.label)) === index)
    .filter((item) => !existing.has(normalizeSearchText(item.label)));
  return `<div class="wiki-property-picker" data-property-picker hidden>
    <span>Elegí una propiedad</span>
    <div>${choices.map((item) => `<button type="button" data-action="add-wiki-property-preset" data-property-label="${escapeAttr(item.label)}" data-property-icon="${escapeAttr(item.icon)}">${renderWikiPropertyIcon(item.icon)}${escapeHtml(item.label)}</button>`).join("")}</div>
    <button class="wiki-property-custom" type="button" data-action="add-wiki-property-custom">＋ Crear propiedad propia</button>
  </div>`;
}

function wikiPropertyEditorRow(item, index) {
  const icon = item.icon || "◆";
  return `<div class="wiki-property-editor" data-property-row>
    <input type="hidden" name="property_id_${index}" value="${escapeAttr(item.id || uid("property"))}" />
    <label class="wiki-property-icon" title="Icono de la propiedad"><span>Icono</span><input type="hidden" data-property-icon-input name="property_icon_${index}" value="${escapeAttr(icon)}" /><details class="wiki-icon-picker"><summary data-property-icon-preview>${renderWikiPropertyIcon(icon)}</summary><div><span>Elegí un icono</span><section>${WIKI_PROPERTY_ICONS.map((option) => `<button type="button" data-action="select-wiki-property-icon" data-property-icon="${escapeAttr(option)}">${renderWikiPropertyIcon(option)}</button>`).join("")}</section><label class="wiki-icon-upload">Cargar tu icono<input data-property-icon-file name="property_icon_file_${index}" type="file" accept="image/*" /></label></div></details></label>
    <label class="field"><span>Nombre de propiedad</span><input class="input" name="property_label_${index}" value="${escapeAttr(item.label || "")}" placeholder="Ej: Portador" /></label>
    <label class="field wiki-property-value"><span>Texto o ficha vinculada</span><input class="input" name="property_value_${index}" value="${escapeAttr(item.value || "")}" list="wiki-linkable-cards" placeholder="Escribí texto o el nombre de otra ficha" /></label>
    <button class="wiki-row-remove" type="button" data-action="remove-wiki-property" aria-label="Quitar propiedad">×</button>
  </div>`;
}

function characterSpellEditorRow(blockIndex, level, spell, rowKey) {
  const prefix = `block_sheet_${blockIndex}_spell_${level}_${rowKey}`;
  return `<div class="dnd5e-spell-editor-row" data-5e-spell-row>
    <input type="hidden" name="${prefix}_id" value="${escapeAttr(spell.id || uid("spell"))}" />
    <label><span>Nombre</span><input name="${prefix}_name" value="${escapeAttr(spell.name || "")}" placeholder="Nombre del conjuro" /></label>
    <label><span>Detalle desplegable</span><textarea name="${prefix}_notes" placeholder="Tiempo de lanzamiento, alcance, componentes, efecto...">${escapeHtml(spell.notes || "")}</textarea></label>
    <button type="button" data-action="remove-5e-spell" aria-label="Quitar conjuro">×</button>
  </div>`;
}

function characterSheet5eEditor(block, index) {
  const sheet = normalizedCharacterSheet5e(block);
  const name = (field) => `block_sheet_${index}_${field}`;
  const value = (field) => escapeAttr(sheet[field] ?? "");
  const proficiency = dnd5eProficiencyBonus(sheet.level);
  const modifier = (key) => dnd5eModifier(sheet.abilities[key]);
  const skillTotal = (key, ability) => modifier(ability) + (sheet.skillProficiencies.includes(key) ? proficiency : 0);
  const spellModifier = modifier(sheet.spellcastingAbility);
  const weaponRows = sheet.weapons.map((weapon, rowKey) => characterWeaponEditorRow(index, weapon, rowKey)).join("");
  return `<div class="dnd5e-sheet dnd5e-sheet-editor" data-5e-sheet-editor>
    <div class="dnd5e-editor-note"><strong>Calculos automaticos</strong><span>Al cambiar nivel o caracteristicas se actualizan modificadores, competencia, salvaciones, habilidades, iniciativa, percepcion pasiva y armadura.</span></div>
    <div class="dnd5e-sheet-banner dnd5e-editor-banner">
      <label class="dnd5e-character-name"><input name="${name("characterName")}" value="${value("characterName")}" placeholder="Nombre del personaje" /><small>NOMBRE DEL PERSONAJE</small></label>
      <div class="dnd5e-identity-grid">
        <label><input data-5e-class name="${name("className")}" value="${value("className")}" list="dnd5e-classes-${index}" placeholder="Guerrero" /><small>CLASE</small></label>
        <label><input data-5e-level name="${name("level")}" type="number" min="1" max="20" value="${sheet.level}" /><small>NIVEL</small></label>
        <label><input name="${name("background")}" value="${value("background")}" /><small>TRASFONDO</small></label>
        <label><input name="${name("playerName")}" value="${value("playerName")}" /><small>JUGADOR</small></label>
        <label><input name="${name("race")}" value="${value("race")}" /><small>RAZA</small></label>
        <label><input name="${name("alignment")}" value="${value("alignment")}" /><small>ALINEAMIENTO</small></label>
        <label><input name="${name("experience")}" value="${value("experience")}" /><small>EXPERIENCIA</small></label>
      </div>
      <datalist id="dnd5e-classes-${index}">${Object.keys(DND5E_CLASS_SAVES).map((className) => `<option value="${className[0].toUpperCase()}${className.slice(1)}"></option>`).join("")}</datalist>
    </div>
    <nav class="dnd5e-page-tabs"><button class="active" type="button" data-action="set-5e-sheet-page" data-page="main">Ficha principal</button><button type="button" data-action="set-5e-sheet-page" data-page="spells">Ataques y conjuros</button></nav>
    <div data-5e-page-panel="main"><div class="dnd5e-sheet-grid dnd5e-editor-grid">
      <div class="dnd5e-abilities">${DND5E_ABILITIES.map(([key, label]) => `<label class="dnd5e-ability"><small>${label.toUpperCase()}</small><output data-5e-modifier="${key}">${signedDnd5e(dnd5eModifier(sheet.abilities[key]))}</output><input data-5e-ability="${key}" name="${name(`ability_${key}`)}" type="number" min="1" max="30" value="${sheet.abilities[key]}" aria-label="Puntuacion de ${label}" /></label>`).join("")}</div>
      <div class="dnd5e-checks">
        <label class="dnd5e-inspiration"><input name="${name("inspiration")}" type="checkbox" ${sheet.inspiration ? "checked" : ""} /><b>INSPIRACION</b></label>
        <div class="dnd5e-proficiency"><output data-5e-proficiency>${signedDnd5e(proficiency)}</output><span>BONO DE COMPETENCIA</span></div>
        <section class="dnd5e-paper-box"><h4>TIRADAS DE SALVACION</h4>${DND5E_ABILITIES.map(([key, label]) => `<label class="dnd5e-check-row"><input data-5e-save="${key}" name="${name(`save_${key}`)}" type="checkbox" ${sheet.saveProficiencies.includes(key) ? "checked" : ""} /><output data-5e-save-total="${key}">${signedDnd5e(modifier(key) + (sheet.saveProficiencies.includes(key) ? proficiency : 0))}</output><span>${label}</span></label>`).join("")}</section>
        <details class="dnd5e-paper-box dnd5e-skills"><summary>HABILIDADES <small>desplegar</small></summary><div>${DND5E_SKILLS.map(([key, label, ability]) => `<label class="dnd5e-check-row"><input data-5e-skill="${key}" data-ability="${ability}" name="${name(`skill_${key}`)}" type="checkbox" ${sheet.skillProficiencies.includes(key) ? "checked" : ""} /><output data-5e-skill-total="${key}">${signedDnd5e(skillTotal(key, ability))}</output><span>${label} <small>(${DND5E_ABILITIES.find(([item]) => item === ability)?.[2]})</small></span></label>`).join("")}</div></details>
        <div class="dnd5e-passive"><output data-5e-passive>${10 + skillTotal("perception", "wis")}</output><span>SABIDURIA PASIVA (PERCEPCION)</span></div>
      </div>
      <div class="dnd5e-main-sheet">
        <div class="dnd5e-combat-row">
          <div><output data-5e-armor>${(Number(sheet.armorBase) || 10) + modifier("dex") + (Number(sheet.armorBonus) || 0)}</output><span>CLASE DE ARMADURA</span></div>
          <div><output data-5e-initiative>${signedDnd5e(modifier("dex"))}</output><span>INICIATIVA</span></div>
          <label><input data-5e-speed name="${name("speed")}" type="number" min="0" value="${Number(sheet.speed) || 30}" /><span>VELOCIDAD (PIES)</span></label>
        </div>
        <div class="dnd5e-armor-settings">
          <label>Base de armadura <input data-5e-armor-base name="${name("armorBase")}" type="number" value="${Number(sheet.armorBase) || 10}" /></label>
          <span>+ modificador DES +</span>
          <label>Bonificador extra <input data-5e-armor-bonus name="${name("armorBonus")}" type="number" value="${Number(sheet.armorBonus) || 0}" /></label>
        </div>
        <div class="dnd5e-hp-grid">${[["maxHp", "PG MAXIMOS"], ["currentHp", "PG ACTUALES"], ["temporaryHp", "PG TEMPORALES"], ["hitDice", "DADOS DE GOLPE"]].map(([field, label]) => `<label><small>${label}</small><input name="${name(field)}" value="${value(field)}" /></label>`).join("")}<div class="dnd5e-death-save"><small>SALVACIONES EXITOSAS</small><span>${Array.from({ length: 3 }, (_, slot) => `<input name="${name(`deathSuccess_${slot}`)}" type="checkbox" ${slot < Number(sheet.deathSuccesses) ? "checked" : ""} aria-label="Salvacion exitosa ${slot + 1}" />`).join("")}</span></div><div class="dnd5e-death-save"><small>SALVACIONES FALLIDAS</small><span>${Array.from({ length: 3 }, (_, slot) => `<input name="${name(`deathFailure_${slot}`)}" type="checkbox" ${slot < Number(sheet.deathFailures) ? "checked" : ""} aria-label="Salvacion fallida ${slot + 1}" />`).join("")}</span></div></div>
        <div class="dnd5e-notes-grid">${[["personality", "Rasgos de personalidad"], ["ideals", "Ideales"], ["bonds", "Vinculos"], ["flaws", "Defectos"], ["proficiencies", "Otras competencias e idiomas"], ["features", "Rasgos y capacidades"]].map(([field, label]) => `<label class="dnd5e-paper-box"><textarea name="${name(field)}" placeholder="${label}">${escapeHtml(sheet[field] || "")}</textarea><h4>${label.toUpperCase()}</h4></label>`).join("")}</div>
      </div>
    </div></div>
    <div class="dnd5e-spell-page" data-5e-page-panel="spells" hidden>
      <div class="dnd5e-spell-head"><label><select data-5e-spell-ability name="${name("spellcastingAbility")}">${DND5E_ABILITIES.map(([key, label, short]) => `<option value="${key}" ${sheet.spellcastingAbility === key ? "selected" : ""}>${label} (${short})</option>`).join("")}</select><span>CARACTERISTICA MAGICA</span></label><section><output data-5e-spell-dc>${8 + proficiency + spellModifier}</output><span>CD SALVACION</span></section><section><output data-5e-spell-attack>${signedDnd5e(proficiency + spellModifier)}</output><span>BONO DE ATAQUE</span></section></div>
      <section class="dnd5e-paper-box dnd5e-attacks"><div data-5e-weapon-list>${weaponRows}</div><button class="dnd5e-add-spell" type="button" data-action="add-5e-weapon" data-block-index="${index}">＋ Agregar arma</button>${sheet.attacks ? `<label class="dnd5e-legacy-attacks"><span>Notas viejas de ataques</span><textarea name="${name("attacks")}" placeholder="Notas generales">${escapeHtml(sheet.attacks || "")}</textarea></label>` : `<input type="hidden" name="${name("attacks")}" value="" />`}<h4>ARMAS Y ATAQUES</h4></section>
      <div class="dnd5e-spell-levels">${Array.from({ length: 10 }, (_, level) => `<details class="dnd5e-spell-level" ${level === 0 ? "open" : ""}><summary><b>${level === 0 ? "Trucos" : `Nivel ${level}`}</b><span>${sheet.spells[level].length} conjuros</span></summary>${dnd5eSpellPicker(index, level)}<div data-5e-spell-list>${sheet.spells[level].map((spell, rowKey) => characterSpellEditorRow(index, level, spell, rowKey)).join("")}</div><button class="dnd5e-add-spell" type="button" data-action="add-5e-spell" data-block-index="${index}" data-spell-level="${level}">＋ Cargarlo vos</button></details>`).join("")}</div>
    </div>
    <input type="hidden" name="block_text_${index}" value="" />
    <input type="hidden" name="block_url_${index}" value="" />
  </div>`;
}

function statBlock5eEditor(block, index) {
  const stat = normalizedStatBlock5e(block);
  const name = (field) => `block_stat_${index}_${field}`;
  const value = (field) => escapeAttr(stat[field] || "");
  return `<div class="dnd5e-stat-editor" data-5e-stat-editor>
    <p class="dnd5e-stat-editor-note">El titulo del bloque es el nombre de la criatura. Los modificadores se calculan automaticamente.</p>
    <div class="dnd5e-stat-editor-grid">
      <label class="field dnd5e-stat-wide"><span>Tipo, tamano y alineamiento</span><input class="input" name="${name("subtitle")}" value="${value("subtitle")}" placeholder="Humanoide Mediano, neutral bueno" /></label>
      <label class="field"><span>Clase de Armadura</span><input class="input" name="${name("armorClass")}" value="${value("armorClass")}" placeholder="12" /></label>
      <label class="field"><span>Puntos de Golpe</span><input class="input" name="${name("hitPoints")}" value="${value("hitPoints")}" placeholder="13 (3d8)" /></label>
      <label class="field"><span>Velocidad</span><input class="input" name="${name("speed")}" value="${value("speed")}" placeholder="20 pies, vuelo 50 pies" /></label>
    </div>
    <div class="dnd5e-stat-editor-abilities">
      ${DND5E_ABILITIES.map(([key, label, short]) => `<label><span>${short}</span><input data-5e-stat-ability="${key}" name="${name(`ability_${key}`)}" type="number" min="1" max="30" value="${stat.abilities[key]}" aria-label="${label}" /><output data-5e-stat-modifier="${key}">${signedDnd5e(dnd5eModifier(stat.abilities[key]))}</output></label>`).join("")}
    </div>
    <div class="dnd5e-stat-editor-grid">
      <label class="field"><span>Tiradas de salvacion</span><input class="input" name="${name("savingThrows")}" value="${value("savingThrows")}" placeholder="DES +4, SAB +3" /></label>
      <label class="field"><span>Habilidades</span><input class="input" name="${name("skills")}" value="${value("skills")}" placeholder="Percepcion +5" /></label>
      <label class="field"><span>Sentidos</span><input class="input" name="${name("senses")}" value="${value("senses")}" placeholder="Vision en la oscuridad 60 pies, Percepcion pasiva 15" /></label>
      <label class="field"><span>Idiomas</span><input class="input" name="${name("languages")}" value="${value("languages")}" placeholder="Comun, Auran" /></label>
      <label class="field dnd5e-stat-wide"><span>Desafio</span><input class="input" name="${name("challenge")}" value="${value("challenge")}" placeholder="1/4 (50 PX)" /></label>
    </div>
    ${[["traits", "Rasgos", "Ataque en picado. Si la criatura vuela..."], ["actions", "Acciones", "Garra. Ataque de arma cuerpo a cuerpo..."], ["reactions", "Reacciones", "Reaccion y su efecto..."]].map(([field, label, placeholder]) => `<label class="field"><span>${label}</span><textarea class="textarea dnd5e-stat-prose" name="${name(field)}" placeholder="${placeholder}">${escapeHtml(stat[field] || "")}</textarea></label>`).join("")}
  </div>`;
}

function wikiContentEditorBlock(block, index) {
  const type = WIKI_CONTENT_TYPES[block.type] || WIKI_CONTENT_TYPES.text;
  const supportsImage = block.type === "image";
  const isMapBlock = block.type === "map";
  const campaign = campaignById(activeCampaignId);
  const linkedMap = isMapBlock ? mapsFor(campaign).find((map) => map.cardId === editing?.id) : null;
  const linkedMapImage = mapImageFor(campaign, linkedMap);
  return `<article class="wiki-content-editor" data-content-block>
    <input type="hidden" name="block_id_${index}" value="${escapeAttr(block.id || uid("block"))}" />
    <input type="hidden" name="block_type_${index}" value="${escapeAttr(block.type)}" />
    <header><span>${type.icon} ${escapeHtml(type.label)}</span><button type="button" data-action="remove-content-block" aria-label="Quitar bloque">×</button></header>
    <label class="field"><span>${block.type === "statBlock5e" ? "Nombre de la criatura" : "Título editable"}</span><input class="input wiki-block-title" name="block_title_${index}" value="${escapeAttr(block.title || type.title)}" placeholder="${block.type === "statBlock5e" ? "Nombre de la criatura" : "Título de la sección"}" /></label>
    ${block.type === "characterSheet5e" ? characterSheet5eEditor(block, index) : block.type === "statBlock5e" ? statBlock5eEditor(block, index) : supportsImage ? `<div class="wiki-block-media-fields">
      <label class="field"><span>URL de imagen</span><input class="input" name="block_url_${index}" type="url" value="${escapeAttr(String(block.url || "").startsWith("data:") ? "" : block.url || "")}" placeholder="https://..." /></label>
      <label class="field"><span>o subir archivo</span><input class="input" name="block_file_${index}" type="file" accept="image/*" /></label>
      <input type="hidden" name="block_existing_url_${index}" value="${escapeAttr(block.url || "")}" />
    </div>` : isMapBlock ? `<div class="wiki-map-module-editor">${linkedMapImage ? `<img src="${escapeAttr(linkedMapImage)}" alt="Vista previa del mapa" />` : `<p>${linkedMap ? "El mÃ³dulo mostrarÃ¡ la imagen del mapa cuando estÃ© cargada." : "GuardÃ¡ esta ficha y creÃ¡ su mapa interactivo para poder mostrarlo aquÃ­."}</p>`}</div><input type="hidden" name="block_url_${index}" value="" />` : `<input type="hidden" name="block_url_${index}" value="" />`}
    ${block.type === "characterSheet5e" || block.type === "statBlock5e" ? `<input type="hidden" name="block_text_${index}" value="" />` : block.type === "familyTree" ? `<input type="hidden" name="block_text_${index}" value="${escapeAttr(block.text || "")}" /><p class="wiki-family-editor-note">El árbol se genera automáticamente con todas las fichas conectadas mediante una propiedad llamada <strong>Familiar</strong>.</p>` : `<label class="field"><span>${block.type === "timeline" ? "Hechos de esta ficha" : isMapBlock ? "Notas del mapa" : supportsImage ? "Texto, leyenda o notas" : "Contenido editable"}</span><textarea class="textarea wiki-description-input" name="block_text_${index}" placeholder="${escapeAttr(type.placeholder)}">${escapeHtml(block.text || "")}</textarea></label>`}
  </article>`;
}

function renderWikiModal(pageId) {
  const campaign = campaignById(activeCampaignId);
  const existingPage = campaign.wiki.find((item) => item.id === pageId);
  const page = existingPage ? wikiCardsFor({ wiki: [existingPage] })[0] : {
    title: "",
    type: editing.wikiType || "nota",
    description: "",
    aliases: [],
    folder: editing.folder || "Sin carpeta",
    properties: {},
    propertyItems: [],
    contentBlocks: [{ id: uid("block"), type: "text", title: "Descripción", text: "", url: "" }],
    relations: [],
    imageUrl: "",
    isPublic: true,
  };
  const type = wikiType(page);
  const cards = wikiCardsFor(campaign);
  const properties = wikiEditorPropertyItems(page, type);
  const contentBlocks = normalizedWikiContentBlocks(page);
  const relatedNames = cards.filter((card) => page.relations.includes(card.id)).map((card) => card.title).join(", ");
  const extraAliases = page.aliases.filter((alias) => normalizeSearchText(alias) !== normalizeSearchText(page.title));

  return `
    <div class="modal-backdrop wiki-modal-backdrop">
      <section class="modal-panel wiki-editor-modal">
        <header class="modal-head">
          <div><span class="wiki-modal-kicker">${type.icon} ${type.label.toUpperCase()}</span><h2>${pageId ? "Editar ficha" : `Nueva ficha de ${type.label.toLowerCase()}`}</h2><p class="muted small">Todo lo que mencione el nombre o alias de otra ficha quedará vinculado.</p></div>
          <button class="button ghost" data-action="close-modal" aria-label="Cerrar">×</button>
        </header>
        <form class="form-grid wiki-card-form" data-form="wiki">
          <input type="hidden" name="type" value="${page.type}" />
          <datalist id="wiki-linkable-cards">${cards.filter((card) => card.id !== pageId).flatMap((card) => [card.title, ...card.aliases]).map((name) => `<option value="${escapeAttr(name)}"></option>`).join("")}</datalist>
          <div class="wiki-form-columns">
            <div class="wiki-form-main">
              <label class="field wiki-title-field"><span>Nombre</span><input class="input wiki-title-input" name="title" value="${escapeAttr(page.title)}" placeholder="Ej: Aureon el Radiante" required /></label>
              <label class="field"><span>Aliases <small>el nombre siempre cuenta como alias</small></span><div class="wiki-alias-editor"><em data-primary-alias>${escapeHtml(page.title || "Nombre de la ficha")}</em><div class="wiki-alias-chips" data-alias-list>${extraAliases.map(wikiAliasChip).join("")}</div><div class="wiki-alias-add"><input class="input" data-wiki-alias-input placeholder="Escribí un alias y agregalo" /><button type="button" data-action="add-wiki-alias">＋</button></div></div></label>

              <section class="wiki-editor-section">
                <div class="wiki-editor-section-head"><div><span>PROPIEDADES</span><p>El icono, nombre y texto de cada propiedad son editables. Escribí el nombre de otra ficha para vincularla.</p></div></div>
                <div class="wiki-property-editors" data-property-list>${properties.map(wikiPropertyEditorRow).join("")}</div>
                <div class="wiki-property-add"><button class="wiki-add-property" type="button" data-action="open-wiki-property-picker">＋ Añadir propiedad</button>${wikiPropertyPicker(type, properties)}</div>
              </section>

              <section class="wiki-editor-section wiki-content-section">
                <div class="wiki-editor-section-head"><div><span>CONTENIDO</span><p>Armá la ficha con los módulos que necesites. Sus títulos y textos se pueden editar.</p></div></div>
                <div class="wiki-content-editors" data-content-list>${contentBlocks.map(wikiContentEditorBlock).join("")}</div>
                <div class="wiki-content-add"><span>Agregar módulo</span><div>${Object.entries(WIKI_CONTENT_TYPES).map(([key, item]) => `<button type="button" data-action="add-content-block" data-block-type="${key}">${item.icon} ${item.label}</button>`).join("")}</div></div>
              </section>

              <details class="wiki-editor-organization">
                <summary>Relaciones y visibilidad</summary>
                <label class="field"><span>Visibilidad</span><select class="select" name="isPublic"><option value="true" ${page.isPublic ? "selected" : ""}>Pública</option><option value="false" ${!page.isPublic ? "selected" : ""}>Privada</option></select></label>
                <label class="field"><span>Relaciones manuales <small>opcionales y separadas por comas</small></span><input class="input" name="relationNames" value="${escapeAttr(relatedNames)}" placeholder="Ej: Luminar, Daga del olvido" /></label>
              </details>
            </div>

            <aside class="wiki-image-fields">
              <button class="wiki-image-preview wiki-image-trigger" type="button" data-action="open-wiki-image" aria-label="Elegir imagen de la ficha">
                ${page.imageUrl ? `<img src="${escapeAttr(page.imageUrl)}" alt="Vista previa" />` : `<span>${type.icon}</span><small>Hacé click para agregar una imagen</small>`}
              </button>
              <p>Imagen de portada</p><small>Hacé click para pegar un enlace o subir un archivo.</small>
              <input type="hidden" name="existingImageUrl" value="${escapeAttr(page.imageUrl)}" />
              <input type="hidden" name="removeImage" value="" />
            </aside>
          </div>

          <div class="wiki-image-dialog" data-wiki-image-dialog hidden>
            <div class="wiki-image-dialog-card">
              <header><div><span>IMAGEN DE LA FICHA</span><h3>Elegí una imagen</h3></div><button type="button" data-action="close-wiki-image" aria-label="Cerrar">×</button></header>
              <label class="field"><span>Pegar enlace</span><input class="input" name="imageUrl" type="url" value="${escapeAttr(String(page.imageUrl || "").startsWith("data:") ? "" : page.imageUrl || "")}" placeholder="https://..." /></label>
              <div class="wiki-image-or"><span></span><small>o</small><span></span></div>
              <label class="wiki-file-drop"><span>⇧</span><strong>Subir desde tu dispositivo</strong><small>PNG, JPG, WEBP · máximo 4 MB</small><input name="imageFile" type="file" accept="image/*" /></label>
              <footer>${page.imageUrl ? `<button class="button danger" type="button" data-action="remove-wiki-image">Quitar imagen</button>` : `<span></span>`}<button class="button primary" type="button" data-action="close-wiki-image">Aplicar</button></footer>
            </div>
          </div>

          <div class="wiki-form-footer"><button class="button" type="button" data-action="${pageId ? "close-modal" : "back-to-wiki-types"}">${pageId ? "Cancelar" : "← Cambiar tipo"}</button><button class="button primary" type="submit"><span class="icon">✓</span>Guardar ficha</button></div>
        </form>
      </section>
    </div>`;
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

  if (formType === "wiki-folder") {
    if (createWikiFolder(data.name)) {
      editing = null;
      saveState();
      render();
      showToast("Carpeta creada.");
    }
    return;
  }

  if (formType === "wiki") {
    const imageUrl = await wikiImageFromData(data);
    if (imageUrl === null) return;
    const contentBlocks = await wikiContentBlocksFromData(data);
    if (contentBlocks === null) return;
    data.imageUrl = imageUrl;
    data.contentBlocks = contentBlocks;
    if (!(await saveWikiPage(data))) return;
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

  if (target.closest(".wiki-node") && Date.now() < wikiGraphClickSuppressedUntil) {
    event.preventDefault();
    return;
  }

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
    if (activeTab === "maps") mapDrawMode = false;
    render();
  }

  if (action === "new-map") {
    editing = { type: "new-map" };
    render();
  }

  if (action === "create-map-from-card") createMapFromCard(id);

  if (action === "select-map") {
    selectedMapId = id;
    mapDrawMode = false;
    render();
  }

  if (action === "toggle-map-draw") {
    mapDrawMode = !mapDrawMode;
    render();
  }

  if (action === "open-map-card") {
    editing = { type: "map-card-preview", cardId: id };
    render();
  }

  if (action === "add-map-point") addMapPoint(editing?.mapId, id, editing?.x, editing?.y);

  if (action === "go-to-map") {
    selectedMapId = id;
    activeTab = "maps";
    mapDrawMode = false;
    editing = null;
    render();
  }

  if (action === "map-zoom-in") mapRuntime?.zoomBy(1.2);
  if (action === "map-zoom-out") mapRuntime?.zoomBy(1 / 1.2);
  if (action === "map-reset") mapRuntime?.reset();

  if (action === "close-modal") {
    editing = null;
    render();
  }

  if (action === "open-wiki-image") {
    const dialog = target.closest("form")?.querySelector("[data-wiki-image-dialog]");
    if (dialog) dialog.hidden = false;
  }

  if (action === "close-wiki-image") {
    const dialog = target.closest("[data-wiki-image-dialog]");
    if (dialog) dialog.hidden = true;
  }

  if (action === "remove-wiki-image") {
    const form = target.closest("form");
    const removeInput = form?.querySelector('input[name="removeImage"]');
    const urlInput = form?.querySelector('input[name="imageUrl"]');
    const fileInput = form?.querySelector('input[name="imageFile"]');
    const preview = form?.querySelector(".wiki-image-preview");
    if (removeInput) removeInput.value = "true";
    if (urlInput) urlInput.value = "";
    if (fileInput) fileInput.value = "";
    if (preview) preview.innerHTML = "<span>＋</span><small>Hacé click para agregar una imagen</small>";
    const dialog = target.closest("[data-wiki-image-dialog]");
    if (dialog) dialog.hidden = true;
  }

  if (action === "add-wiki-alias") {
    const editor = target.closest(".wiki-alias-editor");
    const input = editor?.querySelector("[data-wiki-alias-input]");
    const list = editor?.querySelector("[data-alias-list]");
    const alias = String(input?.value || "").trim();
    if (alias && list) {
      const exists = [...list.querySelectorAll("input[name^='alias_']")].some((field) => normalizeSearchText(field.value) === normalizeSearchText(alias));
      if (!exists) list.insertAdjacentHTML("beforeend", wikiAliasChip(alias, uid("alias")));
      input.value = "";
      input.focus();
    }
  }

  if (action === "remove-wiki-alias") {
    target.closest("[data-alias-chip]")?.remove();
  }

  if (action === "open-wiki-property-picker") {
    const picker = target.closest(".wiki-property-add")?.querySelector("[data-property-picker]");
    if (picker) picker.hidden = !picker.hidden;
  }

  if (action === "add-wiki-property-preset" || action === "add-wiki-property-custom") {
    const list = target.closest(".wiki-editor-section")?.querySelector("[data-property-list]");
    const label = action === "add-wiki-property-preset" ? target.dataset.propertyLabel || "" : "";
    const icon = action === "add-wiki-property-preset" ? target.dataset.propertyIcon || "◆" : "◆";
    if (list) {
      list.insertAdjacentHTML("beforeend", wikiPropertyEditorRow({ id: uid("property"), icon, label, value: "" }, Date.now()));
      target.closest("[data-property-picker]")?.setAttribute("hidden", "");
      list.lastElementChild?.querySelector(label ? "[name^='property_value_']" : "[name^='property_label_']")?.focus();
    }
  }

  if (action === "remove-wiki-property") {
    target.closest("[data-property-row]")?.remove();
  }

  if (action === "select-wiki-property-icon") {
    const row = target.closest("[data-property-row]");
    const icon = target.dataset.propertyIcon || "◆";
    const input = row?.querySelector("[data-property-icon-input]");
    const preview = row?.querySelector("[data-property-icon-preview]");
    if (input) input.value = icon;
    if (preview) preview.innerHTML = renderWikiPropertyIcon(icon);
    target.closest("details")?.removeAttribute("open");
  }

  if (action === "add-content-block") {
    const list = target.closest(".wiki-editor-section")?.querySelector("[data-content-list]");
    const blockType = WIKI_CONTENT_TYPES[target.dataset.blockType] ? target.dataset.blockType : "text";
    const type = WIKI_CONTENT_TYPES[blockType];
    if (list) {
      list.insertAdjacentHTML("beforeend", wikiContentEditorBlock({ id: uid("block"), type: blockType, title: type.title, text: "", url: "" }, Date.now()));
      list.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  if (action === "remove-content-block") {
    target.closest("[data-content-block]")?.remove();
  }

  if (action === "set-5e-sheet-page") {
    const sheet = target.closest(".dnd5e-sheet");
    const page = target.dataset.page === "spells" ? "spells" : "main";
    sheet?.querySelectorAll(".dnd5e-page-tabs button").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    sheet?.querySelectorAll("[data-5e-page-panel]").forEach((panel) => { panel.hidden = panel.getAttribute("data-5e-page-panel") !== page; });
  }

  if (action === "add-5e-spell") {
    const list = target.closest(".dnd5e-spell-level")?.querySelector("[data-5e-spell-list]");
    const level = Math.max(0, Math.min(9, Number(target.dataset.spellLevel) || 0));
    if (list) list.insertAdjacentHTML("beforeend", characterSpellEditorRow(target.dataset.blockIndex, level, { id: uid("spell"), name: "", notes: "" }, Date.now()));
  }

  if (action === "load-5e-spell") {
    const list = target.closest(".dnd5e-spell-level")?.querySelector("[data-5e-spell-list]");
    const level = Math.max(0, Math.min(9, Number(target.dataset.spellLevel) || 0));
    const spellName = target.dataset.spellName || "";
    const spellNotes = target.dataset.spellNotes || "";
    if (list && spellName) {
      list.insertAdjacentHTML("beforeend", characterSpellEditorRow(target.dataset.blockIndex, level, { id: uid("spell"), name: spellName, notes: spellNotes }, Date.now()));
    }
  }

  if (action === "remove-5e-spell") {
    target.closest("[data-5e-spell-row]")?.remove();
  }

  if (action === "add-5e-weapon") {
    const list = target.closest(".dnd5e-attacks")?.querySelector("[data-5e-weapon-list]");
    if (list) list.insertAdjacentHTML("beforeend", characterWeaponEditorRow(target.dataset.blockIndex, { id: uid("weapon"), name: "", damageDice: "", ability: "str", proficient: true, bonus: 0, damageType: "Cortante", notes: "" }, Date.now()));
  }

  if (action === "remove-5e-weapon") {
    target.closest("[data-5e-weapon-row]")?.remove();
  }

  if (action === "new-wiki-page") {
    editing = { type: "wiki-type", folder: wikiFolder === "all" ? "Sin carpeta" : wikiFolder };
    render();
  }

  if (action === "new-wiki-folder") {
    editing = { type: "wiki-folder" };
    render();
  }

  if (action === "choose-wiki-type") {
    editing = { type: "wiki", id: null, wikiType: target.dataset.wikiType, folder: editing.folder || "Sin carpeta" };
    render();
  }

  if (action === "back-to-wiki-types") {
    editing = { type: "wiki-type", folder: editing.folder || "Sin carpeta" };
    render();
  }

  if (action === "set-wiki-view") {
    activeTab = "wiki";
    wikiView = target.dataset.view === "cards" ? "cards" : "home";
    render();
  }

  if (action === "select-wiki-card") {
    activeTab = "wiki";
    selectedWikiCardId = id;
    wikiView = "cards";
    render();
  }

  if (action === "filter-wiki-folder") {
    activeTab = "wiki";
    wikiFolder = target.dataset.folder || "all";
    selectedWikiCardId = null;
    render();
  }

  if (action === "edit-wiki") {
    editing = { type: "wiki", id };
    render();
  }

  if (action === "delete-wiki") {
    editing = { type: "delete-wiki", id };
    render();
  }

  if (action === "confirm-delete-wiki") {
    editing = null;
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

document.addEventListener("contextmenu", (event) => {
  const viewport = event.target.closest("[data-map-viewport]");
  if (!viewport || viewport.dataset.canManage !== "true" || event.target.closest(".map-point, .map-upload-button")) return;
  const canvas = viewport.querySelector("[data-map-canvas]");
  if (!canvas) return;
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  editing = { type: "map-point", mapId: viewport.dataset.mapId, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editing) {
    editing = null;
    render();
    return;
  }
  const aliasInput = event.target.closest("[data-wiki-alias-input]");
  if (aliasInput && event.key === "Enter") {
    event.preventDefault();
    aliasInput.closest(".wiki-alias-editor")?.querySelector('[data-action="add-wiki-alias"]')?.click();
    return;
  }
  const input = event.target.closest("[data-tag-input]");
  if (!input) return;

  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    addTagFromPicker(input);
  }
});

function refreshCharacterSheet5e(editor, inferClassSaves = false) {
  if (!editor) return;
  const level = Number(editor.querySelector("[data-5e-level]")?.value) || 1;
  const proficiency = dnd5eProficiencyBonus(level);
  const scores = Object.fromEntries(DND5E_ABILITIES.map(([key]) => [key, Number(editor.querySelector(`[data-5e-ability="${key}"]`)?.value) || 10]));
  const modifier = (key) => dnd5eModifier(scores[key]);

  if (inferClassSaves) {
    const className = normalizeSearchText(editor.querySelector("[data-5e-class]")?.value || "");
    const classSaves = DND5E_CLASS_SAVES[className];
    if (classSaves) editor.querySelectorAll("[data-5e-save]").forEach((input) => { input.checked = classSaves.includes(input.getAttribute("data-5e-save")); });
  }

  const proficiencyOutput = editor.querySelector("[data-5e-proficiency]");
  if (proficiencyOutput) proficiencyOutput.textContent = signedDnd5e(proficiency);
  DND5E_ABILITIES.forEach(([key]) => {
    const modifierOutput = editor.querySelector(`[data-5e-modifier="${key}"]`);
    const saveInput = editor.querySelector(`[data-5e-save="${key}"]`);
    const saveOutput = editor.querySelector(`[data-5e-save-total="${key}"]`);
    if (modifierOutput) modifierOutput.textContent = signedDnd5e(modifier(key));
    if (saveOutput) saveOutput.textContent = signedDnd5e(modifier(key) + (saveInput?.checked ? proficiency : 0));
  });
  DND5E_SKILLS.forEach(([key, , ability]) => {
    const skillInput = editor.querySelector(`[data-5e-skill="${key}"]`);
    const skillOutput = editor.querySelector(`[data-5e-skill-total="${key}"]`);
    if (skillOutput) skillOutput.textContent = signedDnd5e(modifier(ability) + (skillInput?.checked ? proficiency : 0));
  });
  const perception = editor.querySelector('[data-5e-skill="perception"]');
  const passiveOutput = editor.querySelector("[data-5e-passive]");
  if (passiveOutput) passiveOutput.textContent = String(10 + modifier("wis") + (perception?.checked ? proficiency : 0));
  const initiativeOutput = editor.querySelector("[data-5e-initiative]");
  if (initiativeOutput) initiativeOutput.textContent = signedDnd5e(modifier("dex"));
  const armorBase = Number(editor.querySelector("[data-5e-armor-base]")?.value) || 10;
  const armorBonus = Number(editor.querySelector("[data-5e-armor-bonus]")?.value) || 0;
  const armorOutput = editor.querySelector("[data-5e-armor]");
  if (armorOutput) armorOutput.textContent = String(armorBase + modifier("dex") + armorBonus);
  const spellAbility = editor.querySelector("[data-5e-spell-ability]")?.value || "int";
  const spellDcOutput = editor.querySelector("[data-5e-spell-dc]");
  const spellAttackOutput = editor.querySelector("[data-5e-spell-attack]");
  if (spellDcOutput) spellDcOutput.textContent = String(8 + proficiency + modifier(spellAbility));
  if (spellAttackOutput) spellAttackOutput.textContent = signedDnd5e(proficiency + modifier(spellAbility));
}

function refreshStatBlock5e(editor) {
  DND5E_ABILITIES.forEach(([key]) => {
    const score = Number(editor.querySelector(`[data-5e-stat-ability="${key}"]`)?.value) || 10;
    const output = editor.querySelector(`[data-5e-stat-modifier="${key}"]`);
    if (output) output.textContent = signedDnd5e(dnd5eModifier(score));
  });
}

document.addEventListener("change", (event) => {
  const folderSelect = event.target.closest("[data-wiki-folder-move]");
  if (folderSelect) {
    moveWikiPageToFolder(folderSelect.dataset.id, folderSelect.value);
    return;
  }

  const sheetEditor = event.target.closest("[data-5e-sheet-editor]");
  if (sheetEditor) refreshCharacterSheet5e(sheetEditor, event.target.matches("[data-5e-class]"));

  const iconFileInput = event.target.closest("[data-property-icon-file]");
  const iconFile = iconFileInput?.files?.[0];
  if (iconFileInput) {
    if (!iconFile || !iconFile.type.startsWith("image/")) {
      showToast("Elegí una imagen para el icono.");
      return;
    }
    const preview = iconFileInput.closest("[data-property-row]")?.querySelector("[data-property-icon-preview]");
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (preview) preview.innerHTML = renderWikiPropertyIcon(String(reader.result || ""));
    });
    reader.readAsDataURL(iconFile);
    return;
  }

  const mapImageInput = event.target.closest("[data-map-image-file]");
  const mapImageFile = mapImageInput?.files?.[0];
  if (mapImageInput) {
    updateMapImageFromFile(mapImageInput.dataset.mapId, mapImageFile);
    return;
  }

  const fileInput = event.target.closest('.wiki-card-form input[name="imageFile"]');
  const file = fileInput?.files?.[0];
  const preview = fileInput?.closest("form")?.querySelector(".wiki-image-preview");
  if (!file || !preview || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    preview.innerHTML = `<img src="${escapeAttr(String(reader.result || ""))}" alt="Vista previa" />`;
    const removeInput = fileInput.closest("form")?.querySelector('input[name="removeImage"]');
    if (removeInput) removeInput.value = "";
  });
  reader.readAsDataURL(file);
});

document.addEventListener("input", (event) => {
  const sheetEditor = event.target.closest("[data-5e-sheet-editor]");
  if (sheetEditor) refreshCharacterSheet5e(sheetEditor);
  const statEditor = event.target.closest("[data-5e-stat-editor]");
  if (statEditor) refreshStatBlock5e(statEditor);

  const titleInput = event.target.closest('.wiki-card-form input[name="title"]');
  if (titleInput) {
    const primaryAlias = titleInput.closest("form")?.querySelector("[data-primary-alias]");
    if (primaryAlias) primaryAlias.textContent = titleInput.value.trim() || "Nombre de la ficha";
  }

  const imageUrlInput = event.target.closest('.wiki-card-form input[name="imageUrl"]');
  if (imageUrlInput) {
    const preview = imageUrlInput.closest("form")?.querySelector(".wiki-image-preview");
    if (preview && imageUrlInput.value.trim()) preview.innerHTML = `<img src="${escapeAttr(imageUrlInput.value.trim())}" alt="Vista previa" />`;
    const removeInput = imageUrlInput.closest("form")?.querySelector('input[name="removeImage"]');
    if (removeInput) removeInput.value = "";
  }

  const dashboardInput = event.target.closest("[data-dashboard-search]");
  if (dashboardInput) {
    dashboardSearch = dashboardInput.value;
    refreshDashboardResults();
    return;
  }

  const mapInput = event.target.closest("[data-map-search]");
  if (mapInput) {
    mapSearch = mapInput.value;
    render();
    document.querySelector("[data-map-search]")?.focus();
    return;
  }

  const mapLinkSearch = event.target.closest("[data-map-link-search]");
  if (mapLinkSearch) {
    const query = normalizeSearchText(mapLinkSearch.value);
    document.querySelectorAll("[data-map-link-list] > button").forEach((button) => {
      button.hidden = !normalizeSearchText(button.textContent).includes(query);
    });
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

async function saveWikiPage(data) {
  const campaign = campaignById(activeCampaignId);
  const existing = editing.id ? campaign.wiki.find((page) => page.id === editing.id) : null;
  const type = WIKI_CARD_TYPES[data.type] ? data.type : "nota";
  const propertyItems = await wikiPropertyItemsFromData(data);
  if (propertyItems === null) return false;
  const properties = Object.fromEntries(propertyItems.filter((item) => item.value).map((item) => [item.label, item.value]));
  const title = String(data.title || "").trim();
  const editorAliases = Object.entries(data)
    .filter(([key]) => /^alias_/.test(key))
    .map(([, value]) => String(value || "").trim());
  const aliases = [title, ...editorAliases, ...splitTags(data.aliases || "")]
    .filter(Boolean)
    .filter((alias, index, list) => list.findIndex((candidate) => normalizeSearchText(candidate) === normalizeSearchText(alias)) === index);
  const contentBlocks = Array.isArray(data.contentBlocks) ? data.contentBlocks : [];
  const description = contentBlocks.find((block) => block.type === "text")?.text || contentBlocks[0]?.text || "";
  const relationNames = splitTags(data.relationNames || "");
  const relationIds = wikiCardsFor(campaign)
    .filter((card) => relationNames.some((name) =>
      [card.title, ...(card.aliases || [])].some((candidate) => normalizeSearchText(name) === normalizeSearchText(candidate))
    ))
    .map((card) => card.id);
  const payload = {
    title,
    type,
    category: WIKI_CARD_TYPES[type].label,
    aliases,
    folder: String(existing?.folder || editing.folder || "Sin carpeta").trim(),
    properties,
    propertyItems,
    contentBlocks,
    description,
    content: description,
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
  return true;
}

async function wikiPropertyItemsFromData(data) {
  const indexes = Object.keys(data)
    .map((key) => key.match(/^property_label_(.+)$/)?.[1])
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));
  const items = [];
  for (const index of indexes) {
    let icon = String(data[`property_icon_${index}`] || "◆").trim() || "◆";
    const file = data[`property_icon_file_${index}`];
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        showToast("Elegí una imagen para el icono de la propiedad.");
        return null;
      }
      if (file.size > 1024 * 1024) {
        showToast("El icono debe pesar menos de 1 MB.");
        return null;
      }
      try {
        icon = await readFileAsDataUrl(file);
      } catch {
        showToast("No se pudo leer el icono de la propiedad.");
        return null;
      }
    }
    const label = String(data[`property_label_${index}`] || "").trim();
    if (label) items.push({ id: String(data[`property_id_${index}`] || uid("property")), icon, label, value: String(data[`property_value_${index}`] || "").trim() });
  }
  return items;
}

function characterSheet5eFromData(data, index) {
  const field = (key) => data[`block_sheet_${index}_${key}`];
  const spells = Object.fromEntries(Array.from({ length: 10 }, (_, level) => [level, []]));
  const weapons = [];
  Object.keys(data).forEach((key) => {
    const match = key.match(new RegExp(`^block_sheet_${index}_spell_(\\d+)_([^_]+)_name$`));
    if (!match) return;
    const level = Number(match[1]);
    const rowKey = match[2];
    const name = String(data[key] || "").trim();
    if (!name || !spells[level]) return;
    const prefix = `block_sheet_${index}_spell_${level}_${rowKey}`;
    spells[level].push({ id: String(data[`${prefix}_id`] || uid("spell")), name, notes: String(data[`${prefix}_notes`] || "").trim() });
  });
  Object.keys(data).forEach((key) => {
    const match = key.match(new RegExp(`^block_sheet_${index}_weapon_(.+)_name$`));
    if (!match) return;
    const rowKey = match[1];
    const prefix = `block_sheet_${index}_weapon_${rowKey}`;
    const weaponName = String(data[key] || "").trim();
    const damageDice = String(data[`${prefix}_damageDice`] || "").trim();
    if (!weaponName && !damageDice) return;
    weapons.push({
      id: String(data[`${prefix}_id`] || uid("weapon")),
      name: weaponName,
      damageDice,
      ability: String(data[`${prefix}_ability`] || "str"),
      proficient: Boolean(data[`${prefix}_proficient`]),
      bonus: Number(data[`${prefix}_bonus`]) || 0,
      damageType: String(data[`${prefix}_damageType`] || "Cortante"),
      notes: String(data[`${prefix}_notes`] || "").trim(),
    });
  });
  return normalizedCharacterSheet5e({
    type: "characterSheet5e",
    sheet: {
      characterName: String(field("characterName") || "").trim(),
      className: String(field("className") || "").trim(),
      level: Number(field("level")) || 1,
      background: String(field("background") || "").trim(),
      playerName: String(field("playerName") || "").trim(),
      race: String(field("race") || "").trim(),
      alignment: String(field("alignment") || "").trim(),
      experience: String(field("experience") || "").trim(),
      abilities: Object.fromEntries(DND5E_ABILITIES.map(([key]) => [key, Number(field(`ability_${key}`)) || 10])),
      saveProficiencies: DND5E_ABILITIES.map(([key]) => key).filter((key) => Boolean(field(`save_${key}`))),
      skillProficiencies: DND5E_SKILLS.map(([key]) => key).filter((key) => Boolean(field(`skill_${key}`))),
      inspiration: Boolean(field("inspiration")),
      spellcastingAbility: String(field("spellcastingAbility") || "int"),
      spells,
      weapons,
      armorBase: Number(field("armorBase")) || 10,
      armorBonus: Number(field("armorBonus")) || 0,
      speed: Number(field("speed")) || 30,
      maxHp: String(field("maxHp") || "").trim(), currentHp: String(field("currentHp") || "").trim(),
      temporaryHp: String(field("temporaryHp") || "").trim(), hitDice: String(field("hitDice") || "").trim(),
      deathSuccesses: Array.from({ length: 3 }, (_, slot) => Boolean(field(`deathSuccess_${slot}`))).filter(Boolean).length,
      deathFailures: Array.from({ length: 3 }, (_, slot) => Boolean(field(`deathFailure_${slot}`))).filter(Boolean).length,
      attacks: String(field("attacks") || "").trim(), personality: String(field("personality") || "").trim(),
      ideals: String(field("ideals") || "").trim(), bonds: String(field("bonds") || "").trim(), flaws: String(field("flaws") || "").trim(),
      proficiencies: String(field("proficiencies") || "").trim(),
      features: String(field("features") || "").trim(),
    },
  });
}

function statBlock5eFromData(data, index) {
  const field = (key) => data[`block_stat_${index}_${key}`];
  return normalizedStatBlock5e({
    type: "statBlock5e",
    stat: {
      subtitle: String(field("subtitle") || "").trim(),
      armorClass: String(field("armorClass") || "").trim(),
      hitPoints: String(field("hitPoints") || "").trim(),
      speed: String(field("speed") || "").trim(),
      abilities: Object.fromEntries(DND5E_ABILITIES.map(([key]) => [key, Number(field(`ability_${key}`)) || 10])),
      savingThrows: String(field("savingThrows") || "").trim(),
      skills: String(field("skills") || "").trim(),
      senses: String(field("senses") || "").trim(),
      languages: String(field("languages") || "").trim(),
      challenge: String(field("challenge") || "").trim(),
      traits: String(field("traits") || "").trim(),
      actions: String(field("actions") || "").trim(),
      reactions: String(field("reactions") || "").trim(),
    },
  });
}

async function wikiContentBlocksFromData(data) {
  const indexes = Object.keys(data)
    .map((key) => key.match(/^block_type_(.+)$/)?.[1])
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));
  const blocks = [];
  for (const index of indexes) {
    const type = WIKI_CONTENT_TYPES[data[`block_type_${index}`]] ? data[`block_type_${index}`] : "text";
    let url = String(data[`block_url_${index}`] || data[`block_existing_url_${index}`] || "").trim();
    const file = data[`block_file_${index}`];
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        showToast("Elegí un archivo de imagen para el módulo.");
        return null;
      }
      if (file.size > 4 * 1024 * 1024) {
        showToast("Las imágenes deben pesar menos de 4 MB.");
        return null;
      }
      try {
        url = await readFileAsDataUrl(file);
      } catch {
        showToast("No se pudo leer una de las imágenes.");
        return null;
      }
    }
    blocks.push({
      id: String(data[`block_id_${index}`] || uid("block")),
      type,
      title: String(data[`block_title_${index}`] || WIKI_CONTENT_TYPES[type].title).trim(),
      text: String(data[`block_text_${index}`] || "").trim(),
      url,
      sheet: type === "characterSheet5e" ? characterSheet5eFromData(data, index) : undefined,
      stat: type === "statBlock5e" ? statBlock5eFromData(data, index) : undefined,
    });
  }
  return blocks;
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
    mapSettings: {
      playersCanDraw: Boolean(data.playersCanDrawMaps),
      strokeDuration: Math.max(10, Math.min(3600, Number(data.mapStrokeDuration) || 90)),
    },
  });
}

function createMapFromCard(cardId) {
  const campaign = campaignById(activeCampaignId);
  if (!campaign || !canManageCampaign(campaign, currentUser().id)) return;
  const card = campaign.wiki.find((item) => item.id === cardId);
  if (!card || mapsFor(campaign).some((map) => map.cardId === cardId)) return;
  const map = { id: uid("map"), cardId, points: [], playerStrokes: [], createdAt: Date.now() };
  campaign.maps = [...mapsFor(campaign), map];
  card.mapId = map.id;
  const items = Array.isArray(card.propertyItems) ? card.propertyItems : normalizedWikiPropertyItems(card);
  if (!items.some((item) => normalizeSearchText(item.label) === "mapa")) items.push({ id: uid("property"), icon: "⌖", label: "Mapa", value: "Mapa interactivo vinculado" });
  card.propertyItems = items;
  card.properties = { ...(card.properties || {}), Mapa: "Mapa interactivo vinculado" };
  ensureWikiMapBlock(card);
  card.modifiedAt = Date.now();
  selectedMapId = map.id;
  editing = null;
  saveState();
  render();
  showToast(`Mapa creado para ${card.title}.`);
}

function addMapPoint(mapId, cardId, x, y) {
  const campaign = campaignById(activeCampaignId);
  const map = mapsFor(campaign).find((item) => item.id === mapId);
  if (!campaign || !map || !canManageCampaign(campaign, currentUser().id)) return;
  map.points = [...(map.points || []), { id: uid("point"), cardId, x: Math.max(0, Math.min(100, Number(x))), y: Math.max(0, Math.min(100, Number(y))) }];
  editing = null;
  saveState();
  render();
  showToast("Punto interactivo agregado.");
}

async function updateMapImageFromFile(mapId, file) {
  const campaign = campaignById(activeCampaignId);
  const map = mapsFor(campaign).find((item) => item.id === mapId);
  if (!campaign || !map || !canManageCampaign(campaign, currentUser().id)) return;
  if (!(file instanceof File) || file.size <= 0 || !file.type.startsWith("image/")) {
    showToast("ElegÃ­ una imagen para el mapa.");
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    showToast("La imagen del mapa debe pesar menos de 4 MB.");
    return;
  }
  try {
    map.imageUrl = await readFileAsDataUrl(file);
    ensureWikiMapBlock(campaign.wiki.find((card) => card.id === map.cardId));
    selectedMapId = map.id;
    saveState();
    render();
    showToast("Imagen del mapa actualizada.");
  } catch {
    showToast("No se pudo leer la imagen del mapa.");
  }
}

function createWikiFolder(value) {
  const campaign = campaignById(activeCampaignId);
  if (!campaign || !canManageCampaign(campaign, currentUser().id)) return false;
  const folder = String(value || "").trim();
  const folderKey = normalizeSearchText(folder);
  if (!folder) {
    showToast("Escribí un nombre para la carpeta.");
    return false;
  }
  if (["all", "todas las fichas", "sin carpeta"].includes(folderKey)) {
    showToast("Elegí otro nombre para la carpeta.");
    return false;
  }
  if (wikiFoldersFor(campaign).some((item) => normalizeSearchText(item) === folderKey)) {
    showToast("Ya existe una carpeta con ese nombre.");
    return false;
  }
  campaign.wikiFolders = [...(Array.isArray(campaign.wikiFolders) ? campaign.wikiFolders : []), folder];
  wikiFolder = folder;
  selectedWikiCardId = null;
  return true;
}

function moveWikiPageToFolder(id, value) {
  const campaign = campaignById(activeCampaignId);
  if (!campaign || !canManageCampaign(campaign, currentUser().id)) return;
  const page = campaign.wiki.find((item) => item.id === id);
  const folder = String(value || "Sin carpeta").trim() || "Sin carpeta";
  if (!page || page.folder === folder) return;
  page.folder = folder;
  page.modifiedAt = Date.now();
  selectedWikiCardId = page.id;
  wikiFolder = folder;
  saveState();
  render();
  showToast(`Ficha movida a ${folder}.`);
}

function deleteWikiPage(id) {
  const campaign = campaignById(activeCampaignId);
  campaign.wiki = campaign.wiki.filter((page) => page.id !== id);
  campaign.wiki.forEach((page) => {
    if (Array.isArray(page.relations)) page.relations = page.relations.filter((targetId) => targetId !== id);
  });
  campaign.maps = mapsFor(campaign)
    .filter((map) => map.cardId !== id)
    .map((map) => ({ ...map, points: (map.points || []).filter((point) => point.cardId !== id) }));
  if (!campaign.maps.some((map) => map.id === selectedMapId)) selectedMapId = campaign.maps[0]?.id || null;
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
