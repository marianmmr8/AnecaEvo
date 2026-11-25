// ============================================================================
// COMPONENTE PRINCIPAL DE RUTAS Y LAYOUT - ANECA EVO
// ============================================================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CarritoLateral from './components/tienda/CarritoLateral';
import AsistenteHolistico from './components/asistente/AsistenteHolistico';

import InicioPage from './pages/inicio/InicioPage';
import SobreMiPage from './pages/sobre-mi/SobreMiPage';
import ServiciosPage from './pages/servicios/ServiciosPage';
import ReservarPage from './pages/reservar/ReservarPage';
import TiendaPage from './pages/tienda/TiendaPage';
import TarjetasRegaloPage from './pages/tienda/TarjetasRegaloPage';
import BonosPage from './pages/tienda/BonosPage';
import MiCuentaPage from './pages/mi-cuenta/MiCuentaPage';
import AdminPanelPage from './pages/admin/AdminPanelPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<InicioPage />} />
                <Route path="/sobre-mi" element={<SobreMiPage />} />
                <Route path="/servicios" element={<ServiciosPage />} />
                <Route path="/reservar" element={<ReservarPage />} />
                <Route path="/tienda" element={<TiendaPage />} />
                <Route path="/tarjetas-regalo" element={<TarjetasRegaloPage />} />
                <Route path="/bonos" element={<BonosPage />} />
                <Route path="/mi-cuenta" element={<MiCuentaPage />} />
                <Route path="/admin" element={<AdminPanelPage />} />
              </Routes>
            </main>
            <Footer />
            <CarritoLateral />
            <AsistenteHolistico />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
