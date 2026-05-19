// ============================================================
//  CONFIG.JS  —  ÚNICO ARCHIVO QUE DEBES EDITAR
//  Sigue el README.md para obtener estos valores
// ============================================================

const CONFIG = {
  // ID de tu Google Sheet (está en la URL de la hoja)
  // Ejemplo: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
  SHEET_ID: "PEGA_AQUI_TU_SHEET_ID",

  // URL de tu Google Apps Script desplegado como Web App
  // Sigue el README para crear y desplegar el script
  APPS_SCRIPT_URL: "PEGA_AQUI_TU_APPS_SCRIPT_URL",

  // Nombre de tu empresa / planta (aparece en el encabezado)
  EMPRESA: "Almacén de Granos",

  // Zonas del almacén (agrega o quita según tu planta)
  ZONAS: [
    "Bodega Norte",
    "Bodega Sur",
    "Bodega Central",
    "Área de carga",
    "Tolvas",
    "Silos exteriores",
    "Pasillo principal",
    "Oficinas",
  ],

  // Tipos de hallazgo predeterminados
  // icono: nombre de ícono Tabler (sin "ti-")
  // color: índice 0-8 (ver paleta en style.css)
  CATEGORIAS: [
    { id: "maq",  nombre: "Fallo en máquina",    icono: "engine",             color: 0, modulo: "Mantenimiento"  },
    { id: "fuga", nombre: "Fuga de producto",    icono: "droplet-off",        color: 1, modulo: "Operaciones"    },
    { id: "est",  nombre: "Estructura dañada",   icono: "building-arch",      color: 2, modulo: "Infraestructura"},
    { id: "res",  nombre: "Material de desalojo",icono: "recycle",            color: 3, modulo: "Ambiental"      },
    { id: "seg",  nombre: "Riesgo de seguridad", icono: "shield-exclamation", color: 4, modulo: "Seguridad"      },
    { id: "lim",  nombre: "Limpieza / Orden",    icono: "trash",              color: 5, modulo: "Operaciones"    },
  ],

  // Actividades TPM disponibles
  ACTIVIDADES_TPM: [
    "Lubricación",
    "Limpieza técnica",
    "Inspección visual",
    "Ajuste de tornillería",
    "Verificación de fajas",
    "Revisión eléctrica básica",
    "Purga / drenaje",
    "Calibración simple",
    "Otro",
  ],

  // Turnos
  TURNOS: [
    "Turno A — Mañana",
    "Turno B — Tarde",
    "Turno C — Noche",
  ],
};
