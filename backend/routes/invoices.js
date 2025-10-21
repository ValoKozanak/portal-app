const { Router } = require('express');
const { query } = require('../services/pgService');
const { authenticateToken } = require('./auth'); // uprav cestu podľa seba

const router = Router();

// všetky faktúry (list) – čítame z mdb.invoices (JSONB 1:1)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // query parametre
    const {
      q,                 // voľné hľadanie (ilike cez data::text alebo tsvector)
      number,            // presné číslo faktúry (napr. "2025-00123")
      ico,               // IČO odberateľa
      companyId,         // interné ID firmy (ak ho máš v JSONB)
      dateFrom,          // ISO: 2025-01-01
      dateTo,            // ISO: 2025-12-31
      sort = 'updated_at.desc', // "updated_at.desc" | "updated_at.asc"
      limit = '50',
      offset = '0',
    } = req.query;

    const L = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const O = Math.max(parseInt(offset, 10) || 0, 0);

    // skladáme WHERE podmienky
    const where = [];
    const params = [];

    // presné polia (prispôsob cesty podľa tvojho JSONu)
    if (number) {
      params.push(String(number));
      where.push(`data->>'number' = $${params.length}`);
    }
    if (ico) {
      params.push(String(ico));
      // príklad: data->'customer'->>'ico'
      where.push(`(data->'customer'->>'ico') = $${params.length}`);
    }
    if (companyId) {
      params.push(String(companyId));
      // príklad: data->>'companyId'
      where.push(`data->>'companyId' = $${params.length}`);
    }

    // dátumy (ak sú v JSONB ako ISO stringy, inak uprav)
    if (dateFrom) {
      params.push(dateFrom);
      where.push(`(data->>'issueDate')::timestamptz >= $${params.length}`);
    }
    if (dateTo) {
      params.push(dateTo);
      where.push(`(data->>'issueDate')::timestamptz < ($${params.length}::timestamptz + interval '1 day')`);
    }

    // voľné hľadanie: preferuj tsvector, fallback na ilike cez text
    if (q) {
      params.push(`%${q}%`);
      where.push(`( (tsv IS NOT NULL AND tsv @@ plainto_tsquery('simple', $${params.length}::text))
                    OR data::text ILIKE $${params.length} )`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // sort
    let orderBy = `updated_at DESC NULLS LAST, mongo_id ASC`;
    if (typeof sort === 'string') {
      const [col, dir] = sort.split('.');
      const safeCol = (col === 'updated_at') ? 'updated_at'
                    : (col === 'issueDate') ? `(data->>'issueDate')::timestamptz`
                    : null;
      const safeDir = (dir && dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
      if (safeCol) orderBy = `${safeCol} ${safeDir} NULLS LAST, mongo_id ASC`;
    }

    // dopyt s total count bez druhého „count(*)“ dotazu (window funkcia)
    params.push(L, O);
    const sql = `
      SELECT mongo_id, data, updated_at,
             COUNT(*) OVER() AS total
      FROM mdb.invoices
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const { rows } = await query(sql, params);
    const total = rows[0]?.total ? Number(rows[0].total) : 0;
    res.json({
      items: rows.map(({ total: _t, ...r }) => r),
      total,
      limit: L,
      offset: O,
    });
  } catch (e) {
    console.error('[GET /invoices] error:', e);
    res.status(500).json({ error: 'Failed to load invoices' });
  }
});

// detail podľa mongo_id
router.get('/:mongoId', authenticateToken, async (req, res) => {
  try {
    const { mongoId } = req.params;
    const { rows } = await query(
      `SELECT mongo_id, data, updated_at
       FROM mdb.invoices
       WHERE mongo_id = $1`,
      [String(mongoId)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('[GET /invoices/:mongoId] error:', e);
    res.status(500).json({ error: 'Failed to load invoice' });
  }
});

module.exports = router;
