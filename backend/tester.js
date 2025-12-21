// ============================================
// Tester básico del backend - Clase 3
// Sin dependencias externas
// Usa fetch nativo de Node 18+
// ============================================

const BACKEND_URL = "http://localhost:3000";

async function main() {
  console.log("======================================");
  console.log("🔍 Probando Backend del Laboratorio");
  console.log("======================================\n");

  // 1) /api/status
  console.log("[1] GET /api/status");
  let resp1 = await fetch(`${BACKEND_URL}/api/status`);
  let data1 = await resp1.text();
  console.log("Respuesta:", data1, "\n");

  // 2) Listar items
  console.log("[2] GET /api/items");
  let resp2 = await fetch(`${BACKEND_URL}/api/items`);
  let data2 = await resp2.text();
  console.log("Respuesta:", data2, "\n");

  // 3) Crear item
  console.log("[3] POST /api/items");
  let resp3 = await fetch(`${BACKEND_URL}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "Item creado desde tester.js" }),
  });
  let data3 = await resp3.text();
  console.log("Respuesta:", data3);

  // intentar capturar el ID (muy básico)
  const match = data3.match(/"id":\s*(\d+)/);
  const newId = match ? match[1] : null;
  console.log("ID detectado:", newId, "\n");

  // 4) Volver a listar
  console.log("[4] GET /api/items después del POST");
  let resp4 = await fetch(`${BACKEND_URL}/api/items`);
  let data4 = await resp4.text();
  console.log("Respuesta:", data4, "\n");

  // 5) Eliminar item
  if (newId) {
    console.log(`[5] DELETE /api/items/${newId}`);
    let resp5 = await fetch(`${BACKEND_URL}/api/items/${newId}`, {
      method: "DELETE",
    });
    let data5 = await resp5.text();
    console.log("Respuesta:", data5, "\n");
  } else {
    console.log("[5] No se encontró ID para borrar\n");
  }

  // 6) Listado final
  console.log("[6] GET /api/items (final)");
  let resp6 = await fetch(`${BACKEND_URL}/api/items`);
  let data6 = await resp6.text();
  console.log("Respuesta:", data6, "\n");

  // 7) API externa
  console.log("[7] GET /api/external");
  let resp7 = await fetch(`${BACKEND_URL}/api/external`);
  let data7 = await resp7.text();
  console.log("Respuesta:", data7, "\n");

  console.log("======================================");
  console.log("✔ Pruebas completadas");
  console.log("======================================");
}

main().catch((err) => console.error("Error en tester:", err));
