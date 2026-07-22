# Dolchissimo — Sistema de Pedidos

Duplicado del sistema Fast Food 58, adaptado para Dolchissimo Cafetería de Especialidad.

## Estructura
```
dolchissimo/
├── index.html          ← Landing page
├── login.html          ← Login (admin / mozo / cocina)
├── mozo.html           ← Toma de pedidos
├── admin.html          ← Dashboard admin + gestión
├── cocina.html         ← Vista cocina / barra
├── qr_mesas.html       ← Generador QR de mesas
├── public/
│   └── menu.html       ← Menú público para clientes
├── admin/
│   └── dashboard.html
├── cocina/
│   └── comandas.html
├── vercel.json         ← Configuración Vercel
├── supabase_setup.sql  ← ⚠ EJECUTAR PRIMERO en Supabase
└── .env.example        ← Keys a reemplazar
```

## Pasos para activar

### 1. Crear proyecto en Supabase
- Ir a supabase.com → New Project → Nombre: `dolchissimo`
- Copiar: **Project URL** y **anon public key**

### 2. Configurar la base de datos
- SQL Editor → pegar el contenido de `supabase_setup.sql` → Run
- Esto crea las tablas + carga los 57 productos de la carta

### 3. Crear usuarios en Supabase Auth
- Authentication → Users → Add User
- Crear: `admin@dolchissimo.com`, `mozo@dolchissimo.com`, `cocina@dolchissimo.com`
- Luego descomentar y ejecutar el INSERT de usuarios al final del SQL

### 4. Reemplazar las keys en los archivos HTML
Buscar y reemplazar en todos los .html:
```
DOLCHISSIMO_SUPABASE_URL  →  https://TU_PROJECT_ID.supabase.co
DOLCHISSIMO_ANON_KEY      →  eyJ...tu_anon_key
```

### 5. Deploy en Vercel
- Subir la carpeta a un repo GitHub nuevo (ej: `dolchissimo`)
- Vercel → New Project → importar el repo
- Listo ✓

## Diferencias con Fast Food 58
| | Fast Food 58 | Dolchissimo |
|---|---|---|
| Color | Rojo `#CC0000` | Verde `#2D6A4F` |
| Menú | Hamburguesas, Chifa, Caldo | Café especialidad, Waffles, Brunch |
| Supabase | Proyecto propio | Proyecto separado (misma cuenta) |
| Vercel | Propio | Proyecto separado (misma cuenta) |
