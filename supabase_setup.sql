-- ============================================================
--  DOLCHISSIMO — Sistema de Pedidos
--  Supabase Setup — Tablas del sistema (igual que Fast Food 58)
--  Ejecutar en: SQL Editor de tu proyecto Dolchissimo en Supabase
-- ============================================================

-- 1. USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  nombre     TEXT NOT NULL,
  rol        TEXT NOT NULL CHECK (rol IN ('admin', 'mozo', 'cocina')),
  activo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CARTA / MENÚ
CREATE TABLE IF NOT EXISTS menu_items (
  id          SERIAL PRIMARY KEY,
  categoria   TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(6,2) NOT NULL,
  disponible  BOOLEAN DEFAULT TRUE,
  es_nuevo    BOOLEAN DEFAULT FALSE,
  emoji       TEXT DEFAULT '☕',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id              SERIAL PRIMARY KEY,
  cliente_nombre  TEXT,
  mesa            TEXT,
  estado          TEXT NOT NULL DEFAULT 'espera'
                  CHECK (estado IN ('espera','cocina','listo','entregado','cancelado')),
  total           NUMERIC(8,2) NOT NULL DEFAULT 0,
  nota            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ITEMS DE CADA PEDIDO
CREATE TABLE IF NOT EXISTS pedido_items (
  id            SERIAL PRIMARY KEY,
  pedido_id     INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  menu_item_id  INTEGER REFERENCES menu_items(id),
  nombre        TEXT NOT NULL,
  cantidad      INTEGER NOT NULL DEFAULT 1,
  precio_unit   NUMERIC(6,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  CARTA DE DOLCHISSIMO (57 productos)
-- ============================================================

INSERT INTO menu_items (categoria, nombre, descripcion, precio, es_nuevo, emoji) VALUES
-- BEBIDAS CALIENTES
('BEBIDAS CALIENTES','Espresso',NULL,6.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Cafe Americano',NULL,7.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Flat White',NULL,10.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Cappuccino',NULL,9.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Latte Art',NULL,9.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Tiramisu Latte',NULL,11.00,TRUE,'☕'),
('BEBIDAS CALIENTES','Cinnamon Latte',NULL,10.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Caramel Macchiato',NULL,11.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Moccaccino',NULL,10.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Maca Latte',NULL,12.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Chocolate Caliente',NULL,7.00,FALSE,'🍫'),
('BEBIDAS CALIENTES','Nutelatte',NULL,12.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Matcha Latte',NULL,10.00,FALSE,'🍵'),
('BEBIDAS CALIENTES','Cafe Bonbon',NULL,11.00,FALSE,'☕'),
('BEBIDAS CALIENTES','Chai Latte',NULL,11.00,TRUE,'🍵'),
('BEBIDAS CALIENTES','Cafe Filtrado V60 / CHEMEX',NULL,12.00,FALSE,'☕'),
-- BEBIDAS FRÍAS
('BEBIDAS FRÍAS','Cafe Frio',NULL,8.00,FALSE,'🧊'),
('BEBIDAS FRÍAS','Iced Latte',NULL,10.00,FALSE,'🧊'),
('BEBIDAS FRÍAS','Iced Tiramisu Latte','Con cold foam',13.00,TRUE,'🧊'),
('BEBIDAS FRÍAS','Iced Matcha Latte',NULL,11.00,FALSE,'🍵'),
('BEBIDAS FRÍAS','Iced Caramel Macchiato',NULL,13.00,FALSE,'🧊'),
('BEBIDAS FRÍAS','Matcha Strawberry','Con fresa',13.00,FALSE,'🍓'),
('BEBIDAS FRÍAS','Chocolate Strawberry',NULL,13.00,FALSE,'🍓'),
('BEBIDAS FRÍAS','Sparkling Coffee','Con maracuyá',13.00,FALSE,'✨'),
('BEBIDAS FRÍAS','Cold Brew',NULL,10.00,FALSE,'🧊'),
('BEBIDAS FRÍAS','Cold V60 Latte',NULL,17.00,FALSE,'🧊'),
('BEBIDAS FRÍAS','Affogato Coffee / Matcha',NULL,10.00,FALSE,'🍨'),
('BEBIDAS FRÍAS','Soda Fresh: Maracuyá / Limón / Fresa',NULL,10.00,FALSE,'🥤'),
-- FRAPPÉ / MILKSHAKE
('FRAPPÉ / MILKSHAKE','Frappe de Chocolate',NULL,9.00,FALSE,'🥤'),
('FRAPPÉ / MILKSHAKE','Frappe de Cafe / Mocha / Oreo / Fresa',NULL,10.00,FALSE,'🥤'),
('FRAPPÉ / MILKSHAKE','Milkshake de Cafe / Mocha / Matcha',NULL,15.00,FALSE,'🥛'),
-- SALADOS / BRUNCH
('SALADOS / BRUNCH','Croissant de Queso',NULL,3.00,FALSE,'🥐'),
('SALADOS / BRUNCH','Empanada de Pollo',NULL,6.00,FALSE,'🥟'),
('SALADOS / BRUNCH','Sandwich Mixto','Pan brioche, jamón americano y queso edam',13.00,FALSE,'🥪'),
('SALADOS / BRUNCH','Mixto + Tomate','Pan brioche, jamón, queso edam y tomate',14.00,FALSE,'🥪'),
('SALADOS / BRUNCH','Omelette Sandwich','Pan brioche, huevo y salchicha viena',14.00,FALSE,'🍳'),
('SALADOS / BRUNCH','Sandwich Triple','Pan pullman, jamón americano, queso edam y pollo',10.00,FALSE,'🥪'),
('SALADOS / BRUNCH','Tostada con Huevo','Sandwich de pan brioche con huevos',14.00,FALSE,'🍳'),
('SALADOS / BRUNCH','Tostada con Palta','Tostada de pan brioche con palta y huevo',16.00,FALSE,'🥑'),
-- DULCES / POSTRES
('DULCES / POSTRES','Tostada Francesa','Pan brioche con miel maple, fresa, arándano y chantilly',19.00,FALSE,'🍓'),
('DULCES / POSTRES','Waffle Clásico','Masa clásica, fresa, plátano, fudge, maple',10.00,FALSE,'🧇'),
('DULCES / POSTRES','Wafflito Vegano','Harina integral, leche vegetal, vainilla. Con 3 toppings base',10.00,FALSE,'🧇'),
('DULCES / POSTRES','Wafflito Saludable','Harina integral, leche vegetal, huevo, vainilla',10.00,FALSE,'🧇'),
('DULCES / POSTRES','Wafflito de Plátano / Fresa / Oreo / Choco','Masa clásica, chantilly, fudge y 1 topping',8.00,FALSE,'🧇'),
('DULCES / POSTRES','Tarta de Limón',NULL,6.00,FALSE,'🍋'),
('DULCES / POSTRES','Galleta Chocochip',NULL,4.00,FALSE,'🍪'),
('DULCES / POSTRES','Galleta Red Velvet',NULL,5.00,FALSE,'🍪'),
('DULCES / POSTRES','Rollo de Canela',NULL,5.00,FALSE,'🌀'),
('DULCES / POSTRES','Brownie',NULL,5.00,FALSE,'🍫'),
-- OTROS
('OTROS','Jugo de Papaya',NULL,6.00,FALSE,'🧃'),
('OTROS','Jugo de Fresa con Leche',NULL,10.00,FALSE,'🍓'),
('OTROS','Infusiones',NULL,3.00,FALSE,'🍵'),
-- PROMOCIONES
('PROMOCIONES','Americano + Croissant',NULL,9.00,FALSE,'☕'),
('PROMOCIONES','Americano + Galleta Chocochip',NULL,10.00,FALSE,'☕'),
('PROMOCIONES','Americano + Sandwich Triple',NULL,15.50,FALSE,'☕'),
('PROMOCIONES','2 Frappes del mismo sabor',NULL,17.00,FALSE,'🥤'),
('PROMOCIONES','Cappuccino + Galleta Red Velvet',NULL,13.00,FALSE,'☕');

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE usuarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Lectura pública del menú
CREATE POLICY "menu publico" ON menu_items FOR SELECT USING (TRUE);

-- Solo usuarios autenticados para pedidos
CREATE POLICY "pedidos auth" ON pedidos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "pedido_items auth" ON pedido_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "usuarios auth" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
--  REALTIME (para que cocina vea los pedidos en tiempo real)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE pedido_items;

-- ============================================================
--  USUARIO ADMIN INICIAL
--  ⚠ Primero crea el usuario en Supabase Auth (Authentication > Users)
--  con el email que quieras, luego ejecuta este INSERT:
-- ============================================================
-- INSERT INTO usuarios (email, nombre, rol, activo) VALUES
--   ('admin@dolchissimo.com', 'Administrador', 'admin', TRUE),
--   ('mozo@dolchissimo.com',  'Mozo 1',        'mozo',  TRUE),
--   ('cocina@dolchissimo.com','Cocina',         'cocina',TRUE);

-- ============================================================
--  NOTAS DE ORIGEN DEL CAFÉ
--  Región Satipo-Perú | Finca "El Mirador"
--  Variedad: Caturra, Bourbon | Proceso: Lavado
--  Altura: 1720 m.s.n.m | Tostado: Medio Alto
--  Notas: Chocolate, Cítrico
-- ============================================================
