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

// ACTIVAR compatibilidad temporal para password EN CLARO (true SOLO mientras pruebas)
const ALLOW_PLAINTEXT_LOGIN = true;


// Endpoint de test (GET /): lista primeros usuarios JOIN con tipos para rol
app.get('/', (req, res) => {
  const sql = `
    SELECT u.id, u.username, t.name AS rol
    FROM users u
    LEFT JOIN tipos t ON u.tipo_id = t.id
    LIMIT 5
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Error en la consulta');
    res.json(results);
  });
});

// LOGIN endpoint
// app.post('/api/login', (req, res) => {
//   console.log('POST /api/login - body:', req.body);
//   if (!req.body) return res.status(400).json({ error: 'No JSON body' });

//   const { username, password } = req.body;
//   if (!username || !password) return res.status(400).json({ error: 'Faltan campos username/password' });

//   let passwordHash;
//   try {
//     passwordHash = hashPassword(password);
//   } catch (e) {
//     console.error('Error al hashear password:', e);
//     return res.status(500).json({ error: 'Error interno' });
//   }

//   // JOIN para devolver el rol legible
//   const sql = `
//     SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
//     FROM users u
//     LEFT JOIN tipos t ON u.tipo_id = t.id 
//     WHERE u.username = ? AND u.password = ?
//     LIMIT 1
//   `;

//   db.query(sql, [username, passwordHash], (err, results) => {
//     if (err) {
//       console.error('Error en query login:', err);
//       return res.status(500).json({ error: 'Error del servidor' });
//     }
//     if (!results || results.length === 0) {
//       console.log('No hay resultados de login');
//       return res.status(401).json({ success: false, error: 'Login incorrecto' });
//     }
//     // Login correcto: devuelve usuario + rol
//     console.log('Usuario autenticado:', results[0]);
//     return res.json({ success: true, usuario: results[0] });
//   });
// });

// // EJEMPLO ENDPOINT TOTAlES para Home GOD/ADMIN (puedes adaptarlo según BBDD)
// app.get('/api/totales', (req, res) => {
//   // Contar alumnos (tipo alumno=4), profesores (tipo=3), reuniones de hoy
//   const sqlAlumnos = 'SELECT COUNT(*) AS total FROM users WHERE tipo_id=4;';
//   const sqlProfes = 'SELECT COUNT(*) AS total FROM users WHERE tipo_id=3;';
//   const sqlReuniones = "SELECT COUNT(*) AS total FROM reuniones WHERE DATE(created_at)=CURDATE();";
//   let totales = { alumnos: 0, profesores: 0, reunionesHoy: 0 };

//   db.query(sqlAlumnos, (err, resAlum) => {
//     if (err) return res.status(500).json({ error: 'Error contar alumnos' });
//     totales.alumnos = resAlum[0]?.total || 0;

//     db.query(sqlProfes, (err, resProf) => {
//       if (err) return res.status(500).json({ error: 'Error contar profesores' });
//       totales.profesores = resProf[0]?.total || 0;

//       db.query(sqlReuniones, (err, resReun) => {
//         if (err) return res.status(500).json({ error: 'Error contar reuniones' });
//         totales.reunionesHoy = resReun[0]?.total || 0;
//         return res.json(totales);
//       });
//     });
//   });
// });

// // API CRUD usuarios (simplificado)
// app.get('/api/usuarios', (req, res) => {
//   const rol = req.query.rol;
//   let sql = `
//     SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
//     FROM users u
//     LEFT JOIN tipos t ON u.tipo_id = t.id
//   `;
//   if (rol) {
//     sql += " WHERE t.name = ?";
//     db.query(sql, [rol], (err, results) => {
//       if (err) return res.status(500).json({ error: 'Error al listar usuarios' });
//       res.json(results);
//     });
//   } else {
//     db.query(sql, (err, results) => {
//       if (err) return res.status(500).json({ error: 'Error al listar usuarios' });
//       res.json(results);
//     });
//   }
// });

// app.post('/api/usuarios', (req, res) => {
//   // Alta de usuario (admin)
//   const { username, nombre, apellidos, email, password, rol } = req.body;
//   if (!username || !nombre || !apellidos || !email || !password || !rol) {
//     return res.status(400).json({ error: 'Faltan campos obligatorios' });
//   }
//   const tipo_id = rol === 'god' ? 1 : rol === 'admin' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
//   if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });
//   const passwordHash = hashPassword(password);
//   const sql = `
//     INSERT INTO users (username, nombre, apellidos, email, password, tipo_id)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `;
//   db.query(sql, [username, nombre, apellidos, email, passwordHash, tipo_id], (err, result) => {
//     if (err) return res.status(500).json({ error: 'Error al crear usuario' });
//     res.json({ success: true, id: result.insertId });
//   });
// });

// app.put('/api/usuarios/:id', (req, res) => {
//   const { nombre, apellidos, email, password, rol } = req.body;
//   const { id } = req.params;
//   if (!id || !nombre || !apellidos || !email || !rol) {
//     return res.status(400).json({ error: 'Faltan campos obligatorios' });
//   }
//   const tipo_id = rol === 'god' ? 1 : rol === 'admin' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
//   if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });
//   let sql = `
//     UPDATE users SET nombre=?, apellidos=?, email=?, tipo_id=?
//   `;
//   let params = [nombre, apellidos, email, tipo_id, id];
//   if (password) {
//     sql += `, password=?`;
//     params = [nombre, apellidos, email, tipo_id, hashPassword(password), id];
//   }
//   sql += ` WHERE id=?`;
//   db.query(sql, params, (err, result) => {
//     if (err) return res.status(500).json({ error: 'Error al editar usuario' });
//     res.json({ success: true });
//   });
// });

// app.delete('/api/usuarios/:id', (req, res) => {
//   const { id } = req.params;
//   if (!id) return res.status(400).json({ error: 'ID requerido' });
//   // No puedes borrar goduser
//   db.query(`SELECT username FROM users WHERE id=?`, [id], (err, results) => {
//     if (err) return res.status(500).json({ error: 'Error al comprobar usuario' });
//     if (results[0]?.username === 'goduser') {
//       return res.status(403).json({ error: 'No puedes borrar el usuario god.' });
//     }
//     db.query(`DELETE FROM users WHERE id=?`, [id], (err, result) => {
//       if (err) return res.status(500).json({ error: 'Error al borrar usuario' });
//       res.json({ success: true });
//     });
//   });
// });




// LOGIN
app.post('/api/login', (req, res) => {
  console.log('POST /api/login - body:', req.body);
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos username/password' });

  const passwordHash = hashPassword(password);

  const sql = ALLOW_PLAINTEXT_LOGIN
    ? `
      SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
      FROM users u
      LEFT JOIN tipos t ON u.tipo_id = t.id
      WHERE u.username = ?
        AND (u.password = ? OR u.password = UPPER(SHA1(?)))
      LIMIT 1
    `
    : `
      SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
      FROM users u
      LEFT JOIN tipos t ON u.tipo_id = t.id
      WHERE u.username = ? AND u.password = ?
      LIMIT 1
    `;

  const params = ALLOW_PLAINTEXT_LOGIN ? [username, passwordHash, password] : [username, passwordHash];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error en query login:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    console.log('Resultado SQL login:', results);
    if (!results || results.length === 0) {
      return res.status(401).json({ success: false, error: 'Login incorrecto' });
    }
    return res.json({ success: true, usuario: results[0] });
  });
});

