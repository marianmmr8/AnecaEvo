// ============================================================================
// CONTROLADOR DE SERVICIOS (Terapias, Venta Cruzada y Gestión Admin)
// ============================================================================
const { pool } = require('../config/db');

// Mapa de venta cruzada: qué categorías de productos combinan mejor con cada categoría de terapia
const CATEGORIAS_VENTA_CRUZADA = {
  masajes: ['aceites', 'cremas', 'infusiones'],
  terapias_energeticas: ['aceites', 'infusiones', 'libros'],
  crecimiento_alma: ['libros', 'infusiones', 'especias'],
  otros: ['infusiones', 'aceites']
};

/**
 * GET /api/servicios - Lista servicios activos (o todos si ?incluirInactivos=1 para admin)
 * Incluye productos recomendados para venta cruzada en la ficha de cada terapia.
 */
async function listarServicios(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === '1';
    const sql = incluirInactivos
      ? 'SELECT * FROM servicios ORDER BY categoria, nombre'
      : 'SELECT * FROM servicios WHERE activo = TRUE ORDER BY categoria, nombre';

    const [servicios] = await pool.query(sql);
    const [productos] = await pool.query('SELECT id, nombre, slug, categoria, precio, imagen_url, stock FROM productos WHERE activo = TRUE AND stock > 0');

    // Añadimos hasta 2 productos recomendados (venta cruzada) a cada servicio
    const serviciosConRecomendacion = servicios.map((servicio) => {
      const categoriasAfines = CATEGORIAS_VENTA_CRUZADA[servicio.categoria] || ['infusiones'];
      const recomendados = productos
        .filter((p) => categoriasAfines.includes(p.categoria))
        .slice(0, 2);
      return { ...servicio, productos_recomendados: recomendados };
    });

    return res.json({ servicios: serviciosConRecomendacion });
  } catch (error) {
    console.error('Error al listar servicios:', error);
    return res.status(500).json({ error: 'Error al cargar las terapias y servicios.' });
  }
}

/**
 * POST /api/servicios - Crea un nuevo servicio (Solo Admin)
 */
async function crearServicio(req, res) {
  try {
    const {
      nombre, slug, categoria, descripcion,
      duracion_minutos, margen_descanso_minutos, precio, modalidad, imagen_url
    } = req.body;

    if (!nombre || !categoria || !duracion_minutos || precio === undefined) {
      return res.status(400).json({ error: 'Nombre, categoría, duración y precio son obligatorios.' });
    }

    const slugFinal = (slug || nombre)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quita tildes
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const [resultado] = await pool.query(
      `INSERT INTO servicios (nombre, slug, categoria, descripcion, duracion_minutos, margen_descanso_minutos, precio, modalidad, imagen_url, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        nombre.trim(),
        slugFinal,
        categoria,
        descripcion || null,
        Number(duracion_minutos),
        Number(margen_descanso_minutos ?? 15),
        Number(precio),
        modalidad || 'presencial',
        imagen_url || null
      ]
    );

    return res.status(201).json({ mensaje: 'Servicio creado correctamente.', id: resultado.insertId });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return res.status(500).json({ error: 'No se pudo crear el servicio (verifica que el slug no esté repetido).' });
  }
}

/**
 * PUT /api/servicios/:id - Actualiza un servicio existente (Solo Admin)
 */
async function actualizarServicio(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre, categoria, descripcion,
      duracion_minutos, margen_descanso_minutos, precio, modalidad, imagen_url, activo
    } = req.body;

    await pool.query(
      `UPDATE servicios
       SET nombre = ?, categoria = ?, descripcion = ?, duracion_minutos = ?,
           margen_descanso_minutos = ?, precio = ?, modalidad = ?, imagen_url = ?, activo = ?
       WHERE id = ?`,
      [
        nombre,
        categoria,
        descripcion || null,
        Number(duracion_minutos),
        Number(margen_descanso_minutos ?? 15),
        Number(precio),
        modalidad || 'presencial',
        imagen_url || null,
        activo !== undefined ? Boolean(activo) : true,
        id
      ]
    );

    return res.json({ mensaje: 'Servicio actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el servicio.' });
  }
}

module.exports = { listarServicios, crearServicio, actualizarServicio };
