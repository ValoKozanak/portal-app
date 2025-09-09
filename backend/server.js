require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Routes (importy) ---
const messagesRoutes   = require('./routes/messages');
const authRoutes       = require('./routes/auth');
const companiesRoutes  = require('./routes/companies');
const tasksRoutes      = require('./routes/tasks');
const filesRoutes      = require('./routes/files');
const documentsRoutes  = require('./routes/documents');
const cmsRoutes        = require('./routes/cms');
const dropboxRoutes    = require('./routes/dropbox');
const hrRoutes         = require('./routes/hr');
const payrollRoutes    = require('./routes/payroll');
const accountingRoutes = require('./routes/accounting');
const toolsRoutes = require('./routes/tools.routes');
const { db, isWeekend, isHoliday } = require('./database');

const app = express();

// --- CORS ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-amz-acl',
    'x-amz-date',
    'x-amz-content-sha256',
    'x-requested-with'
  ]
};
app.use(cors(corsOptions));
// Preflight handler (OPTIONS) – dôležité pre presign-upload a PUT do Spaces
app.options('*', cors(corsOptions));

// (voliteľné) log základných info o requeste
app.use((req, _res, next) => {
  // komentované, aby to nerušilo: odkomentuj pri debugingu
  // console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// --- Parsre a statika ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Mounty API (iba relatívne cesty! žiadne plné URL) ---
app.use('/api/messages',   messagesRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/companies',  companiesRoutes);
app.use('/api/tasks',      tasksRoutes);
app.use('/api/files',      filesRoutes);
app.use('/api/documents',  documentsRoutes);
app.use('/api/cms',        cmsRoutes);
app.use('/api/dropbox',    dropboxRoutes);
app.use('/api/hr',         hrRoutes);
app.use('/api/payroll',    payrollRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/tools', toolsRoutes);

// --- Healthcheck ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('❌ Error middleware:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- 404 ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Štart ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
  console.log(`📊 API dostupné na http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Export pre testy (nevadí v produkcii)
module.exports = app;

// --- Auto-checkout cron (každé ~2 min) ---
let __autoCheckoutRunning = false;

function formatTodayISODate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toISO(dateStr, hhmm) {
  if (!hhmm) return null;
  return `${dateStr}T${hhmm.length === 5 ? hhmm + ':00' : hhmm}`;
}

function calculateBreakMinutes(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

function calculateWorkHours(startTime, endTime, breakMinutes) {
  if (!startTime || !endTime) return 0;
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const workMinutes = Math.max(0, totalMinutes - (Number(breakMinutes) || 0));
  return Math.round((workMinutes / 60) * 100) / 100;
}

async function autoCheckoutTick() {
  if (__autoCheckoutRunning) return;
  __autoCheckoutRunning = true;
  try {
    const today = formatTodayISODate();
    const todayDate = new Date(today);
    if (isWeekend(todayDate) || isHoliday(todayDate)) {
      return; // neuzatvárame pracovný pokoj
    }

    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentHM = `${currentHH}:${currentMM}`;

    // Nájdeme zamestnancov s automatickou dochádzkou, ktorým už uplynul work_end_time
    const employees = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           e.id AS employee_id,
           er.company_id,
           er.work_start_time,
           er.work_end_time,
           er.break_start_time,
           er.break_end_time
         FROM employment_relations er
         JOIN employees e ON e.id = er.employee_id
         WHERE er.is_active = 1
           AND er.attendance_mode = 'automatic'
           AND er.employment_start_date <= ?
           AND (er.employment_end_date IS NULL OR er.employment_end_date >= ?)
           AND er.work_end_time <= ?`,
        [today, today, currentHM],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    for (const emp of employees) {
      // Mzdové obdobie uzavreté?
      const year = todayDate.getFullYear();
      const month = todayDate.getMonth() + 1;
      const payroll = await new Promise((resolve) => {
        db.get(
          `SELECT is_closed FROM payroll_periods WHERE company_id = ? AND year = ? AND month = ?`,
          [emp.company_id, year, month],
          (_err, row) => resolve(row)
        );
      });
      if (payroll && payroll.is_closed === 1) continue;

      // Existujúca dnešná dochádzka
      const existing = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id, check_in, check_out, break_minutes, status, notes 
           FROM attendance 
           WHERE employee_id = ? AND company_id = ? AND date = ?`,
          [emp.employee_id, emp.company_id, today],
          (err, row) => (err ? reject(err) : resolve(row || null))
        );
      });

      // Ak je schválená dovolenka/PN atď., neskúšame vytvárať prítomnosť
      const hasApprovedLeave = await new Promise((resolve) => {
        db.get(
          `SELECT 1 FROM leave_requests 
           WHERE employee_id = ? AND status = 'approved' AND ? BETWEEN start_date AND end_date`,
          [emp.employee_id, today],
          (_err, row) => resolve(!!row)
        );
      });
      if (hasApprovedLeave) continue;

      const endTime = emp.work_end_time; // HH:MM
      const breakMinutes = calculateBreakMinutes(emp.break_start_time, emp.break_end_time);
      const checkOutISO = toISO(today, endTime);

      if (existing) {
        if (existing.check_out) continue; // už uzavreté
        // odvodiť start_time z existujúceho check_in alebo z nastavenia
        const startTime = existing.check_in ? existing.check_in.split('T')[1]?.substring(0,5) : emp.work_start_time;
        const totalHours = calculateWorkHours(startTime, endTime, existing.break_minutes ?? breakMinutes);
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE attendance SET 
               check_out = ?,
               total_hours = ?,
               break_minutes = COALESCE(break_minutes, ?),
               updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [checkOutISO, totalHours, breakMinutes, existing.id],
            (err) => (err ? reject(err) : resolve())
          );
        });
      } else {
        // Ak dnes nie je záznam a čas konca už uplynul, vytvoríme prítomnosť
        const startTime = emp.work_start_time;
        const totalHours = calculateWorkHours(startTime, endTime, breakMinutes);
        const checkInISO = toISO(today, startTime);
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO attendance (
               employee_id, company_id, date, check_in, check_out,
               total_hours, break_minutes, status, attendance_type, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 'automatic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [emp.employee_id, emp.company_id, today, checkInISO, checkOutISO, totalHours, breakMinutes],
            (err) => (err ? reject(err) : resolve())
          );
        });
      }
    }
  } catch (err) {
    console.error('❌ Auto-checkout cron error:', err);
  } finally {
    __autoCheckoutRunning = false;
  }
}

// Spúšťaj každé 2 minúty
setInterval(autoCheckoutTick, 2 * 60 * 1000);
// Spusti po štarte s malým oneskorením
setTimeout(autoCheckoutTick, 30 * 1000);