// Totales (God/Admin)
app.get('/api/totales', (req, res) => {
  const sqlAlumnos = 'SELECT COUNT(*) AS total FROM users WHERE tipo_id=4;';
  const sqlProfes = 'SELECT COUNT(*) AS total FROM users WHERE tipo_id=3;';
  const sqlReuniones = 'SELECT COUNT(*) AS total FROM reuniones WHERE DATE(created_at)=CURDATE();';

  const totales = { alumnos: 0, profesores: 0, reunionesHoy: 0 };
  db.query(sqlAlumnos, (err, r1) => {
    if (err) return res.status(500).json({ error: 'Error contar alumnos' });
    totales.alumnos = r1[0]?.total || 0;
    db.query(sqlProfes, (err, r2) => {
      if (err) return res.status(500).json({ error: 'Error contar profesores' });
      totales.profesores = r2[0]?.total || 0;
      db.query(sqlReuniones, (err, r3) => {
        if (err) return res.status(500).json({ error: 'Error contar reuniones' });
        totales.reunionesHoy = r3[0]?.total || 0;
        res.json(totales);
      });
    });
  });
});

// Listado usuarios con filtro rol y búsqueda por nombre/apellidos (q)
app.get('/api/usuarios', (req, res) => {
  const rolSolicitante = requesterRole(req); // 'god' | 'admin' | ...
  const rolFiltro = (req.query.rol || '').trim().toLowerCase(); // 'profesor' | 'alumno' | 'admin' | 'god'
  const q = (req.query.q || '').trim(); // término de búsqueda opcional

  // Admin no puede listar admins ni god
  if (rolSolicitante === 'admin' && (rolFiltro === 'admin' || rolFiltro === 'god')) {
    return res.status(403).json({ error: 'Solo GOD puede listar administradores' });
  }

  let sql = `
    SELECT u.id, u.username, u.nombre, u.apellidos, u.email, u.tipo_id, t.name AS rol
    FROM users u
    LEFT JOIN tipos t ON u.tipo_id = t.id
  `;
  const params = [];

  const where = [];
  if (rolFiltro) {
    where.push('LOWER(t.name) = ?');
    params.push(rolFiltro);
  }
  if (q) {
    where.push('(LOWER(u.nombre) LIKE ? OR LOWER(u.apellidos) LIKE ? OR LOWER(u.username) LIKE ?)');
    const like = `%${q.toLowerCase()}%`;
    params.push(like, like, like);
  }
  if (where.length) {
    sql += ' WHERE ' + where.join(' AND ');
  }
  sql += ' ORDER BY u.apellidos ASC, u.nombre ASC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al listar usuarios' });
    res.json(results);
  });
});

