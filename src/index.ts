import express from 'express';
import { pool } from './db';
import { buildFilterQuery } from './queries';

const app = express();
app.use(express.json());

app.get('/episodes', async (req, res) => {
  try {
    const query = buildFilterQuery({});
    const result = await pool.query(query);
    console.log('Query result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;