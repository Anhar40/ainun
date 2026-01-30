import dotenv from 'dotenv';
import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// 1. CORS dan Limit (Sudah Benar)
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Konfigurasi Database
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false, 
});

// Cek koneksi (Sudah Benar)
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  }
})();

// 3. Endpoint Simpan Video
app.post('/api/save-reaction', async (req, res) => {
    try {
        const { video_data } = req.body; // Pastikan di frontend key-nya "video_data"

        if (!video_data) {
            return res.status(400).json({ error: 'Data video kosong' });
        }

        // Gunakan nama kolom yang sesuai dengan tabel di DB kamu
        const queryText = 'INSERT INTO story_records(video_base64) VALUES($1) RETURNING id';
        const result = await pool.query(queryText, [video_data]);

        console.log(`✨ Video tersimpan! ID: ${result.rows[0].id}`);
        res.json({ success: true, message: 'Kenangan berhasil diabadikan!' });

    } catch (err) {
        console.error('❌ Error simpan ke DB:', err.message);
        res.status(500).json({ error: 'Gagal menyimpan ke database' });
    }
});

// Endpoint untuk mengambil semua daftar video
app.get('/api/get-videos', async (req, res) => {
    try {
        // Kita ambil ID dan waktu saja dulu agar tidak berat, 
        // Video diambil belakangan atau sekaligus (di sini kita ambil sekaligus)
        const result = await pool.query('SELECT id, video_base64, created_at FROM story_records ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error saat ambil data:', err);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

// 4. Jalankan Server
app.listen(port, () => {
    console.log(`🚀 Server on: http://localhost:${port}`);
});