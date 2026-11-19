// ============================================================================
// RUTAS DE CLIENTES, FICHAS PRIVADAS Y BONOS (/api/clientes)
// ============================================================================
const express = require('express');
const router = express.Router();
const { misBonos, listarClientes, actualizarCliente, eliminarCliente, obtenerFichasCliente, crearFichaCliente, asignarBono } = require('../controllers/clientesController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/bonos/mios', verificarToken, misBonos);                             // Cliente: ver mis bonos disponibles
router.get('/', verificarToken, soloAdmin, listarClientes);                      // Admin: listado de clientes
router.put('/:id', verificarToken, soloAdmin, actualizarCliente);                // Admin: modificar datos del cliente
router.delete('/:id', verificarToken, soloAdmin, eliminarCliente);             // Admin: eliminar/desactivar cliente
router.get('/:id/fichas', verificarToken, soloAdmin, obtenerFichasCliente);      // Admin: ver historial privado del cliente
router.post('/:id/fichas', verificarToken, soloAdmin, crearFichaCliente);        // Admin: añadir nota de evolución
router.post('/:id/bonos', verificarToken, soloAdmin, asignarBono);               // Admin: asignar bono/tarjeta regalo

module.exports = router;
