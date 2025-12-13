const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();

/* =======================
   BODY & SESSION
======================= */
app.use(bodyParser.json());

app.use(session({
  secret: "yapi-market-secret",
  resave: false,
  saveUninitialized: false
}));

/* =======================
   STATIC DOSYALAR
======================= */
app.use(express.static("public"));

/* =======================
   MULTER (RESİM UPLOAD)
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

/* =======================
   DATA
======================= */
const DATA_FILE = "./data/products.json";
const CONTACTS_FILE = "./data/contacts.json";

/* =======================
   AUTH MIDDLEWARE
======================= */
function auth(req, res, next) {
  if (req.session && req.session.auth) next();
  else res.status(401).send("Yetkisiz erişim");
}

/* =======================
   LOGIN / LOGOUT
======================= */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.auth = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* =======================
   ADMIN PANEL
======================= */
app.get("/admin.html", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

/* =======================
   PRODUCTS API
======================= */

/* Liste */
app.get("/api/products", auth, (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

/* Ekle */
app.post("/api/products", auth, upload.single("resim"), (req, res) => {
  const products = JSON.parse(fs.readFileSync(DATA_FILE));

  const urun = {
    id: Date.now().toString(),
    ad: req.body.ad,
    kategori: req.body.kategori,
    marka: req.body.marka,
    aciklama: req.body.aciklama,
    resim: req.file ? req.file.filename : ""
  };

  products.push(urun);
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));

  res.json({ success: true });
});

/* Güncelle */
app.put("/api/products/:id", auth, upload.single("resim"), (req, res) => {
  let products = JSON.parse(fs.readFileSync(DATA_FILE));
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false });
  }

  products[index] = {
    id: req.params.id,
    ad: req.body.ad,
    kategori: req.body.kategori,
    marka: req.body.marka,
    aciklama: req.body.aciklama,
    resim: req.file ? req.file.filename : products[index].resim
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true });
});

/* Sil */
app.delete("/api/products/:id", auth, (req, res) => {
  let products = JSON.parse(fs.readFileSync(DATA_FILE));
  products = products.filter(p => p.id !== req.params.id);

  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
  res.json({ success: true });
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor → http://localhost:${PORT}`);
});

/* PUBLIC PRODUCTS */
app.get("/api/public/products", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
  });
  
/* TEK ÜRÜN (PUBLIC) */
app.get("/api/public/products/:id", (req, res) => {
    const products = JSON.parse(fs.readFileSync(DATA_FILE));
    const urun = products.find(p => p.id === req.params.id);
  
    if (!urun) {
      return res.status(404).json({ success: false });
    }
  
    res.json(urun);
  });

/* =======================
   CONTACT FORM
======================= */
app.post("/api/contact", (req, res) => {
  try {
    const { adSoyad, email, telefon, mesaj } = req.body;

    // Validasyon
    if (!adSoyad || !email || !telefon || !mesaj) {
      return res.status(400).json({ success: false, message: "Tüm alanlar doldurulmalıdır." });
    }

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Geçerli bir e-posta adresi giriniz." });
    }

    // İletişim kaydı oluştur
    const contact = {
      id: Date.now().toString(),
      adSoyad,
      email,
      telefon,
      mesaj,
      tarih: new Date().toISOString()
    };

    // Dosyayı oku veya oluştur
    let contacts = [];
    if (fs.existsSync(CONTACTS_FILE)) {
      contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
    }

    // Yeni kaydı ekle
    contacts.push(contact);
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));

    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
  }
});
  