const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { hashPassword } = require('./hashing'); // import del módulo de hashing

const app = express();
app.use(cors()); // permite peticiones desde localhost:4200
app.use(express.json()); // parsea JSON en el body para que pueda enviar datos como JSON

const db = mysql.createConnection({
  host: 'localhost',    // cambiar si usas otra máquina
  user: 'root',
  port: '3308',
  password: '',
  database: 'reto2'
});

db.connect(err => {
  if (err) {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conexión exitosa a la base de datos reto2');
});

// Endpoint de test (GET /): lista primeros usuarios JOIN con tipos para rol
app.get('/', (req, res) => {
  db.query(
    `SELECT u.id, u.username, t.name AS rol
     FROM users u
     LEFT JOIN tipos t ON u.tipo_id = t.id
     LIMIT 5;`,
    (err, results) => {
      if (err) {
        console.error('Error en consulta / :', err);
        res.status(500).send('Error en la consulta');
        return;
      }
      res.json(results);
    }
  );
});

// LOGIN endpoint
app.post('/api/login', (req, res) => {
  console.log('POST /api/login - body:', req.body);
  if (!req.body) return res.status(400).json({ error: 'No JSON body' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos username/password' });

  let passwordHash;
  try {
    passwordHash = hashPassword(password);
  } catch (e) {
    console.error('Error al hashear password:', e);
    return res.status(500).json({ error: 'Error interno' });
  }

  // JOIN para devolver el rol legible
  const sql = `
    SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
    FROM users u
    LEFT JOIN tipos t ON u.tipo_id = t.id 
    WHERE u.username = ? AND u.password = ?
    LIMIT 1
  `;

  db.query(sql, [username, passwordHash], (err, results) => {
    if (err) {
      console.error('Error en query login:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    if (!results || results.length === 0) {
      console.log('No hay resultados de login');
      return res.status(401).json({ success: false, error: 'Login incorrecto' });
    }
    // Login correcto: devuelve usuario + rol
    console.log('Usuario autenticado:', results[0]);
    return res.json({ success: true, usuario: results[0] });
  });
});

// EJEMPLO ENDPOINT TOTAlES para Home GOD/ADMIN (puedes adaptarlo según BBDD)
app.get('/api/totales', (req, res) => {
  // Contar alumnos (tipo alumno=4), profesores (tipo=3), reuniones de hoy
  const sqlAlumnos = 'SELECT COUNT(*) AS total FROM users WHERE tipo_id=4;';
  const sqlProfes = 'SELECT COUNT(*) AS total FROM users WHERE tipo_id=3;';
  const sqlReuniones = "SELECT COUNT(*) AS total FROM reuniones WHERE DATE(created_at)=CURDATE();";
  let totales = { alumnos: 0, profesores: 0, reunionesHoy: 0 };

  db.query(sqlAlumnos, (err, resAlum) => {
    if (err) return res.status(500).json({ error: 'Error contar alumnos' });
    totales.alumnos = resAlum[0]?.total || 0;

    db.query(sqlProfes, (err, resProf) => {
      if (err) return res.status(500).json({ error: 'Error contar profesores' });
      totales.profesores = resProf[0]?.total || 0;

      db.query(sqlReuniones, (err, resReun) => {
        if (err) return res.status(500).json({ error: 'Error contar reuniones' });
        totales.reunionesHoy = resReun[0]?.total || 0;
        return res.json(totales);
      });
    });
  });
});

// API CRUD usuarios (simplificado)
app.get('/api/usuarios', (req, res) => {
  const rol = req.query.rol;
  let sql = `
    SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
    FROM users u
    LEFT JOIN tipos t ON u.tipo_id = t.id
  `;
  if (rol) {
    sql += " WHERE t.name = ?";
    db.query(sql, [rol], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al listar usuarios' });
      res.json(results);
    });
  } else {
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al listar usuarios' });
      res.json(results);
    });
  }
});

app.post('/api/usuarios', (req, res) => {
  // Alta de usuario (admin)
  const { username, nombre, apellidos, email, password, rol } = req.body;
  if (!username || !nombre || !apellidos || !email || !password || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const tipo_id = rol === 'god' ? 1 : rol === 'admin' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
  if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });
  const passwordHash = hashPassword(password);
  const sql = `
    INSERT INTO users (username, nombre, apellidos, email, password, tipo_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [username, nombre, apellidos, email, passwordHash, tipo_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear usuario' });
    res.json({ success: true, id: result.insertId });
  });
});

app.put('/api/usuarios/:id', (req, res) => {
  const { nombre, apellidos, email, password, rol } = req.body;
  const { id } = req.params;
  if (!id || !nombre || !apellidos || !email || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const tipo_id = rol === 'god' ? 1 : rol === 'admin' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
  if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });
  let sql = `
    UPDATE users SET nombre=?, apellidos=?, email=?, tipo_id=?
  `;
  let params = [nombre, apellidos, email, tipo_id, id];
  if (password) {
    sql += `, password=?`;
    params = [nombre, apellidos, email, tipo_id, hashPassword(password), id];
  }
  sql += ` WHERE id=?`;
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al editar usuario' });
    res.json({ success: true });
  });
});

app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID requerido' });
  // No puedes borrar goduser
  db.query(`SELECT username FROM users WHERE id=?`, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al comprobar usuario' });
    if (results[0]?.username === 'goduser') {
      return res.status(403).json({ error: 'No puedes borrar el usuario god.' });
    }
    db.query(`DELETE FROM users WHERE id=?`, [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al borrar usuario' });
      res.json({ success: true });
    });
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});