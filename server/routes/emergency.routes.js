const express = require('express');
const { getOne, getAll, run } = require('../db');
const { authenticateToken } = require('./auth.routes');

const router = express.Router();

// ─── ACTIVE PROFESSIONALS ─────────────────────────────────────────────────────
router.get('/professionals/active', authenticateToken, async (req, res) => {
  const pros = await getAll(`
    SELECT u.id, u.full_name, u.avatar_url, pp.specialization, pp.hospital, pp.is_active, pp.is_on_duty
    FROM users u JOIN professional_profiles pp ON pp.user_id = u.id
    WHERE u.role = 'professional' AND pp.is_active = TRUE
    ORDER BY pp.is_on_duty DESC, u.full_name ASC
  `);
  res.json(pros);
});

// ─── MEDICAL PROFILE ──────────────────────────────────────────────────────────
router.get('/profile/medical', authenticateToken, async (req, res) => {
  res.json(await getOne('SELECT * FROM medical_profiles WHERE user_id = $1', [req.user.id]) || {});
});

router.put('/profile/medical', authenticateToken, async (req, res) => {
  const { date_of_birth, blood_type, allergies, medications, conditions, insurance_info, additional_notes } = req.body;
  const existing = await getOne('SELECT id FROM medical_profiles WHERE user_id = $1', [req.user.id]);
  if (existing) {
    await run(
      `UPDATE medical_profiles SET date_of_birth=$1, blood_type=$2, allergies=$3, medications=$4,
       conditions=$5, insurance_info=$6, additional_notes=$7, updated_at=NOW() WHERE user_id=$8`,
      [date_of_birth || null, blood_type, allergies, medications, conditions, insurance_info, additional_notes, req.user.id]
    );
  } else {
    await run(
      `INSERT INTO medical_profiles (user_id, date_of_birth, blood_type, allergies, medications, conditions, insurance_info, additional_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [req.user.id, date_of_birth || null, blood_type, allergies, medications, conditions, insurance_info, additional_notes]
    );
  }
  res.json({ message: 'Medical profile updated' });
});

// ─── EMERGENCY CONTACTS ───────────────────────────────────────────────────────
router.get('/contacts', authenticateToken, async (req, res) => {
  res.json(await getAll('SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY created_at', [req.user.id]));
});

router.post('/contacts', authenticateToken, async (req, res) => {
  const { contact_name, contact_phone, relationship } = req.body;
  if (!contact_name || !contact_phone) return res.status(400).json({ error: 'Name and phone required' });
  const contact = await getOne(
    'INSERT INTO emergency_contacts (user_id, contact_name, contact_phone, relationship) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.user.id, contact_name, contact_phone, relationship || '']
  );
  res.status(201).json(contact);
});

router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  await run('DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'Contact deleted' });
});

// ─── EMERGENCY REQUESTS ───────────────────────────────────────────────────────
router.post('/requests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Only patients can create requests' });
  const { request_type, description, location, professional_id } = req.body;
  if (!request_type) return res.status(400).json({ error: 'Request type is required' });
  const req_ = await getOne(
    `INSERT INTO emergency_requests (patient_id, professional_id, request_type, description, location)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, status`,
    [req.user.id, professional_id || null, request_type, description || '', location || '']
  );
  res.status(201).json({ ...req_, message: 'Emergency request sent' });
});

router.get('/requests/mine', authenticateToken, async (req, res) => {
  const rows = await getAll(`
    SELECT er.*, u.full_name AS professional_name
    FROM emergency_requests er
    LEFT JOIN users u ON er.professional_id = u.id
    WHERE er.patient_id = $1
    ORDER BY er.created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

router.get('/requests/pending', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professionals only' });
  const rows = await getAll(`
    SELECT er.*, u.full_name AS patient_name, u.email AS patient_email,
           mp.blood_type, mp.allergies, mp.conditions
    FROM emergency_requests er
    JOIN users u ON er.patient_id = u.id
    LEFT JOIN medical_profiles mp ON mp.user_id = u.id
    WHERE er.status = 'pending'
      AND (er.professional_id IS NULL OR er.professional_id = $1)
    ORDER BY er.created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

router.get('/requests/active', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professionals only' });
  const rows = await getAll(`
    SELECT er.*, u.full_name AS patient_name, u.email AS patient_email,
           mp.blood_type, mp.allergies, mp.conditions, mp.medications
    FROM emergency_requests er
    JOIN users u ON er.patient_id = u.id
    LEFT JOIN medical_profiles mp ON mp.user_id = u.id
    WHERE er.professional_id = $1 AND er.status IN ('accepted','on_the_way')
    ORDER BY er.created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

router.patch('/requests/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (!['accepted','on_the_way','completed','cancelled'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professionals only' });

  const request = await getOne('SELECT * FROM emergency_requests WHERE id = $1', [req.params.id]);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  if (status === 'accepted' && request.status === 'pending') {
    await run(`UPDATE emergency_requests SET status=$1, professional_id=$2, updated_at=NOW() WHERE id=$3`,
      [status, req.user.id, req.params.id]);
  } else {
    if (request.professional_id !== req.user.id) return res.status(403).json({ error: 'Not assigned to this request' });
    await run(`UPDATE emergency_requests SET status=$1, updated_at=NOW() WHERE id=$2`, [status, req.params.id]);
  }
  res.json({ message: `Request marked as ${status}` });
});

// ─── PROFESSIONAL PROFILE ─────────────────────────────────────────────────────
router.get('/professional/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professionals only' });
  res.json(await getOne('SELECT * FROM professional_profiles WHERE user_id = $1', [req.user.id]) || {});
});

router.patch('/professional/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professionals only' });
  const { is_active, is_on_duty } = req.body;
  await run('UPDATE professional_profiles SET is_active=$1, is_on_duty=$2 WHERE user_id=$3',
    [!!is_active, !!is_on_duty, req.user.id]);
  res.json({ message: 'Status updated' });
});

router.put('/professional/profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professional') return res.status(403).json({ error: 'Professionals only' });
  const { specialization, hospital } = req.body;
  await run('UPDATE professional_profiles SET specialization=$1, hospital=$2 WHERE user_id=$3',
    [specialization, hospital, req.user.id]);
  res.json({ message: 'Profile updated' });
});

module.exports = router;
