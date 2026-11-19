// ============================================================================
// ADMIN: GESTIÓN DE AGENDA (Ver/Cancelar/Completar citas y Bloquear festivos)
// ============================================================================
import { useEffect, useState } from 'react';
import { MessageCircle, Mail } from 'lucide-react';
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

export default function AgendaAdmin() {
  const [citas, setCitas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div>
      {error && <div className="alerta-error">{error}</div>}
      {mensaje && <div className="alerta-exito">{mensaje}</div>}

      <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        {/* Listado de citas */}
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Citas Programadas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {citas.map((c) => (
              <div key={c.id} className="tarjeta" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong>{c.fecha} · {c.hora_inicio.slice(0, 5)}</strong>
                  <span className="etiqueta">{c.estado}</span>
                </div>
                <p style={{ fontWeight: 600 }}>{c.servicio_nombre}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)' }}>
                  Cliente: {c.cliente_nombre} {c.cliente_apellidos} ({c.cliente_telefono || c.cliente_email})
                </p>

                {/* Mostrar motivo y botón directo de WhatsApp/Email si la cita fue cancelada */}
                {c.motivo_cancelacion && (
                  <p style={{ fontSize: '0.84rem', color: 'var(--error)', marginTop: '0.4rem' }}>
                    <strong>Motivo de cancelación:</strong> {c.motivo_cancelacion}
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
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-salvia" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => cambiarEstado(c.id, 'completada')}>
                      Marcar Completada
                    </button>
                    <button
                      type="button"
                      className="btn btn-suave"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setCitaCancelandoId(c.id);
                        setMotivoCancelacion('');
                      }}
                    >
                      Cancelar Cita
                    </button>
                  </div>
                )}

                {/* Caja desplegable para escribir el motivo al cancelar */}
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
            ))}
          </div>
        </div>

        {/* Bloquear días festivos / vacaciones */}
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
    </div>
  );
}
