// ============================================================
//  UI.JS  —  Renderizado y componentes visuales
// ============================================================

const COLORS = [
  { bg:"#FAECE7", border:"#D85A30", text:"#993C1D", dot:"#D85A30" },
  { bg:"#E6F1FB", border:"#378ADD", text:"#185FA5", dot:"#378ADD" },
  { bg:"#FAEEDA", border:"#EF9F27", text:"#BA7517", dot:"#EF9F27" },
  { bg:"#EAF3DE", border:"#639922", text:"#3B6D11", dot:"#639922" },
  { bg:"#FCEBEB", border:"#E24B4A", text:"#A32D2D", dot:"#E24B4A" },
  { bg:"#F1EFE8", border:"#888780", text:"#5F5E5A", dot:"#888780" },
  { bg:"#EEEDFE", border:"#7F77DD", text:"#534AB7", dot:"#7F77DD" },
  { bg:"#FBEAF0", border:"#D4537E", text:"#993556", dot:"#D4537E" },
  { bg:"#E1F5EE", border:"#1D9E75", text:"#0F6E56", dot:"#1D9E75" },
];

const ICONS_LISTA = [
  "engine","droplet-off","building-arch","recycle","shield-exclamation",
  "trash","thermometer","bug","bolt","molecule","flask","microscope",
  "plant","box","forklift","alert-triangle","fire","water","wind",
  "tool","settings","clipboard","first-aid-kit","virus",
];