// Alta usuario (solo GOD puede crear admins/god)
app.post('/api/usuarios', (req, res) => {
  const rolSolicitante = requesterRole(req);
  const { username, nombre, apellidos, email, password, rol } = req.body || {};
  if (!username || !nombre || !apellidos || !email || !password || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const tipo_id = rol === 'god' ? 1 : rol === 'admin' || rol === 'administrador' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
  if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });

  // Solo GOD puede crear admins/god
  if ((tipo_id === 2 || tipo_id === 1) && rolSolicitante !== 'god') {
    return res.status(403).json({ error: 'Solo GOD puede crear administradores/god' });
  }

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

// Utilidad: rol del solicitante (demo por cabecera)
function requesterRole(req) {
  return String(req.headers['x-rol'] || '').trim().toLowerCase();
}

// Editar usuario (solo GOD puede editar admins/god)
app.put('/api/usuarios/:id', (req, res) => {
  const rolSolicitante = requesterRole(req);
  const { nombre, apellidos, email, password, rol } = req.body || {};
  const { id } = req.params;
  if (!id || !nombre || !apellidos || !email || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const tipo_id = rol === 'god' ? 1 : rol === 'admin' || rol === 'administrador' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
  if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });

  // Solo GOD puede editar admins/god
  if ((tipo_id === 2 || tipo_id === 1) && rolSolicitante !== 'god') {
    return res.status(403).json({ error: 'Solo GOD puede editar administradores/god' });
  }

  // Protección especial goduser
  db.query('SELECT username FROM users WHERE id=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al comprobar usuario' });
    if (results[0]?.username === 'goduser' && rolSolicitante !== 'god') {
      return res.status(403).json({ error: 'Solo GOD puede editar goduser' });
    }

    let sql = 'UPDATE users SET nombre=?, apellidos=?, email=?, tipo_id=?';
    const params = [nombre, apellidos, email, tipo_id];
    if (password) {
      sql += ', password=?';
      params.push(hashPassword(password));
    }
    sql += ' WHERE id=?';
    params.push(id);

    db.query(sql, params, (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al editar usuario' });
      res.json({ success: true });
    });
  });
});

// Borrar usuario (solo GOD puede borrar admins/god; nunca goduser)
app.delete('/api/usuarios/:id', (req, res) => {
  const rolSolicitante = requesterRole(req);
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID requerido' });

  db.query('SELECT username, tipo_id FROM users WHERE id=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al comprobar usuario' });
    if (!results || results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = results[0];
    if (u.username === 'goduser') {
      return res.status(403).json({ error: 'No puedes borrar el usuario god.' });
    }
    if ((u.tipo_id === 2 || u.tipo_id === 1) && rolSolicitante !== 'god') {
      return res.status(403).json({ error: 'Solo GOD puede borrar administradores/god.' });
    }

    db.query('DELETE FROM users WHERE id=?', [id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al borrar usuario' });
      res.json({ success: true });
    });
  });
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});