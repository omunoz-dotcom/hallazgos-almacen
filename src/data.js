// ============================================================
//  DATA.JS  —  Estado de la app y sincronización con Sheets
// ============================================================

const SHEET_HALLAZGOS = "Hallazgos";
const SHEET_TPM       = "TPM";
const SHEET_CATEGORIAS = "Categorias";

const State = {
  hallazgos: [],
  tpm: [],
  cats: [...CONFIG.CATEGORIAS],
  loading: false,
  synced: false,
};

// ── Helpers ──────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function hoy() {
  return new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function ahora() {
  return new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit",
  });
}

function isoNow() {
  return new Date().toISOString();
}

// Convierte base64 de imagen a URL corta para guardar en Sheets
// (guardamos solo flag "si/no" + las fotos en base64 local por sesión)
// Para producción real se puede integrar Google Drive en el Apps Script
function fotoFlag(arr) {
  return arr && arr.length ? arr.length + " foto(s)" : "";
}

// ── Carga inicial ─────────────────────────────────────────────

async function loadAll() {
  State.loading = true;
  UI.showLoader();
  try {
    const [hallazgos, tpm, cats] = await Promise.all([
      Sheets.getAll(SHEET_HALLAZGOS),
      Sheets.getAll(SHEET_TPM),
      Sheets.getAll(SHEET_CATEGORIAS),
    ]);
    State.hallazgos = hallazgos || [];
    State.tpm       = tpm || [];
    if (cats && cats.length) State.cats = cats;
    State.synced = true;
  } catch (e) {
    console.error("Error cargando datos:", e);
    UI.toast("⚠ Sin conexión — trabajando sin sincronización", "warn");
    // Fallback: datos en memoria (sesión)
  }
  State.loading = false;
  UI.hideLoader();
}

// ── Hallazgos ─────────────────────────────────────────────────

async function crearHallazgo(datos) {
  const row = {
    id:           genId(),
    fecha:        hoy(),
    isoFecha:     isoNow(),
    reportadoPor: datos.reportadoPor,
    turno:        datos.turno,
    cat:          datos.cat,
    catNombre:    datos.catNombre,
    zona:         datos.zona,
    equipo:       datos.equipo || "",
    descripcion:  datos.descripcion,
    accion:       datos.accion || "",
    prioridad:    datos.prioridad,
    estatus:      "Pendiente",
    responsable:  "",
    fechaCierre:  "",
    fotos:        fotoFlag(datos.fotos),
    fotosData:    datos.fotos || [],   // solo en memoria esta sesión
  };
  State.hallazgos.unshift(row);
  try {
    // No enviamos fotosData (base64) a Sheets — solo el conteo
    const { fotosData, ...rowParaSheets } = row;
    await Sheets.insert(SHEET_HALLAZGOS, rowParaSheets);
  } catch (e) {
    UI.toast("Guardado local — sin conexión", "warn");
  }
  return row;
}

async function actualizarHallazgo(id, fields) {
  const h = State.hallazgos.find(x => x.id === id);
  if (!h) return;
  Object.assign(h, fields);
  try {
    await Sheets.update(SHEET_HALLAZGOS, id, fields);
  } catch (e) {
    UI.toast("Sin conexión — cambio guardado localmente", "warn");
  }
}

async function eliminarHallazgo(id) {
  State.hallazgos = State.hallazgos.filter(x => x.id !== id);
  try {
    await Sheets.remove(SHEET_HALLAZGOS, id);
  } catch (e) {
    UI.toast("Sin conexión", "warn");
  }
}

// ── TPM ───────────────────────────────────────────────────────

async function iniciarTPM(datos) {
  const row = {
    id:          genId(),
    fecha:       hoy(),
    isoFecha:    isoNow(),
    operador:    datos.operador,
    turno:       datos.turno,
    equipo:      datos.equipo,
    tipo:        datos.tipo,
    descripcion: datos.descripcion || "",
    estado:      "En curso",
    horaInicio:  ahora(),
    horaFin:     "",
    escalado:    false,
    motivoEscalada: "",
    fotosAntes:  fotoFlag(datos.fotosAntes),
    fotosDespues: "",
    fotosAntesData:   datos.fotosAntes || [],
    fotosDespuesData: [],
  };
  State.tpm.unshift(row);
  try {
    const { fotosAntesData, fotosDespuesData, ...rowParaSheets } = row;
    await Sheets.insert(SHEET_TPM, rowParaSheets);
  } catch (e) {
    UI.toast("Guardado local — sin conexión", "warn");
  }
  return row;
}

async function finalizarTPM(id, fotosData) {
  const t = State.tpm.find(x => x.id === id);
  if (!t) return;
  t.estado      = "Finalizado";
  t.horaFin     = ahora();
  t.fotosDespues = fotoFlag(fotosData);
  t.fotosDespuesData = fotosData || [];
  try {
    await Sheets.update(SHEET_TPM, id, {
      estado: t.estado,
      horaFin: t.horaFin,
      fotosDespues: t.fotosDespues,
    });
  } catch (e) {
    UI.toast("Sin conexión", "warn");
  }
}

async function escalarTPM(id, motivo) {
  const t = State.tpm.find(x => x.id === id);
  if (!t) return;
  t.escalado = true;
  t.motivoEscalada = motivo;
  t.estado = "Escalado";
  try {
    await Sheets.update(SHEET_TPM, id, {
      escalado: true,
      motivoEscalada: motivo,
      estado: "Escalado",
    });
  } catch (e) {
    UI.toast("Sin conexión", "warn");
  }
}

async function guardarCategoria(cat) {
  State.cats.push(cat);
  try {
    await Sheets.insert(SHEET_CATEGORIAS, cat);
  } catch (e) {}
}

async function eliminarCategoria(id) {
  State.cats = State.cats.filter(c => c.id !== id);
  try {
    await Sheets.remove(SHEET_CATEGORIAS, id);
  } catch (e) {}
}

// ── TPM: agregar fotos después (en sesión) ────────────────────
function addFotosTPM(id, nuevasFotos) {
  const t = State.tpm.find(x => x.id === id);
  if (!t) return;
  if (!t.fotosDespuesData) t.fotosDespuesData = [];
  t.fotosDespuesData.push(...nuevasFotos);
}
