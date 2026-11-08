-- KonectAll · datos de demostración para Arequipa
-- Ejecutar después de schema.sql. Es idempotente.

insert into public.perfiles (id, nombre, telefono, barrio) values
  ('11111111-1111-4111-8111-111111111111', 'Rosa Quispe', '51958123456', 'Yanahuara'),
  ('22222222-2222-4222-8222-222222222222', 'Luis Mamani', '51976456789', 'Cercado'),
  ('33333333-3333-4333-8333-333333333333', 'Ana Torres', '51955678901', 'Cayma'),
  ('44444444-4444-4444-8444-444444444444', 'Carlos Apaza', '51966778899', 'José Luis Bustamante y Rivero')
on conflict (id) do update set
  nombre = excluded.nombre,
  telefono = excluded.telefono,
  barrio = excluded.barrio;

insert into public.publicaciones
  (id, autor_id, tipo, modo, categoria, titulo, descripcion, precio, urgente, lat, lng, estado, creado_en)
values
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'ofrezco', 'normal', 'servicio', 'Reparación de gasfitería',
   'Cambio de tuberías, fugas e instalación de lavaderos. Visita y cotización sin costo.',
   25.00, false, -16.3975, -71.5372, 'disponible', now() - interval '2 hours'),

  ('a0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'ofrezco', 'normal', 'producto', 'Verduras frescas del mercado',
   'Tomate, cebolla y zanahoria del día. Entrega en el barrio.',
   3.50, false, -16.3998, -71.5335, 'disponible', now() - interval '4 hours'),

  ('a0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333',
   'necesito', 'normal', 'producto', 'Necesito pañales talla M',
   'Para mi bebé. Pago al contado o coordino entrega.',
   null, true, -16.4012, -71.5311, 'disponible', now() - interval '6 hours'),

  ('a0000000-0000-4000-8000-000000000004', '44444444-4444-4444-8444-444444444444',
   'intercambio', 'normal', 'otros', 'Cambio clases de guitarra por clases de inglés',
   'Toco guitarra hace 10 años. Busco practicar inglés conversacional.',
   null, false, -16.3985, -71.5362, 'disponible', now() - interval '8 hours'),

  ('a0000000-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333',
   'ofrezco', 'normal', 'servicio', 'Corte de cabello a domicilio',
   'Cortes para niños y adultos en la comodidad de tu casa.',
   15.00, false, -16.4021, -71.5341, 'disponible', now() - interval '10 hours'),

  ('a0000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
   'ofrezco', 'normal', 'producto', 'Pan casero',
   'Pan integral y de molde recién horneado. Pedidos por la mañana.',
   5.00, false, -16.3959, -71.5399, 'disponible', now() - interval '12 hours'),

  ('a0000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222',
   'necesito', 'emergencia', 'otros', 'Ayuda para adulto mayor tras caída',
   'Mi abuelo se cayó y necesito apoyo para movilizarlo. Estamos en Cercado.',
   null, true, -16.3980, -71.5340, 'disponible', now() - interval '15 minutes'),

  ('a0000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
   'ofrezco', 'emergencia', 'otros', 'Ofrezco agua y frazadas',
   'Tengo agua potable y frazadas para quien lo necesite en el barrio.',
   null, true, -16.3972, -71.5381, 'disponible', now() - interval '30 minutes'),

  ('a0000000-0000-4000-8000-000000000009', '44444444-4444-4444-8444-444444444444',
   'necesito', 'emergencia', 'servicio', 'Se necesita transporte a clínica',
   'Requiero movilidad para trasladar a una vecina a la clínica San Pablo.',
   null, true, -16.4030, -71.5360, 'disponible', now() - interval '1 hour'),

  ('a0000000-0000-4000-8000-000000000010', '33333333-3333-4333-8333-333333333333',
   'ofrezco', 'normal', 'servicio', 'Refuerzo escolar',
   'Clases de matemática y comunicación para primaria.',
   10.00, false, -16.4002, -71.5302, 'disponible', now() - interval '20 hours'),

  ('a0000000-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111',
   'necesito', 'normal', 'servicio', 'Necesito cerrajero urgente',
   'Se me quedó la llave dentro de casa. Busco cerrajero cerca de Yanahuara.',
   null, true, -16.3966, -71.5368, 'disponible', now() - interval '3 hours'),

  ('a0000000-0000-4000-8000-000000000012', '22222222-2222-4222-8222-222222222222',
   'intercambio', 'normal', 'otros', 'Intercambio libros por juguetes',
   'Novelas y libros escolares por juguetes en buen estado.',
   null, false, -16.3990, -71.5328, 'disponible', now() - interval '26 hours'),

  ('a0000000-0000-4000-8000-000000000013', '33333333-3333-4333-8333-333333333333',
   'ofrezco', 'normal', 'producto', 'Ropa de bebé',
   'Donación: ropa talla 0-6 meses en buen estado.',
   null, false, -16.4018, -71.5325, 'disponible', now() - interval '30 hours'),

  ('a0000000-0000-4000-8000-000000000014', '44444444-4444-4444-8444-444444444444',
   'ofrezco', 'normal', 'servicio', 'Paseo de mascotas',
   'Paseo perros por el parque cerca de casa. Cupos por la tarde.',
   8.00, false, -16.4045, -71.5370, 'disponible', now() - interval '32 hours'),

  ('a0000000-0000-4000-8000-000000000015', '22222222-2222-4222-8222-222222222222',
   'ofrezco', 'normal', 'servicio', 'Clases de quechua',
   'Enseño quechua básico a niños y adultos.',
   12.00, false, -16.3985, -71.5355, 'disponible', now() - interval '36 hours'),

  ('a0000000-0000-4000-8000-000000000016', '33333333-3333-4333-8333-333333333333',
   'necesito', 'normal', 'producto', 'Busco cuna para bebé',
   'Prestada o a bajo costo, gracias.',
   null, false, -16.4008, -71.5308, 'disponible', now() - interval '40 hours')
on conflict (id) do nothing;

insert into public.recomendaciones (id, publicacion_id, vecino_id) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000008', '44444444-4444-4444-8444-444444444444'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000010', '44444444-4444-4444-8444-444444444444'),
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000014', '11111111-1111-4111-8111-111111111111')
on conflict (publicacion_id, vecino_id) do nothing;
