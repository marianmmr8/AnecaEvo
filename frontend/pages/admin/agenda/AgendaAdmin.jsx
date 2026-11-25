// ============================================================================
// ADMIN: GESTIÓN DE AGENDA (Calendario mensual con modal, Estados y Festivos)
// ============================================================================
import { useEffect, useState } from 'react';
import { MessageCircle, Mail, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { apiFetch } from '../../../services/api';

// Genera el enlace de WhatsApp con el teléfono del cliente y el motivo de cancelación pre-rellenado
function crearEnlaceWhatsApp(cita) {
  const soloDigitos = (cita.cliente_telefono || '').replace(/\D/g, '');
  const telefonoFinal = soloDigitos.length === 9 ? `34${soloDigitos}` : soloDigitos;
  const texto = `Hola ${cita.cliente_nombre}, te escribimos desde Aneca Evo. Lamentamos informarte de que tu cita de *${cita.servicio_nombre}* del ${cita.fecha} a las ${cita.hora_inicio.slice(0, 5)} ha sido cancelada.${cita.motivo_cancelacion ? ` Motivo: ${cita.motivo_cancelacion}` : ''} Escríbenos para reubicarla cuando te venga bien.`;
  return `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(texto)}`;
}

// Genera enlace mailto como alternativa si el cliente no dejó teléfono
function crearEnlaceEmail(cita) {
  const asunto = `Cancelación de cita - Aneca Evo (${cita.fecha})`;
  const cuerpo = `Hola ${cita.cliente_nombre},\n\nLamentamos informarte de que tu cita de ${cita.servicio_nombre} del ${cita.fecha} a las ${cita.hora_inicio.slice(0, 5)} ha sido cancelada.${cita.motivo_cancelacion ? `\n\nMotivo: ${cita.motivo_cancelacion}` : ''}\n\nUn abrazo,\nAneca Evo`;
  return `mailto:${cita.cliente_email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function AgendaAdmin() {
  const [citas, setCitas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Calendario mensual y ventana emergente del día seleccionado o de una cita concreta
  const hoy = new Date();
  const [mesVisible, setMesVisible] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  const [diaModal, setDiaModal] = useState(null); // 'YYYY-MM-DD'
  const [citaDetalleModal, setCitaDetalleModal] = useState(null);

  // Estados para pedir el motivo cuando el admin cancela una cita concreta
  const [citaCancelandoId, setCitaCancelandoId] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  useEffect(() => {
    cargarTodo();
  }, []);

  function cargarTodo() {
    apiFetch('/citas/admin').then((res) => setCitas(res.citas || []));
    apiFetch('/citas/bloqueos').then((res) => setBloqueos(res.bloqueos || []));
  }

  async function cambiarEstado(id, estado, textoMotivo = null) {
    setError('');
    setMensaje('');
    try {
      await apiFetch(`/citas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, motivo_cancelacion: textoMotivo })
      });
      setMensaje(estado === 'cancelada' ? 'Cita cancelada y motivo guardado.' : 'Estado de cita actualizado.');
      setCitaCancelandoId(null);
      setMotivoCancelacion('');
      cargarTodo();
    } catch (err) {
      setError(err.message);
    }
  }

  async function agregarBloqueo(e) {
    e.preventDefault();
    await apiFetch('/citas/bloqueos', {
      method: 'POST',
      body: JSON.stringify({
        fecha_inicio: `${fechaInicio} 00:00:00`,
        fecha_fin: `${fechaFin || fechaInicio} 23:59:59`,
        motivo
      })
    });
    setFechaInicio('');
    setFechaFin('');
    setMotivo('');
    setMensaje('Día/rango bloqueado en la agenda.');
    cargarTodo();
  }

  async function borrarBloqueo(id) {
    await apiFetch(`/citas/bloqueos/${id}`, { method: 'DELETE' });
    cargarTodo();
  }

  // Construcción de la cuadrícula del mes (empezando en Lunes)
  const primerDiaMes = new Date(mesVisible.anio, mesVisible.mes, 1);
  const diasEnMes = new Date(mesVisible.anio, mesVisible.mes + 1, 0).getDate();
  const huecosInicio = (primerDiaMes.getDay() + 6) % 7; // Lunes = 0 ... Domingo = 6

  function cambiarMes(delta) {
    setMesVisible((prev) => {
      const nueva = new Date(prev.anio, prev.mes + delta, 1);
      return { anio: nueva.getFullYear(), mes: nueva.getMonth() };
    });
  }

  function formatoFecha(dia) {
    const m = String(mesVisible.mes + 1).padStart(2, '0');
    const d = String(dia).padStart(2, '0');
    return `${mesVisible.anio}-${m}-${d}`;
  }

  function esDiaBloqueado(fechaStr) {
    return bloqueos.some((b) => fechaStr >= b.fecha_inicio.slice(0, 10) && fechaStr <= b.fecha_fin.slice(0, 10));
  }

  // Renderiza una tarjeta de cita reutilizable (tanto en el modal del día como en el listado)
  function renderTarjetaCita(c) {
    const precioTotal = Number(c.precio || 0);
    const senal = Math.max(15, Number((precioTotal * 0.25).toFixed(2)));
    const pendienteSenal = Math.max(0, precioTotal - senal);

    return (
      <div key={c.id} className="tarjeta" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <strong>{c.fecha} · {c.hora_inicio.slice(0, 5)}</strong>
          <span className="etiqueta">{c.estado}</span>
        </div>
        <p style={{ fontWeight: 600 }}>{c.servicio_nombre}</p>
        <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)' }}>
          Cliente: {c.cliente_nombre} {c.cliente_apellidos} ({c.cliente_telefono || c.cliente_email})
        </p>

        {/* Resumen exacto de pago: distingue Bono, Tarjeta Regalo, Pago completo, Señal o Efectivo */}
        <p style={{ fontSize: '0.84rem', marginTop: '0.35rem', color: c.pago_estado === 'pagado' ? 'var(--exito)' : 'var(--terracota)', fontWeight: 600 }}>
          {c.origen_pago?.startsWith('Tarjeta Regalo:') && `🎁 ${c.origen_pago}`}
          {c.origen_pago?.startsWith('Bono:') && `🎟️ ${c.origen_pago}`}
          {!c.origen_pago?.startsWith('Tarjeta Regalo:') && !c.origen_pago?.startsWith('Bono:') && c.pago_estado === 'pagado' && `✅ Pagado al 100% (${precioTotal.toFixed(2)} €)`}
          {c.pago_estado === 'senal_pagada' && `💳 Señal pagada (${senal.toFixed(2)} €) · Falta por cobrar: ${pendienteSenal.toFixed(2)} €`}
          {c.pago_estado === 'pendiente' && `💵 Efectivo pendiente en sala: ${precioTotal.toFixed(2)} €`}
          {c.pago_estado === 'reembolsado' && '↩️ Reembolsado'}
        </p>

        <button
          type="button"
          className="btn btn-suave"
          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', marginTop: '0.45rem' }}
          onClick={() => setCitaDetalleModal(c)}
        >
          Ver / Gestionar pago y detalle
        </button>

        {c.estado === 'completada' && c.completada_en && (
          <p style={{ fontSize: '0.82rem', color: 'var(--exito)', fontWeight: 600, marginTop: '0.3rem' }}>
            ✅ Marcada como realizada el {c.completada_en.slice(0, 10)} a las {c.completada_en.slice(11, 16)}
          </p>
        )}

        {c.motivo_cancelacion && (
          <p style={{ fontSize: '0.84rem', color: 'var(--error)', marginTop: '0.4rem' }}>
            <strong>Motivo:</strong> {c.motivo_cancelacion}
          </p>
        )}

        {c.estado === 'cancelada' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
            {c.cliente_telefono && (
              <a
                href={crearEnlaceWhatsApp(c)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-salvia"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              >
                <MessageCircle size={14} /> Avisar por WhatsApp ({c.cliente_telefono})
              </a>
            )}
            {c.cliente_email && (
              <a
                href={crearEnlaceEmail(c)}
                className="btn btn-suave"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              >
                <Mail size={14} /> Enviar Email
              </a>
            )}
          </div>
        )}

        {c.estado !== 'cancelada' && c.estado !== 'completada' && (
          <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-salvia"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => cambiarEstado(c.id, 'completada')}
            >
              {c.origen_pago?.startsWith('Bono:') ? 'Sesión de bono hecha' : 'Realizada'}
            </button>
            <button
              type="button"
              className="btn btn-suave"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => cambiarEstado(c.id, 'cancelada', 'Cancelada por el cliente')}
            >
              Cancelada por cliente
            </button>
            <button
              type="button"
              className="btn btn-contorno"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => {
                setCitaCancelandoId(c.id);
                setMotivoCancelacion('');
              }}
            >
              Cancelada por admin
            </button>
          </div>
        )}

        {citaCancelandoId === c.id && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--borde-suave)' }}>
            <div className="campo" style={{ marginBottom: '0.6rem' }}>
              <label>Motivo de la cancelación (visible para el cliente)</label>
              <textarea
                rows={2}
                placeholder="Ej: Por indisposición de la terapeuta, te contactamos para reubicar tu sesión."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primario"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => cambiarEstado(c.id, 'cancelada', motivoCancelacion)}
              >
                Confirmar cancelación
              </button>
              <button
                type="button"
                className="btn btn-suave"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setCitaCancelandoId(null)}
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const citasDelDiaModal = diaModal ? citas.filter((c) => c.fecha === diaModal) : [];

  return (
    <div>
      {error && <div className="alerta-error">{error}</div>}
      {mensaje && <div className="alerta-exito">{mensaje}</div>}

      <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        {/* Columna izquierda: Calendario mensual interactivo + resumen de citas */}
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Calendario de Citas</h2>

          <div className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button type="button" className="icono-btn" onClick={() => cambiarMes(-1)} title="Mes anterior">
                <ChevronLeft size={18} />
              </button>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem' }}>
                {NOMBRES_MESES[mesVisible.mes]} {mesVisible.anio}
              </strong>
              <button type="button" className="icono-btn" onClick={() => cambiarMes(1)} title="Mes siguiente">
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', textAlign: 'center', marginBottom: '0.4rem' }}>
              {DIAS_SEMANA.map((d) => (
                <small key={d} style={{ fontWeight: 700, color: 'var(--texto-suave)' }}>{d}</small>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
              {Array.from({ length: huecosInicio }).map((_, idx) => (
                <div key={`vacio-${idx}`} />
              ))}
              {Array.from({ length: diasEnMes }).map((_, idx) => {
                const dia = idx + 1;
                const fechaStr = formatoFecha(dia);
                const citasDia = citas.filter((c) => c.fecha === fechaStr);
                const bloqueado = esDiaBloqueado(fechaStr);
                return (
                  <button
                    key={fechaStr}
                    type="button"
                    onClick={() => setDiaModal(fechaStr)}
                    style={{
                      padding: '0.55rem 0.25rem',
                      borderRadius: 10,
                      border: '1px solid var(--borde-suave)',
                      background: bloqueado ? 'var(--bg-piedra)' : citasDia.length > 0 ? '#fdf4e7' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dia}</span>
                    {citasDia.length > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--terracota)' }}>
                        {citasDia.length} {citasDia.length === 1 ? 'cita' : 'citas'}
                      </span>
                    )}
                    {bloqueado && citasDia.length === 0 && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--texto-suave)' }}>Cerrado</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Todas las citas ({citas.length})</h3>
          {citas.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)' }}>Todavía no hay citas reservadas.</p>
          ) : (
            citas.map((c) => renderTarjetaCita(c))
          )}
        </div>

        {/* Columna derecha: Bloquear días festivos / vacaciones */}
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Bloquear Festivos / Cierres</h2>
          <form onSubmit={agregarBloqueo} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="campo">
              <label>Fecha inicio</label>
              <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="campo">
              <label>Fecha fin (opcional)</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div className="campo">
              <label>Motivo</label>
              <input type="text" placeholder="Ej: Festivo nacional / Retiro" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primario" style={{ width: '100%' }}>
              Bloquear fechas
            </button>
          </form>

          {bloqueos.map((b) => (
            <div key={b.id} className="tarjeta" style={{ padding: '0.85rem 1rem', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{b.motivo}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
                  {b.fecha_inicio.slice(0, 10)} → {b.fecha_fin.slice(0, 10)}
                </div>
              </div>
              <button type="button" className="btn btn-suave" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => borrarBloqueo(b.id)}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ventana emergente (modal) con las citas del día seleccionado en el calendario */}
      {diaModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 120,
            background: 'rgba(46, 42, 39, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setDiaModal(null)}
        >
          <div
            className="tarjeta"
            style={{ width: 'min(540px, 100%)', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem' }}>Citas del {diaModal}</h3>
              <button type="button" className="icono-btn" onClick={() => setDiaModal(null)}>
                <X size={18} />
              </button>
            </div>

            {citasDelDiaModal.length === 0 ? (
              <p style={{ color: 'var(--texto-suave)' }}>No hay citas programadas para este día.</p>
            ) : (
              citasDelDiaModal.map((c) => renderTarjetaCita(c))
            )}
          </div>
        </div>
      )}

      {/* Ventana emergente de detalle y gestión de una cita concreta */}
      {citaDetalleModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 130,
            background: 'rgba(46, 42, 39, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setCitaDetalleModal(null)}
        >
          <div
            className="tarjeta"
            style={{ width: 'min(480px, 100%)', padding: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.45rem' }}>Detalle de la Cita</h3>
              <button type="button" className="icono-btn" onClick={() => setCitaDetalleModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p><strong>Terapia:</strong> {citaDetalleModal.servicio_nombre}</p>
            <p><strong>Fecha y hora:</strong> {citaDetalleModal.fecha} · {citaDetalleModal.hora_inicio.slice(0, 5)}</p>
            <p><strong>Cliente:</strong> {citaDetalleModal.cliente_nombre} {citaDetalleModal.cliente_apellidos}</p>
            <p><strong>Origen / Pago:</strong> {citaDetalleModal.origen_pago || citaDetalleModal.pago_estado}</p>
            {citaDetalleModal.notas_cliente && <p><strong>Notas del cliente:</strong> {citaDetalleModal.notas_cliente}</p>}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
              {citaDetalleModal.estado === 'cancelada' ? (
                <p style={{ color: 'var(--error)', fontSize: '0.88rem', fontWeight: 600 }}>
                  Esta cita está cancelada y no se puede cobrar ni marcar como realizada.
                </p>
              ) : (
                <>
                  {citaDetalleModal.pago_estado !== 'pagado' && (
                    <button
                      type="button"
                      className="btn btn-primario"
                      onClick={async () => {
                        await apiFetch(`/citas/${citaDetalleModal.id}/estado`, {
                          method: 'PATCH',
                          body: JSON.stringify({ pago_estado: 'pagado' })
                        });
                        setMensaje('Pago marcado como completado.');
                        setCitaDetalleModal(null);
                        cargarTodo();
                      }}
                    >
                      Marcar pagado en sala
                    </button>
                  )}
                  {citaDetalleModal.estado !== 'completada' && (
                    <button
                      type="button"
                      className="btn btn-salvia"
                      onClick={async () => {
                        await cambiarEstado(citaDetalleModal.id, 'completada');
                        setCitaDetalleModal(null);
                      }}
                    >
                      {citaDetalleModal.origen_pago?.startsWith('Bono:')
                        ? 'Esta sesión de bono se ha hecho'
                        : 'Marcar cita realizada'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
