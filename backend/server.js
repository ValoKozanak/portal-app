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
const db = require('./services/dbCompat');
const { isWeekend, isHoliday } = require('./utils/dateUtils');

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
app.options('/:splat(.*)', cors(corsOptions));

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

// --- Healthcheck ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});


// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('❌ Error middleware:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// PG health route (inserted)
  try {
    res.json(status);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
});




const healthpgRoutes = require("./routes/healthpg");
app.use("/api/healthpg", healthpgRoutes);

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

// --- Auto-checkin cron (každý deň o 6:00) ---
let __autoCheckinRunning = false;

async function autoCheckinTick() {
  if (__autoCheckinRunning) return;
  __autoCheckinRunning = true;
  
  try {
    const today = formatTodayISODate();
    const todayDate = new Date(today);
    
    // Preskočiť víkendy a sviatky
    if (isWeekend(todayDate) || isHoliday(todayDate)) {
      console.log('📅 Auto-checkin: Dnes je víkend/sviatok, preskakujem');
      return;
    }

    console.log('🕕 Auto-checkin: Spúšťam automatickú dochádzku pre', today);

    // Získanie všetkých aktívnych zamestnancov s automatickou dochádzkou
    const employees = await new Promise((resolve, reject) => {
      db.all(`
        SELECT er.*, e.id as employee_id, e.first_name, e.last_name
        FROM employment_relations er
        JOIN employees e ON er.employee_id = e.id
        WHERE er.is_active = 1 
        AND er.attendance_mode = 'automatic'
        AND er.employment_start_date <= ?
        AND (er.employment_end_date IS NULL OR er.employment_end_date >= ?)
      `, [today, today], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (employees.length === 0) {
      console.log('📝 Auto-checkin: Žiadni zamestnanci s automatickou dochádzkou');
      return;
    }

    console.log(`👥 Auto-checkin: Našiel som ${employees.length} zamestnancov s automatickou dochádzkou`);

    let created = 0;
    let skipped = 0;

    for (const employee of employees) {
      try {
        // Kontrola, či už existuje dochádzka
        const existing = await new Promise((resolve, reject) => {
          db.get(`
            SELECT id FROM attendance 
            WHERE employee_id = ? AND date = ?
          `, [employee.employee_id, today], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existing) {
          console.log(`⏭️  Auto-checkin: Preskočujem ${employee.first_name} ${employee.last_name} - už má dochádzku`);
          skipped++;
          continue;
        }

        // Kontrola schválených dovoleniek
        const leaveRequest = await new Promise((resolve) => {
          db.get(`
            SELECT leave_type, start_date, end_date
            FROM leave_requests 
            WHERE employee_id = ? 
            AND status = 'approved'
            AND ? BETWEEN start_date AND end_date
            LIMIT 1
          `, [employee.employee_id, today], (err, row) => {
            if (err) {
              console.error('Chyba pri kontrole dovolenky:', err);
              resolve(null);
            } else {
              resolve(row);
            }
          });
        });

        if (leaveRequest) {
          // Zamestnanec má schválenú dovolenku - vytvoriť záznam s príslušným statusom
          let status = 'absent';
          switch (leaveRequest.leave_type) {
            case 'vacation': status = 'vacation'; break;
            case 'sick_leave': status = 'sick_leave'; break;
            case 'personal_leave': status = 'personal_leave'; break;
            case 'maternity_leave': status = 'maternity_leave'; break;
            case 'paternity_leave': status = 'paternity_leave'; break;
            case 'unpaid_leave': status = 'unpaid_leave'; break;
            default: status = 'absent';
          }

          await new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO attendance (
                employee_id, company_id, date, check_in, check_out, 
                total_hours, break_minutes, status, attendance_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'automatic')
            `, [
              employee.employee_id, employee.company_id, today, null, null, 
              0, 0, status
            ], function(err) {
              if (err) reject(err);
              else resolve({ id: this.lastID });
            });
          });

          console.log(`🏖️  Auto-checkin: Vytvoril som ${status} pre ${employee.first_name} ${employee.last_name} (dovolenka)`);
        } else {
          // Vytvorenie automatickej dochádzky pre pracovný deň
          const checkInTime = `${today}T${employee.work_start_time}:00`;
          const checkOutTime = `${today}T${employee.work_end_time}:00`;
          const breakMinutes = calculateBreakMinutes(employee.break_start_time, employee.break_end_time);
          const totalHours = calculateWorkHours(employee.work_start_time, employee.work_end_time, breakMinutes);

          await new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO attendance (
                employee_id, company_id, date, check_in, check_out, 
                total_hours, break_minutes, status, attendance_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'present', 'automatic')
            `, [
              employee.employee_id, employee.company_id, today, checkInTime, checkOutTime, 
              totalHours, breakMinutes
            ], function(err) {
              if (err) reject(err);
              else resolve({ id: this.lastID });
            });
          });

          console.log(`✅ Auto-checkin: Vytvoril som dochádzku pre ${employee.first_name} ${employee.last_name} (${employee.work_start_time}-${employee.work_end_time})`);
        }

        created++;
      } catch (error) {
        console.error(`❌ Auto-checkin: Chyba pri spracovaní ${employee.first_name} ${employee.last_name}:`, error);
      }
    }

    console.log(`🎯 Auto-checkin: Hotovo - ${created} vytvorených, ${skipped} preskočených`);
  } catch (err) {
    console.error('❌ Auto-checkin error:', err);
  } finally {
    __autoCheckinRunning = false;
  }
}

// Funkcia na spustenie auto-checkin v správnom čase
function scheduleAutoCheckin() {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(6, 0, 0, 0); // 6:00 ráno
  
  // Ak je už po 6:00, spusti hneď
  if (now >= targetTime) {
    console.log('🕕 Spúšťam auto-checkin hneď (je už po 6:00)');
    setTimeout(autoCheckinTick, 5000); // 5 sekúnd oneskorenie
  } else {
    // Inak spusti o 6:00
    const delay = targetTime.getTime() - now.getTime();
    console.log(`🕕 Naplánoval som auto-checkin na 6:00 (za ${Math.round(delay / 1000 / 60)} minút)`);
    setTimeout(autoCheckinTick, delay);
  }
  
  // Potom spúšťaj každých 24 hodín
  setInterval(autoCheckinTick, 24 * 60 * 60 * 1000);
}

// Spúšťaj každé 2 minúty
setInterval(autoCheckoutTick, 2 * 60 * 1000);
// Spusti po štarte s malým oneskorením
setTimeout(autoCheckoutTick, 30 * 1000);

// Naplánuj auto-checkin
scheduleAutoCheckin();
