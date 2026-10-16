(() => {
  const W = 960, H = 600, TILE = 32;
  const WORLD_W = 64, WORLD_H = 48;
  const keys = {};
  const sceneLabel = document.getElementById("scene-name");
  const dialogEl = document.getElementById("dialog");
  const dialogName = document.getElementById("dialog-name");
  const dialogText = document.getElementById("dialog-text");
  const dialogPortrait = document.getElementById("dialog-portrait");
  const SAVE_KEY = "pixelQuestMisteriBukuKas_save_v2";
  function readSave() {
    try { return JSON.parse(sessionStorage.getItem(SAVE_KEY) || "{}") || {}; }
    catch (err) { console.warn("Save Pixel Quest tidak bisa dibaca:", err); return {}; }
  }
  const savedGame = readSave();
  let score = Number(savedGame.score) || 0, clues = Number(savedGame.clues) || 0;
  const completedLevels = new Set(Array.isArray(savedGame.completedLevels) ? savedGame.completedLevels : []);
  const talkedNPCs = new Set(Array.isArray(savedGame.talkedNPCs) ? savedGame.talkedNPCs : []);
  let introSeen = !!savedGame.introSeen;
  let allMissionsCelebrated = !!savedGame.allMissionsCelebrated;
  let totalLevelPoints = Number(savedGame.totalLevelPoints) || 0;
  const levelScoreSummary = savedGame.levelScoreSummary || {};
  let endingDialogs = [];
  const quizPanel = document.getElementById("quiz-panel");
  let quizIndex = 0, quizScore = 0, quizAnswered = false, quizResponses = [], activeQuizQuestions = [], activeQuizLevel = 1;
  let levelSeconds = 410, questionSeconds = 90, wrongAttempts = 0, questionLostPoint = false, quizTimerHandle = null, finishingLevel = false, introRulesPending = false, pendingLevelIntro = null;
  const quizQuestions = [
    {level:1,title:"Soal 1 — Transaksi mencurigakan",question:"Pilih dua kartu yang menunjukkan kesalahan pencatatan paling jelas.",details:"Saldo awal kas Rp2.000.000; penjualan Rp1.500.000; listrik Rp300.000; alat tulis Rp200.000. Kartu A: listrik sudah dicatat. Kartu B: alat tulis belum dicatat. Kartu C: penjualan sudah dicatat. Kartu D: pembayaran pribadi pemilik Rp400.000 dicatat sebagai biaya listrik. Kartu E: saldo awal benar.",options:["Kartu A dan C","Kartu B dan D","Kartu C dan E","Kartu A dan E"],answer:1,explain:"Benar: B adalah transaksi yang terlewat, sedangkan D salah mengklasifikasikan pembayaran pribadi sebagai biaya listrik."},
    {level:1,title:"Soal 2 — Laporan tidak sesuai",question:"Pilih dua jenis kesalahan yang harus diperiksa.",details:"Pendapatan penjualan Rp4.000.000; pembelian barang dagang Rp1.200.000; biaya sewa Rp500.000; pembayaran utang usaha Rp700.000. Pembayaran utang belum dicatat dan biaya sewa dicatat dua kali.",options:["Penjualan terlewat dan pembelian salah akun","Utang usaha belum dicatat dan biaya sewa tercatat dua kali","Saldo awal salah dan pendapatan dicatat dua kali","Semua transaksi sudah benar"],answer:1,explain:"Benar: pembayaran utang usaha belum dicatat dan biaya sewa dicatat dua kali."},
    {level:2,title:"Soal 3 — Saldo kas kecil",question:"Berapa selisihnya dan apa jenis selisih tersebut?",details:"Saldo menurut catatan Rp1.000.000. Uang fisik yang tersedia hanya Rp750.000.",options:["Rp250.000 overage","Rp250.000 shortage","Rp150.000 shortage","Rp1.750.000 overage"],answer:1,explain:"Rp1.000.000 − Rp750.000 = Rp250.000. Uang fisik kurang dari catatan, jadi shortage (kekurangan)."},
    {level:2,title:"Soal 4 — Pemeriksaan kas",question:"Berapa selisihnya dan apa jenis selisih tersebut?",details:"Saldo menurut catatan Rp850.000. Uang fisik yang tersedia Rp1.000.000.",options:["Rp150.000 shortage","Rp1.850.000 overage","Rp150.000 overage","Rp250.000 shortage"],answer:2,explain:"Uang fisik lebih banyak Rp150.000 daripada catatan, jadi overage (kelebihan)."},
    {level:3,title:"Soal 5 — Pembelian perlengkapan",question:"Kartu mana yang belum dicatat dan akun apa yang seharusnya bertambah?",details:"A: pembelian perlengkapan kantor Rp150.000. B: listrik Rp250.000. C: pendapatan jasa Rp500.000. D: air Rp100.000. Laporan sudah mencatat B, C, dan D, tetapi belum mencatat A.",options:["Kartu A; akun perlengkapan bertambah Rp150.000","Kartu B; akun listrik bertambah Rp250.000","Kartu C; pendapatan jasa bertambah Rp500.000","Kartu D; akun air bertambah Rp100.000"],answer:0,explain:"Kartu A terlewat. Perlengkapan bertambah sebesar Rp150.000."},
    {level:3,title:"Soal 6 — Bukti transaksi tidak sesuai",question:"Kartu mana yang harus diperiksa dan berapa selisih pencatatannya?",details:"A: meja Rp600.000, tetapi dicatat Rp60.000. B: kertas Rp100.000. C: internet Rp200.000. D: penerimaan kas Rp400.000. B, C, dan D benar.",options:["Kartu B; selisih Rp40.000","Kartu A; selisih Rp540.000","Kartu C; selisih Rp200.000","Kartu D; selisih Rp400.000"],answer:1,explain:"Rp600.000 − Rp60.000 = Rp540.000. Kartu A harus diperiksa."},
    {level:4,title:"Soal 7 — Temukan jenis kesalahan",question:"Pasangkan kasus dengan jenis kesalahan yang tepat.",details:"A. Transaksi pembelian tidak dimasukkan ke laporan. B. Biaya listrik dicatat sebagai biaya air. C. Nota pembelian tidak tersedia. Pilihan: 1 salah akun; 2 transaksi terlewat; 3 bukti tidak lengkap.",options:["A–1, B–2, C–3","A–2, B–1, C–3","A–3, B–1, C–2","A–2, B–3, C–1"],answer:1,explain:"A–2 transaksi terlewat; B–1 salah akun; C–3 bukti tidak lengkap."},
    {level:4,title:"Soal 8 — Temukan pola selisih",question:"Apa tiga masalah yang ditemukan?",details:"Hasil pemeriksaan: uang fisik lebih sedikit daripada saldo catatan; ada nota pembelian belum dicatat; satu transaksi masuk ke akun yang tidak sesuai.",options:["Overage, transaksi ganda, bukti lengkap","Shortage, transaksi terlewat, salah akun","Shortage, saldo awal benar, transaksi ganda","Overage, salah hitung harga, bukti lengkap"],answer:1,explain:"Masalahnya adalah kekurangan kas (shortage), transaksi terlewat, dan salah akun."},
    {level:5,title:"Soal 9 — Kumpulkan angka",question:"Susun angka dari hasil soal 3, 4, 5, dan 6. Kode apa yang didapat?",details:"Petunjuk kode: soal 3 = 3; soal 4 = 5; soal 5 = 2; soal 6 = 7.",options:["3257","3527","5732","7235"],answer:1,explain:"Urutan soal 3, 4, 5, 6 menghasilkan kode 3527."},
    {level:5,title:"Soal 10 — Kode rahasia terakhir",question:"Susun kode rahasia berdasarkan petunjuk urutan soal.",details:"Angka yang tersedia: 7 — 3 — 2 — 5. Angka pertama dari soal 3; kedua dari soal 4; ketiga dari soal 5; keempat dari soal 6.",options:["7325","3257","3527","5273"],answer:2,explain:"Kode rahasia terakhir adalah 3527. Misi audit selesai!"}
    ,
    {level:1,title:"Soal 3 — Kas bon hilang",question:"Pengeluaran mana yang paling perlu ditelusuri?",details:"Buku kas menunjukkan uang keluar Rp180.000, tetapi tidak ada kuitansi atau kas bon pendukung.",options:["Pengeluaran Rp180.000 tanpa bukti","Penjualan tunai yang punya nota","Saldo awal yang sudah cocok","Setoran yang sudah mendapat tanda terima"],answer:0,explain:"Pengeluaran tanpa bukti harus ditelusuri dan dilengkapi dokumen yang sah."},
    {level:1,title:"Soal 4 — Pengeluaran ganda",question:"Apa tindakan pertama saat menemukan biaya fotokopi tercatat dua kali?",details:"Satu kuitansi fotokopi Rp75.000 muncul dua kali di jurnal.",options:["Mencatatnya sekali lagi","Memeriksa bukti dan mengoreksi pencatatan ganda","Menghapus semua biaya","Mengubahnya menjadi pendapatan"],answer:1,explain:"Cocokkan jurnal dengan bukti asli, lalu koreksi entri ganda sesuai prosedur."},
    {level:1,title:"Soal 5 — Tanggal transaksi",question:"Nota bertanggal 28 Mei baru dicatat pada 2 Juni. Apa yang harus diperiksa?",details:"Periode laporan bulanan ditutup setiap akhir bulan.",options:["Warna nota","Apakah transaksi masuk ke periode yang tepat","Nama pemasok saja","Jumlah pohon di desa"],answer:1,explain:"Tanggal transaksi penting agar transaksi tercatat pada periode akuntansi yang benar."},
    {level:2,title:"Soal 3 — Selisih kas",question:"Catatan kas Rp920.000, uang fisik Rp870.000. Berapa selisihnya?",details:"Bandingkan saldo catatan dengan uang yang benar-benar tersedia.",options:["Rp50.000 shortage","Rp50.000 overage","Rp1.790.000 shortage","Rp870.000 overage"],answer:0,explain:"Rp920.000 − Rp870.000 = Rp50.000 shortage."},
    {level:2,title:"Soal 4 — Total penerimaan",question:"Ada penerimaan Rp250.000, Rp175.000, dan Rp125.000. Berapa totalnya?",details:"Ketiga penerimaan sudah memiliki bukti yang sah.",options:["Rp450.000","Rp500.000","Rp550.000","Rp600.000"],answer:2,explain:"Rp250.000 + Rp175.000 + Rp125.000 = Rp550.000."},
    {level:2,title:"Soal 5 — Kembalian",question:"Kasir menerima Rp200.000 untuk transaksi Rp164.000. Berapa kembalian?",details:"Anggap tidak ada biaya tambahan.",options:["Rp26.000","Rp34.000","Rp36.000","Rp46.000"],answer:2,explain:"Rp200.000 − Rp164.000 = Rp36.000."},
    {level:3,title:"Soal 3 — Bukti yang tepat",question:"Dokumen paling tepat untuk membuktikan pembelian tunai adalah…",details:"Toko membeli kertas dan membayar langsung.",options:["Kuitansi/nota pembelian","Poster promosi","Jadwal piket","Daftar hadir rapat"],answer:0,explain:"Nota atau kuitansi memuat rincian transaksi dan menjadi bukti pencatatan."},
    {level:3,title:"Soal 4 — Aset atau beban",question:"Desa membeli komputer untuk digunakan selama beberapa tahun. Akun yang paling sesuai?",details:"Komputer digunakan untuk operasional, bukan untuk dijual kembali.",options:["Pendapatan jasa","Aset peralatan","Utang gaji","Beban air"],answer:1,explain:"Komputer yang digunakan jangka panjang umumnya dicatat sebagai aset peralatan sesuai kebijakan akuntansi."},
    {level:3,title:"Soal 5 — Bukti setoran",question:"Bank menunjukkan setoran Rp400.000, tetapi buku kas mencatat Rp40.000. Apa yang diperiksa?",details:"Nominal pada bukti bank dan buku kas berbeda.",options:["Perbedaan nominal dan sumber salah input","Warna buku kas","Nama penjaga gerbang","Jumlah kursi kantor"],answer:0,explain:"Bandingkan bukti bank dan catatan; selisih nominalnya Rp360.000."},
    {level:4,title:"Soal 3 — Salah akun",question:"Pembayaran air dicatat sebagai biaya listrik. Jenis kesalahan ini adalah…",details:"Jumlah pembayaran sudah benar, tetapi akun yang dipilih salah.",options:["Transaksi terlewat","Salah klasifikasi akun","Bukti hilang","Kas lebih"],answer:1,explain:"Nominal benar tetapi masuk ke akun yang tidak sesuai, sehingga termasuk salah akun."},
    {level:4,title:"Soal 4 — Pola transaksi",question:"Setiap Jumat, satu penerimaan penjualan tidak pernah masuk jurnal. Pola apa yang terlihat?",details:"Pemeriksaan menunjukkan hal yang sama selama tiga minggu.",options:["Kesalahan berulang/transaksi terlewat","Semua laporan pasti benar","Bukti terlalu lengkap","Overage otomatis"],answer:0,explain:"Pola berulang menandakan proses pencatatan perlu diperiksa, terutama penerimaan hari Jumat."},
    {level:4,title:"Soal 5 — Rekonsiliasi",question:"Apa tujuan mencocokkan buku kas dengan rekening koran bank?",details:"Petugas ingin memastikan transaksi dan saldo cocok.",options:["Menghias laporan","Menemukan perbedaan dan memastikan catatan sesuai","Mengganti semua akun","Menghilangkan bukti transaksi"],answer:1,explain:"Rekonsiliasi membantu menemukan transaksi yang belum tercatat, biaya bank, atau kesalahan."},
    {level:5,title:"Soal 3 — Angka petunjuk",question:"Satu kuitansi Rp80.000 dan satu nota Rp120.000 belum dicatat. Berapa total yang terlewat?",details:"Gunakan hasil perhitungan sebagai angka petunjuk: dalam satuan puluhan ribu rupiah.",options:["10","15","20","25"],answer:2,explain:"Total Rp200.000, setara 20 satuan Rp10.000."},
    {level:5,title:"Soal 4 — Urutkan pemeriksaan",question:"Urutan kerja audit yang paling masuk akal adalah…",details:"Pilih proses yang membantu hasil audit bisa ditelusuri.",options:["Tebak hasil, hapus bukti, selesai","Kumpulkan bukti, cocokkan catatan, telusuri selisih, dokumentasikan koreksi","Koreksi dulu, cari bukti nanti","Abaikan transaksi kecil"],answer:1,explain:"Audit dimulai dari bukti, pencocokan, penelusuran selisih, lalu dokumentasi koreksi."},
    {level:5,title:"Soal 5 — Kode terakhir",question:"Tiga petunjuk menghasilkan angka 3, 5, dan 2. Jika angka terakhir dari selisih Rp540.000 adalah 7, apa kodenya?",details:"Susun angka sesuai urutan petunjuk yang diberikan.",options:["3527","3572","5327","7253"],answer:0,explain:"Urutan 3–5–2–7 menghasilkan kode 3527."}
  ];

  const say = (name, text) => {
    dialogName.textContent = name;
    dialogText.textContent = text;
    const welcome = name.includes("Alya") && text.includes("selamat datang di Desa Lumina");
    dialogEl.classList.add("welcome-dialog");
    const portraitFiles = {"Bu Rani":"bu_rani.png","Pak Danu":"pak_danu.png","Lani":"lani.png","Mira":"mira.png","Bimo":"bimo.png","Alya":"alya.png","Sari":"sari.png","Jalu":"jalu.png","Nenek Wati":"nenek_wati.png","Timo":"timo.png"};
    const speaker = Object.keys(portraitFiles).find(n => name.includes(n));
    dialogPortrait.src = speaker ? `assets/characters/${portraitFiles[speaker]}` : "assets/guide_portrait.png";
    dialogPortrait.alt = `Potret ${speaker || name}`;
    dialogPortrait.classList.remove("hidden");
    if (welcome) introRulesPending = true;
    dialogEl.classList.remove("hidden");
  };
  const hideDialog = () => {
    dialogEl.classList.add("hidden");
    // NPC penjaga level selalu memperkenalkan diri, menjelaskan masalahnya,
    // lalu baru membuka kuis setelah pemain membaca kedua dialog.
    if (pendingLevelIntro) {
      if (pendingLevelIntro.step === 0) {
        pendingLevelIntro.step = 1;
        say(pendingLevelIntro.npc.name + " · Level " + pendingLevelIntro.level,
          pendingLevelIntro.helpText);
        return;
      }
      const levelToStart = pendingLevelIntro.level;
      const blocked = pendingLevelIntro.blocked;
      const npcName = pendingLevelIntro.npc.name;
      pendingLevelIntro = null;
      if (blocked) {
        say(npcName + " · Urutan Misi", "Maaf, Detektif! Kita harus menyelesaikan Level " + (levelToStart-1) + " terlebih dahulu. Selesaikan misi sebelumnya, lalu kembali kepadaku. Aku akan menunggumu!");
        return;
      }
      dialogEl.classList.remove("welcome-dialog");
      dialogPortrait.classList.add("hidden");
      startQuiz(levelToStart);
      return;
    }
    if (endingDialogs.length) {
      const next = endingDialogs.shift();
      say(next.name, next.text);
      return;
    }
    if (introRulesPending) {
      introRulesPending = false;
      say("Alya · Peraturan Misi", "PERATURAN MISI: Setiap level memiliki 5 soal dan nilai maksimal 100 poin (20 poin per soal). Waktu total level 06:50; setiap soal memiliki batas 01:30. Jawab benar pada percobaan pertama mendapat 20 poin, percobaan kedua 15 poin, dan percobaan ketiga 10 poin. Jika tiga kali salah, soal mendapat 0 poin. Setiap jawaban salah mengurangi 15 detik dari waktu level dan waktu soal. Kamu punya maksimal 3 percobaan per soal. Setelah 3 jawaban salah, soal berikutnya terbuka. Jika waktu soal habis, soal dilewati tanpa poin. Jika waktu level habis, level langsung berakhir dan soal tersisa tidak mendapat poin. Tekan tombol untuk lanjut dan semoga berhasil, Detektif!");
    } else {
      if (dialogName.textContent.includes("Peraturan Misi")) { introSeen = true; saveGame(); }
      dialogEl.classList.remove("welcome-dialog");
      dialogPortrait.classList.add("hidden");
    }
  };
  document.getElementById("dialog-close").addEventListener("click", hideDialog);
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "Escape") hideDialog();
  });
  document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  const config = {
    type: Phaser.AUTO, parent: "game-container", width: W, height: H,
    pixelArt: true, roundPixels: true, backgroundColor: "#8dc66d",
    physics: { default: "arcade", arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: { preload, create, update }
  };
  new Phaser.Game(config);

  let scene, worldLayer, decoLayer, player, cursors, mapData, interior = null;
  let buildings = [], npcs = [], obstacles = [], interactables = [];
  let facing = "down", moving = false, walkTick = 0, nearThing = null, lastInteract = false;

  function preload() {}
  function create() {
    scene = this;
    this.cameras.main.setBackgroundColor("#8dc66d");
    makeTextures(this);
    drawVillage(this);
    makePlayer(this, Number.isFinite(savedGame.playerX) ? savedGame.playerX : 13*TILE, Number.isFinite(savedGame.playerY) ? savedGame.playerY : 17*TILE);
    cursors = this.input.keyboard.createCursorKeys();
    this.cameras.main.startFollow(player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, WORLD_W*TILE, WORLD_H*TILE);
    this.physics.world.setBounds(0,0,WORLD_W*TILE,WORLD_H*TILE);
    this.physics.add.collider(player, obstacles);
    this.input.keyboard.on("keydown-E", interact);
    this.input.keyboard.on("keydown-SPACE", interact);
    npcs.forEach(n => { n.talked = talkedNPCs.has(n.name); if (n.talked) n.exclamation.setVisible(false); });
    updateStats();
    updateMissionTracker();
    if (!introSeen) {
      say("Alya · Pemandu Desa", "Hai, selamat datang di Desa Lumina, Detektif! Aku Alya. Buku Kas Desa yang menyimpan dana Festival Panen telah hilang. Bimo membutuhkan bantuanmu: selesaikan lima misi audit dari Level 1 sampai Level 5, bicara dengan warga untuk mencari petunjuk, lalu temukan kode rahasia 3527. Mulailah dari Bu Rani di dekat Arsip Desa. Semoga berhasil!");
    } else {
      dialogEl.classList.add("hidden");
      dialogPortrait.classList.add("hidden");
    }
    saveGame();
  }

  function makeTextures(s) {
    const g = s.make.graphics({x:0,y:0,add:false});
    // Pixel character texture with a small backpack, face, hair and boots.
    g.clear();
    g.fillStyle(0x000000,0.20); g.fillEllipse(16,29,20,7);
    g.fillStyle(0x71462f); g.fillRect(8,21,7,9); g.fillRect(18,21,7,9);
    g.fillStyle(0x3e3028); g.fillRect(7,27,9,4); g.fillRect(17,27,9,4);
    g.fillStyle(0x4f8064); g.fillRect(5,13,22,12);
    g.fillStyle(0xb88945); g.fillRect(3,15,5,10); g.fillRect(21,15,6,8);
    g.fillStyle(0xe4bd78); g.fillRect(11,17,10,7);
    g.fillStyle(0xe9bd91); g.fillRect(8,5,17,13);
    g.fillStyle(0x5b3828); g.fillRect(7,3,19,7); g.fillRect(5,6,5,8); g.fillRect(22,7,4,5);
    g.fillStyle(0x30271f); g.fillRect(11,10,3,3); g.fillRect(19,10,3,3);
    g.fillStyle(0xffe5b6); g.fillRect(11,9,2,1); g.fillRect(19,9,2,1);
    g.fillStyle(0x9e5b4d); g.fillRect(15,14,4,1);
    g.generateTexture("hero",32,34); g.destroy();

    const p = s.make.graphics({x:0,y:0,add:false});
    // NPC
    p.fillStyle(0x000000,0.18);p.fillEllipse(16,29,20,7);
    p.fillStyle(0x5c4031);p.fillRect(8,21,7,9);p.fillRect(18,21,7,9);
    p.fillStyle(0x674f8a);p.fillRect(5,13,22,12);
    p.fillStyle(0xe9c39a);p.fillRect(8,5,17,13);
    p.fillStyle(0x7a4d31);p.fillRect(7,3,19,7);p.fillRect(5,7,5,7);
    p.fillStyle(0x322820);p.fillRect(11,10,3,3);p.fillRect(19,10,3,3);
    p.generateTexture("npc",32,34);p.destroy();

    // Alya: pemandu desa dengan rambut cokelat panjang yang terlihat jelas dari atas.
    const a = s.make.graphics({x:0,y:0,add:false});
    a.fillStyle(0x000000,0.2); a.fillEllipse(16,30,22,7);
    a.fillStyle(0x6a432c); a.fillRect(5,3,22,22); a.fillRect(4,8,5,17); a.fillRect(23,8,5,17); a.fillRect(7,17,4,10); a.fillRect(22,17,4,10);
    a.fillStyle(0xeac09a); a.fillRect(9,6,14,13);
    a.fillStyle(0x6a432c); a.fillRect(8,4,17,6); a.fillRect(7,8,4,8); a.fillRect(22,8,4,8);
    a.fillStyle(0x30271f); a.fillRect(11,11,2,3); a.fillRect(19,11,2,3);
    a.fillStyle(0xf4d8cf); a.fillRect(14,15,5,2);
    a.fillStyle(0x6b9eaf); a.fillRect(6,19,20,10); a.fillStyle(0xe9d6a4); a.fillRect(13,20,6,8);
    a.fillStyle(0x67412b); a.fillRect(8,27,6,4); a.fillRect(18,27,6,4);
    a.generateTexture("guide",32,36); a.destroy();

    const b = s.make.graphics({x:0,y:0,add:false});
    b.fillStyle(0x000000,0.16); b.fillRect(4,5,24,24);
    b.fillStyle(0xf0d4a0); b.fillRect(3,2,26,28);
    b.fillStyle(0xc38a59); b.fillRect(5,4,22,24);
    b.fillStyle(0x6a4631); b.fillRect(7,6,18,19);
    b.fillStyle(0xe8d1a3); b.fillRect(9,8,14,15);
    b.fillStyle(0x9ed5dd); b.fillRect(10,9,12,11);
    b.fillStyle(0xede5c7); b.fillRect(15,9,2,11); b.fillRect(10,14,12,2);
    b.generateTexture("window",32,32); b.destroy();

    const d = s.make.graphics({x:0,y:0,add:false});
    d.fillStyle(0x000000,0.22); d.fillEllipse(16,29,27,7);
    d.fillStyle(0x765034); d.fillRect(13,17,7,14); d.fillRect(10,24,4,6); d.fillRect(18,23,4,7);
    // Kanopi bertingkat dengan highlight dan bayangan agar terlihat seperti tileset pixel.
    d.fillStyle(0x356b43); d.fillRect(7,9,18,16); d.fillRect(3,13,9,10); d.fillRect(20,12,9,11); d.fillRect(9,5,14,8);
    d.fillStyle(0x4f8a4e); d.fillRect(6,8,18,13); d.fillRect(4,13,8,8); d.fillRect(20,13,7,7); d.fillRect(10,4,12,8);
    d.fillStyle(0x72ad58); d.fillRect(8,7,7,5); d.fillRect(16,5,5,4); d.fillRect(5,13,5,4); d.fillRect(20,14,5,4);
    d.fillStyle(0x9bca69); d.fillRect(10,8,3,2); d.fillRect(17,7,2,2); d.fillRect(7,14,2,2);
    d.fillStyle(0x2f603e); d.fillRect(14,17,7,5); d.fillRect(9,19,5,3); d.fillRect(22,17,3,4);
    d.generateTexture("tree",32,32);d.destroy();

    const bush = s.make.graphics({x:0,y:0,add:false});
    bush.fillStyle(0x000000,0.16); bush.fillEllipse(16,27,26,6);
    bush.fillStyle(0x2f6941); bush.fillRect(5,15,22,11); bush.fillRect(2,18,8,7); bush.fillRect(21,17,9,8);
    bush.fillStyle(0x4e8b4b); bush.fillRect(6,12,20,12); bush.fillRect(3,16,8,8); bush.fillRect(21,15,8,8);
    bush.fillStyle(0x7ab65a); bush.fillRect(8,13,5,3); bush.fillRect(17,12,4,3); bush.fillRect(23,17,3,2);
    bush.fillStyle(0xc64f57); bush.fillRect(10,19,3,3); bush.fillRect(21,20,3,3);
    bush.generateTexture("bush",32,32); bush.destroy();

    const rock = s.make.graphics({x:0,y:0,add:false});
    rock.fillStyle(0x000000,0.16); rock.fillEllipse(16,26,24,6);
    rock.fillStyle(0x777f75); rock.fillRect(6,17,20,9); rock.fillRect(9,12,14,10); rock.fillRect(13,9,7,5);
    rock.fillStyle(0xa8b1a1); rock.fillRect(10,14,7,5); rock.fillRect(14,11,4,3);
    rock.fillStyle(0x626b64); rock.fillRect(20,19,4,5); rock.generateTexture("rock",32,32); rock.destroy();

    const f = s.make.graphics({x:0,y:0,add:false});
    f.fillStyle(0x8b6243);f.fillRect(2,2,28,28);
    f.fillStyle(0x5d9b4c);f.fillRect(4,4,24,24);
    [[8,9,0xf7c96d],[18,7,0xf1a1b9],[13,18,0xfff0d0],[22,21,0xd4a6ef],[7,23,0xf0a2a2]].forEach(a=>{f.fillStyle(a[2]);f.fillRect(a[0],a[1],4,4);f.fillRect(a[0]+1,a[1]-2,2,2)});
    f.generateTexture("flowers",32,32);f.destroy();

    const n = s.make.graphics({x:0,y:0,add:false});
    n.fillStyle(0x000000,0.18);n.fillEllipse(16,29,23,6);
    n.fillStyle(0x79523b);n.fillRect(3,15,26,14);
    n.fillStyle(0xd6b77a);n.fillRect(5,12,22,14);
    n.fillStyle(0x4e7b70);n.fillRect(7,15,18,8);
    n.fillStyle(0xf0d7a1);n.fillRect(9,17,14,4);
    n.generateTexture("sign",32,32);n.destroy();
  }

  function drawVillage(s) {
    worldLayer = s.add.container(0,0);
    decoLayer = s.add.container(0,0);
    // base grass tiles with tiny variation and pixel speckles
    for(let y=0;y<WORLD_H;y++) for(let x=0;x<WORLD_W;x++) {
      let color = ((x*13+y*7)%9===0)?0x8ac366:(((x*3+y*11)%13===0)?0x96ce72:0x8fc96b);
      const r=s.add.rectangle(x*TILE+16,y*TILE+16,TILE,TILE,color).setOrigin(.5);
      worldLayer.add(r);
      if((x*17+y*23)%11===0) {
        const speck=s.add.rectangle(x*TILE+7+(x%3)*7,y*TILE+9+(y%3)*6,2,3,0x6fac5a);
        decoLayer.add(speck);
      }
    }
    // curving-ish main path, with warm soil and pebbles
    for(let x=0;x<WORLD_W;x++) {
      const yy=Math.round(18 + Math.sin(x/4)*1.2);
      pathTile(s,x,yy);
      pathTile(s,x,yy+1);
    }
    for(let y=7;y<44;y++) { pathTile(s,14,y); pathTile(s,15,y); }
    // Jalur cabang menuju peternakan, bengkel, kebun komunal, dan hutan timur.
    for(let x=14;x<61;x++) { pathTile(s,x,32); pathTile(s,x,33); }
    for(let y=18;y<33;y++) { pathTile(s,30,y); pathTile(s,31,y); }
    for(let x=30;x<55;x++) { pathTile(s,x,24); pathTile(s,x,25); }
    for(let x=8;x<23;x++){pathTile(s,x,11);pathTile(s,x,12);}
    // pond at northeast
    s.add.ellipse(35*TILE,8*TILE,8*TILE,5*TILE,0x5b9eaa).setDepth(1);
    s.add.ellipse(35*TILE,8*TILE,7.4*TILE,4.4*TILE,0x78c6d0).setDepth(1);
    s.add.ellipse(35*TILE,8*TILE,6.5*TILE,3.5*TILE,0x8bd6d9).setDepth(1);
    for(let i=0;i<10;i++){
      const rx=(31+(i*7%9))*TILE, ry=(6+(i*5%5))*TILE;
      s.add.rectangle(rx,ry,16,3,0xc2ece0).setDepth(2).setAngle(-12);
    }
    // flower beds, lamps, fences, rocks and shrubs
    [[6,8],[9,9],[21,8],[25,16],[30,21],[40,14],[8,25],[22,25],[37,25]].forEach(([x,y])=>decoLayer.add(s.add.image(x*TILE,y*TILE,"flowers").setDepth(y*TILE)));
    // Rumpun semak, batu kecil, dan jamur ditempatkan di tepi rumput, bukan di tengah jalur.
    [[3,9],[6,17],[9,31],[22,15],[26,28],[34,17],[42,12],[44,23],[48,27],[58,17],[59,30],[16,40],[23,38],[36,36],[46,40],[57,41]].forEach(([x,y],i)=>{
      const obj=s.add.image(x*TILE+16,y*TILE+16,i%3===0?"rock":"bush").setScale(i%3===0?0.85:0.95).setDepth(y*TILE+14);
      decoLayer.add(obj);
    });
    for(let x=25;x<31;x++){fence(s,x,15);fence(s,x,22)}
    for(let y=15;y<=22;y++){fence(s,25,y);fence(s,30,y)}
    for(let x=2;x<7;x++) { fence(s,x,26); fence(s,x,30); }
    [[11,7],[20,14],[31,12],[42,19],[6,20]].forEach(([x,y])=>lamp(s,x,y));
    // trees around boundaries and as small groves
    const treeSpots=[];
    for(let x=0;x<WORLD_W;x++){treeSpots.push([x,0],[x,WORLD_H-1]);}
    for(let y=1;y<WORLD_H-1;y++){treeSpots.push([0,y],[WORLD_W-1,y]);}
    [[3,4],[5,4],[7,5],[8,4],[23,4],[25,4],[27,4],[42,5],[43,6],[42,7],[3,22],[4,22],[5,23],[40,27],[42,27],[43,28],[37,31],[39,31],[12,30],[13,30],[17,28],[18,29],[33,26],[34,27],[35,27],[8,34],[10,35],[12,36],[15,38],[18,36],[22,34],[25,37],[29,39],[32,35],[36,38],[40,36],[44,34],[48,38],[52,35],[55,37],[58,33],[5,14],[7,16],[4,18],[27,8],[29,9],[31,7],[46,10],[48,12],[50,13],[55,18],[58,20],[60,22],[45,26],[49,28],[53,29],[57,27],[22,18],[24,19],[27,18],[30,28],[31,30],[26,32]].forEach(p=>treeSpots.push(p));
    // Tambahan rumpun pohon, tetapi saring tile jalur, bangunan, kolam, hewan dan NPC
    // agar pohon tidak muncul menutupi jalan atau pintu.
    for(let y=2;y<WORLD_H-2;y+=3) for(let x=2;x<WORLD_W-2;x+=4) {
      if(((x*7+y*11)%5)!==0) treeSpots.push([x,y]);
    }
    const buildingRects = [
      [8,5,4,4],[17,5,4,4],[17,23,5,4],[31,20,4,4],[37,13,4,4],
      [45,5,4,4],[50,19,4,4],[8,37,5,4],[28,39,4,4],[51,38,5,4]
    ];
    const npcTiles = [[11,10],[23,29],[40,18],[46,20],[17,22],[13,15],[54,16],[56,25],[20,34],[39,41]];
    const animalTiles = [[5,28],[8,29],[17,35],[20,36],[24,35],[35,10],[47,31],[56,13],[31,44]];
    const isPath = (x,y) => {
      const mainY=Math.round(18+Math.sin(x/4)*1.2);
      return (Math.abs(y-mainY)<=2) || ((x===14||x===15)&&y>=7&&y<44) || ((y===32||y===33)&&x>=14&&x<61) || ((x===30||x===31)&&y>=18&&y<33) || ((y===24||y===25)&&x>=30&&x<55) || ((y===11||y===12)&&x>=8&&x<23);
    };
    const blockedForTree = (x,y) => isPath(x,y) || (x>=31&&x<=39&&y>=5&&y<=10) ||
      buildingRects.some(([bx,by,bw,bh])=>x>=bx-1&&x<=bx+bw&&y>=by-1&&y<=by+bh+1) ||
      npcTiles.some(([nx,ny])=>Math.abs(x-nx)<=1&&Math.abs(y-ny)<=1) || animalTiles.some(([ax,ay])=>Math.abs(x-ax)<=2&&Math.abs(y-ay)<=2) ||
      (x>=6&&x<=20&&y>=31&&y<=36) || (x>=32&&x<=37&&y>=30&&y<=34);
    const uniqueTrees = [...new Map(treeSpots.filter(([x,y])=>x>0&&y>0&&x<WORLD_W-1&&y<WORLD_H-1&&!blockedForTree(x,y)).map(([x,y])=>[`${x},${y}`,[x,y]])).values()];
    uniqueTrees.forEach(([x,y])=>{
      const t=s.add.image(x*TILE+16,y*TILE+16,"tree").setDepth(y*TILE+20);
      obstacles.push(s.add.zone(x*TILE+16,y*TILE+23,17,12).setRectangleDropZone(17,12).setVisible(false));
      t.setScale(1.45);
    });
    // buildings placed over path edges
    addBuilding(s,{x:8,y:5,w:4,h:4,name:"Arsip Desa",roof:0x9a5c52,wall:0xe7c990,door:0x69472f,kind:"archive",desc:"Rak arsip berisi kuitansi lama dan catatan pemasukan."});
    addBuilding(s,{x:17,y:5,w:4,h:4,name:"Toko Roti & ATK",roof:0xc56f52,wall:0xf0d3a0,door:0x6b4930,kind:"shop",desc:"Rak alat tulis, roti hangat, dan buku transaksi toko."});
    addBuilding(s,{x:17,y:23,w:5,h:4,name:"Balai Desa",roof:0x698f83,wall:0xe7dcb8,door:0x6a4830,kind:"hall",desc:"Tempat warga berkumpul dan membahas keuangan desa."});
    addBuilding(s,{x:31,y:20,w:4,h:4,name:"Rumah Warga",roof:0x8b72a9,wall:0xf0d0bc,door:0x684632,kind:"home",desc:"Rumah kecil yang hangat. Ada meja dan catatan belanja."});
    addBuilding(s,{x:37,y:13,w:4,h:4,name:"Bank Pixel",roof:0x699b70,wall:0xdce8c9,door:0x684632,kind:"bank",desc:"Loket bank menyimpan catatan setoran dan penarikan."});
    addBuilding(s,{x:45,y:5,w:4,h:4,name:"Perpustakaan",roof:0x587d9b,wall:0xe4d6b4,door:0x684632,kind:"library",desc:"Perpustakaan desa menyimpan buku besar lama dan catatan sejarah kas."});
    addBuilding(s,{x:50,y:19,w:4,h:4,name:"Klinik Hewan",roof:0x6a9d86,wall:0xf0dfbd,door:0x684632,kind:"clinic",desc:"Klinik kecil merawat hewan desa. Ada catatan pembelian pakan yang perlu diperiksa."});
    addBuilding(s,{x:8,y:37,w:5,h:4,name:"Peternakan",roof:0xa16d52,wall:0xe8c99b,door:0x684632,kind:"farm",desc:"Peternakan memasok telur dan susu ke toko. Periksa catatan penjualan hasil ternak."});
    addBuilding(s,{x:28,y:39,w:4,h:4,name:"Bengkel Kayu",roof:0x8b744c,wall:0xe5c69a,door:0x684632,kind:"workshop",desc:"Bengkel membuat bangku dan pagar. Nota pembelian kayunya mungkin menyimpan petunjuk."});
    addBuilding(s,{x:51,y:38,w:5,h:4,name:"Kebun Komunal",roof:0x789b5a,wall:0xdce5b8,door:0x684632,kind:"garden",desc:"Kebun warga mencatat hasil panen, penjualan sayur, dan biaya bibit."});
    // signposts and NPCs
    const sign1=s.add.image(13*TILE,13*TILE,"sign").setDepth(13*TILE);
    sign1.setScale(1.2);
    // Lima penjaga level: masing-masing menguji satu level berisi lima soal.
    addNPC(s,11*TILE,10*TILE,"Bu Rani","Penjaga Level 1 · Cari Kesalahan","Selamat datang, auditor muda! Mulai dari Level 1: cari transaksi yang salah atau mencurigakan.",1);
    addNPC(s,23*TILE,29*TILE,"Pak Danu","Penjaga Level 2 · Hitung Selisih","Untuk Level 2, bandingkan angka pada catatan dengan uang fisik. Tekan E untuk menjawab lima soal.",2);
    addNPC(s,40*TILE,18*TILE,"Lani","Penjaga Level 3 · Periksa Bukti","Level 3 menguji ketelitianmu memeriksa nota, kuitansi, dan akun yang tepat.",3);
    addNPC(s,46*TILE,20*TILE,"Mira","Penjaga Level 4 · Cari Pola","Di Level 4, cari pola kesalahan dan tentukan langkah pemeriksaan yang masuk akal.",4);
    addNPC(s,17*TILE,22*TILE,"Bimo","Penjaga Level 5 · Pecahkan Kode","Level terakhir! Jawab lima tantangan dan gunakan logika audit untuk membuka kode rahasia.",5);
    // Lima warga pemberi petunjuk: mereka membantu menemukan para penjaga level.
    addNPC(s,13*TILE,15*TILE,"Alya","Pemandu Desa","Aku akan membantumu, Detektif! Petunjuk pertama: Bu Rani menjaga Level 1 di dekat Arsip Desa. Dekati warga bertanda seru dan tekan E untuk bicara.");
    addNPC(s,54*TILE,16*TILE,"Sari","Pustakawati","Petunjuk: penjaga Level 2 sering mengecek angka di sekitar Balai Desa. Selisih = catatan dikurangi uang fisik, lalu tentukan shortage atau overage.");
    addNPC(s,56*TILE,25*TILE,"Jalu","Penggembala","Petunjuk: cari penjaga Level 3 di dekat Bank Pixel. Nota dan kuitansi adalah bukti transaksi; cocokkan nominalnya.");
    addNPC(s,20*TILE,34*TILE,"Nenek Wati","Peracik Teh","Petunjuk: penjaga Level 4 berada di sisi timur desa. Salah akun, transaksi terlewat, dan bukti tidak lengkap adalah tiga masalah berbeda.");
    addNPC(s,39*TILE,41*TILE,"Timo","Petani Muda","Petunjuk terakhir: penjaga Level 5 menunggu di sekitar Balai Desa. Kumpulkan empat angka petunjuk dengan urutan yang benar untuk memperoleh kode 3527.");
    addAnimals(s);
    // remove any overlap from decorative ordering by depth
    s.add.text(27*TILE,17*TILE,"DESA LUMINA",{fontFamily:"monospace",fontSize:"14px",color:"#fff1cb",stroke:"#4b6041",strokeThickness:4}).setOrigin(.5).setDepth(100);
  }

  function addAnimals(s) {
    // Hewan desa kecil dengan gerakan santai; dibuat dari bentuk pixel sederhana.
    const specs = [
      [5,28,"chicken",0xf7f0dc],[8,29,"chicken",0xf7f0dc],
      [17,35,"cow",0xf4eee1],[20,36,"sheep",0xf1ead9],[24,35,"cat",0xd99a61],
      [35,10,"duck",0xf0d35c],[47,31,"sheep",0xf1ead9],[56,13,"cow",0xf4eee1],[31,44,"cat",0x8b8b94]
    ];
    specs.forEach(([tx,ty,type,color],i)=>{
      const c=scene.add.container(tx*TILE,ty*TILE).setDepth(ty*TILE+12);
      const shadow=scene.add.ellipse(2,9,23,8,0x41583a,0.22);
      const body=scene.add.ellipse(0,0,type==="cow"?25:18,type==="cow"?17:14,color);
      c.add([shadow,body]);
      // Kaki kecil dan detail wajah agar tiap hewan mudah dikenali.
      [-7,5].forEach(lx=>c.add(scene.add.rectangle(lx,7,4,7,type==="cat"?0xb47a4c:0x796348)));
      if(type==="cow") {
        c.add(scene.add.rectangle(-5,-2,6,5,0x4b4038)); c.add(scene.add.rectangle(6,3,6,5,0x4b4038));
        c.add(scene.add.ellipse(12,-3,10,9,color)); c.add(scene.add.circle(14,-4,1.5,0x302b28));
        c.add(scene.add.triangle(9,-9,0,5,3,0,6,5,0xd8b58a)); c.add(scene.add.triangle(15,-9,0,5,3,0,6,5,0xd8b58a));
      }
      if(type==="chicken"||type==="duck") {
        c.add(scene.add.ellipse(7,-6,11,10,color)); c.add(scene.add.triangle(14,-6,0,0,6,2,0,4,0xe8a34b));
        c.add(scene.add.rectangle(7,-12,4,4,type==="duck"?0xe4a62f:0xd65d52)); c.add(scene.add.circle(9,-7,1.4,0x302b28));
      }
      if(type==="cat") {
        c.add(scene.add.triangle(4,-8,0,8,4,0,8,8,0xd99a61)); c.add(scene.add.triangle(11,-8,0,8,4,0,8,8,0xd99a61));
        c.add(scene.add.circle(6,-2,1.4,0x302b28)); c.add(scene.add.circle(11,-2,1.4,0x302b28));
        c.add(scene.add.line(0,0,14,3,20,0,0x9c6c50));
      }
      if(type==="sheep") { [-7,-1,5].forEach(x=>c.add(scene.add.circle(x,-4,6,0xffffff))); c.add(scene.add.circle(10,-3,4,0xd4c8b6)); c.add(scene.add.circle(11,-4,1,0x302b28)); }
      c.setScale(0.9);
      // Hewan bergerak pendek di area rumput masing-masing, tidak melintasi jalan utama.
      scene.tweens.add({targets:c,x:c.x+(i%2?10:-10),y:c.y+(i%3===0?4:-3),duration:2400+(i%3)*500,yoyo:true,repeat:-1,ease:"Sine.easeInOut",delay:i*180});
    });
  }

  function pathTile(s,x,y) {
    const c=((x*5+y*3)%4===0)?0xc4a071:(((x+y)%3===0)?0xd0ae7d:0xc9a779);
    const r=s.add.rectangle(x*TILE+16,y*TILE+16,TILE,TILE,c).setOrigin(.5).setDepth(2);
    decoLayer.add(r);
    if((x+y)%4===0) decoLayer.add(s.add.rectangle(x*TILE+9,y*TILE+13,3,2,0xa8865d).setDepth(3));
  }
  function fence(s,x,y) {
    const c=s.add.container(x*TILE,y*TILE);
    c.add(s.add.rectangle(16,17,32,7,0x8b5d3d));
    c.add(s.add.rectangle(16,8,5,17,0xb88454));
    c.add(s.add.rectangle(5,8,5,17,0xb88454));
    c.add(s.add.rectangle(27,8,5,17,0xb88454));
    c.setDepth(y*TILE+10);decoLayer.add(c);
  }
  function lamp(s,x,y) {
    const c=s.add.container(x*TILE,y*TILE);
    c.add(s.add.rectangle(16,20,4,24,0x684a32));
    c.add(s.add.rectangle(16,6,18,13,0xf4d982));
    c.add(s.add.rectangle(16,6,10,8,0xfff0b1));
    c.add(s.add.rectangle(16,0,22,3,0x6e4e34));
    c.setDepth(y*TILE+10);decoLayer.add(c);
  }

  function addBuilding(s,b) {
    const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE;
    const g=s.add.container(x,y);
    // foundation and cast shadow
    g.add(s.add.rectangle(w/2+7,h/2+12,w+12,h+12,0x3f573d,0.35));
    g.add(s.add.rectangle(w/2,h/2+8,w+4,h+4,0x78543a));
    // wall base, side shadows, wall panels
    g.add(s.add.rectangle(w/2,h/2,w,h,b.wall));
    g.add(s.add.rectangle(5,h/2,w*0.04,h,0xffffff,0.18));
    g.add(s.add.rectangle(w-5,h/2,w*0.04,h,0x7b523b,0.16));
    for(let xx=16;xx<w;xx+=28)g.add(s.add.rectangle(xx,h/2,2,h-8,0xb28b61,0.32));
    // gable roof with stepped pixel rows
    g.add(s.add.rectangle(w/2,4,w+20,18,b.roof));
    g.add(s.add.rectangle(w/2,14,w+12,16,b.roof));
    g.add(s.add.rectangle(w/2,24,w+4,12,b.roof));
    g.add(s.add.rectangle(w/2,30,w,7,b.roof));
    // roof highlights, shingles
    for(let yy=1;yy<27;yy+=8){
      for(let xx=6+(yy%2)*8;xx<w;xx+=24)g.add(s.add.rectangle(xx,yy,13,3,Phaser.Display.Color.ValueToColor(b.roof).lighten(16).color));
    }
    // windows
    [w*.25,w*.75].forEach(wx=>{
      g.add(s.add.rectangle(wx,h*.48,28,29,0x6a4731));
      g.add(s.add.rectangle(wx,h*.48,21,22,0x9dd5db));
      g.add(s.add.rectangle(wx,h*.48,3,22,0xf2e3c4));
      g.add(s.add.rectangle(wx,h*.48,21,3,0xf2e3c4));
      g.add(s.add.rectangle(wx,h*.48+14,33,4,0x8b603d));
    });
    // door in front center
    g.add(s.add.rectangle(w/2,h-22,25,44,b.door));
    g.add(s.add.rectangle(w/2,h-22,17,36,0x986843));
    g.add(s.add.rectangle(w/2+5,h-23,3,3,0xf4d47b));
    // lintel and doorstep
    g.add(s.add.rectangle(w/2,h-45,31,5,0x71472f));
    g.add(s.add.rectangle(w/2,h+2,37,7,0xd0b18a));
    // name plaque
    g.add(s.add.rectangle(w/2,42,Math.min(w-12,b.name.length*6+16),15,0x514435));
    g.add(s.add.text(w/2,42,b.name,{fontFamily:"monospace",fontSize:"8px",color:"#fff0c8"}).setOrigin(.5));
    g.setDepth(y+h+15);
    b.bounds={x,y,w,h}; b.centerX=x+w/2; b.frontY=y+h+7; b.visual=g;
    buildings.push(b);
    interactables.push({x:b.centerX,y:b.frontY,kind:"building",data:b});
    // collision rectangles: body of building, leaving front door approach open
    obstacles.push(s.add.zone(x+w/2,y+h/2,w,h-24).setRectangleDropZone(w,h-24).setVisible(false));
  }

  function addNPC(s,x,y,name,role,text,level=null) {
    const npc=s.physics.add.sprite(x,y,name==="Alya"?"guide":"npc");
    npc.setDepth(y+20); npc.body.setSize(18,18).setOffset(7,12);
    npc.name=name;npc.role=role;npc.dialog=text;npc.isNPC=true;npc.level=level;
    npcs.push(npc);
    const ex=s.add.text(x,y-34,"!",{fontFamily:"monospace",fontSize:"18px",fontStyle:"bold",color:"#ffe58b",stroke:"#57412b",strokeThickness:4}).setOrigin(.5).setDepth(y+30);
    npc.exclamation=ex;
    if (level) {
      const label = s.add.text(x, y-48, `${name} · LVL ${level}`, {fontFamily:"monospace",fontSize:"9px",fontStyle:"bold",color:"#fff2c8",backgroundColor:"#294638",padding:{x:4,y:3},stroke:"#172820",strokeThickness:2}).setOrigin(.5).setDepth(y+31);
      npc.nameLabel = label;
    }
    s.tweens.add({targets:ex,y:y-39,duration:550,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
  }

  function makePlayer(s,x,y) {
    player=s.physics.add.sprite(x,y,"hero");
    player.setDepth(y+25);
    player.body.setSize(17,15).setOffset(7,17);
    player.setCollideWorldBounds(true);
    player.speed=145;
    // placeholder collision groups use overlap checks for more reliable map movement
  }

  function update(time,delta) {
    if(!player || !dialogEl.classList.contains("hidden") || !quizPanel.classList.contains("hidden")) { if(player) player.setVelocity(0,0); return; }
    let vx=0,vy=0;
    if(keys.a||keys.arrowleft)vx=-1;
    if(keys.d||keys.arrowright)vx=1;
    if(keys.w||keys.arrowup)vy=-1;
    if(keys.s||keys.arrowdown)vy=1;
    if(vx&&vy){vx*=0.7071;vy*=0.7071;}
    moving=!!(vx||vy);
    player.setVelocity(vx*player.speed,vy*player.speed);
    if(moving) {
      facing=Math.abs(vx)>Math.abs(vy)?(vx<0?"left":"right"):(vy<0?"up":"down");
      walkTick+=delta;
      player.y=Math.round(player.y);
      if(Math.floor(walkTick/150)%2===1) player.setScale(1,0.96); else player.setScale(1,1);
    } else {walkTick=0;player.setScale(1,1);}
    // depth sort: player and NPCs should render in front/behind based on Y
    player.setDepth(player.y+25);
    npcs.forEach(n=>n.setDepth(n.y+20));
    if(interior) {
      if(Phaser.Math.Distance.Between(player.x,player.y,interior.exitX,interior.exitY)<54) {
        nearThing={kind:"exit",data:interior};
      } else nearThing=null;
    } else {
      nearThing=null;
      for(const n of npcs) if(Phaser.Math.Distance.Between(player.x,player.y,n.x,n.y)<52){nearThing={kind:"npc",data:n};break;}
      if(!nearThing) for(const b of buildings) if(Phaser.Math.Distance.Between(player.x,player.y,b.centerX,b.frontY)<78){nearThing={kind:"building",data:b};break;}
    }
    if(nearThing) {
      const prompt=nearThing.kind==="npc" ? `E · Bicara dengan ${nearThing.data.name}` : nearThing.kind==="building" ? `E · Masuk ${nearThing.data.name}` : "E · Keluar ke desa";
      sceneLabel.textContent=prompt;
    } else sceneLabel.textContent=interior?interior.name:"Desa Lumina";
    // keep obstacles solid using Arcade overlap correction
    if(!interior) {
      for(const o of obstacles) {
        if(!o.active) continue;
        const bounds=o.getBounds();
        if(Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(),bounds)) {
          const dx=(player.x-(bounds.left+bounds.width/2));
          const dy=(player.y-(bounds.top+bounds.height/2));
          if(Math.abs(dx)>Math.abs(dy)) player.x += Math.sign(dx)*2.5; else player.y += Math.sign(dy)*2.5;
        }
      }
    } else {
      // interior furniture collisions
      for(const box of interior.furniture) {
        if(Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(),box)) {
          player.x -= vx*3; player.y -= vy*3;
        }
      }
      if(player.x<30)player.x=30;if(player.x>W-30)player.x=W-30;
      if(player.y<35)player.y=35;if(player.y>H-35)player.y=H-35;
    }
  }

  function interact() {
    if(!dialogEl.classList.contains("hidden")) { hideDialog(); return; }
    if(!nearThing) { say("Tidak ada interaksi","Dekati warga atau pintu bangunan sampai nama interaksi muncul di bagian atas."); return; }
    if(nearThing.kind==="npc") {
      if(nearThing.data.level) {
        const npc = nearThing.data;
        const level = npc.level;
        if(completedLevels.has(level)) {
          say(npc.name, level===5 && completedLevels.size===5 ? "Detektif, kamu berhasil! Semua lima level selesai. Buku Kas Desa berhasil dipulihkan dan kode rahasianya 3527. Festival Panen terselamatkan!" : `Level ${level} sudah selesai. Terima kasih sudah membantu Desa Lumina!`);
          return;
        }
        const introductions = {
          1: {intro:"Halo, Detektif! Namaku Bu Rani, penjaga arsip dan bendahara Desa Lumina. Aku bertanggung jawab memastikan setiap transaksi dicatat dengan benar.", help:"Aku butuh bantuanmu memeriksa salah pencatatan. Ada transaksi yang belum dimasukkan, biaya yang mungkin tercatat ganda, dan pembayaran yang masuk ke akun keliru. Bantu aku menemukan kesalahan sebelum laporan kas festival disahkan. Siap? Tekan Lanjutkan untuk mulai Level 1 — Cari Kesalahan."},
          2: {intro:"Salam kenal, Detektif! Aku Pak Danu, pengelola kas kecil desa. Aku selalu mencocokkan uang fisik dengan saldo yang tertulis di buku kas.", help:"Hari ini jumlah uang di laci kas tidak selalu cocok dengan catatan. Tolong hitung selisihnya dan tentukan apakah terjadi shortage (kekurangan) atau overage (kelebihan). Kita mulai Level 2 — Hitung Selisih."},
          3: {intro:"Hai! Aku Lani, petugas pemeriksa bukti transaksi di Bank Pixel. Aku menyimpan nota, kuitansi, dan dokumen pembayaran desa.", help:"Beberapa transaksi tidak cocok dengan bukti, dan ada pembelian yang belum tercatat. Bantu aku menemukan bukti yang bermasalah, memeriksa nominal, dan memilih akun yang tepat. Bersiap untuk Level 3 — Periksa Bukti."},
          4: {intro:"Senang bertemu denganmu, Detektif. Namaku Mira, auditor yang mencari pola kesalahan di laporan keuangan Desa Lumina.", help:"Aku menemukan masalah yang berulang: transaksi terlewat, akun yang tertukar, dan dokumen yang tidak lengkap. Bantu aku mencocokkan setiap kasus dengan jenis kesalahan yang benar. Mari mulai Level 4 — Cari Pola."},
          5: {intro:"Akhirnya kamu datang! Aku Bimo, ketua tim audit festival. Aku sedang menyelidiki hilangnya Buku Kas Desa dan butuh detektif yang teliti.", help:"Petunjuk dari warga sudah mengarah pada empat angka rahasia. Selesaikan tantangan terakhir, gunakan hasil pemeriksaan sebelumnya, lalu susun kode untuk membuka kotak arsip. Ini Level 5 — Pecahkan Kode. Semoga kita bisa menemukan Buku Kas sebelum festival dimulai!"}
        };
        const script = introductions[level];
        const blocked = level > 1 && !completedLevels.has(level - 1);
        const helpText = blocked
          ? `Aku sebenarnya membutuhkan bantuanmu untuk Level ${level}, tetapi kita harus mengikuti urutan penyelidikan. Kamu belum menyelesaikan Level ${level-1}. Selesaikan misi sebelumnya terlebih dahulu, lalu kembali kepadaku. Aku akan menunggumu!`
          : script.help;
        pendingLevelIntro = {level, npc, step:0, helpText, blocked};
        say(npc.name+" · "+npc.role,script.intro);
        if(!npc.talked) {npc.talked=true;talkedNPCs.add(npc.name);score+=10;clues+=1;updateStats();saveGame();}
        return;
      }
      say(nearThing.data.name+" · "+nearThing.data.role,nearThing.data.dialog);
      if(!nearThing.data.talked) {nearThing.data.talked=true;talkedNPCs.add(nearThing.data.name);score+=10;clues+=1;updateStats();saveGame();}
    } else if(nearThing.kind==="building") enterBuilding(nearThing.data);
    else if(nearThing.kind==="exit") exitBuilding();
  }

  function enterBuilding(b) {
    interior={name:b.name,kind:b.kind,desc:b.desc,exitX:W/2,exitY:H-72,furniture:[]};
    // hide exterior layers and sprites but preserve their positions/state
    worldLayer.setVisible(false);decoLayer.setVisible(false);
    buildings.forEach(x=>x.visual && x.visual.setVisible(false));
    npcs.forEach(n=>{n.setVisible(false);n.exclamation.setVisible(false);if(n.nameLabel)n.nameLabel.setVisible(false);});
    player.setPosition(W/2,H-115); player.setVelocity(0,0);
    scene.physics.world.setBounds(0,0,W,H);
    scene.cameras.main.stopFollow();scene.cameras.main.setBounds(0,0,W,H);scene.cameras.main.centerOn(W/2,H/2);
    drawInterior(b);
    sceneLabel.textContent=b.name;
    say(b.name,b.desc+" Jelajahi ruangan, lalu dekati pintu bawah dan tekan E untuk keluar.");
  }

  function drawInterior(b) {
    const c=scene.add.container(0,0).setDepth(1);
    c.add(scene.add.rectangle(W/2,H/2,W,H,0xd8b98a));
    // plank floor, alternating wood rows
    for(let y=0;y<H;y+=30) {
      c.add(scene.add.rectangle(W/2,y+15,W-20,26,y%60===0?0xd9b17c:0xe3bf8c));
      c.add(scene.add.rectangle(W/2,y+29,W-20,2,0xb8895b));
      for(let x=25+(y%60);x<W;x+=100)c.add(scene.add.rectangle(x,y+15,2,25,0xc79b69));
    }
    // walls, trim, wallpaper
    c.add(scene.add.rectangle(W/2,28,W,56,interiorWall(b.kind)));
    for(let x=20;x<W;x+=42)c.add(scene.add.rectangle(x,15,3,4,0xf8e5bd));
    c.add(scene.add.rectangle(W/2,58,W,7,0x8a5d3c));
    c.add(scene.add.rectangle(W/2,74,W,20,0xb88457));
    // windows and window highlights
    [125, W-125].forEach(x=>{
      c.add(scene.add.rectangle(x,38,68,43,0x704b33));
      c.add(scene.add.rectangle(x,37,58,34,0x8fd0d5));
      c.add(scene.add.rectangle(x,37,4,34,0xf8e8c7));
      c.add(scene.add.rectangle(x,37,58,4,0xf8e8c7));
      c.add(scene.add.rectangle(x,60,76,4,0x855a3a));
    });
    // role-specific furnishings
    const furniture=[];
    const box=(x,y,w,h,color,depth=2)=>{c.add(scene.add.rectangle(x,y,w,h,color).setDepth(depth));furniture.push(new Phaser.Geom.Rectangle(x-w/2,y-h/2,w,h));};
    const item=(x,y,w,h,color)=>c.add(scene.add.rectangle(x,y,w,h,color).setDepth(3));
    if(b.kind==="archive"){
      box(180,180,210,66,0x805237);item(180,146,210,9,0xb98550);
      for(let x=105;x<260;x+=42){item(x,176,28,45,0xf0dcb1);item(x,176,20,4,0x9b6d47);item(x,188,20,4,0x9b6d47)}
      box(490,180,210,70,0x805237);item(490,145,210,8,0xb98550);
      for(let x=405;x<575;x+=36){item(x,175,25,43,0xe4c995);item(x,170,19,4,0x4e7c70);item(x,183,19,4,0x9d6752)}
      box(790,190,100,92,0x9a704c);item(790,164,100,8,0xc99a62);item(790,190,80,48,0xf5e8c7);
    } else if(b.kind==="shop"){
      box(185,190,260,65,0x805237);item(185,155,260,8,0xb98550);
      for(let x=80;x<290;x+=48){item(x,183,30,35,0xf0d49a);item(x,175,24,14,0xc76f54);item(x,195,24,12,0xe9b66c)}
      box(505,190,220,65,0x805237);item(505,155,220,8,0xb98550);
      for(let x=430;x<600;x+=42){item(x,181,27,35,0xd8e2b5);item(x,174,20,12,0x719d78);item(x,194,20,12,0xe8b777)}
      box(790,205,100,55,0xa8754c);item(790,192,90,22,0xe9c78a);
    } else if(b.kind==="hall"){
      box(480,180,490,68,0x805237);item(480,145,490,8,0xb98550);
      item(480,180,450,38,0xf3e5bd);
      for(let x=300;x<=660;x+=90)item(x,180,40,18,0x719d91);
      for(let x=180;x<800;x+=130){box(x,315,70,55,0x93643f);item(x,300,64,7,0xc99b62);}
    } else if(b.kind==="home"){
      box(170,190,190,80,0x805237);item(170,164,190,10,0xc28d5b);item(170,190,168,54,0xf3d4b3);item(170,172,168,12,0xc67f88);
      box(470,185,170,80,0x805237);item(470,185,145,55,0xf4e3bd);
      box(770,185,115,100,0x98714b);item(770,160,115,10,0xc4935f);
    } else {
      box(480,175,480,95,0x805237);item(480,145,480,10,0xc99b62);item(480,175,450,65,0xf3e8c8);
      for(let x=300;x<=660;x+=100){item(x,175,72,42,0x7fa69a);item(x,175,48,7,0xe9d9a9);}
    }
    // center rug and desk
    c.add(scene.add.rectangle(W/2,390,240,100,0x9d6c88));
    c.add(scene.add.rectangle(W/2,390,220,80,0xe7c2a8));
    c.add(scene.add.rectangle(W/2,365,112,48,0x805237));
    c.add(scene.add.rectangle(W/2,361,100,38,0xd5aa70));
    c.add(scene.add.rectangle(W/2,360,68,24,0xf8e9c5));
    // potted plants
    [38,W-38].forEach(x=>{c.add(scene.add.rectangle(x,495,24,15,0xa46b4c));c.add(scene.add.rectangle(x,477,20,26,0x58934f));c.add(scene.add.rectangle(x,464,14,18,0x76b75b));});
    // Exit door at the bottom
    c.add(scene.add.rectangle(W/2,H-27,72,54,0x70472f));
    c.add(scene.add.rectangle(W/2,H-27,56,48,0xb7824e));
    c.add(scene.add.rectangle(W/2+18,H-27,4,4,0xf6d47b));
    c.add(scene.add.text(W/2,H-70,"E · KELUAR",{fontFamily:"monospace",fontSize:"13px",color:"#3d3024",backgroundColor:"#fff0cb",padding:{x:8,y:4}}).setOrigin(.5));
    interior.container=c;interior.furniture=furniture;
    // make sure the player renders over furniture
    player.setDepth(100);
  }

  function interiorWall(kind) {
    return ({archive:0xb9a5c2,shop:0xf0c8a0,hall:0xc2d5c6,home:0xe8c8ba,bank:0xc6d7b9})[kind]||0xe5caa1;
  }
  function exitBuilding() {
    if(!interior)return;
    const b=buildings.find(x=>x.kind===interior.kind);
    if(interior.container) interior.container.destroy();
    interior=null;
    worldLayer.setVisible(true);decoLayer.setVisible(true);
    npcs.forEach(n=>{n.setVisible(true);n.exclamation.setVisible(true);if(n.nameLabel)n.nameLabel.setVisible(true);});
    player.setPosition(b.centerX,b.frontY+28);player.setVelocity(0,0);
    scene.physics.world.setBounds(0,0,WORLD_W*TILE,WORLD_H*TILE);
    scene.cameras.main.setBounds(0,0,WORLD_W*TILE,WORLD_H*TILE);
    scene.cameras.main.startFollow(player,true,0.12,0.12);
    sceneLabel.textContent="Desa Lumina";
  }
  function startQuiz(level=1) {
    stopQuizTimer();
    activeQuizLevel=level; activeQuizQuestions=quizQuestions.filter(q=>q.level===level);
    quizIndex = 0; quizScore = 0; quizAnswered = false; quizResponses = []; finishingLevel = false;
    levelSeconds = 410; questionSeconds = 90; wrongAttempts = 0; questionLostPoint = false;
    dialogEl.classList.add("hidden");
    quizPanel.classList.remove("hidden");
    renderQuizQuestion();
    updateTimerLabels();
    quizTimerHandle = setInterval(tickQuizTimer, 1000);
  }

  function stopQuizTimer() {
    if (quizTimerHandle) { clearInterval(quizTimerHandle); quizTimerHandle = null; }
  }
  function formatClock(seconds) {
    seconds = Math.max(0, seconds|0);
    return String(Math.floor(seconds/60)).padStart(2,"0") + ":" + String(seconds%60).padStart(2,"0");
  }
  function updateTimerLabels() {
    const levelClock = document.getElementById("level-clock");
    const questionClock = document.getElementById("question-clock");
    const attempts = document.getElementById("attempts-left");
    if (levelClock) { levelClock.textContent = "⏱ Waktu level: " + formatClock(levelSeconds); levelClock.classList.toggle("danger", levelSeconds <= 60); }
    if (questionClock) { questionClock.textContent = "Soal: " + formatClock(questionSeconds); questionClock.classList.toggle("danger", questionSeconds <= 15); }
    if (attempts) attempts.textContent = "Kesempatan tersisa: " + Math.max(0,3-wrongAttempts);
  }
  function tickQuizTimer() {
    if (quizPanel.classList.contains("hidden") || finishingLevel) return;
    levelSeconds--; questionSeconds--;
    updateTimerLabels();
    if (levelSeconds <= 0) { finishLevel(true); return; }
    if (questionSeconds <= 0) {
      quizResponses.push({choice:null, correct:false, timedOut:true});
      document.getElementById("quiz-feedback").textContent = "Waktu soal habis! Soal ini tidak mendapat poin.";
      advanceQuestion(true);
    }
  }
  function renderQuizQuestion() {
    if (quizIndex >= activeQuizQuestions.length) { finishLevel(false); return; }
    const q = activeQuizQuestions[quizIndex];
    questionSeconds = Math.min(90, levelSeconds); wrongAttempts = 0; questionLostPoint = false;
    document.getElementById("quiz-level").textContent = "LEVEL " + q.level + " · MAKS. 100 POIN";
    document.getElementById("quiz-progress").textContent = "Soal " + (quizIndex+1) + " dari " + activeQuizQuestions.length;
    document.getElementById("quiz-title").textContent = q.title;
    document.getElementById("quiz-question").textContent = q.question;
    document.getElementById("quiz-details").textContent = q.details;
    document.getElementById("quiz-feedback").textContent = "Poin: benar pada percobaan pertama 20, kedua 15, ketiga 10; tiga kali salah mendapat 0 poin.";
    const opts = document.getElementById("quiz-options"); opts.innerHTML = "";
    q.options.forEach((label,i)=>{
      const btn = document.createElement("button"); btn.className="quiz-option"; btn.textContent=String.fromCharCode(65+i)+". "+label;
      btn.addEventListener("click",()=>answerQuiz(i,btn)); opts.appendChild(btn);
    });
    const next=document.getElementById("quiz-next"); next.disabled=true; next.textContent="Pilih jawaban"; next.onclick=nextQuizQuestion;
    quizAnswered=false; updateTimerLabels();
  }

  function answerQuiz(choice, button) {
    if(quizAnswered || finishingLevel) return;
    const q=activeQuizQuestions[quizIndex];
    if (choice === q.answer) {
      quizAnswered=true;
      [...document.querySelectorAll(".quiz-option")].forEach(b=>b.disabled=true);
      button.classList.add("selected");
      const awarded = wrongAttempts === 0 ? 20 : wrongAttempts === 1 ? 15 : 10;
      quizScore += awarded; score += awarded;
      const tryLabel = wrongAttempts === 0 ? "percobaan pertama" : wrongAttempts === 1 ? "percobaan kedua" : "percobaan ketiga";
      document.getElementById("quiz-feedback").textContent = `✓ Benar pada ${tryLabel}! +${awarded} poin.`;
      quizResponses.push({choice, correct:true, attempts:wrongAttempts+1, points:awarded});
      document.getElementById("quiz-next").disabled=false;
      document.getElementById("quiz-next").textContent=quizIndex===activeQuizQuestions.length-1?"Lihat hasil":"Soal berikutnya →";
      updateStats();
    } else {
      wrongAttempts++; questionLostPoint=true; levelSeconds=Math.max(0,levelSeconds-15); questionSeconds=Math.max(0,questionSeconds-15);
      button.classList.add("wrong-choice"); button.disabled=true;
      document.getElementById("quiz-feedback").textContent=`✗ Belum tepat. Penalti −15 detik dan soal ini tidak mendapat poin. Percobaan ${wrongAttempts}/3.`;
      updateTimerLabels();
      if (levelSeconds <= 0) { finishLevel(true); return; }
      if (questionSeconds <= 0) { advanceQuestion(true); return; }
      if (wrongAttempts >= 3) {
        quizAnswered=true;
        [...document.querySelectorAll(".quiz-option")].forEach(b=>b.disabled=true);
        document.getElementById("quiz-feedback").textContent="Tiga percobaan salah. Soal tidak mendapat poin; lanjut ke soal berikutnya.";
        quizResponses.push({choice,correct:false,attempts:3});
        document.getElementById("quiz-next").disabled=false;
        document.getElementById("quiz-next").textContent=quizIndex===activeQuizQuestions.length-1?"Lihat hasil":"Soal berikutnya →";
      } else {
        document.getElementById("attempts-left").textContent=`Kesempatan tersisa: ${3-wrongAttempts}`;
      }
    }
  }

  function nextQuizQuestion() {
    if(!quizAnswered) return;
    advanceQuestion(false);
  }
  function advanceQuestion(fromTimeout=false) {
    if (finishingLevel) return;
    if (quizIndex < activeQuizQuestions.length-1 && levelSeconds > 0) {
      quizIndex++; renderQuizQuestion(); return;
    }
    finishLevel(false);
  }
  function finishLevel(timeExpired=false) {
    if (finishingLevel) return;
    finishingLevel=true; stopQuizTimer();
    const correctLabels = activeQuizQuestions.map((q,i)=>`${i+1}. ${q.title}: ${q.options[q.answer]} — ${q.explain}`).join("\n\n");
    document.getElementById("quiz-level").textContent = timeExpired ? "WAKTU HABIS" : "MISI SELESAI";
    document.getElementById("quiz-progress").textContent = "Hasil akhir";
    document.getElementById("quiz-title").textContent = `Skor Level ${activeQuizLevel}: ${quizScore} / 100 poin`;
    document.getElementById("quiz-question").textContent = timeExpired ? "Waktu level habis! Level otomatis selesai. Soal yang belum dikerjakan tidak mendapat poin." : (activeQuizLevel===5 ? "Kode rahasia akhir: 3527! Di bawah ini pembahasan untuk level ini." : `Level ${activeQuizLevel} selesai! Temukan penjaga level berikutnya untuk melanjutkan cerita.`);
    document.getElementById("quiz-details").textContent = correctLabels;
    document.getElementById("quiz-options").innerHTML = "";
    document.getElementById("quiz-feedback").textContent = `Poin level ini: ${quizScore}/100. Jawaban salah tidak mendapat poin.`;
    document.getElementById("level-clock").textContent = "Waktu level: " + formatClock(levelSeconds);
    document.getElementById("question-clock").textContent = "Batas tiap soal: 01:30";
    document.getElementById("attempts-left").textContent = "Level berakhir";
    const next=document.getElementById("quiz-next"); next.disabled=false; next.textContent="Kembali ke desa"; next.onclick=()=>{quizPanel.classList.add("hidden"); finishingLevel=false;};
    if (!completedLevels.has(activeQuizLevel)) {
      totalLevelPoints += quizScore;
      levelScoreSummary[activeQuizLevel] = quizScore;
    }
    completedLevels.add(activeQuizLevel);
    clues += 1; updateStats(); updateMissionTracker(); saveGame();
    if (completedLevels.size === 5 && !allMissionsCelebrated) {
      allMissionsCelebrated = true;
      saveGame();
      setTimeout(() => {
        quizPanel.classList.add("hidden");
        finishingLevel = false;
        endingDialogs = [
          {name:"Alya · Total Poin", text:`Rekap skor dari seluruh levelmu adalah ${totalLevelPoints} dari maksimal 500 poin. Level 1: ${levelScoreSummary[1] ?? 0}, Level 2: ${levelScoreSummary[2] ?? 0}, Level 3: ${levelScoreSummary[3] ?? 0}, Level 4: ${levelScoreSummary[4] ?? 0}, dan Level 5: ${levelScoreSummary[5] ?? 0}.`},
          {name:"Alya · Terima Kasih", text:"Terima kasih sudah membantu semua warga Desa Lumina, Detektif! Berkat ketelitian dan kerja kerasmu, Buku Kas Desa berhasil ditemukan dan Festival Panen terselamatkan. Semua misi utama selesai—sekarang kamu bebas menjelajahi desa, masuk ke rumah-rumah, dan menyapa warga kapan saja. Sampai jumpa di petualangan berikutnya!"}
        ];
        say("Alya · Misi Selesai!", "SELAMAT, DETEKTIF! Kamu berhasil menyelesaikan kelima misi audit, membantu warga, dan menemukan Buku Kas Desa. Kode rahasia 3527 berhasil dipecahkan. Desa Lumina merayakan keberhasilanmu!");
      }, 350);
    }
  }

  function updateMissionTracker() {
    const count = completedLevels.size;
    const title = document.getElementById("mission-progress");
    const detail = document.getElementById("mission-detail");
    const list = document.getElementById("mission-levels");
    if(!title || !detail || !list) return;
    title.textContent = `Bantu Bimo · ${count}/5 level`;
    detail.textContent = count===5 ? "Semua pemeriksaan selesai! Temui Bimo untuk mengungkap kode 3527." : "Bantu warga menyelesaikan audit dari Level 1 sampai Level 5.";
    list.innerHTML = "";
    const names = ["Cari Kesalahan","Hitung Selisih","Periksa Bukti","Cari Pola","Pecahkan Kode"];
    names.forEach((name,i)=>{
      const li=document.createElement("li");
      li.textContent=`${completedLevels.has(i+1)?"✓":"○"} Level ${i+1}: ${name}`;
      if(completedLevels.has(i+1)) li.className="done";
      list.appendChild(li);
    });
  }

  function saveGame() {
    try {
      const data = {
        version: 2,
        score,
        clues,
        completedLevels: [...completedLevels],
        talkedNPCs: [...talkedNPCs],
        introSeen,
        allMissionsCelebrated,
        totalLevelPoints,
        levelScoreSummary,
        playerX: player ? Math.round(player.x) : (savedGame.playerX ?? 13*TILE),
        playerY: player ? Math.round(player.y) : (savedGame.playerY ?? 17*TILE),
        savedAt: new Date().toISOString()
      };
      sessionStorage.setItem(SAVE_KEY, JSON.stringify(data));
      const status = document.getElementById("save-status");
      if (status) status.textContent = "Tersimpan sementara (sesi ini)";
    } catch (err) {
      console.warn("Progress tidak dapat disimpan di browser ini:", err);
      const status = document.getElementById("save-status");
      if (status) status.textContent = "Penyimpanan browser tidak tersedia";
    }
  }
  window.addEventListener("pagehide", saveGame);
  window.addEventListener("beforeunload", saveGame);

  function updateStats() {
    document.getElementById("score").textContent=score;
    document.getElementById("clues").textContent=clues;
    saveGame();
  }
})();