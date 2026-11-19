// ============================================================================
// PANEL PRIVADO DE ADMINISTRACIÓN (Solo accesible si usuario.rol === 'admin')
// ============================================================================
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AgendaAdmin from './agenda/AgendaAdmin';
import ClientesAdmin from './clientes/ClientesAdmin';
import InventarioAdmin from './inventario/InventarioAdmin';

export default function AdminPanelPage() {
  const { usuario } = useAuth();
  const [pestana, setPestana] = useState('agenda');

  // Protección de ruta en frontend: si no es admin, redirige a mi-cuenta
  if (!usuario || usuario.rol !== 'admin') {
    return <Navigate to="/mi-cuenta" replace />;
  }

  return (
    <div className="seccion">
      <div className="contenedor">
        <span className="etiqueta" style={{ marginBottom: '0.6rem' }}>Administración Privada</span>
        <h1 style={{ fontSize: '2.6rem', marginBottom: '1.5rem' }}>Panel de Gestión Aneca Evo</h1>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button type="button" className={`btn ${pestana === 'agenda' ? 'btn-primario' : 'btn-suave'}`} onClick={() => setPestana('agenda')}>
            Agenda y Festivos
          </button>
          <button type="button" className={`btn ${pestana === 'clientes' ? 'btn-primario' : 'btn-suave'}`} onClick={() => setPestana('clientes')}>
            Clientes y Fichas Privadas
          </button>
          <button type="button" className={`btn ${pestana === 'inventario' ? 'btn-primario' : 'btn-suave'}`} onClick={() => setPestana('inventario')}>
            Inventario y Servicios
          </button>
        </div>

        {pestana === 'agenda' && <AgendaAdmin />}
        {pestana === 'clientes' && <ClientesAdmin />}
        {pestana === 'inventario' && <InventarioAdmin />}
      </div>
    </div>
  );
}
