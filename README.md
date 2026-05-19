# Hallazgos & TPM — Almacén de Granos

Sistema de levantamiento de hallazgos, mantenimiento autónomo (TPM) y seguimiento de minutas, con Google Sheets como base de datos en la nube.

---

## Estructura del proyecto

```
hallazgos-almacen/
├── index.html              ← Entrada principal
├── src/
│   ├── config.js           ← ⚠ ÚNICO archivo que editas
│   ├── style.css           ← Estilos
│   ├── sheets.js           ← Comunicación con Google Sheets
│   ├── data.js             ← Lógica de datos
│   ├── ui.js               ← Renderizado
│   └── app.js              ← Controlador principal
└── apps-script/
    └── Code.gs             ← Código que va en Google Apps Script
```

---

## Configuración paso a paso

### Paso 1 — Crear el Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Nómbrala como quieras (ej: `Hallazgos Almacén 2025`).
3. Copia el **ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```
4. Guarda ese ID, lo necesitarás en los pasos siguientes.

---

### Paso 2 — Crear el Google Apps Script

1. En tu Google Sheet, ve al menú **Extensiones → Apps Script**.
2. Borra todo el código que aparece por defecto.
3. Pega el contenido completo del archivo `apps-script/Code.gs`.
4. En la línea 7, reemplaza `PEGA_AQUI_TU_SHEET_ID` con el ID de tu hoja:
   ```javascript
   const SHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms";
   ```
5. Guarda el proyecto (Ctrl+S) con cualquier nombre (ej: `Backend Hallazgos`).

---

### Paso 3 — Inicializar las hojas

1. En el editor de Apps Script, selecciona la función `initSheets` en el menú desplegable.
2. Haz clic en **Ejecutar**.
3. Acepta los permisos que solicita Google (acceso a la hoja).
4. Regresa a tu Google Sheet — verás que se crearon 3 pestañas:
   - `Hallazgos`
   - `TPM`
   - `Categorias`

---

### Paso 4 — Desplegar como Web App

1. En el editor de Apps Script, haz clic en **Desplegar → Nueva implementación**.
2. En "Seleccionar tipo", elige **Aplicación web**.
3. Configura así:
   - **Descripción**: `API Hallazgos v1`
   - **Ejecutar como**: `Yo`
   - **Quién puede acceder**: `Cualquier usuario` *(necesario para que la app web pueda conectarse)*
4. Haz clic en **Desplegar**.
5. Copia la **URL de la aplicación web** que aparece. Se verá así:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

### Paso 5 — Configurar la app

Abre el archivo `src/config.js` y rellena los dos valores:

```javascript
const CONFIG = {
  SHEET_ID: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",  // ← tu ID
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec", // ← tu URL
  EMPRESA: "Almacén de Granos",  // ← nombre de tu empresa
  ...
};
```

---

### Paso 6 — Subir a GitHub y publicar con GitHub Pages

#### Subir el código:
```bash
git init
git add .
git commit -m "Primer commit: Hallazgos & TPM"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/hallazgos-almacen.git
git push -u origin main
```

#### Activar GitHub Pages:
1. En tu repositorio en GitHub, ve a **Settings → Pages**.
2. En "Source", selecciona **Deploy from a branch**.
3. Rama: `main`, carpeta: `/ (root)`.
4. Guarda. En 1-2 minutos tendrás la app en:
   ```
   https://TU_USUARIO.github.io/hallazgos-almacen/
   ```

---

## Actualizar la app después de cambios

```bash
git add .
git commit -m "Descripción del cambio"
git push
```
GitHub Pages actualiza automáticamente en ~1 minuto.

---

## Agregar nuevos tipos de hallazgo

**Desde la app**: Tab `Config.` → Botón `Agregar` → rellena nombre, módulo, ícono y color.

**Desde código** (para que sean permanentes desde el inicio):
Edita el array `CATEGORIAS` en `src/config.js`:
```javascript
{ id: "cal", nombre: "Inocuidad / Calidad", icono: "microscope", color: 7, modulo: "Calidad" },
```

---

## Notas importantes

### Fotos
Las fotos se almacenan en memoria durante la sesión (base64). En Google Sheets se guarda el **conteo** de fotos (ej: `2 foto(s)`).

Para guardar fotos en la nube, la siguiente versión puede integrar **Google Drive**: el Apps Script subiría la imagen y guardaría la URL pública en Sheets.

### Sin conexión
Si la app no puede conectarse al Apps Script, funciona en modo local (memoria de sesión) y muestra una advertencia. Los datos no se pierden hasta cerrar el navegador.

### Seguridad
El Apps Script está configurado para acceso público porque la app web necesita conectarse sin login. Si necesitas restringir el acceso, puedes agregar autenticación con Google Sign-In.

---

## Tecnologías

- **Frontend**: HTML + CSS + JavaScript vanilla (sin frameworks, sin build)
- **Base de datos**: Google Sheets via Apps Script REST
- **Hosting**: GitHub Pages (gratuito)
- **Íconos**: Tabler Icons

---

## Soporte

Si al desplegar el Apps Script aparece un error de CORS, asegúrate de que:
1. El despliegue está configurado como `Cualquier usuario`.
2. Estás usando la URL de implementación (termina en `/exec`), no la URL del editor.
3. Vuelve a desplegar: `Desplegar → Administrar implementaciones → Editar → Nueva versión → Desplegar`.
