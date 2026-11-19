-- ============================================================================
-- BASE DE DATOS: aneca evo
-- MOTOR: MySQL 8.0+ / MariaDB 10.2+ (UTF8MB4 / InnoDB)
-- DESCRIPCIÓN: Gestión de terapias holísticas, masajes, citas, clientes y tienda
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `aneca evo`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `aneca evo`;

-- ============================================================================
-- 1. USUARIOS (Clientes y Administradora)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    telefono VARCHAR(25) NULL,
    rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SERVICIOS (Masajes, Reiki, Registros Akáshicos, Regresiones...)
-- ============================================================================
CREATE TABLE IF NOT EXISTS servicios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    categoria ENUM('masajes', 'terapias_energeticas', 'crecimiento_alma', 'otros') NOT NULL,
    descripcion TEXT NULL,
    duracion_minutos INT NOT NULL CHECK (duracion_minutos > 0),
    margen_descanso_minutos INT NOT NULL DEFAULT 15 CHECK (margen_descanso_minutos >= 0),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    modalidad ENUM('presencial', 'online', 'ambas') NOT NULL DEFAULT 'presencial',
    imagen_url TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_servicios_slug (slug),
    INDEX idx_servicios_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. HORARIOS DISPONIBLES Y BLOQUEOS DE AGENDA
-- ============================================================================
CREATE TABLE IF NOT EXISTS horarios_disponibles (
    id INT NOT NULL AUTO_INCREMENT,
    dia_semana TINYINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes ... 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bloqueos_agenda (
    id INT NOT NULL AUTO_INCREMENT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    motivo VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CITAS (Reservas de clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS citas (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    servicio_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    modalidad ENUM('presencial', 'online') NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio') NOT NULL DEFAULT 'pendiente',
    pago_estado ENUM('pendiente', 'senal_pagada', 'pagado', 'reembolsado') NOT NULL DEFAULT 'pendiente',
    notas_cliente TEXT NULL,
    recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CHECK (hora_fin > hora_inicio),
    INDEX idx_citas_fecha (fecha),
    INDEX idx_citas_usuario (usuario_id),
    INDEX idx_citas_servicio (servicio_id),
    CONSTRAINT fk_citas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_citas_servicio
        FOREIGN KEY (servicio_id) REFERENCES servicios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. FICHAS PRIVADAS DE CLIENTES (Solo visible para la terapeuta/admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fichas_clientes (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    cita_id CHAR(36) NULL,
    motivo_consulta TEXT NULL,
    contraindicaciones TEXT NULL, -- Alergias a aceites, lesiones, embarazo, etc.
    notas_privadas_terapeuta TEXT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fichas_usuario (usuario_id),
    INDEX idx_fichas_cita (cita_id),
    CONSTRAINT fk_fichas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fichas_cita
        FOREIGN KEY (cita_id) REFERENCES citas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. BONOS Y TARJETAS REGALO
-- ============================================================================
CREATE TABLE IF NOT EXISTS bonos_clientes (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    servicio_id INT NULL,
    nombre_bono VARCHAR(150) NOT NULL,
    sesiones_totales INT NOT NULL CHECK (sesiones_totales > 0),
    sesiones_restantes INT NOT NULL CHECK (sesiones_restantes >= 0),
    fecha_caducidad DATE NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bonos_usuario (usuario_id),
    CONSTRAINT fk_bonos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bonos_servicio
        FOREIGN KEY (servicio_id) REFERENCES servicios(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. TIENDA: PRODUCTOS (Aceites, Cremas, Infusiones, Especias, Libros)
-- ============================================================================
CREATE TABLE IF NOT EXISTS productos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    categoria ENUM('aceites', 'cremas', 'infusiones', 'especias', 'libros', 'otros') NOT NULL,
    descripcion TEXT NULL,
    ingredientes_o_autor TEXT NULL,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_productos_slug (slug),
    INDEX idx_productos_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. TIENDA: PEDIDOS Y DETALLE DE PEDIDOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    estado ENUM('pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    direccion_envio TEXT NOT NULL,
    metodo_pago VARCHAR(50) NULL,
    referencia_pago VARCHAR(255) NULL,
    PRIMARY KEY (id),
    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_fecha (fecha_pedido),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id INT NOT NULL AUTO_INCREMENT,
    pedido_id CHAR(36) NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (id),
    INDEX idx_detalle_pedido (pedido_id),
    INDEX idx_detalle_producto (producto_id),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
