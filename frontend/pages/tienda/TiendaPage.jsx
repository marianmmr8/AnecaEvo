// ============================================================================
// PÁGINA DE TIENDA NATURAL (Filtros: Aceites, Cremas, Infusiones, Especias, Libros)
// ============================================================================
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { apiFetch } from '../../services/api';
import TarjetaProducto from '../../components/tienda/TarjetaProducto';

const CATEGORIAS_TIENDA = [
  { id: 'todas', label: '🛍️ Todos' },
  { id: 'aceites', label: '💧 Aceites' },
  { id: 'cremas', label: '🧴 Cremas' },
  { id: 'infusiones', label: '🍵 Infusiones' },
  { id: 'especias', label: '🌿 Especias' },
  { id: 'libros', label: '📚 Libros' }
];

export default function TiendaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaActual = searchParams.get('cat') || 'todas';
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    const params = new URLSearchParams();
    if (categoriaActual !== 'todas') params.set('categoria', categoriaActual);
    if (busqueda.trim()) params.set('q', busqueda.trim());

    apiFetch(`/productos?${params.toString()}`)
      .then((res) => setProductos(res.productos || []))
      .finally(() => setCargando(false));
  }, [categoriaActual, busqueda]);

  return (
    <div className="seccion">
      <div className="contenedor">
        <div style={{ marginBottom: '2rem' }}>
          <span className="etiqueta" style={{ marginBottom: '0.6rem' }}>Botica & Librería</span>
          <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>Tienda Natural Aneca Evo</h1>
          <p style={{ color: 'var(--texto-suave)' }}>
            Aceites esenciales ecológicos, bálsamos artesanales, infusiones, especias ayurvédicas y lecturas para el alma.
          </p>
        </div>

        {/* Barra de filtros y buscador */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {CATEGORIAS_TIENDA.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSearchParams(cat.id === 'todas' ? {} : { cat: cat.id })}
                className={`btn ${categoriaActual === cat.id ? 'btn-primario' : 'btn-suave'}`}
              >
                {cat.label}
              </button>
            ))}
            <Link to="/tarjetas-regalo" className="btn btn-suave">
              🎁 Tarjetas Regalo
            </Link>
            <Link to="/bonos" className="btn btn-suave">
              🎟️ Bonos
            </Link>
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
            <input
              type="text"
              placeholder="Buscar producto o autor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.2rem',
                borderRadius: 999, border: '1px solid var(--borde-suave)', background: '#fff'
              }}
            />
          </div>
        </div>

        {cargando ? (
          <p>Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p style={{ color: 'var(--texto-suave)' }}>No se encontraron productos con ese filtro.</p>
        ) : (
          <div className="grid-3">
            {productos.map((prod) => (
              <TarjetaProducto key={prod.id} producto={prod} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
