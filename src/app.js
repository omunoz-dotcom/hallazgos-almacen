// ============================================================
//  APP.JS  —  Controlador principal, navegación y eventos
// ============================================================

const App = {
  tab: "lev",
  state: {
    selCat: "",
    selSev: "",
    selIcon: 0,
    selColor: 0,
    levFotos: [],
    tpmAntes: [],
    tpmFotosDespues: {}, // id → []
  },

  // ── Bootstrap ─────────────────────────────────────────────

  async init() {
    this.renderShell();
    await loadAll();
    this.renderTab(this.tab);
    this.updateStats();
  },

  // ── Shell (header + tabs persistentes) ────────────────────

  renderShell() {
    document.getElementById("app").innerHTML = `
      <div class="app">
        <div class="hdr">
          <div class="hdr-icon"><i class="ti ti-building-warehouse"></i></div>
          <div>
            <h1>${CONFIG.EMPRESA} — Hallazgos &amp; TPM</h1>
            <p>Levantamiento · Mantenimiento autónomo · Seguimiento</p>
          </div>
        </div>
        <div class="stats">
          <div class="sc"><div class="sc-n n-amb" id="s-tot">—</div><div class="sc-l">Hallazgos</div></div>
          <div class="sc"><div class="sc-n n-red" id="s-alt">—</div><div class="sc-l">Alta prioridad</div></div>
          <div class="sc"><div class="sc-n n-teal" id="s-tpm">—</div><div class="sc-l">TPM activos</div></div>
          <div class="sc"><div class="sc-n n-gry" id="s-esc">—</div><div class="sc-l">Escalados</div></div>
        </div>
        <div class="tabs" role="tablist">
          <button class="tab active" data-tab="lev"><i class="ti ti-clipboard-plus"></i>Levantar</button>
          <button class="tab" data-tab="tpm"><i class="ti ti-tool"></i>TPM</button>
          <button class="tab" data-tab="lis"><i class="ti ti-list"></i>Hallazgos</button>
          <button class="tab" data-tab="min"><i class="ti ti-notes"></i>Minuta</button>
          <button class="tab" data-tab="seg"><i class="ti ti-chart-line"></i>Seguimiento</button>
          <button class="tab" data-tab="cfg"><i class="ti ti-settings"></i>Config.</button>
        </div>
        <div id="tabContent"></div>
      </div>`;
    this.bindTabs();
  },

  bindTabs() {
    document.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        this.tab = btn.dataset.tab;
        this.renderTab(this.tab);
      });
    });
  },

  // ── Render de cada tab ────────────────────────────────────

  renderTab(tab) {
    const content = document.getElementById("tabContent");
    const renders = {
      lev: () => UI.renderLevantar(),
      tpm: () => UI.renderTPM(),
      lis: () => UI.renderHallazgos(),
      min: () => UI.renderMinuta(),
      seg: () => UI.renderSeguimiento(),
      cfg: () => UI.renderConfig(),
    };
    content.innerHTML = renders[tab] ? renders[tab]() : "";
    this.bindTabEvents(tab);
    this.updateStats();
  },

  // ── Eventos por tab ───────────────────────────────────────

  bindTabEvents(tab) {
    const s = this.state;

    if (tab === "lev") {
      // Categorías
      document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          s.selCat = btn.dataset.cat;
          document.getElementById("catGrid").innerHTML = UI.renderCatGrid();
          this.bindTabEvents("lev"); // rebind after re-render
        });
      });
      // Prioridad
      document.querySelectorAll(".sev-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".sev-btn").forEach(b => b.classList.remove("s-alta","s-media","s-baja"));
          btn.classList.add("s-" + btn.dataset.sev);
          s.selSev = btn.dataset.sev;
        });
      });
      // Fotos hallazgo
      this.bindPhotoZone("phZoneLev", "ph-lev", "levFotos", "prevLev");
      // Guardar
      document.getElementById("btnGuardar")?.addEventListener("click", () => this.guardarHallazgo());
    }

    if (tab === "tpm") {
      this.bindPhotoZone("phZoneTPM", "ph-tpm", "tpmAntes", "prevTPM");
      document.getElementById("btnIniciarTPM")?.addEventListener("click", () => this.iniciarTPM());
      // Finalizar / Escalar / Fotos después
      document.querySelectorAll("[data-finalizar]").forEach(btn => {
        btn.addEventListener("click", () => this.finalizarTPM(btn.dataset.finalizar));
      });
      document.querySelectorAll("[data-escalar]").forEach(btn => {
        btn.addEventListener("click", () => this.escalarTPM(btn.dataset.escalar));
      });
      document.querySelectorAll("[data-tpm-fotos]").forEach(input => {
        input.addEventListener("change", e => this.addFotosDespues(e, input.dataset.tpmFotos));
      });
    }

    if (tab === "lis") {
      document.querySelectorAll("[data-set-est]").forEach(btn => {
        btn.addEventListener("click", async () => {
          await actualizarHallazgo(btn.dataset.setEst, { estatus: btn.dataset.est });
          this.renderTab("lis");
          UI.toast("Estatus: " + btn.dataset.est);
        });
      });
      document.querySelectorAll("[data-del]").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("¿Eliminar este hallazgo?")) return;
          await eliminarHallazgo(btn.dataset.del);
          this.renderTab("lis");
          UI.toast("Hallazgo eliminado");
        });
      });
      // Filtros
      ["fEst","fSev"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", () => {
          this.applyFilters();
        });
      });
    }

    if (tab === "min") {
      document.getElementById("btnExportar")?.addEventListener("click", () => UI.exportarMinuta());
      // Responsable
      document.querySelectorAll("[data-min-resp]").forEach(input => {
        input.addEventListener("blur", async () => {
          await actualizarHallazgo(input.dataset.minResp, { responsable: input.value.trim() });
          if (input.value.trim()) UI.toast("Responsable: " + input.value.trim());
        });
      });
      // Fecha
      document.querySelectorAll("[data-min-fecha]").forEach(input => {
        input.addEventListener("change", async () => {
          await actualizarHallazgo(input.dataset.minFecha, { fechaCierre: input.value });
          if (input.value) UI.toast("Fecha de cierre: " + input.value);
        });
      });
    }

    if (tab === "seg") {
      document.querySelectorAll("[data-seg]").forEach(btn => {
        btn.addEventListener("click", async () => {
          await actualizarHallazgo(btn.dataset.seg, { estatus: btn.dataset.est });
          this.renderTab("seg");
          UI.toast("Estatus: " + btn.dataset.est);
        });
      });
    }

    if (tab === "cfg") {
      document.getElementById("btnToggleForm")?.addEventListener("click", () => {
        const f = document.getElementById("nuevaForm");
        f.style.display = f.style.display === "none" ? "block" : "none";
      });
      document.querySelectorAll("[data-del-cat]").forEach(btn => {
        btn.addEventListener("click", async () => {
          await eliminarCategoria(btn.dataset.delCat);
          this.renderTab("cfg");
          UI.toast("Tipo eliminado");
        });
      });
      document.querySelectorAll(".icon-opt").forEach(el => {
        el.addEventListener("click", () => {
          s.selIcon = parseInt(el.dataset.icon);
          document.querySelectorAll(".icon-opt").forEach(e => e.classList.remove("si"));
          el.classList.add("si");
        });
      });
      document.querySelectorAll(".color-dot").forEach(el => {
        el.addEventListener("click", () => {
          s.selColor = parseInt(el.dataset.color);
          document.querySelectorAll(".color-dot").forEach(e => e.classList.remove("sc2"));
          el.classList.add("sc2");
        });
      });
      document.getElementById("btnGuardarCat")?.addEventListener("click", () => this.guardarCat());
      document.getElementById("btnCancelarCat")?.addEventListener("click", () => {
        document.getElementById("nuevaForm").style.display = "none";
      });
    }
  },

  // ── Filtros de hallazgos ──────────────────────────────────

  applyFilters() {
    const fEst = document.getElementById("fEst")?.value || "";
    const fSev = document.getElementById("fSev")?.value || "";
    const lista = State.hallazgos.filter(h => {
      if (fEst && h.estatus !== fEst) return false;
      if (fSev && h.prioridad !== fSev) return false;
      return true;
    });
    const wrap = document.getElementById("lisLista");
    if (!wrap) return;
    const tmpState = State.hallazgos;
    State.hallazgos = lista;
    wrap.innerHTML = UI.renderHallazgos().match(/<div id="lisLista">([\s\S]*)<\/div>/)?.[1] || "";
    State.hallazgos = tmpState;
    // Re-render simple
    wrap.innerHTML = lista.map(h => {
      const fotos = UI.thumbs(h.fotosData, 52);
      return `<div class="h-item">
        <div class="h-title">${h.zona}${h.equipo ? " — " + h.equipo : ""}</div>
        <div class="h-desc">${h.descripcion}</div>
        <div class="h-reporter"><i class="ti ti-user"></i>${h.reportadoPor} · ${h.fecha}</div>
        <div class="h-meta">${UI.badgeCat(h)} ${UI.badgeSev(h.prioridad)} ${UI.badgeEst(h.estatus)}</div>
        ${fotos}
      </div>`;
    }).join("") || `<div class="empty"><i class="ti ti-clipboard-x"></i><p>Sin resultados</p></div>`;
  },

  // ── Fotos helper ─────────────────────────────────────────

  bindPhotoZone(zoneId, inputId, bucket, previewId) {
    const zone  = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const prev  = document.getElementById(previewId);
    if (!zone || !input) return;
    zone.addEventListener("click", () => input.click());
    input.addEventListener("change", e => {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          this.state[bucket].push(ev.target.result);
          this.renderPreviews(bucket, previewId);
        };
        reader.readAsDataURL(file);
      });
    });
  },

  renderPreviews(bucket, previewId) {
    const el = document.getElementById(previewId);
    if (!el) return;
    const arr = this.state[bucket] || [];
    el.innerHTML = arr.map((src, i) => `
      <div class="photo-thumb">
        <img src="${src}" alt="foto">
        <button class="del-ph" data-bucket="${bucket}" data-idx="${i}">
          <i class="ti ti-x"></i>
        </button>
      </div>`).join("");
    el.querySelectorAll(".del-ph").forEach(btn => {
      btn.addEventListener("click", () => {
        this.state[btn.dataset.bucket].splice(parseInt(btn.dataset.idx), 1);
        this.renderPreviews(bucket, previewId);
      });
    });
  },

  addFotosDespues(e, tpmId) {
    if (!this.state.tpmFotosDespues[tpmId]) this.state.tpmFotosDespues[tpmId] = [];
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        this.state.tpmFotosDespues[tpmId].push(ev.target.result);
        addFotosTPM(tpmId, [ev.target.result]);
        UI.toast("Foto agregada");
      };
      reader.readAsDataURL(file);
    });
  },

  // ── Acciones ─────────────────────────────────────────────

  async guardarHallazgo() {
    const s = this.state;
    const reporta = document.getElementById("reporta")?.value.trim();
    if (!reporta)       { UI.toast("Ingresa quién reporta"); return; }
    if (!s.selCat)      { UI.toast("Selecciona el tipo de hallazgo"); return; }
    if (!s.selSev)      { UI.toast("Selecciona la prioridad"); return; }
    const zona = document.getElementById("zona")?.value;
    const desc = document.getElementById("desc")?.value.trim();
    if (!zona)          { UI.toast("Selecciona la zona"); return; }
    if (!desc)          { UI.toast("Describe el hallazgo"); return; }
    const cat = State.cats.find(c => c.id === s.selCat);
    const btn = document.getElementById("btnGuardar");
    btn.disabled = true; btn.innerHTML = `<i class="ti ti-loader-2 spin"></i>Guardando...`;
    await crearHallazgo({
      reportadoPor: reporta,
      turno:    document.getElementById("turno")?.value || "",
      cat:      s.selCat,
      catNombre: cat?.nombre || "—",
      zona,
      equipo:   document.getElementById("equipo")?.value.trim() || "",
      descripcion: desc,
      accion:   document.getElementById("accion")?.value || "",
      prioridad: s.selSev,
      fotos:    [...s.levFotos],
    });
    s.selCat = ""; s.selSev = ""; s.levFotos = [];
    this.renderTab("lev");
    UI.toast("✓ Hallazgo registrado en Sheets");
  },

  async iniciarTPM() {
    const s = this.state;
    const op = document.getElementById("tpm-op")?.value.trim();
    if (!op)     { UI.toast("Ingresa el operador"); return; }
    const equipo = document.getElementById("tpm-equipo")?.value.trim();
    if (!equipo) { UI.toast("Ingresa el equipo o zona"); return; }
    const tipo   = document.getElementById("tpm-tipo")?.value;
    if (!tipo)   { UI.toast("Selecciona el tipo de actividad"); return; }
    const btn = document.getElementById("btnIniciarTPM");
    btn.disabled = true; btn.innerHTML = `<i class="ti ti-loader-2 spin"></i>Registrando...`;
    await iniciarTPM({
      operador:    op,
      turno:       document.getElementById("tpm-turno")?.value || "",
      equipo,
      tipo,
      descripcion: document.getElementById("tpm-desc")?.value.trim() || "",
      fotosAntes:  [...s.tpmAntes],
    });
    s.tpmAntes = [];
    this.renderTab("tpm");
    UI.toast("✓ Actividad TPM iniciada");
  },

  async finalizarTPM(id) {
    const fotos = this.state.tpmFotosDespues[id] || [];
    await finalizarTPM(id, fotos);
    this.renderTab("tpm");
    UI.toast("✓ Actividad finalizada");
  },

  async escalarTPM(id) {
    const motivo = prompt("¿Por qué se escala a mantenimiento?");
    if (motivo === null) return;
    await escalarTPM(id, motivo || "Sin descripción");
    this.renderTab("tpm");
    UI.toast("Escalado a mantenimiento");
  },

  async guardarCat() {
    const nombre = document.getElementById("nc-nombre")?.value.trim();
    if (!nombre) { UI.toast("Ingresa el nombre"); return; }
    const cat = {
      id:      "cat_" + Date.now(),
      nombre,
      icono:   UI.ICONS_LISTA[this.state.selIcon],
      color:   this.state.selColor,
      modulo:  document.getElementById("nc-modulo")?.value.trim() || "",
    };
    await guardarCategoria(cat);
    this.state.selIcon = 0; this.state.selColor = 0;
    this.renderTab("cfg");
    UI.toast("✓ Tipo agregado: " + nombre);
  },

  updateStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("s-tot", State.hallazgos.length);
    set("s-alt", State.hallazgos.filter(h => h.prioridad === "alta").length);
    set("s-tpm", State.tpm.filter(t => t.estado !== "Finalizado").length);
    set("s-esc", State.tpm.filter(t => t.escalado).length);
  },
};

// ── Arranque ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());
