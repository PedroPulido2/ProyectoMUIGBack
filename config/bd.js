require('dotenv').config();

const { Pool } = require('pg');

const schema = /^[A-Za-z_][A-Za-z0-9_]*$/.test(process.env.DB_SCHEMA || '')
    ? process.env.DB_SCHEMA
    : 'MUIGUPTCDB';

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // La mayoría de Postgres gestionados (Neon/Supabase/Render/Railway) exigen SSL.
    // Para local sin SSL: DB_SSL=false en el .env
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    options: `-c search_path="${schema}",public`
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = pool;