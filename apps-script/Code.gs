// ============================================================
//  GOOGLE APPS SCRIPT — Pega este código en script.google.com
//  Luego despliega como Web App (ver README para instrucciones)
// ============================================================

const SHEET_ID = "PEGA_AQUI_TU_SHEET_ID"; // mismo que en config.js

// Nombres exactos de las hojas (pestañas) en tu Google Sheet
const SHEETS = {
  Hallazgos:  "Hallazgos",
  TPM:        "TPM",
  Categorias: "Categorias",
};

// Columnas para cada hoja — el orden importa
const COLUMNS = {
  Hallazgos: [
    "id","fecha","isoFecha","reportadoPor","turno",
    "cat","catNombre","zona","equipo","descripcion",
    "accion","prioridad","estatus","responsable","fechaCierre","fotos"
  ],
  TPM: [
    "id","fecha","isoFecha","operador","turno",
    "equipo","tipo","descripcion","estado",
    "horaInicio","horaFin","escalado","motivoEscalada",
    "fotosAntes","fotosDespues"
  ],
  Categorias: ["id","nombre","icono","color","modulo"],
};

// ── CORS helper ───────────────────────────────────────────────
function cors(output) {
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET: leer todas las filas de una hoja ─────────────────────
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet;
    const action    = e.parameter.action;

    if (action !== "getAll" || !sheetName) {
      return cors({ error: "Parámetros inválidos" });
    }

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return cors([]);

    const data   = sheet.getDataRange().getValues();
    if (data.length <= 1) return cors([]); // solo encabezado

    const headers = data[0];
    const rows    = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] === "" ? "" : row[i];
        // Normaliza booleanos guardados como string
        if (obj[h] === "TRUE" || obj[h] === true)  obj[h] = true;
        if (obj[h] === "FALSE" || obj[h] === false) obj[h] = false;
      });
      return obj;
    });

    return cors(rows);
  } catch (err) {
    return cors({ error: err.message });
  }
}

// ── POST: insert / update / remove ───────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, sheet: sheetName, row, id, fields } = payload;

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(sheetName);

    // Crear hoja y encabezado si no existe
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const cols = COLUMNS[sheetName];
      if (cols) sheet.appendRow(cols);
    }

    if (action === "insert") {
      return handleInsert(sheet, sheetName, row);
    }
    if (action === "update") {
      return handleUpdate(sheet, id, fields);
    }
    if (action === "remove") {
      return handleRemove(sheet, id);
    }

    return cors({ error: "Acción desconocida: " + action });
  } catch (err) {
    return cors({ error: err.message });
  }
}

function handleInsert(sheet, sheetName, row) {
  const cols = COLUMNS[sheetName];
  if (!cols) return cors({ error: "Hoja sin definición de columnas" });

  // Primera fila = encabezado si la hoja está vacía
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cols);
  }

  const newRow = cols.map(col => {
    const val = row[col];
    if (val === undefined || val === null) return "";
    if (typeof val === "boolean") return val;
    return val;
  });

  sheet.appendRow(newRow);
  return cors({ ok: true, id: row.id });
}

function handleUpdate(sheet, id, fields) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return cors({ error: "Hoja vacía" });

  const headers  = data[0];
  const idColIdx = headers.indexOf("id");
  if (idColIdx < 0) return cors({ error: "Columna 'id' no encontrada" });

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idColIdx]) === String(id)) {
      Object.entries(fields).forEach(([key, val]) => {
        const colIdx = headers.indexOf(key);
        if (colIdx >= 0) {
          sheet.getRange(r + 1, colIdx + 1).setValue(
            typeof val === "boolean" ? val : (val ?? "")
          );
        }
      });
      return cors({ ok: true });
    }
  }
  return cors({ error: "ID no encontrado: " + id });
}

function handleRemove(sheet, id) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return cors({ error: "Hoja vacía" });

  const headers  = data[0];
  const idColIdx = headers.indexOf("id");
  if (idColIdx < 0) return cors({ error: "Columna 'id' no encontrada" });

  for (let r = data.length - 1; r >= 1; r--) {
    if (String(data[r][idColIdx]) === String(id)) {
      sheet.deleteRow(r + 1);
      return cors({ ok: true });
    }
  }
  return cors({ error: "ID no encontrado" });
}

// ── Inicializar hojas (ejecuta una sola vez manualmente) ──────
function initSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Object.entries(COLUMNS).forEach(([name, cols]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(cols);
      sheet.setFrozenRows(1);
      // Formato del encabezado
      sheet.getRange(1, 1, 1, cols.length)
        .setBackground("#BA7517")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheet.autoResizeColumns(1, cols.length);
    }
  });
  SpreadsheetApp.getUi().alert("✓ Hojas creadas correctamente");
}
