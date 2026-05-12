-- Tabla para categorías de ingresos
CREATE TABLE IF NOT EXISTS categorias_ingresos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE categorias_ingresos ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver y editar (autenticados)
CREATE POLICY "Permitir todo a usuarios autenticados" ON categorias_ingresos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Agregar columna categoria_id a la tabla ingresos
ALTER TABLE ingresos 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias_ingresos(id) ON DELETE SET NULL;

-- Insertar categorías por defecto
INSERT INTO categorias_ingresos (nombre, color) VALUES
  ('Hotmart', '#8B5CF6'),
  ('Venta libros MP', '#10B981'),
  ('Venta libros TRANSF', '#3B82F6'),
  ('Venta libros EFECT', '#F59E0B'),
  ('Otros ingresos', '#6B7280')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE categorias_ingresos IS 'Categorías para clasificar ingresos';
