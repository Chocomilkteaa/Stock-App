import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  db.execute('SELECT 1');
  res.json({ message: 'API is running' });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
