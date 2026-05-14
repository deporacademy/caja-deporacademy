# Sistema Multimoneda - Instrucciones de Implementación

## 📋 Resumen
Se ha implementado un sistema completo para manejar transacciones en USD y UYU con soporte para conversiones entre monedas.

## 🔧 Pasos para Implementar

### 1. Ejecutar el Script SQL
1. Ve a tu proyecto en **Supabase**
2. Abre el **SQL Editor**
3. Copia todo el contenido del archivo `supabase-multimoneda.sql`
4. Ejecútalo

Esto creará:
- Campo `moneda` en tabla `gastos`
- Campo `moneda` en tabla `ingresos`
- Nueva tabla `conversiones` para registrar cambios de moneda

### 2. Desplegar los cambios
Los cambios en el código ya están listos. Solo necesitas hacer push a tu repositorio:

```bash
git push origin main
```

Vercel desplegará automáticamente todos los cambios.

## ✨ Características Implementadas

### 1. **Selector de Moneda en Gastos e Ingresos**
- Cuando agregas un gasto o ingreso, puedes elegir entre USD o UYU
- Radio buttons simples: 🪙 Pesos (UYU) o 💵 Dólares (USD)
- Por defecto: UYU (pesos)

### 2. **Dashboard con Cajas Separadas**
El dashboard ahora muestra 3 tarjetas principales:
- **💵 Caja Dólares (USD)**: Total ingresos USD - Total gastos USD
- **🪙 Caja Pesos (UYU)**: Total ingresos UYU - Total gastos UYU
- **Balance del Mes**: Total general (suma de ambas monedas)

Cada caja muestra:
- Balance actual
- Ingresos y gastos del mes

### 3. **Nueva Página: Conversiones**
Ubicación: Dashboard → Conversiones

Permite registrar cuando cambias dinero:
- **De UYU a USD**: Ej. cambias $50,000 pesos → recibes $1,200 dólares
- **De USD a UYU**: Ej. cambias $500 dólares → recibes $21,000 pesos

Funcionalidades:
- Registro de monto origen y destino
- Cálculo automático del tipo de cambio
- Campo de notas (opcional): para anotar casa de cambio, etc.
- Historial de todas las conversiones
- Botón para intercambiar monedas rápidamente

### 4. **Visualización de Moneda**
En todas las listas:
- Los montos ahora muestran la moneda: `$1,000 USD` o `$50,000 UYU`
- Fácil identificación visual

## 📊 Cómo Funciona Contablemente

### Caso 1: Gasto/Ingreso Simple
**Compras libros en USD:**
- Tipo: Gasto
- Monto: $350
- Moneda: USD
- ✅ Sale de Caja USD

**Venta local en pesos:**
- Tipo: Ingreso
- Monto: $80,000
- Moneda: UYU
- ✅ Entra a Caja UYU

### Caso 2: Conversión de Moneda
**Necesitas USD para comprar libros:**
1. Ve a **Conversiones** → Nueva Conversión
2. Monto origen: $50,000 UYU
3. Monto destino: $1,200 USD
4. Tipo de cambio: Se calcula automático (41.67)
5. Guardar

**Efecto en las cajas:**
- Caja UYU: -$50,000
- Caja USD: +$1,200

### Caso 3: Workflow Completo
Ejemplo real: "Necesito comprar libros de $500 USD pero solo tengo pesos"

**Paso 1 - Conversión:**
- Ve a Conversiones
- Cambias $21,000 UYU → $500 USD (TC: 42)
- Caja UYU: -$21,000
- Caja USD: +$500

**Paso 2 - Gasto:**
- Ve a Gastos → Nuevo Gasto
- Monto: $500
- Moneda: USD
- Descripción: "Compra libros importados"
- Caja USD: -$500

**Resultado Final:**
- Caja UYU: -$21,000
- Caja USD: $0
- Historial claro de todo el flujo

## 🎯 Ventajas del Sistema

1. **Claridad Total**: Siempre sabes cuánto tienes en cada moneda
2. **Auditoría Completa**: Histórico de conversiones con tipos de cambio
3. **Sin Mezclas**: USD y UYU nunca se confunden
4. **Fácil de Usar**: 95% del tiempo solo seleccionas USD o UYU
5. **Reportes Limpios**: Puedes ver cuánto gastaste/ganaste en cada moneda

## 🔍 Ejemplo de Uso Diario

### Operaciones Normales (90% del tiempo)
**Agregar Gasto:**
1. Click en "Nuevo Gasto"
2. Monto: 350
3. Seleccionar: 💵 Dólares (USD)
4. Descripción: "Suscripción Canva"
5. Guardar → Listo ✅

**Agregar Ingreso:**
1. Click en "Nuevo Ingreso"
2. Monto: 80000
3. Seleccionar: 🪙 Pesos (UYU)
4. Descripción: "Venta libros local"
5. Guardar → Listo ✅

### Conversiones (cuando necesites cambiar plata)
1. Ve a **Conversiones**
2. Click "Nueva Conversión"
3. Llena los montos de origen y destino
4. Agregar nota (opcional)
5. Guardar → Se actualiza todo automáticamente ✅

## 📝 Notas Importantes

1. **Datos Existentes**: Los registros anteriores tendrán por defecto UYU
2. **MercadoPago**: Los ingresos automáticos vendrán en UYU por defecto
3. **Tipo de Cambio**: El sistema NO busca cotización online, debes ingresar los montos reales del cambio
4. **Balance General**: En el dashboard, el "Balance del Mes" suma todo, pero las cajas están separadas

## 🚀 Próximos Pasos Opcionales

Si en el futuro necesitas:
- **Cotización automática**: Se puede integrar API de tipos de cambio
- **Equivalencias**: Mostrar "Caja USD = X en pesos" en tiempo real
- **Reportes avanzados**: Ganancias/pérdidas por diferencia cambiaria
- **Alertas**: Notificar cuando caja USD baje de cierto monto

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si me equivoco en la moneda?**
R: Puedes editar el gasto/ingreso y cambiar la moneda.

**P: ¿Puedo ver cuánto gasté solo en USD este mes?**
R: Sí, en el dashboard las cajas están separadas por moneda.

**P: ¿El sistema convierte automáticamente?**
R: No. Las conversiones son explícitas - tú registras cuando cambias plata.

**P: ¿Puedo eliminar una conversión?**
R: Sí, desde la página de Conversiones puedes eliminarlas.

**P: ¿Cómo sé el tipo de cambio actual?**
R: El sistema no lo busca. Cuando hagas el cambio real, anota los montos exactos que diste/recibiste.

## ✅ Checklist de Implementación

- [ ] Ejecutar script SQL en Supabase
- [ ] Hacer push al repositorio
- [ ] Esperar despliegue de Vercel
- [ ] Probar crear un gasto en USD
- [ ] Probar crear un ingreso en UYU
- [ ] Probar hacer una conversión
- [ ] Verificar que el dashboard muestre las 2 cajas

---

**Sistema implementado por:** Claude
**Fecha:** Mayo 2026
**Versión:** 1.0
