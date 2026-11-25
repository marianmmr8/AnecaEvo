-- ============================================================================
-- BASE DE DATOS: aneca evo (Versión PostgreSQL / Supabase)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    telefono VARCHAR(25) NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. SERVICIOS
CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    categoria VARCHAR(40) NOT NULL CHECK (categoria IN ('masajes', 'terapias_energeticas', 'crecimiento_alma', 'otros')),
    descripcion TEXT NULL,
    duracion_minutos INT NOT NULL CHECK (duracion_minutos > 0),
    margen_descanso_minutos INT NOT NULL DEFAULT 15 CHECK (margen_descanso_minutos >= 0),
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    modalidad VARCHAR(20) NOT NULL DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'online', 'ambas')),
    imagen_url TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. HORARIOS DISPONIBLES Y BLOQUEOS DE AGENDA
CREATE TABLE IF NOT EXISTS horarios_disponibles (
    id SERIAL PRIMARY KEY,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (hora_fin > hora_inicio)
);

CREATE TABLE IF NOT EXISTS bloqueos_agenda (
    id SERIAL PRIMARY KEY,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    motivo VARCHAR(255) NULL,
    CHECK (fecha_fin > fecha_inicio)
);

-- 4. CITAS
CREATE TABLE IF NOT EXISTS citas (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    servicio_id INT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('presencial', 'online')),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio')),
    pago_estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (pago_estado IN ('pendiente', 'senal_pagada', 'pagado', 'reembolsado')),
    origen_pago VARCHAR(150) NULL,
    completada_en TIMESTAMP NULL,
    notas_cliente TEXT NULL,
    motivo_cancelacion TEXT NULL,
    recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (hora_fin > hora_inicio)
);

-- 5. FICHAS PRIVADAS DE CLIENTES
CREATE TABLE IF NOT EXISTS fichas_clientes (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    cita_id VARCHAR(36) NULL REFERENCES citas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    motivo_consulta TEXT NULL,
    contraindicaciones TEXT NULL,
    notas_privadas_terapeuta TEXT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. BONOS Y TARJETAS REGALO
CREATE TABLE IF NOT EXISTS bonos_clientes (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    servicio_id INT NULL REFERENCES servicios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    nombre_bono VARCHAR(150) NOT NULL,
    sesiones_totales INT NOT NULL CHECK (sesiones_totales > 0),
    sesiones_restantes INT NOT NULL CHECK (sesiones_restantes >= 0),
    fecha_caducidad DATE NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tarjetas_regalo (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    comprador_usuario_id VARCHAR(36) NULL,
    canjeada_por_usuario_id VARCHAR(36) NULL,
    servicio_id INT NULL,
    precio_maximo NUMERIC(10, 2) NOT NULL,
    nombre_destinatario VARCHAR(150) NULL,
    dedicatoria TEXT NULL,
    descripcion_admin TEXT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'canjeada', 'cancelada')),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. TIENDA: PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('aceites', 'cremas', 'infusiones', 'especias', 'libros', 'otros')),
    descripcion TEXT NULL,
    ingredientes_o_autor TEXT NULL,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. TIENDA: PEDIDOS Y DETALLE DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado')),
    direccion_envio TEXT NOT NULL,
    nota_cliente_cambio TEXT NULL,
    metodo_pago VARCHAR(50) NULL,
    referencia_pago VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(36) NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0)
);
