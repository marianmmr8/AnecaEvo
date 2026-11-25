// ============================================================================
// SERVIDOR PRINCIPAL DE EXPRESS - ANECA EVO BACKEND
// ============================================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { verificarConexion } = require('./config/db');

// Importación de rutas modulares
const authRoutes = require('./routes/authRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const citasRoutes = require('./routes/citasRoutes');
const productosRoutes = require('./routes/productosRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const asistenteRoutes = require('./routes/asistenteRoutes');
const tarjetasRoutes = require('./routes/tarjetasRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Middlewares globales
app.use(cors());                                                   // Permite peticiones desde el frontend en Vite (puerto 5173)
app.use(express.json({ limit: '10mb' }));                          // Permite recibir JSON y fotos en base64 de hasta 10MB
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Sirve las fotos subidas de productos

// Ruta de comprobación de salud del servidor y base de datos
app.get('/api/health', async (_req, res) => {
  try {
    await verificarConexion();
    res.json({ estado: 'ok', baseDatos: 'aneca evo conectada' });
  } catch (error) {
    res.status(500).json({ estado: 'error', detalle: error.message });
  }
});

// Registro de endpoints de la API
app.use('/api/auth', authRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/asistente', asistenteRoutes);
app.use('/api/tarjetas', tarjetasRoutes);

// Arranque del servidor
app.listen(PORT, async () => {
  console.log(`\n🌿 Servidor Aneca Evo escuchando en http://localhost:${PORT}`);
  try {
    await verificarConexion();
    console.log('✅ Conexión verificada con MySQL (base de datos: `aneca evo`)');
  } catch (error) {
    console.warn('⚠️  Aviso: Aún no se pudo conectar a MySQL. Asegúrate de iniciar MySQL en XAMPP y ejecutar `npm run init-db`.');
  }
});
