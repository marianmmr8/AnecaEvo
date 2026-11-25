// ============================================================================
// CONTROLADOR DE PRODUCTOS DE TIENDA (Aceites, Cremas, Infusiones, Especias, Libros)
// ============================================================================
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

/**
 * GET /api/productos - Lista productos con filtros opcionales por categoría y búsqueda
 */
async function listarProductos(req, res) {
  try {
    const { categoria, q, incluirInactivos } = req.query;
    let sql = 'SELECT * FROM productos WHERE 1=1';
    const params = [];

    if (incluirInactivos !== '1') {
      sql += ' AND activo = TRUE';
    }

    if (categoria && categoria !== 'todas') {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    if (q && q.trim() !== '') {
      sql += ' AND (nombre LIKE ? OR descripcion LIKE ? OR ingredientes_o_autor LIKE ?)';
      const termino = `%${q.trim()}%`;
      params.push(termino, termino, termino);
    }

    sql += ' ORDER BY categoria, nombre';
    const [productos] = await pool.query(sql, params);
    return res.json({ productos });
  } catch (error) {
    console.error('Error al listar productos:', error);
    return res.status(500).json({ error: 'Error al cargar los productos de la tienda.' });
  }
}

/**
 * POST /api/productos - Crea un nuevo producto (Solo Admin)
 */
async function crearProducto(req, res) {
  try {
    const { nombre, slug, categoria, descripcion, ingredientes_o_autor, precio, stock, imagen_url } = req.body;

    if (!nombre || !categoria || precio === undefined) {
      return res.status(400).json({ error: 'Nombre, categoría y precio son obligatorios.' });
    }

    const slugFinal = (slug || nombre)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const [resultado] = await pool.query(
      `INSERT INTO productos (nombre, slug, categoria, descripcion, ingredientes_o_autor, precio, stock, imagen_url, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        nombre.trim(),
        slugFinal,
        categoria,
        descripcion || null,
        ingredientes_o_autor || null,
        Number(precio),
        Number(stock ?? 0),
        imagen_url || null
      ]
    );

    return res.status(201).json({ mensaje: 'Producto añadido a la tienda.', id: resultado.insertId });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ error: 'No se pudo crear el producto.' });
  }
}

/**
 * PUT /api/productos/:id - Actualiza datos o stock de un producto (Solo Admin)
 */
async function actualizarProducto(req, res) {
  try {
    const { id } = req.params;
    const { nombre, categoria, descripcion, ingredientes_o_autor, precio, stock, imagen_url, activo } = req.body;

    await pool.query(
      `UPDATE productos
       SET nombre = ?, categoria = ?, descripcion = ?, ingredientes_o_autor = ?,
           precio = ?, stock = ?, imagen_url = ?, activo = ?
       WHERE id = ?`,
      [
        nombre,
        categoria,
        descripcion || null,
        ingredientes_o_autor || null,
        Number(precio),
        Number(stock ?? 0),
        imagen_url || null,
        activo !== undefined ? Boolean(activo) : true,
        id
      ]
    );

    return res.json({ mensaje: 'Producto actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el producto.' });
  }
}

/**
 * POST /api/productos/subir-imagen - Guarda una foto en backend/uploads/productos (Solo Admin)
 */
async function subirImagenProducto(req, res) {
  try {
    const { datosBase64 } = req.body;
    if (!datosBase64 || typeof datosBase64 !== 'string') {
      return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    }

    // Validamos que sea una imagen válida en formato Data URL (png, jpg, jpeg, webp, gif)
    const coincidencia = datosBase64.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
    if (!coincidencia) {
      return res.status(400).json({ error: 'Formato de imagen no válido. Usa JPG, PNG o WEBP.' });
    }

    const extension = coincidencia[1].toLowerCase() === 'jpeg' ? 'jpg' : coincidencia[1].toLowerCase();
    const buffer = Buffer.from(coincidencia[2], 'base64');

    const carpetaDestino = path.join(__dirname, '..', 'uploads', 'productos');
    fs.mkdirSync(carpetaDestino, { recursive: true }); // Crea la carpeta si aún no existe

    const nombreArchivo = `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}.${extension}`;
    fs.writeFileSync(path.join(carpetaDestino, nombreArchivo), buffer);

    return res.status(201).json({ imagen_url: `/uploads/productos/${nombreArchivo}` });
  } catch (error) {
    console.error('Error al subir imagen de producto:', error);
    return res.status(500).json({ error: 'No se pudo guardar la imagen.' });
  }
}

/**
 * DELETE /api/productos/:id - Elimina un producto o lo retira si tiene pedidos (Solo Admin)
 */
async function eliminarProducto(req, res) {
  try {
    const { id } = req.params;
    const [usos] = await pool.query('SELECT COUNT(*) AS total FROM detalle_pedidos WHERE producto_id = ?', [id]);

    if (usos[0].total > 0) {
      await pool.query('UPDATE productos SET activo = FALSE, stock = 0 WHERE id = ?', [id]);
      return res.json({ mensaje: 'Producto retirado de la tienda (se conserva en el historial de pedidos).' });
    }

    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    return res.json({ mensaje: 'Producto eliminado definitivamente.' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ error: 'No se pudo eliminar el producto.' });
  }
}

/**
 * POST /api/productos/ajuste-precios - Actualiza precios en masa por categoría en % o € (Solo Admin)
 */
async function ajustarPreciosMasivo(req, res) {
  try {
    const { tabla, categoria, tipo, valor } = req.body;
    const numValor = Number(valor);

    if (!['productos', 'servicios'].includes(tabla)) {
      return res.status(400).json({ error: 'Destino no válido.' });
    }
    if (!['porcentaje', 'euros'].includes(tipo) || Number.isNaN(numValor) || numValor === 0) {
      return res.status(400).json({ error: 'Indica un valor numérico distinto de 0.' });
    }

    const expresion = tipo === 'porcentaje'
      ? 'GREATEST(0, ROUND(precio * (1 + ? / 100), 2))'
      : 'GREATEST(0, ROUND(precio + ?, 2))';

    let sql = `UPDATE ${tabla} SET precio = ${expresion}`;
    const params = [numValor];

    if (categoria && categoria !== 'todas') {
      sql += ' WHERE categoria = ?';
      params.push(categoria);
    }

    const [resultado] = await pool.query(sql, params);
    return res.json({
      mensaje: `Precios actualizados en ${resultado.affectedRows} ${tabla}.`,
      actualizados: resultado.affectedRows
    });
  } catch (error) {
    console.error('Error en ajuste masivo de precios:', error);
    return res.status(500).json({ error: 'No se pudieron actualizar los precios.' });
  }
}

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto, subirImagenProducto, ajustarPreciosMasivo };
