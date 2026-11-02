import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [empCount] = await query("SELECT COUNT(*) AS total FROM employees WHERE status = 'active'");
    const [caseTotal] = await query('SELECT COUNT(*) AS total FROM cases');
    const [caseOpen] = await query("SELECT COUNT(*) AS total FROM cases WHERE status NOT IN ('selesai', 'dibatalkan')");
    const [caseDone] = await query("SELECT COUNT(*) AS total FROM cases WHERE status = 'selesai'");
    const [reportTotal] = await query('SELECT COUNT(*) AS total FROM reports');
    const [reportPending] = await query("SELECT COUNT(*) AS total FROM reports WHERE status = 'diajukan'");
    const [examPending] = await query("SELECT COUNT(*) AS total FROM examinations WHERE status = 'terjadwal'");
    const [decisionTotal] = await query("SELECT COUNT(*) AS total FROM decisions WHERE status IN ('ditetapkan', 'berlaku')");

    res.json({
      success: true,
      data: {
        active_employees: empCount?.total || 0,
        total_cases: caseTotal?.total || 0,
        open_cases: caseOpen?.total || 0,
        completed_cases: caseDone?.total || 0,
        total_reports: reportTotal?.total || 0,
        pending_reports: reportPending?.total || 0,
        upcoming_examinations: examPending?.total || 0,
        active_decisions: decisionTotal?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/charts
router.get('/charts', async (req, res, next) => {
  try {
    // 1) Cases by category
    const casesByCategory = await query(
      `SELECT category, COUNT(*) AS "count"
       FROM cases
       GROUP BY category`
    );

    // 2) Cases by status
    const casesByStatus = await query(
      `SELECT status, COUNT(*) AS "count"
       FROM cases
       GROUP BY status`
    );

    // 3) Monthly case trend for current year
    const monthlyTrend = await query(
      `SELECT EXTRACT(MONTH FROM created_at) AS month, COUNT(*) AS "count"
       FROM cases
       WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY EXTRACT(MONTH FROM created_at)
       ORDER BY month ASC`
    );

    // 4) Attendance today overview
    const attendanceToday = await query(
      `SELECT status, COUNT(*) AS "count"
       FROM attendance
       WHERE date = CURRENT_DATE
       GROUP BY status`
    );

    // 5) Penalties by level
    const penaltiesByLevel = await query(
      `SELECT penalty_level, COUNT(*) AS "count"
       FROM decisions
       GROUP BY penalty_level`
    );

    res.json({
      success: true,
      data: {
        cases_by_category: casesByCategory,
        cases_by_status: casesByStatus,
        monthly_trend: monthlyTrend,
        attendance_today: attendanceToday,
        penalties_by_level: penaltiesByLevel,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;