// ============================================================================
// CONTROLADOR DE AUTENTICACIÓN (Registro, Login y Perfil de Usuario)
// ============================================================================
const bcrypt = require('bcryptjs');          // Para encriptar y comparar contraseñas de forma segura
const jwt = require('jsonwebtoken');           // Para generar tokens de sesión JWT
const { randomUUID } = require('crypto');      // Para generar UUID v4 compatibles con CHAR(36)
const { pool } = require('../config/db');      // Pool de conexiones a MySQL (`aneca evo`)
const { enviarRecuperacionPassword } = require('../services/emailService');

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

    // Validación estricta de campos obligatorios, formato de email y teléfono numérico
    if (!nombre || !apellidos || !email || !password || !telefono) {
      return res.status(400).json({ error: 'Nombre, apellidos, email, teléfono y contraseña son obligatorios.' });
    }

    const emailNormalizado = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      return res.status(400).json({ error: 'Introduce un correo electrónico válido.' });
    }

    const telefonoLimpio = String(telefono).replace(/\s+/g, '');
    if (!/^\+?\d{9,15}$/.test(telefonoLimpio)) {
      return res.status(400).json({ error: 'El teléfono es obligatorio y debe contener solo números (9 a 15 dígitos).' });
    }

    // Comprobamos si el email ya existe (un solo usuario por correo)
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [emailNormalizado]);
    if (existentes.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo.' });
    }

    const id = randomUUID(); // Generamos UUID único para la columna id CHAR(36)
    const passwordHash = await bcrypt.hash(password, 10); // Encriptamos la contraseña con salt 10

    // Insertamos el usuario con rol 'cliente' por defecto
    await pool.query(
      `INSERT INTO usuarios (id, nombre, apellidos, email, password_hash, telefono, rol)
       VALUES (?, ?, ?, ?, ?, ?, 'cliente')`,
      [id, nombre.trim(), apellidos.trim(), emailNormalizado, passwordHash, telefonoLimpio]
    );

    const usuario = { id, nombre: nombre.trim(), apellidos: apellidos.trim(), email: emailNormalizado, telefono: telefonoLimpio, rol: 'cliente' };
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

/**
 * POST /api/auth/olvide-password - Genera un token temporal y envía email de recuperación
 */
async function olvidePassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Introduce un correo electrónico válido.' });
    }

    const [filas] = await pool.query('SELECT id, nombre, email FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
    if (filas.length > 0) {
      const usuario = filas[0];
      const token = jwt.sign(
        { id: usuario.id, proposito: 'reset_password' },
        process.env.JWT_SECRET || 'aneca_evo_clave_secreta_holistica_2026',
        { expiresIn: '15m' }
      );
      await enviarRecuperacionPassword({ email: usuario.email, nombre: usuario.nombre, token });
    }

    return res.json({
      mensaje: 'Si el correo existe, hemos enviado las instrucciones para restablecer tu contraseña.'
    });
  } catch (error) {
    console.error('Error en olvidePassword:', error);
    return res.status(500).json({ error: 'No se pudo procesar la solicitud.' });
  }
}

/**
 * POST /api/auth/restablecer-password - Valida el token y guarda la nueva contraseña
 */
async function restablecerPassword(req, res) {
  try {
    const { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword || nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'Indica el código recibido y una contraseña de al menos 6 caracteres.' });
    }

    const decoded = jwt.verify(
      token.trim(),
      process.env.JWT_SECRET || 'aneca_evo_clave_secreta_holistica_2026'
    );
    if (decoded.proposito !== 'reset_password') {
      return res.status(400).json({ error: 'El código no es válido para restablecer contraseña.' });
    }

    const hash = await bcrypt.hash(nuevaPassword, 10);
    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, decoded.id]);
    return res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch {
    return res.status(400).json({ error: 'El código ha caducado o no es válido.' });
  }
}

module.exports = { registro, login, perfil, olvidePassword, restablecerPassword };
