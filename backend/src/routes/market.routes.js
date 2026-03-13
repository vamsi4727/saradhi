import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  fetchStock,
  fetchMF,
  fetchFDRates,
  searchAssets,
} from '../services/pythonBridge.js';

const router = Router();
router.use(requireAuth);

router.get('/stock/:symbol', async (req, res) => {
  try {
    const data = await fetchStock(req.params.symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mf/:scheme_code', async (req, res) => {
  try {
    const data = await fetchMF(req.params.scheme_code);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fd', async (req, res) => {
  try {
    const data = await fetchFDRates();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const data = await searchAssets(q);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
