# Misi Alam Ceria

Game pendidikan digital 2D adventure untuk murid MBPK bagi topik mengenal dan mengelaskan haiwan serta tumbuhan.

## Struktur Fail

- `index.html` - fail utama aplikasi.
- `style.css` - semua gaya visual game.
- `script.js` - logik game, stage, chatbot, leaderboard dan localStorage.
- `vercel.json` - konfigurasi deploy statik Vercel.
- `package.json` - skrip semakan dan preview.
- `assets/` - folder gambar untuk background, karakter, objek, UI dan lencana.

## Asset Visual

Kod sudah bersedia menggunakan PNG dalam folder `assets/`. Masukkan gambar sebenar mengikut nama dalam [assets/README.md](assets/README.md). Jika gambar belum ada, game masih jalan dengan fallback CSS/emoji.

## Jalankan Lokal

```bash
npm install
npm run start
```

Untuk semak JavaScript:

```bash
npm run check
```

## Deploy ke Vercel

Import folder ini ke Vercel sebagai projek statik. Tetapan build boleh dibiarkan kosong:

- Framework Preset: Other
- Build Command: kosong
- Output Directory: `.`
