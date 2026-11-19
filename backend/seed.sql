-- ============================================================================
-- DATOS INICIALES (SEED) PARA: aneca evo
-- Ejecutar después de datos/aneca_evo.sql para poblar servicios, horarios y productos
-- ============================================================================

USE `aneca evo`;

-- Horarios de apertura: Lunes (1) a Viernes (5) de 09:30 a 14:00 y de 16:00 a 20:00, Sábados (6) de 10:00 a 14:00
INSERT INTO horarios_disponibles (dia_semana, hora_inicio, hora_fin, activo) VALUES
(1, '09:30:00', '14:00:00', TRUE),
(1, '16:00:00', '20:00:00', TRUE),
(2, '09:30:00', '14:00:00', TRUE),
(2, '16:00:00', '20:00:00', TRUE),
(3, '09:30:00', '14:00:00', TRUE),
(3, '16:00:00', '20:00:00', TRUE),
(4, '09:30:00', '14:00:00', TRUE),
(4, '16:00:00', '20:00:00', TRUE),
(5, '09:30:00', '14:00:00', TRUE),
(5, '16:00:00', '20:00:00', TRUE),
(6, '10:00:00', '14:00:00', TRUE);

-- Servicios iniciales por categoría (con margen de descanso / buffer de 15-30 min)
INSERT INTO servicios (nombre, slug, categoria, descripcion, duracion_minutos, margen_descanso_minutos, precio, modalidad, imagen_url, activo) VALUES
('Masaje Relajante con Aromaterapia', 'masaje-relajante-aromaterapia', 'masajes', 'Masaje corporal lento y envolvente con aceites esenciales puros de lavanda y sándalo para liberar tensiones profundas y calmar el sistema nervioso.', 60, 20, 55.00, 'presencial', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80', TRUE),
('Masaje Descontracturante Profundo', 'masaje-descontracturante-profundo', 'masajes', 'Trabajo focalizado en espalda, cervicales y musculatura cargada mediante presión consciente y bálsamo de árnica caliente.', 60, 20, 60.00, 'presencial', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80', TRUE),
('Sesión de Reiki Usui Tradicional', 'reiki-usui-tradicional', 'terapias_energeticas', 'Canalización de energía vital universal para armonizar chakras, reducir el estrés emocional y recuperar el equilibrio interior.', 60, 15, 48.00, 'ambas', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80', TRUE),
('Limpieza Energética y Cuencos Tibetanos', 'limpieza-energetica-cuencos', 'terapias_energeticas', 'Baño de sonido vibracional con cuencos tibetanos y sahumerio de salvia blanca para despejar bloqueos energéticos.', 50, 20, 52.00, 'presencial', 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=900&q=80', TRUE),
('Lectura de Registros Akáshicos', 'lectura-registros-akashicos', 'crecimiento_alma', 'Apertura amorosa de tu archivo álmico para recibir claridad sobre tu propósito, relaciones y bloqueos actuales.', 75, 30, 75.00, 'ambas', 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=900&q=80', TRUE),
('Terapia de Regresión Consciente', 'terapia-regresion-consciente', 'crecimiento_alma', 'Acompañamiento terapéutico profundo en estado de relajación guiada para sanar memorias emocionales y patrones repetitivos.', 90, 30, 90.00, 'presencial', 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=900&q=80', TRUE);

-- Productos iniciales de la tienda (Aceites, Cremas, Infusiones, Especias, Libros)
INSERT INTO productos (nombre, slug, categoria, descripcion, ingredientes_o_autor, precio, stock, imagen_url, activo) VALUES
('Aceite Esencial de Lavanda Bio 15ml', 'aceite-esencial-lavanda-bio', 'aceites', 'Aceite esencial 100% puro y ecológico destilado al vapor. Ideal para difusor nocturno o diluido en masajes calmantes.', 'Lavandula angustifolia 100% ecológica', 14.50, 25, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80', TRUE),
('Aceite Corporal Sándalo y Jojoba 100ml', 'aceite-corporal-sandalo-jojoba', 'aceites', 'Mezcla nutritiva de primera presión en frío para hidratar la piel tras la ducha y enraizar la mente.', 'Aceite de Jojoba, Sándalo, Vitamina E', 24.00, 14, 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80', TRUE),
('Crema Bálsamo de Caléndula y Árnica', 'crema-calendula-arnica', 'cremas', 'Crema artesanal regeneradora para aliviar tensiones musculares y nutrir pieles sensibles.', 'Extracto de Árnica, Caléndula, Manteca de Karité', 19.90, 18, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', TRUE),
('Infusión Dulces Sueños (Tila y Melisa)', 'infusion-dulces-suenos', 'infusiones', 'Tisana nocturna sin teína formulada para inducir un descanso profundo y sereno.', 'Melisa, Tila, Pasiflora, Pétalos de Rosa', 9.50, 40, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80', TRUE),
('Infusión Chai Equilibrio Interior', 'infusion-chai-equilibrio', 'infusiones', 'Té negro Assam con especias ayurvédicas recién molidas para despertar la vitalidad.', 'Té Assam, Cardamomo, Canela Ceilán, Jengibre', 11.00, 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80', TRUE),
('Cúrcuma Dorada con Pimienta Negra 150g', 'curcuma-dorada-pimienta', 'especias', 'Especia ecológica de alta curcumina ideal para preparar Golden Milk antiinflamatoria.', 'Cúrcuma molida ecológica, Pimienta negra', 8.90, 35, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80', TRUE),
('El Poder del Ahora (Edición Especial)', 'libro-el-poder-del-ahora', 'libros', 'Guía imprescindible de iluminación espiritual para vivir plenamente en el momento presente.', 'Eckhart Tolle', 18.50, 12, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80', TRUE),
('Muchas Vidas, Muchos Maestros', 'libro-muchas-vidas-muchos-maestros', 'libros', 'Relato real sobre terapia regresiva, sanación emocional y comprensión del alma.', 'Brian Weiss', 16.00, 10, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', TRUE);
