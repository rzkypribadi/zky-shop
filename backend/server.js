const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000; // Port untuk backend

// Middleware
app.use(cors()); // Mengizinkan permintaan dari domain lain (penting untuk frontend)
app.use(express.json()); // Untuk parsing application/json

// --- Setup folder upload ---
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// --- Setup Multer untuk upload file ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder); // Simpan file di folder 'uploads'
  },
  filename: (req, file, cb) => {
    // Buat nama file unik dengan timestamp dan nama asli
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Batasi ukuran file 10MB

// --- Endpoint untuk QRIS Dinamis (Simulasi) ---
// Ini akan mengembalikan gambar placeholder QRIS.
// Di produksi, Anda akan mengintegrasikan dengan penyedia QRIS asli.
app.get('/api/qrisdinamis', (req, res) => {
  const { string, nominal } = req.query;
  if (!string || !nominal) {
    return res.status(400).send('Missing string or nominal parameter');
  }
  // Untuk demo, kita akan mengirim gambar placeholder.
  // Pastikan ada file 'placeholder-qris.png' di folder 'backend'.
  const qrisImagePath = path.join(__dirname, 'placeholder-qris.png');
  if (fs.existsSync(qrisImagePath)) {
    res.sendFile(qrisImagePath);
  } else {
    res.status(404).send('QRIS placeholder image not found. Please create one or use a real QRIS API.');
  }
});

// --- Endpoint untuk Menerima Order dan Bukti Transfer ---
app.post('/api/order', upload.single('proof'), (req, res) => {
  try {
    const { plan, price, adminFee, total, orderId, customerName, customerPhone, customerEmail, customerNote } = req.body;
    const proofFile = req.file; // File bukti transfer yang diupload

    // Validasi data yang diterima
    if (!plan || !price || !adminFee || !total || !orderId || !customerName || !customerPhone) {
      // Jika ada data wajib yang hilang
      if (proofFile) { // Hapus file jika validasi data gagal
        fs.unlinkSync(proofFile.path);
      }
      return res.status(400).json({ success: false, message: 'Data order tidak lengkap. Harap isi semua kolom wajib.' });
    }

    if (!proofFile) {
      return res.status(400).json({ success: false, message: 'Bukti transfer wajib diupload.' });
    }

    // --- Simulasi Penyimpanan Data Order ---
    // Di aplikasi nyata, Anda akan menyimpan data ini ke database (MySQL, PostgreSQL, MongoDB, dll.)
    // dan mencatat lokasi file bukti transfer.
    console.log('--- Order Baru Diterima ---');
    console.log('Plan:', plan);
    console.log('Harga:', price);
    console.log('Biaya Admin:', adminFee);
    console.log('Total Pembayaran:', total);
    console.log('Order ID:', orderId);
    console.log('Nama Pelanggan:', customerName);
    console.log('Nomor HP:', customerPhone);
    console.log('Email:', customerEmail || '-');
    console.log('Catatan:', customerNote || '-');
    console.log('Nama File Bukti Transfer:', proofFile.filename);
    console.log('Lokasi File Bukti Transfer:', proofFile.path);
    console.log('---------------------------');

    // Kirim respons sukses ke frontend
    res.json({ success: true, message: 'Order berhasil diterima dan bukti transfer tersimpan. Admin akan segera memproses.' });

  } catch (error) {
    console.error('Error saat memproses order:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar. Maksimal 10MB.' });
      }
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memproses order Anda.' });
  }
});

// --- Serve file statis dari folder 'uploads' ---
// Ini memungkinkan frontend untuk mengakses gambar bukti transfer yang diupload
app.use('/uploads', express.static(uploadFolder));

// --- Jalankan server ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Pastikan ada file 'placeholder-qris.png' di folder ${__dirname}`);
});
