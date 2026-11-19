// ============================================================================
// RUTAS DE AUTENTICACIÓN (/api/auth)
// ============================================================================
const express = require('express');
const router = express.Router();
const { registro, login, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/registro', registro);               // Crear nueva cuenta de cliente
router.post('/login', login);                     // Iniciar sesión y recibir JWT
router.get('/perfil', verificarToken, perfil);    // Obtener datos del usuario conectado

module.exports = router;
