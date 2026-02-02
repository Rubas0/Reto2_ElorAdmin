const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const { hashPassword } = require('./hashing'); // import del módulo de hashing

// Carga de clave privada (para descifrar lo que envía el frontend con JSEncrypt)
const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'private.key');
let PRIVATE_KEY_PEM = '';
try {
  PRIVATE_KEY_PEM = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
} catch (e) {
  console.error('No se pudo leer la clave privada:', e.message);
  process.exit(1);
}

// Descifra base64 generado por JSEncrypt, movidas de cifrado de node
function decryptPasswordB64(encryptedB64) {
  try {
    const buf = Buffer.from(encryptedB64, 'base64');
    const decrypted = crypto.privateDecrypt(
      { key: PRIVATE_KEY_PEM, padding: crypto.constants.RSA_PKCS1_PADDING },
      buf
    );
    return decrypted.toString('utf8');
  } catch (e) {
    console.error('Error al descifrar password:', e.message);
    return null;
  }
}


const app = express();
app.use(cors()); // permite peticiones desde localhost:4200
app.use(express.json()); // parsea JSON en el body para que pueda enviar datos como JSON

const db = mysql.createConnection({
  host: 'localhost',    // cambiar si usas otra máquina
  user: 'root',
  port: '3307',
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

// ACTIVAR compatibilidad temporal para password EN CLARO (true SOLO PARA TESTS)
// const ALLOW_PLAINTEXT_LOGIN = true;


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


// LOGIN: descifra -> hashea -> compara
app.post('/api/login', (req, res) => {
  console.log('POST /api/login - body recibido (solo username):', { username: req.body?.username });

  const { username, password: encryptedPassword } = req.body || {};
  if (!username || !encryptedPassword) {
    return res.status(400).json({ error: 'Faltan campos username/password' });
  }

  const plain = decryptPasswordB64(encryptedPassword);
  if (!plain) {
    return res.status(400).json({ error: 'Password mal cifrada' });
  }

  const passwordHash = hashPassword(plain);

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

// Utilidad: rol del solicitante (demo por cabecera)
function requesterRole(req) {
  return String(req.headers['x-rol'] || '').trim().toLowerCase();
}

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


// Alta usuario (solo GOD puede crear admins/god). Descifra -> hashea antes de guardar
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

  const plainPass = decryptPasswordB64(password);
  if (!plainPass) return res.status(400).json({ error: 'Password mal cifrada' });
  const passwordHash = hashPassword(plainPass);

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

// Editar usuario (solo GOD puede editar admins/god). Si viene password, descifra -> hashea
app.put('/api/usuarios/:id', (req, res) => {

  if (password) {
  const plainPass = decryptPasswordB64(password);
  if (!plainPass) return res.status(400).json({ error: 'Password mal cifrada' });
  sql += ', password=?';
  params.push(hashPassword(plainPass));
}

  const rolSolicitante = requesterRole(req);
  const { nombre, apellidos, email, password, rol } = req.body || {};
  const { id } = req.params;
  if (!id || !nombre || !apellidos || !email || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const tipo_id = rol === 'god' ? 1 : rol === 'admin' || rol === 'administrador' ? 2 : rol === 'profesor' ? 3 : rol === 'alumno' ? 4 : null;
  if (!tipo_id) return res.status(400).json({ error: 'Rol no válido' });

  if ((tipo_id === 2 || tipo_id === 1) && rolSolicitante !== 'god') {
    return res.status(403).json({ error: 'Solo GOD puede editar administradores/god' });
  }

  db.query('SELECT username FROM users WHERE id=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al comprobar usuario' });
    if (results[0]?.username === 'goduser' && rolSolicitante !== 'god') {
      return res.status(403).json({ error: 'Solo GOD puede editar goduser' });
    }

    let sql = 'UPDATE users SET nombre=?, apellidos=?, email=?, tipo_id=?';
    const params = [nombre, apellidos, email, tipo_id];

    if (password) {
      const plainPass = decryptPasswordB64(password);
      if (!plainPass) return res.status(400).json({ error: 'Password mal cifrada' });
      sql += ', password=?';
      params.push(hashPassword(plainPass));
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


// ==================== REUNIONES ====================

// Listar todas las reuniones
app.get('/api/reuniones', (req, res) => {
  console.log('GET /api/reuniones');
  
  const sql = `
    SELECT 
      r.id_reunion as id,
      r.estado,
      r.profesor_id as profesorId,
      r.alumno_id as alumnoId,
      r.id_centro as centroId,
      r.titulo,
      r.asunto as tema,
      r.aula,
      DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha,
      DATE_FORMAT(r.fecha, '%H:%i') as hora,
      r.created_at,
      p.nombre as profesor_nombre, 
      p.apellidos as profesor_apellidos,
      a.nombre as alumno_nombre, 
      a.apellidos as alumno_apellidos
    FROM reuniones r
    LEFT JOIN users p ON r.profesor_id = p.id
    LEFT JOIN users a ON r.alumno_id = a.id
    ORDER BY r.fecha DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error al listar reuniones:', err);
      return res.status(500).json({ error: 'Error al listar reuniones', detalle: err.message });
    }
    
    console.log('✅ Reuniones cargadas:', results.length);
    res.json(results);
  });
});

// GET /api/reuniones/:id - Obtener una reunión por ID
app.get('/api/reuniones/:id', (req, res) => {
  const { id } = req.params;
  console.log('GET /api/reuniones/' + id);
  
  const sql = `
    SELECT 
      r.id_reunion as id,
      r.estado,
      r.profesor_id as profesorId,
      r.alumno_id as alumnoId,
      r.id_centro as centroId,
      r.titulo,
      r.asunto as tema,
      r.aula,
      DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha,
      DATE_FORMAT(r.fecha, '%H:%i') as hora,
      r.created_at,
      p.nombre as profesor_nombre, 
      p.apellidos as profesor_apellidos,
      a.nombre as alumno_nombre, 
      a.apellidos as alumno_apellidos
    FROM reuniones r
    LEFT JOIN users p ON r.profesor_id = p.id
    LEFT JOIN users a ON r.alumno_id = a.id
    WHERE r.id_reunion = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener reunión:', err);
      return res.status(500).json({ error: 'Error al obtener reunión' });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Reunión no encontrada' });
    }
    
    console.log('✅ Reunión obtenida:', results[0].id);
    res.json(results[0]);
  });
});

// Obtener una reunión por ID
app.get('/api/reuniones/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      r.id_reunion as id,
      r.estado,
      r.profesor_id as profesorId,
      r.alumno_id as alumnoId,
      r.id_centro as centroId,
      r.titulo,
      r.asunto as tema,
      r.aula,
      DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha,
      DATE_FORMAT(r.fecha, '%H:%i') as hora,
      r.created_at,
      p.nombre as profesor_nombre, 
      p.apellidos as profesor_apellidos,
      a.nombre as alumno_nombre, 
      a.apellidos as alumno_apellidos
    FROM reuniones r
    LEFT JOIN users p ON r.profesor_id = p.id
    LEFT JOIN users a ON r.alumno_id = a.id
    WHERE r.id_reunion = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener reunión:', err);
      return res.status(500).json({ error: 'Error al obtener reunión' });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Reunión no encontrada' });
    }
    
    console.log('✅ Reunión obtenida:', results[0].id);
    res.json(results[0]);
  });
});
// Crear nueva reunión
app.post('/api/reuniones', (req, res) => {
  console.log('POST /api/reuniones - body recibido:', req.body);
  
  const { titulo, tema, fecha, hora, aula, estado, centroId, profesorId, alumnoId } = req.body;
  
  // Validación de campos obligatorios
  if (!fecha || !profesorId || !alumnoId) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios',
      campos_requeridos: ['fecha', 'profesorId', 'alumnoId']
    });
  }

  // Construir fecha completa con hora
  const fechaHoraCompleta = `${fecha} ${hora || '00:00:00'}`;

  const sql = `
    INSERT INTO reuniones 
    (estado, profesor_id, alumno_id, id_centro, titulo, asunto, aula, fecha, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
  
  const estadoFinal = estado || 'pendiente';
  const centroFinal = centroId || 15112; // Por defecto Elorrieta
  const tituloFinal = titulo || 'Reunión';
  const asuntoFinal = tema || '';
  const aulaFinal = aula || '';
  
  db.query(
    sql, 
    [estadoFinal, profesorId, alumnoId, centroFinal, tituloFinal, asuntoFinal, aulaFinal, fechaHoraCompleta], 
    (err, result) => {
      if (err) {
        console.error('❌ Error al crear reunión:', err);
        return res.status(500).json({ 
          error: 'Error al crear reunión', 
          detalle: err.message 
        });
      }
      
      console.log('✅ Reunión creada correctamente, ID:', result.insertId);
      res.json({ 
        success: true, 
        id: result.insertId, 
        message: 'Reunión creada correctamente' 
      });
    }
  );
});

// Actualizar estado de reunión
app.put('/api/reuniones/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  if (!estado) {
    return res.status(400).json({ error: 'Estado es obligatorio' });
  }

  const sql = 'UPDATE reuniones SET estado = ? WHERE id = ?';
  
  db.query(sql, [estado, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar reunión:', err);
      return res.status(500).json({ error: 'Error al actualizar reunión' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reunión no encontrada' });
    }
    res.json({ success: true });
  });
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});