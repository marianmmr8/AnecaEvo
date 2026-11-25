// ============================================================================
// RUTAS DE CLIENTES, FICHAS PRIVADAS Y BONOS (/api/clientes)
// ============================================================================
const express = require('express');
const router = express.Router();
const {
  misBonos,
  comprarBono,
  obtenerBonosCliente,
  descontarSesionBono,
  listarClientes,
  actualizarCliente,
  eliminarCliente,
  obtenerFichasCliente,
  crearFichaCliente,
  actualizarFichaCliente,
  eliminarFichaCliente,
  asignarBono
} = require('../controllers/clientesController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/bonos/mios', verificarToken, misBonos);                             // Cliente: ver mis bonos disponibles
router.post('/bonos/comprar', verificarToken, comprarBono);                      // Cliente: comprar bono de sesiones
router.get('/', verificarToken, soloAdmin, listarClientes);                      // Admin: listado de clientes
router.put('/:id', verificarToken, soloAdmin, actualizarCliente);                // Admin: modificar datos del cliente
router.delete('/:id', verificarToken, soloAdmin, eliminarCliente);             // Admin: eliminar/desactivar cliente
router.get('/:id/fichas', verificarToken, soloAdmin, obtenerFichasCliente);      // Admin: ver historial privado del cliente
router.post('/:id/fichas', verificarToken, soloAdmin, crearFichaCliente);        // Admin: añadir nota de evolución
router.put('/fichas/:fichaId', verificarToken, soloAdmin, actualizarFichaCliente);   // Admin: modificar ficha privada
router.delete('/fichas/:fichaId', verificarToken, soloAdmin, eliminarFichaCliente); // Admin: eliminar ficha privada
router.get('/:id/bonos', verificarToken, soloAdmin, obtenerBonosCliente);        // Admin: ver bonos del cliente
router.patch('/bonos/:bonoId/descontar', verificarToken, soloAdmin, descontarSesionBono); // Admin: descontar 1 sesión
router.post('/:id/bonos', verificarToken, soloAdmin, asignarBono);               // Admin: asignar bono/tarjeta regalo

module.exports = router;
