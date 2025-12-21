const axios = require("axios");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || "db";
const DB_USER = process.env.DB_USER || "labo";
const DB_PASS = process.env.DB_PASS || "labo123";
const DB_NAME = process.env.DB_NAME || "laboratorio";

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDb() {
  // Tablas base
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alumnos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cursos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS asistencias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alumno_id INT NOT NULL,
      curso_id INT NOT NULL,
      estado ENUM('PRESENTE','AUSENTE','TARDANZA') NOT NULL,
      fecha DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_asist_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_asist_curso FOREIGN KEY (curso_id) REFERENCES cursos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

      INDEX idx_fecha (fecha),
      INDEX idx_alumno_fecha (alumno_id, fecha),
      INDEX idx_curso_fecha (curso_id, fecha),
      UNIQUE KEY uniq_asistencia (alumno_id, curso_id, fecha)
    );
  `);

  console.log("DB inicializada: alumnos, cursos, asistencias.");
}

// --- Health ---
app.get("/api/status", (req, res) => res.json({ status: "OK" }));

// --- Alumnos ---
app.get("/api/alumnos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM alumnos ORDER BY nombre ASC");
    res.json(rows);
  } catch (e) {
    console.error("GET /api/alumnos:", e.message);
    res.status(500).json({ error: "Error obteniendo alumnos" });
  }
});

app.post("/api/alumnos", async (req, res) => {
  try {
    const nombre = (req.body?.nombre || "").trim();
    if (!nombre) return res.status(400).json({ error: "nombre es obligatorio" });

    const [r] = await pool.query("INSERT INTO alumnos (nombre) VALUES (?)", [nombre]);
    res.status(201).json({ id: r.insertId, nombre });
  } catch (e) {
    console.error("POST /api/alumnos:", e.message);
    res.status(500).json({ error: "Error creando alumno" });
  }
});

// --- Cursos ---
app.get("/api/cursos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM cursos ORDER BY nombre ASC");
    res.json(rows);
  } catch (e) {
    console.error("GET /api/cursos:", e.message);
    res.status(500).json({ error: "Error obteniendo cursos" });
  }
});

app.post("/api/cursos", async (req, res) => {
  try {
    const nombre = (req.body?.nombre || "").trim();
    if (!nombre) return res.status(400).json({ error: "nombre es obligatorio" });

    const [r] = await pool.query("INSERT INTO cursos (nombre) VALUES (?)", [nombre]);
    res.status(201).json({ id: r.insertId, nombre });
  } catch (e) {
    console.error("POST /api/cursos:", e.message);
    res.status(500).json({ error: "Error creando curso" });
  }
});

// --- Registrar asistencia ---
app.post("/api/asistencias", async (req, res) => {
  try {
    const alumno_id = Number(req.body?.alumno_id);
    const curso_id = Number(req.body?.curso_id);
    const estado = (req.body?.estado || "").toUpperCase();
    const fecha = (req.body?.fecha || "").trim(); // YYYY-MM-DD

    if (!alumno_id || !curso_id || !estado || !fecha) {
      return res.status(400).json({ error: "alumno_id, curso_id, estado y fecha son obligatorios" });
    }

    // Insert o update (si ya existe para ese alumno/curso/fecha)
    await pool.query(
      `
      INSERT INTO asistencias (alumno_id, curso_id, estado, fecha)
      VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE estado = VALUES(estado)
      `,
      [alumno_id, curso_id, estado, fecha]
    );

    res.status(201).json({ ok: true, alumno_id, curso_id, estado, fecha });
  } catch (e) {
    console.error("POST /api/asistencias:", e.message);
    res.status(500).json({ error: "Error registrando asistencia" });
  }
});

// --- Listado de asistencias (últimas 50) ---
app.get("/api/asistencias", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.fecha, a.estado,
             al.id AS alumno_id, al.nombre AS alumno,
             c.id AS curso_id, c.nombre AS curso
      FROM asistencias a
      JOIN alumnos al ON al.id = a.alumno_id
      JOIN cursos c ON c.id = a.curso_id
      ORDER BY a.fecha DESC, a.id DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/asistencias:", e.message);
    res.status(500).json({ error: "Error listando asistencias" });
  }
});

// --- Reporte por rango (sirve para semana o cuatrimestre) ---
app.get("/api/reportes/rango", async (req, res) => {
  try {
    const desde = (req.query?.desde || "").trim(); // YYYY-MM-DD
    const hasta = (req.query?.hasta || "").trim(); // YYYY-MM-DD
    const curso_id = req.query?.curso_id ? Number(req.query.curso_id) : null;

    if (!desde || !hasta) return res.status(400).json({ error: "desde y hasta son obligatorios (YYYY-MM-DD)" });

    const params = [desde, hasta];
    let whereCurso = "";
    if (curso_id) {
      whereCurso = " AND a.curso_id = ? ";
      params.push(curso_id);
    }

    const [rows] = await pool.query(
      `
      SELECT
        al.id AS alumno_id,
        al.nombre AS alumno,
        c.id AS curso_id,
        c.nombre AS curso,
        SUM(a.estado='PRESENTE') AS presentes,
        SUM(a.estado='AUSENTE') AS ausentes,
        SUM(a.estado='TARDANZA') AS tardanzas,
        COUNT(*) AS total_registros
      FROM asistencias a
      JOIN alumnos al ON al.id = a.alumno_id
      JOIN cursos c ON c.id = a.curso_id
      WHERE a.fecha BETWEEN ? AND ?
      ${whereCurso}
      GROUP BY al.id, c.id
      ORDER BY c.nombre ASC, al.nombre ASC
      `,
      params
    );

    res.json({ desde, hasta, curso_id: curso_id || null, resultados: rows });
  } catch (e) {
    console.error("GET /api/reportes/rango:", e.message);
    res.status(500).json({ error: "Error generando reporte" });
  }
});

// --- API externa (igual que antes) ---
app.get("/api/external", async (req, res) => {
  try {
    const r = await axios.get("https://jsonplaceholder.typicode.com/todos", { params: { _limit: 10 } });
    res.json(r.data);
  } catch (e) {
    console.error("GET /api/external:", e.message);
    res.status(502).json({ error: "Error consultando API externa" });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend ejecutándose en puerto ${PORT}`);
      console.log(`DB: host=${DB_HOST} db=${DB_NAME} user=${DB_USER}`);
    });
  })
  .catch((e) => {
    console.error("No se pudo inicializar DB:", e.message);
    process.exit(1);
  });
