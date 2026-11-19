// ============================================================================
// MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN (JWT y Rol Admin)
// ============================================================================
const jwt = require('jsonwebtoken'); // Librería para verificar tokens JWT

/**
 * verificarToken: Comprueba que la petición incluye un token Bearer válido.
 * Si es válido, guarda los datos del usuario en req.usuario y deja pasar.
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization || ''; // Lee la cabecera Authorization
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7) // Extrae solo el token quitando "Bearer "
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Inicia sesión para continuar.' });
  }

  try {
    // Verifica la firma del token usando la clave secreta del .env
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'aneca_evo_clave_secreta_holistica_2026'
    );
    req.usuario = decoded; // Adjunta { id, email, nombre, rol } a la petición
    return next();         // Continúa hacia el controlador
  } catch (error) {
    return res.status(401).json({ error: 'Tu sesión ha caducado o el token no es válido.' });
  }
}

/**
 * soloAdmin: Se ejecuta después de verificarToken y exige que rol === 'admin'.
 */
function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido solo para administración.' });
  }
  return next(); // El usuario es admin, puede acceder al panel privado
}

module.exports = { verificarToken, soloAdmin };
