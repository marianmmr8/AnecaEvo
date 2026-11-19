// ============================================================================
// CALENDARIO DE CITAS (Selector de fecha y horas libres calculadas con buffer)
// ============================================================================
import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { apiFetch } from '../../services/api';

export default function CalendarioCitas({ servicio, fecha, setFecha, horaSeleccionada, setHoraSeleccionada }) {
  const [horasLibres, setHorasLibres] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Fecha mínima hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split('T')[0];

  // Cada vez que cambia la fecha o el servicio, consultamos al backend las horas libres
  useEffect(() => {
    if (!servicio || !fecha) return;
    setCargando(true);
    setError('');
    setHoraSeleccionada('');

    apiFetch(`/citas/disponibilidad?fecha=${fecha}&servicioId=${servicio.id}`)
      .then((res) => setHorasLibres(res.horasLibres || []))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [servicio, fecha, setHoraSeleccionada]);

  return (
    <div className="tarjeta" style={{ padding: '1.5rem' }}>
      <div className="campo">
        <label htmlFor="fecha-cita" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={16} /> Selecciona el día de tu sesión
        </label>
        <input
          id="fecha-cita"
          type="date"
          min={hoy}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', marginBottom: '1rem' }}>
        Los horarios mostrados ya incluyen nuestro margen de descanso ({servicio.margen_descanso_minutos} min) entre sesiones para preparar y armonizar la sala.
      </p>

      {error && <div className="alerta-error">{error}</div>}

      {cargando ? (
        <p style={{ color: 'var(--texto-suave)' }}>Consultando disponibilidad en agenda...</p>
      ) : horasLibres.length === 0 ? (
        <p style={{ color: 'var(--terracota)', fontWeight: 500 }}>
          No hay huecos disponibles para este día (domingo o agenda completa/bloqueada). Prueba otra fecha.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {horasLibres.map((slot) => {
            const seleccionada = horaSeleccionada === slot.hora_inicio;
            return (
              <button
                key={slot.hora_inicio}
                type="button"
                onClick={() => setHoraSeleccionada(slot.hora_inicio)}
                className={`btn ${seleccionada ? 'btn-primario' : 'btn-suave'}`}
                style={{ padding: '0.55rem 1rem', fontSize: '0.9rem' }}
              >
                <Clock size={14} /> {slot.hora_inicio}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
