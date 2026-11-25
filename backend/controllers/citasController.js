// ============================================================================
// CONTROLADOR DE CITAS Y AGENDA (Horas libres con buffer, 24h, Bonos, Bloqueos)
// ============================================================================
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const { enviarConfirmacionCita, enviarCancelacionCita } = require('../services/emailService');
const { procesarPago } = require('../services/pagoService');

// Flag en memoria para comprobar una sola vez si existe la columna motivo_cancelacion en `citas`
let columnaMotivoVerificada = false;

async function asegurarColumnaMotivoCancelacion() {
  if (columnaMotivoVerificada) return;
  const dbName = process.env.DB_NAME || 'aneca evo';
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'citas' AND COLUMN_NAME = 'motivo_cancelacion'`,
    [dbName]
  );
  if (cols.length === 0) {
    await pool.query('ALTER TABLE citas ADD COLUMN motivo_cancelacion TEXT NULL AFTER notas_cliente');
  }
  columnaMotivoVerificada = true;
}

// Convierte una hora "HH:MM" o "HH:MM:SS" a minutos desde las 00:00
function aMinutos(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
}

// Convierte minutos desde las 00:00 a formato "HH:MM:SS"
function aHoraSql(totalMinutos) {
  const h = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const m = String(totalMinutos % 60).padStart(2, '0');
  return `${h}:${m}:00`;
}

// Convierte minutos desde las 00:00 a formato corto "HH:MM"
function aHoraCorta(totalMinutos) {
  const h = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const m = String(totalMinutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calcula los huecos libres para un servicio y fecha concretos,
 * respetando horarios_disponibles, bloqueos_agenda y el margen_descanso_minutos (buffer).
 */
async function calcularSlotsDisponibles(fecha, servicio) {
  // Obtenemos el día de la semana (0=Domingo .. 6=Sábado) evitando problemas de zona horaria
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();

  // 1. Consultar horarios de apertura para ese día
  const [horarios] = await pool.query(
    'SELECT hora_inicio, hora_fin FROM horarios_disponibles WHERE dia_semana = ? AND activo = TRUE ORDER BY hora_inicio',
    [diaSemana]
  );
  if (horarios.length === 0) return [];

  // 2. Consultar bloqueos de agenda (vacaciones, festivos) que afecten a esa fecha
  const inicioDia = `${fecha} 00:00:00`;
  const finDia = `${fecha} 23:59:59`;
  const [bloqueos] = await pool.query(
    'SELECT fecha_inicio, fecha_fin FROM bloqueos_agenda WHERE fecha_inicio <= ? AND fecha_fin >= ?',
    [finDia, inicioDia]
  );

  // 3. Consultar citas activas (no canceladas) de ese día junto con el margen de descanso de su servicio
  const [citasDia] = await pool.query(
    `SELECT c.hora_inicio, c.hora_fin, s.margen_descanso_minutos
     FROM citas c
     JOIN servicios s ON c.servicio_id = s.id
     WHERE c.fecha = ? AND c.estado NOT IN ('cancelada', 'no_asistio')`,
    [fecha]
  );

  const duracion = Number(servicio.duracion_minutos);
  const bufferNuevo = Number(servicio.margen_descanso_minutos || 15);
  const slots = [];

  // Recorremos cada tramo horario del día (ej. mañana y tarde) en pasos de 30 minutos
  for (const tramo of horarios) {
    const inicioTramo = aMinutos(tramo.hora_inicio);
    const finTramo = aMinutos(tramo.hora_fin);

    for (let inicio = inicioTramo; inicio + duracion <= finTramo; inicio += 30) {
      const finCita = inicio + duracion;
      const finConBuffer = finCita + bufferNuevo; // Tiempo total bloqueado incluyendo ventilación/limpieza

      // Comprobar si choca con algún bloqueo de agenda
      const chocaBloqueo = bloqueos.some((b) => {
        const bIni = b.fecha_inicio.startsWith(fecha) ? aMinutos(b.fecha_inicio.slice(11, 16)) : 0;
        const bFin = b.fecha_fin.startsWith(fecha) ? aMinutos(b.fecha_fin.slice(11, 16)) : 24 * 60;
        return inicio < bFin && finCita > bIni;
      });
      if (chocaBloqueo) continue;

      // Comprobar si choca con alguna cita existente (sumando su margen de descanso)
      const chocaCita = citasDia.some((c) => {
        const cIni = aMinutos(c.hora_inicio);
        const cFinConBuffer = aMinutos(c.hora_fin) + Number(c.margen_descanso_minutos || 15);
        return inicio < cFinConBuffer && finConBuffer > cIni;
      });
      if (chocaCita) continue;

      slots.push({
        hora_inicio: aHoraCorta(inicio),
        hora_fin: aHoraCorta(finCita)
      });
    }
  }

  return slots;
}

/**
 * GET /api/citas/disponibilidad?fecha=YYYY-MM-DD&servicioId=1
 */
async function obtenerHorasLibres(req, res) {
  try {
    const { fecha, servicioId } = req.query;
    if (!fecha || !servicioId) {
      return res.status(400).json({ error: 'Debes indicar fecha y servicioId.' });
    }

    const [servicios] = await pool.query('SELECT * FROM servicios WHERE id = ? AND activo = TRUE', [servicioId]);
    if (servicios.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    const horasLibres = await calcularSlotsDisponibles(fecha, servicios[0]);
    return res.json({ fecha, servicio: servicios[0], horasLibres });
  } catch (error) {
    console.error('Error al calcular horas libres:', error);
    return res.status(500).json({ error: 'Error al consultar la disponibilidad.' });
  }
}

/**
 * POST /api/citas - Reserva una nueva cita, registra anamnesis opcional y canjea bono o cobra señal
 */
async function crearCita(req, res) {
  const conexion = await pool.getConnection();
  try {
    const {
      servicio_id, fecha, hora_inicio, modalidad, notas_cliente,
      motivo_consulta, contraindicaciones, bono_id, codigo_regalo, metodo_pago, tipo_pago
    } = req.body;

    if (!servicio_id || !fecha || !hora_inicio || !modalidad) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para reservar la cita.' });
    }

    const [servicios] = await conexion.query('SELECT * FROM servicios WHERE id = ? AND activo = TRUE', [servicio_id]);
    if (servicios.length === 0) {
      return res.status(404).json({ error: 'El servicio seleccionado no existe.' });
    }
    const servicio = servicios[0];

    // Verificamos que la hora siga libre (evita reservas duplicadas)
    const slots = await calcularSlotsDisponibles(fecha, servicio);
    const slotValido = slots.find((s) => s.hora_inicio === hora_inicio.slice(0, 5));
    if (!slotValido) {
      return res.status(409).json({ error: 'Lo sentimos, esa hora ya no está disponible. Elige otro horario.' });
    }

    await conexion.beginTransaction();

    let pagoEstado = 'pendiente';
    let estadoCita = 'confirmada';

    // Si el cliente canjea una Tarjeta Regalo, la validamos y la marcamos como canjeada
    if (codigo_regalo) {
      const codigoLimpio = String(codigo_regalo).trim().toUpperCase();
      const [tarjetas] = await conexion.query(
        "SELECT * FROM tarjetas_regalo WHERE codigo = ? AND estado = 'activa' FOR UPDATE",
        [codigoLimpio]
      );
      if (tarjetas.length === 0) {
        await conexion.rollback();
        return res.status(400).json({ error: 'El código de tarjeta regalo no es válido o ya fue canjeado.' });
      }
      const tarjeta = tarjetas[0];
      if (tarjeta.servicio_id && Number(tarjeta.servicio_id) !== Number(servicio.id)) {
        await conexion.rollback();
        return res.status(400).json({ error: 'Esta tarjeta regalo corresponde a otra terapia concreta.' });
      }
      if (!tarjeta.servicio_id && Number(servicio.precio) > Number(tarjeta.precio_maximo)) {
        await conexion.rollback();
        return res.status(400).json({ error: 'Esta terapia supera el valor incluido en tu tarjeta regalo.' });
      }
      await conexion.query(
        "UPDATE tarjetas_regalo SET estado = 'canjeada', canjeada_por_usuario_id = ? WHERE id = ?",
        [req.usuario.id, tarjeta.id]
      );
      pagoEstado = 'pagado';
    } else if (bono_id) {
      const [bonos] = await conexion.query(
        'SELECT * FROM bonos_clientes WHERE id = ? AND usuario_id = ? AND activo = TRUE AND sesiones_restantes > 0 FOR UPDATE',
        [bono_id, req.usuario.id]
      );
      if (bonos.length === 0) {
        await conexion.rollback();
        return res.status(400).json({ error: 'El bono seleccionado no es válido o no tiene sesiones.' });
      }
      await conexion.query(
        'UPDATE bonos_clientes SET sesiones_restantes = sesiones_restantes - 1 WHERE id = ?',
        [bono_id]
      );
      pagoEstado = 'pagado';
    } else if (tipo_pago === 'efectivo') {
      pagoEstado = 'pendiente';
    } else if (tipo_pago === 'senal' || tipo_pago === 'total') {
      // Procesamos señal (20% o mínimo 15€) o pago total mediante servicio de pago
      const importe = tipo_pago === 'total' ? Number(servicio.precio) : Math.max(15, Number((servicio.precio * 0.25).toFixed(2)));
      await procesarPago({
        importe,
        metodo: metodo_pago || 'tarjeta',
        concepto: `Reserva ${servicio.nombre} (${fecha} ${hora_inicio})`
      });
      pagoEstado = tipo_pago === 'total' ? 'pagado' : 'senal_pagada';
    }

    const citaId = randomUUID();
    const horaInicioSql = aHoraSql(aMinutos(slotValido.hora_inicio));
    const horaFinSql = aHoraSql(aMinutos(slotValido.hora_fin));

    await conexion.query(
      `INSERT INTO citas (id, usuario_id, servicio_id, fecha, hora_inicio, hora_fin, modalidad, estado, pago_estado, notas_cliente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [citaId, req.usuario.id, servicio.id, fecha, horaInicioSql, horaFinSql, modalidad, estadoCita, pagoEstado, notas_cliente || null]
    );

    // Si el cliente rellenó el cuestionario previo (Anamnesis: alergias, embarazo, lesiones...), lo guardamos en fichas_clientes
    if (motivo_consulta || contraindicaciones) {
      await conexion.query(
        `INSERT INTO fichas_clientes (id, usuario_id, cita_id, motivo_consulta, contraindicaciones)
         VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), req.usuario.id, citaId, motivo_consulta || null, contraindicaciones || null]
      );
    }

    await conexion.commit();

    // Enviamos notificación de confirmación (no bloqueante si falla)
    enviarConfirmacionCita({
      email: req.usuario.email,
      nombre: req.usuario.nombre,
      servicioNombre: servicio.nombre,
      fecha,
      horaInicio: slotValido.hora_inicio,
      modalidad
    }).catch(() => {});

    return res.status(201).json({
      mensaje: '¡Tu cita ha sido reservada con éxito!',
      cita: { id: citaId, fecha, hora_inicio: slotValido.hora_inicio, hora_fin: slotValido.hora_fin, estado: estadoCita, pago_estado: pagoEstado }
    });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear cita:', error);
    return res.status(500).json({ error: 'No se pudo completar la reserva.' });
  } finally {
    conexion.release();
  }
}

/**
 * GET /api/citas/mias - Lista las citas del cliente autenticado
 */
async function misCitas(req, res) {
  try {
    const [citas] = await pool.query(
      `SELECT c.*, s.nombre AS servicio_nombre, s.precio, s.duracion_minutos, s.categoria
       FROM citas c
       JOIN servicios s ON c.servicio_id = s.id
       WHERE c.usuario_id = ?
       ORDER BY c.fecha DESC, c.hora_inicio DESC`,
      [req.usuario.id]
    );
    return res.json({ citas });
  } catch (error) {
    console.error('Error al obtener mis citas:', error);
    return res.status(500).json({ error: 'Error al cargar tus citas.' });
  }
}

/**
 * PATCH /api/citas/:id/cancelar - Cancela una cita respetando la política de 24h (salvo admin)
 */
async function cancelarCita(req, res) {
  try {
    const { id } = req.params;
    const [filas] = await pool.query('SELECT * FROM citas WHERE id = ?', [id]);
    if (filas.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }
    const cita = filas[0];

    // Solo el dueño de la cita o un admin pueden cancelarla
    if (cita.usuario_id !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita.' });
    }

    // Política de 24 horas para clientes
    if (req.usuario.rol !== 'admin') {
      const fechaCita = new Date(`${cita.fecha}T${cita.hora_inicio}`);
      const horasRestantes = (fechaCita.getTime() - Date.now()) / (1000 * 60 * 60);
      if (horasRestantes < 24) {
        return res.status(400).json({
          error: 'La política del centro requiere al menos 24 horas de antelación para cancelar o reprogramar.'
        });
      }
    }

    await pool.query("UPDATE citas SET estado = 'cancelada' WHERE id = ?", [id]);
    return res.json({ mensaje: 'Cita cancelada correctamente.' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return res.status(500).json({ error: 'No se pudo cancelar la cita.' });
  }
}

/**
 * GET /api/citas/admin - Lista todas las citas para el panel de administración
 */
async function listarTodasCitas(req, res) {
  try {
    const [citas] = await pool.query(
      `SELECT c.*, s.nombre AS servicio_nombre, s.precio,
              u.nombre AS cliente_nombre, u.apellidos AS cliente_apellidos, u.email AS cliente_email, u.telefono AS cliente_telefono
       FROM citas c
       JOIN servicios s ON c.servicio_id = s.id
       JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.fecha DESC, c.hora_inicio ASC`
    );
    return res.json({ citas });
  } catch (error) {
    console.error('Error al listar agenda admin:', error);
    return res.status(500).json({ error: 'Error al cargar la agenda.' });
  }
}

/**
 * PATCH /api/citas/:id/estado - Cambia estado, pago_estado o guarda motivo_cancelacion (Solo Admin)
 */
async function actualizarEstadoCita(req, res) {
  try {
    await asegurarColumnaMotivoCancelacion(); // Asegura compatibilidad con la tabla `citas` ya importada
    const { id } = req.params;
    const { estado, pago_estado, motivo_cancelacion } = req.body;

    if (estado === 'cancelada' && (!motivo_cancelacion || !motivo_cancelacion.trim())) {
      return res.status(400).json({ error: 'Indica un motivo para explicar la cancelación al cliente.' });
    }

    await pool.query(
      `UPDATE citas
       SET estado = COALESCE(?, estado),
           pago_estado = COALESCE(?, pago_estado),
           motivo_cancelacion = COALESCE(?, motivo_cancelacion)
       WHERE id = ?`,
      [estado || null, pago_estado || null, motivo_cancelacion ? motivo_cancelacion.trim() : null, id]
    );

    // Si el administrador cancela, enviamos aviso con el motivo al cliente
    if (estado === 'cancelada') {
      const [filas] = await pool.query(
        `SELECT c.fecha, c.hora_inicio, s.nombre AS servicio_nombre, u.email, u.nombre
         FROM citas c
         JOIN servicios s ON c.servicio_id = s.id
         JOIN usuarios u ON c.usuario_id = u.id
         WHERE c.id = ?`,
        [id]
      );
      if (filas.length > 0) {
        const info = filas[0];
        enviarCancelacionCita({
          email: info.email,
          nombre: info.nombre,
          servicioNombre: info.servicio_nombre,
          fecha: info.fecha,
          horaInicio: info.hora_inicio.slice(0, 5),
          motivo: motivo_cancelacion.trim()
        }).catch(() => {});
      }
    }

    return res.json({ mensaje: 'Cita actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return res.status(500).json({ error: 'Error al actualizar la cita.' });
  }
}

/**
 * GET /api/citas/bloqueos - Lista bloqueos de días festivos / vacaciones (Admin)
 */
async function listarBloqueos(req, res) {
  try {
    const [bloqueos] = await pool.query('SELECT * FROM bloqueos_agenda ORDER BY fecha_inicio DESC');
    return res.json({ bloqueos });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar bloqueos de agenda.' });
  }
}

/**
 * POST /api/citas/bloqueos - Crea un bloqueo de día festivo o descanso (Admin)
 */
async function crearBloqueo(req, res) {
  try {
    const { fecha_inicio, fecha_fin, motivo } = req.body;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Indica fecha de inicio y fin del bloqueo.' });
    }
    const [resInsert] = await pool.query(
      'INSERT INTO bloqueos_agenda (fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?)',
      [fecha_inicio, fecha_fin, motivo || 'Festivo / Cierre del centro']
    );
    return res.status(201).json({ mensaje: 'Bloqueo añadido a la agenda.', id: resInsert.insertId });
  } catch (error) {
    console.error('Error al crear bloqueo:', error);
    return res.status(500).json({ error: 'No se pudo crear el bloqueo.' });
  }
}

/**
 * DELETE /api/citas/bloqueos/:id - Elimina un bloqueo (Admin)
 */
async function eliminarBloqueo(req, res) {
  try {
    await pool.query('DELETE FROM bloqueos_agenda WHERE id = ?', [req.params.id]);
    return res.json({ mensaje: 'Bloqueo eliminado.' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar el bloqueo.' });
  }
}

module.exports = {
  obtenerHorasLibres,
  crearCita,
  misCitas,
  cancelarCita,
  listarTodasCitas,
  actualizarEstadoCita,
  listarBloqueos,
  crearBloqueo,
  eliminarBloqueo
};
