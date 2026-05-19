// ============================================================
//  SHEETS.JS  —  Comunicación con Google Sheets
//  Todas las operaciones CRUD pasan por aquí
// ============================================================

const Sheets = (() => {
  const BASE = () => CONFIG.APPS_SCRIPT_URL;

  async function request(payload) {
    const res = await fetch(BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Error de red: " + res.status);
    return res.json();
  }

  // Lee todas las filas de una hoja
  async function getAll(sheet) {
    const url = `${BASE()}?action=getAll&sheet=${encodeURIComponent(sheet)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error al leer " + sheet);
    return res.json(); // array de objetos
  }

  // Inserta una fila nueva
  async function insert(sheet, row) {
    return request({ action: "insert", sheet, row });
  }

  // Actualiza una fila por ID
  async function update(sheet, id, fields) {
    return request({ action: "update", sheet, id, fields });
  }

  // Elimina una fila por ID
  async function remove(sheet, id) {
    return request({ action: "remove", sheet, id });
  }

  return { getAll, insert, update, remove };
})();
