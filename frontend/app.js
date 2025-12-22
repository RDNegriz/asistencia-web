const API_URL = "/api";

function setTodayOnDateInputs() {
  const today = new Date().toISOString().slice(0, 10);
  const f = document.getElementById("asistenciaFecha");
  if (f && !f.value) f.value = today;

  const d = document.getElementById("repDesde");
  const h = document.getElementById("repHasta");
  if (d && !d.value) d.value = today;
  if (h && !h.value) h.value = today;
}

async function fetchJSON(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status}: ${txt}`);
  }
  return r.json();
}

// ---- Alumnos ----
async function cargarAlumnos() {
  const data = await fetchJSON(`${API_URL}/alumnos`);

  // lista
  const ul = document.getElementById("alumnosList");
  ul.innerHTML = "";
  data.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.id} - ${a.nombre}`;
    ul.appendChild(li);
  });

  // select asistencia
  const sel = document.getElementById("selAlumno");
  sel.innerHTML = "";
  data.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.nombre} (#${a.id})`;
    sel.appendChild(opt);
  });
}

document.getElementById("btnCrearAlumno").addEventListener("click", async () => {
  try {
    const nombre = document.getElementById("alumnoNombre").value.trim();
    if (!nombre) return alert("Poné un nombre de alumno.");
    await fetchJSON(`${API_URL}/alumnos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    document.getElementById("alumnoNombre").value = "";
    await cargarAlumnos();
    alert("Alumno creado.");
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

document.getElementById("btnCargarAlumnos").addEventListener("click", async () => {
  try {
    await cargarAlumnos();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

// ---- Cursos ----
async function cargarCursos() {
  const data = await fetchJSON(`${API_URL}/cursos`);

  // lista
  const ul = document.getElementById("cursosList");
  ul.innerHTML = "";
  data.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = `${c.id} - ${c.nombre}`;
    ul.appendChild(li);
  });

  // select asistencia
  const sel = document.getElementById("selCurso");
  sel.innerHTML = "";
  data.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.nombre} (#${c.id})`;
    sel.appendChild(opt);
  });

  // select reporte
  const rep = document.getElementById("repCurso");
  const keepFirst = rep.querySelector("option[value='']");
  rep.innerHTML = "";
  rep.appendChild(keepFirst);
  data.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.nombre} (#${c.id})`;
    rep.appendChild(opt);
  });
}

document.getElementById("btnCrearCurso").addEventListener("click", async () => {
  try {
    const nombre = document.getElementById("cursoNombre").value.trim();
    if (!nombre) return alert("Poné un nombre de curso.");
    await fetchJSON(`${API_URL}/cursos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    document.getElementById("cursoNombre").value = "";
    await cargarCursos();
    alert("Curso creado.");
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

document.getElementById("btnCargarCursos").addEventListener("click", async () => {
  try {
    await cargarCursos();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

// ---- Asistencias ----
async function listarAsistencias() {
  const data = await fetchJSON(`${API_URL}/asistencias`);
  const ul = document.getElementById("asistenciasList");
  ul.innerHTML = "";
  data.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.fecha} | ${a.curso} | ${a.alumno} | ${a.estado}`;
    ul.appendChild(li);
  });
}

document.getElementById("btnRegistrarAsistencia").addEventListener("click", async () => {
  try {
    const alumno_id = Number(document.getElementById("selAlumno").value);
    const curso_id = Number(document.getElementById("selCurso").value);
    const estado = document.getElementById("selEstado").value;
    const fecha = document.getElementById("asistenciaFecha").value;

    if (!alumno_id || !curso_id || !estado || !fecha) {
      return alert("Faltan datos para registrar asistencia.");
    }

    await fetchJSON(`${API_URL}/asistencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumno_id, curso_id, estado, fecha }),
    });

    alert("Asistencia registrada (si existía, se actualizó).");
    await listarAsistencias();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

document.getElementById("btnListarAsistencias").addEventListener("click", async () => {
  try {
    await listarAsistencias();
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

// ---- Reporte (MEJORADO: salida legible tipo tabla) ----
document.getElementById("btnReporte").addEventListener("click", async () => {
  try {
    const desde = document.getElementById("repDesde").value;
    const hasta = document.getElementById("repHasta").value;
    const curso_id = document.getElementById("repCurso").value;

    if (!desde || !hasta) return alert("Elegí desde y hasta.");

    const params = new URLSearchParams({ desde, hasta });
    if (curso_id) params.set("curso_id", curso_id);

    const data = await fetchJSON(`${API_URL}/reportes/rango?${params.toString()}`);

    const out = document.getElementById("reporteOut");
    const rows = data.resultados || [];

    if (rows.length === 0) {
      out.textContent = "No hay registros en ese rango.";
      return;
    }

    let text = "";
    text += `Rango: ${data.desde} a ${data.hasta}\n`;
    text += `Curso: ${data.curso_id ? data.curso_id : "Todos"}\n\n`;

    text += "ALUMNO | CURSO | PRESENTES | AUSENTES | TARDANZAS | TOTAL\n";
    text += "---------------------------------------------------------\n";

    rows.forEach((r) => {
      const p = Number(r.presentes);
      const a = Number(r.ausentes);
      const t = Number(r.tardanzas);
      const total = Number(r.total_registros);

      text += `${r.alumno} | ${r.curso} | ${p} | ${a} | ${t} | ${total}\n`;
    });

    out.textContent = text;
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

// ---- API externa ----
document.getElementById("btnExternal").addEventListener("click", async () => {
  try {
    const data = await fetchJSON(`${API_URL}/external`);
    const dataMap = data.map((d) => ({ id: d.id, title: d.title }));
    document.getElementById("externalResponse").textContent = JSON.stringify(
      dataMap,
      null,
      2
    );
  } catch (e) {
    alert(`Error: ${e.message}`);
  }
});

// Init
(async () => {
  setTodayOnDateInputs();
  await cargarAlumnos();
  await cargarCursos();
  await listarAsistencias();
})();
