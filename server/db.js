// ═══════════════════════════════════════════════════════════════
// DATABASE — PostgreSQL (production-ready)
// Works locally with PostgreSQL and hosted on Railway/Render/Supabase
// ═══════════════════════════════════════════════════════════════
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── INITIALISE TABLES ────────────────────────────────────────
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('patient','professional')),
        avatar_url TEXT,
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS professional_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_number TEXT NOT NULL,
        specialization TEXT,
        hospital TEXT,
        is_active BOOLEAN DEFAULT FALSE,
        is_on_duty BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS medical_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth DATE,
        blood_type TEXT,
        allergies TEXT,
        medications TEXT,
        conditions TEXT,
        insurance_info TEXT,
        additional_notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_name TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        relationship TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS emergency_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id),
        professional_id UUID REFERENCES users(id),
        request_type TEXT NOT NULL,
        description TEXT,
        location TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','on_the_way','completed','cancelled')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed test accounts
    await seedTestAccounts(client);
    console.log('✅ Database tables ready');
  } finally {
    client.release();
  }
}

async function seedTestAccounts(client) {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const testUsers = [
    { id: '00000000-0000-0000-0000-000000000001', full_name: 'Kwame Mensah',      email: 'patient@test.com',  password: 'test123', role: 'patient' },
    { id: '00000000-0000-0000-0000-000000000002', full_name: 'Ama Owusu',         email: 'ama@test.com',      password: 'test123', role: 'patient' },
    { id: '00000000-0000-0000-0000-000000000003', full_name: 'Dr. Kofi Asante',   email: 'doctor@test.com',   password: 'test123', role: 'professional' },
    { id: '00000000-0000-0000-0000-000000000004', full_name: 'Nurse Abena Boateng', email: 'nurse@test.com',  password: 'test123', role: 'professional' },
  ];

  for (const u of testUsers) {
    const exists = await client.query('SELECT id FROM users WHERE id = $1', [u.id]);
    if (exists.rows.length) continue;

    const hash = await bcrypt.hash(u.password, 10);
    await client.query(
      `INSERT INTO users (id, full_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [u.id, u.full_name, u.email, hash, u.role]
    );

    if (u.role === 'professional') {
      await client.query(
        `INSERT INTO professional_profiles (user_id, license_number, specialization, hospital) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [u.id,
         u.id === '00000000-0000-0000-0000-000000000003' ? 'GHS-2024-KA001' : 'GHS-2024-AB002',
         u.id === '00000000-0000-0000-0000-000000000003' ? 'Emergency Medicine' : 'Nursing',
         u.id === '00000000-0000-0000-0000-000000000003' ? 'Korle Bu Teaching Hospital' : 'KATH']
      );
    } else {
      await client.query(
        `INSERT INTO medical_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [u.id]
      );
    }
  }
}

// ─── QUERY HELPERS ────────────────────────────────────────────
async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res;
}

async function getOne(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows[0] || null;
}

async function getAll(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

async function run(sql, params = []) {
  await pool.query(sql, params);
}

module.exports = { initDB, query, getOne, getAll, run, pool };
