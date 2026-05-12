-- DATOS DE EJEMPLO (OPCIONAL)
-- Ejecuta este script solo si quieres tener datos de prueba en tu sistema

-- Nota: Este script es OPCIONAL y solo para testing
-- NO lo ejecutes en producción si ya tienes datos reales

-- Insertar algunos gastos de ejemplo
INSERT INTO gastos (monto, descripcion, fecha, categoria_id, notas) VALUES
  (15000, 'Compra de libros educativos', '2024-05-01', 
   (SELECT id FROM categorias WHERE nombre = 'Operativos'), 
   'Stock para el mes de mayo'),
  (8500, 'Publicidad en redes sociales', '2024-05-05', 
   (SELECT id FROM categorias WHERE nombre = 'Marketing'), 
   'Campaña de Instagram y Facebook'),
  (12000, 'Material de oficina', '2024-05-07', 
   (SELECT id FROM categorias WHERE nombre = 'Administrativos'), 
   'Papel, lapiceras, carpetas'),
  (25000, 'Licencias de software', '2024-05-10', 
   (SELECT id FROM categorias WHERE nombre = 'Tecnología'), 
   'Renovación anual de licencias'),
  (5000, 'Café y refrigerios', '2024-05-12', 
   (SELECT id FROM categorias WHERE nombre = 'Otros'), 
   'Para reuniones con clientes');

-- Nota: Los ingresos se sincronizan automáticamente desde MercadoPago
-- No necesitas insertar ingresos manualmente

-- Verificar que los datos se insertaron correctamente
SELECT COUNT(*) as total_gastos FROM gastos;
SELECT COUNT(*) as total_categorias FROM categorias;

-- Ver resumen
SELECT 
  c.nombre as categoria,
  COUNT(g.id) as cantidad_gastos,
  SUM(g.monto) as total_gastos
FROM categorias c
LEFT JOIN gastos g ON g.categoria_id = c.id
GROUP BY c.id, c.nombre
ORDER BY total_gastos DESC;