const UI = (() => {
  let toastTimer = null;

  function toast(msg, tipo = "ok") {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast show " + tipo;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }

  function showLoader() {
    document.getElementById("app").innerHTML =
      `<div class="loader"><i class="ti ti-loader-2 spin"></i><p>Cargando datos...</p></div>`;
  }

  function hideLoader() { /* app.js llama render() */ }

  // ── Badges ───────────────────────────────────────────────────

  function badgeSev(p) {
    const map = { alta: "b-alta", media: "b-media", baja: "b-baja" };
    const label = { alta: "Alta", media: "Media", baja: "Baja" };
    return `<span class="badge ${map[p]}">${label[p] || p}</span>`;
  }

  function badgeEst(e) {
    const map = { Pendiente:"b-pend", "En proceso":"b-proc", Cerrado:"b-cerr", Finalizado:"b-cerr", Escalado:"b-esc" };
    return `<span class="badge ${map[e] || 'b-pend'}">${e}</span>`;
  }

  function badgeCat(h) {
    const cat = State.cats.find(c => c.id === h.cat);
    const col = cat ? COLORS[cat.color] : COLORS[5];
    return `<span class="badge" style="background:${col.bg};color:${col.text}">${h.catNombre || "—"}</span>`;
  }

  // ── Fotos inline ─────────────────────────────────────────────

  function thumbs(arr, size = 52) {
    if (!arr || !arr.length) return "";
    return `<div class="photo-row">${arr.map(s =>
      `<img class="ph-thumb" style="width:${size}px;height:${size}px" src="${s}" alt="foto">`
    ).join("")}</div>`;
  }

  // ── Sección: Levantar ────────────────────────────────────────

  function renderLevantar() {
    const zonas = CONFIG.ZONAS.map(z => `<option>${z}</option>`).join("");
    const acciones = [
      "Mantenimiento correctivo","Mantenimiento preventivo",
      "Recolección / Tratamiento ambiental","Limpieza y orden",
      "Evaluación estructural","Gestión ambiental externa","Reporte a dirección",
    ].map(a => `<option>${a}</option>`).join("");
    const turnos = CONFIG.TURNOS.map(t => `<option>${t}</option>`).join("");

    return `
    <div class="card">
      <div class="ct"><i class="ti ti-user-check"></i>¿Quién reporta?</div>
      <div class="frow">
        <div class="fg"><label>Nombre del operador</label><input id="reporta" type="text" placeholder="Tu nombre completo..."></div>
        <div class="fg"><label>Turno</label><select id="turno"><option value="">Seleccionar...</option>${turnos}</select></div>
      </div>
    </div>

    <div class="card">
      <div class="ct"><i class="ti ti-tag"></i>Tipo de hallazgo</div>
      <div class="cat-grid" id="catGrid">${renderCatGrid()}</div>
    </div>

    <div class="card">
      <div class="ct"><i class="ti ti-info-circle"></i>Detalle del hallazgo</div>
      <div class="frow">
        <div class="fg"><label>Zona / Área</label><select id="zona"><option value="">Seleccionar...</option>${zonas}</select></div>
        <div class="fg"><label>Equipo / Elemento</label><input id="equipo" type="text" placeholder="Ej: Elevador #3..."></div>
      </div>
      <div class="fg full"><label>Descripción</label><textarea id="desc" placeholder="Qué falla, dónde, condición actual..."></textarea></div>
      <div class="fg full" style="margin-top:9px"><label>Acción requerida</label><select id="accion"><option value="">Seleccionar...</option>${acciones}</select></div>
      <label class="field-label" style="margin-top:10px">Prioridad</label>
      <div class="sev-row">
        <button class="sev-btn" data-sev="alta">🔴 Alta — Detener</button>
        <button class="sev-btn" data-sev="media">🟡 Media — Esta semana</button>
        <button class="sev-btn" data-sev="baja">🟢 Baja — Programar</button>
      </div>
      <label class="field-label"><i class="ti ti-camera"></i> Evidencia fotográfica</label>
      <div class="photo-zone" id="phZoneLev">
        <input type="file" id="ph-lev" accept="image/*" multiple style="display:none">
        <i class="ti ti-photo-plus"></i>
        <p>Toca para agregar fotos</p>
      </div>
      <div class="photo-previews" id="prevLev"></div>
      <div class="info-box" style="margin-top:9px">
        <i class="ti ti-info-circle"></i>
        Fecha de cierre y responsable se asignan en la <strong>Minuta</strong>.
      </div>
      <button class="btn acc full" id="btnGuardar"><i class="ti ti-circle-plus"></i>Registrar hallazgo</button>
    </div>`;
  }

  function renderCatGrid() {
    return State.cats.map(c => {
      const col = COLORS[c.color];
      const sel = App.state.selCat === c.id;
      const style = sel
        ? `border-color:${col.border};background:${col.bg};color:${col.text};border-width:1.5px`
        : "";
      return `<button class="cat-btn" data-cat="${c.id}" style="${style}">
        <i class="ti ti-${c.icono}" style="color:${sel ? col.text : col.dot}"></i>
        ${c.nombre}
      </button>`;
    }).join("");
  }

  // ── Sección: TPM ─────────────────────────────────────────────

  function renderTPM() {
    const turnos = CONFIG.TURNOS.map(t => `<option>${t}</option>`).join("");
    const tipos  = CONFIG.ACTIVIDADES_TPM.map(a => `<option>${a}</option>`).join("");

    const lista = State.tpm.map(t => {
      const fotosA = thumbs(t.fotosAntesData);
      const fotosD = thumbs(t.fotosDespuesData);
      const stBadge = t.escalado
        ? `<span class="badge b-esc"><i class="ti ti-arrow-up"></i>Escalado</span>`
        : t.estado === "Finalizado"
          ? `<span class="badge b-cerr"><i class="ti ti-check"></i>Finalizado ${t.horaFin}</span>`
          : `<span class="badge b-proc">En curso ${t.horaInicio}</span>`;

      const acciones = t.estado !== "Finalizado" && !t.escalado ? `
        <div class="tpm-actions">
          <label class="btn sm ghost" style="cursor:pointer">
            <input type="file" accept="image/*" multiple style="display:none" data-tpm-fotos="${t.id}">
            <i class="ti ti-camera"></i> Foto al finalizar
          </label>
          <button class="btn sm teal" data-finalizar="${t.id}"><i class="ti ti-check"></i>Registrar finalización</button>
          <button class="btn sm red" data-escalar="${t.id}"><i class="ti ti-arrow-up"></i>Escalar a mantenimiento</button>
        </div>` : t.escalado
          ? `<div class="motivo-esc"><i class="ti ti-alert-triangle"></i> Motivo: ${t.motivoEscalada || "—"}</div>` : "";

      return `<div class="tpm-item">
        <div class="tpm-hdr">
          <div>
            <div class="tpm-title">${t.equipo} — ${t.tipo}</div>
            <div class="tpm-sub"><i class="ti ti-user"></i>${t.operador}${t.turno ? " · " + t.turno : ""} · ${t.fecha}</div>
            ${t.descripcion ? `<div class="tpm-sub" style="margin-top:2px">${t.descripcion}</div>` : ""}
          </div>
          <div>${stBadge}</div>
        </div>
        ${fotosA ? `<div class="ph-label">Antes:</div>${fotosA}` : ""}
        ${fotosD ? `<div class="ph-label">Después:</div>${fotosD}` : ""}
        ${acciones}
      </div>`;
    }).join("") || `<div class="empty"><i class="ti ti-tool"></i><p>Sin actividades TPM</p></div>`;

    return `
    <div class="card">
      <div class="ct"><i class="ti ti-tool"></i>Nueva actividad TPM</div>
      <div class="frow">
        <div class="fg"><label>Operador responsable</label><input id="tpm-op" type="text" placeholder="Nombre del operador..."></div>
        <div class="fg"><label>Turno</label><select id="tpm-turno"><option value="">Seleccionar...</option>${turnos}</select></div>
      </div>
      <div class="frow">
        <div class="fg"><label>Zona / Equipo</label><input id="tpm-equipo" type="text" placeholder="Ej: Elevador #3..."></div>
        <div class="fg"><label>Tipo de actividad</label><select id="tpm-tipo"><option value="">Seleccionar...</option>${tipos}</select></div>
      </div>
      <div class="fg full"><label>Descripción</label><textarea id="tpm-desc" placeholder="Qué se va a realizar..."></textarea></div>
      <label class="field-label"><i class="ti ti-camera"></i> Foto antes de iniciar</label>
      <div class="photo-zone" id="phZoneTPM">
        <input type="file" id="ph-tpm" accept="image/*" multiple style="display:none">
        <i class="ti ti-photo"></i>
        <p>Estado inicial del equipo</p>
      </div>
      <div class="photo-previews" id="prevTPM"></div>
      <button class="btn acc full" style="margin-top:10px" id="btnIniciarTPM">
        <i class="ti ti-player-play"></i>Registrar inicio de actividad
      </button>
    </div>
    <div id="tpmListaWrap">${lista}</div>`;
  }

  // ── Sección: Hallazgos ───────────────────────────────────────

  function renderHallazgos() {
    const lista = State.hallazgos.map(h => {
      const fotos = thumbs(h.fotosData, 52);
      return `<div class="h-item">
        <div class="h-title">${h.zona}${h.equipo ? " — " + h.equipo : ""}</div>
        <div class="h-desc">${h.descripcion}</div>
        <div class="h-reporter"><i class="ti ti-user"></i>${h.reportadoPor}${h.turno ? " · " + h.turno : ""} · ${h.fecha}</div>
        <div class="h-meta">
          ${badgeCat(h)} ${badgeSev(h.prioridad)} ${badgeEst(h.estatus)}
        </div>
        ${h.responsable ? `<div class="h-resp"><i class="ti ti-user-check"></i>${h.responsable}${h.fechaCierre ? " · Cierre: " + h.fechaCierre : ""}</div>` : ""}
        ${fotos}
        <div class="h-acts">
          <button class="a-btn" data-set-est="${h.id}" data-est="En proceso"><i class="ti ti-player-play"></i>En proceso</button>
          <button class="a-btn" data-set-est="${h.id}" data-est="Cerrado"><i class="ti ti-check"></i>Cerrar</button>
          <button class="a-btn" data-del="${h.id}"><i class="ti ti-trash"></i>Eliminar</button>
        </div>
      </div>`;
    }).join("") || `<div class="empty"><i class="ti ti-clipboard-x"></i><p>Sin hallazgos registrados</p></div>`;

    return `
    <div style="display:flex;gap:7px;margin-bottom:0.8rem">
      <select id="fEst" class="filter-sel">
        <option value="">Todos los estatus</option>
        <option>Pendiente</option><option>En proceso</option><option>Cerrado</option>
      </select>
      <select id="fSev" class="filter-sel">
        <option value="">Todas las prioridades</option>
        <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
      </select>
    </div>
    <div id="lisLista">${lista}</div>`;
  }

  // ── Sección: Minuta ──────────────────────────────────────────

  function renderMinuta() {
    const hoy = new Date().toLocaleDateString("es-MX", {
      weekday:"long", day:"2-digit", month:"long", year:"numeric"
    });
    const pend = State.hallazgos.filter(h => h.estatus !== "Cerrado");
    const items = pend.map((h, i) => {
      const cat = State.cats.find(c => c.id === h.cat);
      const col = cat ? COLORS[cat.color] : COLORS[5];
      return `<div class="min-item">
        <div class="min-num">${i + 1}</div>
        <div style="flex:1">
          <div class="min-h">${h.zona} — <span style="color:${col.text}">${h.catNombre}</span></div>
          <div class="min-d">${h.descripcion.length > 90 ? h.descripcion.slice(0, 90) + "…" : h.descripcion}</div>
          <div style="margin-top:4px;display:flex;gap:5px;align-items:center">
            ${badgeSev(h.prioridad)}
            <span class="meta-txt">Reportó: ${h.reportadoPor}${h.turno ? " · " + h.turno : ""}</span>
          </div>
          <div class="min-fields">
            <div class="min-field">
              <label><i class="ti ti-user"></i> Responsable</label>
              <input type="text" data-min-resp="${h.id}" value="${h.responsable || ""}" placeholder="Asignar...">
            </div>
            <div class="min-field">
              <label><i class="ti ti-calendar"></i> Fecha de cierre acordada</label>
              <input type="date" data-min-fecha="${h.id}" value="${h.fechaCierre || ""}">
            </div>
          </div>
        </div>
      </div>`;
    }).join("") || `<div class="empty"><i class="ti ti-circle-check"></i><p>Sin hallazgos pendientes</p></div>`;

    const esc = State.tpm.filter(t => t.escalado);
    const escHtml = esc.length ? `
      <div style="margin-top:1rem;padding-top:1rem;border-top:0.5px solid var(--border)">
        <div class="ct" style="margin-bottom:0.5rem"><i class="ti ti-arrow-up"></i>Escalados a mantenimiento</div>
        ${esc.map(t => `<div class="min-item">
          <div class="min-num"><i class="ti ti-tool" style="font-size:10px"></i></div>
          <div style="flex:1">
            <div class="min-h">${t.equipo} — ${t.tipo}</div>
            <div class="min-d">Operador: ${t.operador} · ${t.fecha}</div>
            <div class="min-d">Motivo: ${t.motivoEscalada || "—"}</div>
          </div>
        </div>`).join("")}
      </div>` : "";

    return `
    <div class="card">
      <div class="ct" style="justify-content:space-between">
        <span><i class="ti ti-notes"></i>Minuta — ${hoy.charAt(0).toUpperCase() + hoy.slice(1)}</span>
        <button class="btn sm teal" id="btnExportar"><i class="ti ti-download"></i>Exportar</button>
      </div>
      ${items}
      ${escHtml}
    </div>`;
  }

  // ── Sección: Seguimiento ─────────────────────────────────────

  function renderSeguimiento() {
    const tot  = State.hallazgos.length;
    const cerr = State.hallazgos.filter(h => h.estatus === "Cerrado").length;
    const pct  = tot ? Math.round(cerr / tot * 100) : 0;

    const lista = State.hallazgos.map(h => `
      <div class="seg-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div>
            <div class="seg-title">${h.zona}${h.equipo ? " — " + h.equipo : ""}</div>
            <div class="seg-sub">${h.catNombre} · ${h.reportadoPor}${h.responsable ? " → " + h.responsable : ""}${h.fechaCierre ? " · Cierre: " + h.fechaCierre : ""}</div>
          </div>
          ${badgeSev(h.prioridad)}
        </div>
        <div class="st-btns">
          <button class="st-btn ${h.estatus === "Pendiente" ? "st-pend" : ""}" data-seg="${h.id}" data-est="Pendiente">Pendiente</button>
          <button class="st-btn ${h.estatus === "En proceso" ? "st-proc" : ""}" data-seg="${h.id}" data-est="En proceso">En proceso</button>
          <button class="st-btn ${h.estatus === "Cerrado" ? "st-cerr" : ""}" data-seg="${h.id}" data-est="Cerrado">Cerrado</button>
        </div>
      </div>`).join("") || `<div class="empty"><i class="ti ti-chart-line"></i><p>Sin datos aún</p></div>`;

    return `
    <div class="seg-item" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="seg-title">Progreso general</div>
        <span class="badge ${pct === 100 ? "b-cerr" : "b-proc"}">${pct}%</span>
      </div>
      <div class="seg-sub">${cerr} de ${tot} cerrados · ${tot - cerr} activos</div>
      <div class="pb-wrap"><div class="pb" style="width:${pct}%"></div></div>
    </div>
    ${lista}`;
  }

  // ── Sección: Config ──────────────────────────────────────────

  function renderConfig() {
    const catItems = State.cats.map((c, i) => {
      const col = COLORS[c.color];
      return `<div class="cfg-item">
        <div class="cfg-icon" style="background:${col.bg};color:${col.text}"><i class="ti ti-${c.icono}"></i></div>
        <div style="flex:1">
          <div style="font-size:13px">${c.nombre}</div>
          <div style="font-size:10px;color:var(--text-sec)">${c.modulo || "Sin módulo"}</div>
        </div>
        ${i >= CONFIG.CATEGORIAS.length
          ? `<button class="btn sm ghost" data-del-cat="${c.id}"><i class="ti ti-trash"></i></button>`
          : ""}
      </div>`;
    }).join("");

    const iconOpts = ICONS_LISTA.map((ic, i) =>
      `<div class="icon-opt${i === App.state.selIcon ? " si" : ""}" data-icon="${i}">
        <i class="ti ti-${ic}"></i>
      </div>`).join("");

    const colorOpts = COLORS.map((c, i) =>
      `<div class="color-dot${i === App.state.selColor ? " sc2" : ""}" style="background:${c.dot}" data-color="${i}"></div>`
    ).join("");

    return `
    <div class="card">
      <div class="ct" style="justify-content:space-between">
        <span><i class="ti ti-tag"></i>Tipos de hallazgo</span>
        <button class="btn sm ghost" id="btnToggleForm"><i class="ti ti-plus"></i>Agregar</button>
      </div>
      <div id="cfgLista">${catItems}</div>
      <div id="nuevaForm" style="display:none;margin-top:0.7rem">
        <div style="height:0.5px;background:var(--border);margin-bottom:0.7rem"></div>
        <div style="background:var(--bg-sec);border:0.5px solid var(--border);border-radius:var(--r-lg);padding:0.9rem">
          <p style="font-size:12px;font-weight:500;margin-bottom:0.6rem;color:var(--text-sec)">Nuevo tipo</p>
          <div class="frow">
            <div class="fg"><label>Nombre</label><input id="nc-nombre" type="text" placeholder="Ej: Contaminación cruzada"></div>
            <div class="fg"><label>Módulo</label><input id="nc-modulo" type="text" placeholder="Ej: Calidad..."></div>
          </div>
          <label class="field-label">Ícono</label>
          <div class="icon-grid" id="iconGrid">${iconOpts}</div>
          <label class="field-label">Color</label>
          <div class="color-row" id="colorRow">${colorOpts}</div>
          <div style="display:flex;gap:7px;margin-top:0.65rem">
            <button class="btn acc sm" id="btnGuardarCat"><i class="ti ti-check"></i>Guardar</button>
            <button class="btn ghost sm" id="btnCancelarCat">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-wifi"></i>Estado de conexión</div>
      <div style="font-size:12px;color:var(--text-sec);line-height:1.7">
        <div><i class="ti ti-circle-check" style="color:#1D9E75"></i> Sincronización: <strong>${State.synced ? "Conectado a Google Sheets" : "Sin conexión — datos en memoria"}</strong></div>
        <div style="margin-top:4px"><i class="ti ti-table"></i> Sheet ID: <code style="font-size:10px;background:var(--bg-sec);padding:1px 5px;border-radius:4px">${CONFIG.SHEET_ID.slice(0, 20)}${CONFIG.SHEET_ID.length > 20 ? "…" : ""}</code></div>
      </div>
    </div>`;
  }

  // ── Exportar minuta ──────────────────────────────────────────

  function exportarMinuta() {
    const pend = State.hallazgos.filter(h => h.estatus !== "Cerrado");
    const esc  = State.tpm.filter(t => t.escalado);
    const hoy  = new Date().toLocaleDateString("es-MX");
    let txt = `MINUTA DIARIA DE HALLAZGOS\n${hoy}\n${"─".repeat(50)}\n\n`;
    pend.forEach((h, i) => {
      txt += `${i+1}. [${h.prioridad.toUpperCase()}] ${h.zona} — ${h.catNombre}\n`;
      txt += `   Descripción: ${h.descripcion}\n`;
      txt += `   Reportado por: ${h.reportadoPor}${h.turno ? " (" + h.turno + ")" : ""}\n`;
      if (h.accion) txt += `   Acción: ${h.accion}\n`;
      txt += `   Responsable: ${h.responsable || "Por asignar"}\n`;
      txt += `   Fecha cierre: ${h.fechaCierre || "Por definir en minuta"}\n`;
      txt += `   Estatus: ${h.estatus}\n\n`;
    });
    if (esc.length) {
      txt += `\nESCALADOS A MANTENIMIENTO\n${"─".repeat(50)}\n`;
      esc.forEach((t, i) => {
        txt += `${i+1}. ${t.equipo} — ${t.tipo}\n   Operador: ${t.operador}\n   Motivo: ${t.motivoEscalada || "—"}\n\n`;
      });
    }
    const blob = new Blob([txt], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `minuta_${hoy.replace(/\//g, "-")}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast("Minuta exportada");
  }

  return {
    toast, showLoader, hideLoader,
    renderLevantar, renderTPM, renderHallazgos,
    renderMinuta, renderSeguimiento, renderConfig,
    renderCatGrid, exportarMinuta,
    badgeSev, badgeEst, badgeCat, thumbs,
    COLORS, ICONS_LISTA,
  };
})();
