// ============================================================================
// SELECTOR DE SERVICIO PARA EL FLUJO DE RESERVA
// ============================================================================
import { Clock, Sparkles } from 'lucide-react';

const ETIQUETAS_CATEGORIA = {
  masajes: 'Terapia Corporal',
  terapias_energeticas: 'Terapia Energética',
  crecimiento_alma: 'Crecimiento y Alma',
  otros: 'Bienestar'
};

export default function SelectorServicio({ servicios, servicioSeleccionado, onSeleccionar, ocultarPrecio = false }) {
  return (
    <div className="grid-2">
      {servicios.map((servicio) => {
        const activo = servicioSeleccionado?.id === servicio.id;
        return (
          <div
            key={servicio.id}
            onClick={() => onSeleccionar(servicio)}
            className="tarjeta"
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              borderColor: activo ? 'var(--terracota)' : 'var(--borde-suave)',
              boxShadow: activo ? '0 0 0 2px rgba(164, 93, 67, 0.25)' : undefined
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="etiqueta">{ETIQUETAS_CATEGORIA[servicio.categoria] || servicio.categoria}</span>
              {!ocultarPrecio && (
                <strong style={{ fontSize: '1.15rem', color: 'var(--terracota)' }}>{Number(servicio.precio).toFixed(2)} €</strong>
              )}
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>{servicio.nombre}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--texto-suave)', marginBottom: '0.8rem' }}>
              {servicio.descripcion}
            </p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.84rem', color: 'var(--texto-suave)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={14} /> {servicio.duracion_minutos} min
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={14} /> Modalidad: {servicio.modalidad}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
