// KONFIGURASI DB UNTUK VERCEL
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();
const port = 3000;
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware
app.use(express.json({ limit: '50mb' })); 
app.use(cors());

// RENDER PUBLIC FOLDER: Agar file HTML bisa diakses langsung
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// cek koneksi
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed');
    console.error(err.message);
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

// Endpoint untuk menghapus video berdasarkan ID
app.delete('/api/delete-video/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM story_records WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Video tidak ditemukan' });
        }

        console.log(`🗑️ Video dengan ID ${id} telah dihapus`);
        res.json({ success: true, message: 'Kenangan telah dihapus dari database' });
    } catch (err) {
        console.error('Error saat menghapus data:', err);
        res.status(500).json({ error: 'Gagal menghapus data' });
    }
});
// 4. Jalankan Server
app.listen(port, () => {
    console.log(`🚀 Server on: http://localhost:${port}`);
});