// ============================================================================
// CONTROLADOR DE AUTENTICACIÓN (Registro, Login y Perfil de Usuario)
// ============================================================================
const bcrypt = require('bcryptjs');          // Para encriptar y comparar contraseñas de forma segura
const jwt = require('jsonwebtoken');           // Para generar tokens de sesión JWT
const { randomUUID } = require('crypto');      // Para generar UUID v4 compatibles con CHAR(36)
const { pool } = require('../config/db');      // Pool de conexiones a MySQL (`aneca evo`)

// Helper interno para firmar el token JWT del usuario
function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol
    },
    process.env.JWT_SECRET || 'aneca_evo_clave_secreta_holistica_2026',
    { expiresIn: '7d' } // La sesión dura 7 días
  );
}

/**
 * POST /api/auth/registro - Registra un nuevo cliente en la tabla `usuarios`
 */
async function registro(req, res) {
  try {
    const { nombre, apellidos, email, password, telefono } = req.body;

    // Validación básica de campos obligatorios
    if (!nombre || !apellidos || !email || !password) {
      return res.status(400).json({ error: 'Nombre, apellidos, email y contraseña son obligatorios.' });
    }

    // Comprobamos si el email ya existe
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo.' });
    }

    const id = randomUUID(); // Generamos UUID único para la columna id CHAR(36)
    const passwordHash = await bcrypt.hash(password, 10); // Encriptamos la contraseña con salt 10
    const emailNormalizado = email.trim().toLowerCase();

    // Insertamos el usuario con rol 'cliente' por defecto
    await pool.query(
      `INSERT INTO usuarios (id, nombre, apellidos, email, password_hash, telefono, rol)
       VALUES (?, ?, ?, ?, ?, ?, 'cliente')`,
      [id, nombre.trim(), apellidos.trim(), emailNormalizado, passwordHash, telefono || null]
    );

    const usuario = { id, nombre: nombre.trim(), apellidos: apellidos.trim(), email: emailNormalizado, telefono: telefono || null, rol: 'cliente' };
    const token = generarToken(usuario);

    return res.status(201).json({ mensaje: 'Bienvenida/o a Aneca Evo.', token, usuario });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'No se pudo completar el registro.' });
  }
}

/**
 * POST /api/auth/login - Valida credenciales y devuelve token JWT + datos del usuario
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Introduce tu email y contraseña.' });
    }

    const [filas] = await pool.query(
      'SELECT id, nombre, apellidos, email, password_hash, telefono, rol, activo FROM usuarios WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (filas.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const usuarioDb = filas[0];
    if (!usuarioDb.activo) {
      return res.status(403).json({ error: 'Esta cuenta está desactivada. Contacta con el centro.' });
    }

    // Comparamos la contraseña introducida con el hash guardado en MySQL
    const passwordValida = await bcrypt.compare(password, usuarioDb.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const usuario = {
      id: usuarioDb.id,
      nombre: usuarioDb.nombre,
      apellidos: usuarioDb.apellidos,
      email: usuarioDb.email,
      telefono: usuarioDb.telefono,
      rol: usuarioDb.rol
    };

    const token = generarToken(usuario);
    return res.json({ token, usuario });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
}

/**
 * GET /api/auth/perfil - Devuelve los datos actualizados del usuario autenticado
 */
async function perfil(req, res) {
  try {
    const [filas] = await pool.query(
      'SELECT id, nombre, apellidos, email, telefono, rol, fecha_registro FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.json({ usuario: filas[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error al obtener tu perfil.' });
  }
}

module.exports = { registro, login, perfil };
