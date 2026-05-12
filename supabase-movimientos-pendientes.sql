-- Tabla para movimientos de MercadoPago sin clasificar
CREATE TABLE IF NOT EXISTS movimientos_pendientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mercadopago_id TEXT UNIQUE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  estado TEXT NOT NULL,
  comprador_email TEXT,
  metadata JSONB,
  clasificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE movimientos_pendientes ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver y editar (autenticados)
CREATE POLICY "Permitir todo a usuarios autenticados" ON movimientos_pendientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para mejorar rendimiento
CREATE INDEX idx_movimientos_pendientes_mercadopago_id ON movimientos_pendientes(mercadopago_id);
CREATE INDEX idx_movimientos_pendientes_fecha ON movimientos_pendientes(fecha);
CREATE INDEX idx_movimientos_pendientes_clasificado ON movimientos_pendientes(clasificado);

-- Limpiar tabla de ingresos (solo los incorrectos - los que son compras)
-- Por seguridad, mejor hacerlo manualmente desde Supabase
-- DELETE FROM ingresos WHERE descripcion ILIKE '%MERCADOLIBRE%' OR descripcion ILIKE '%MERPAGO+%';

COMMENT ON TABLE movimientos_pendientes IS 'Movimientos de MercadoPago pendientes de clasificación como ingreso o gasto';
