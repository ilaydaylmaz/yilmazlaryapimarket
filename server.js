require("dotenv").config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const Product = require("./models/Product");
const Contact = require("./models/Contact");

const app = express();

/* =======================
   BODY & SESSION
======================= */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Form data için

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
   MONGODB CONNECTION
======================= */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/yapi_market";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB bağlantısı başarılı!");
  })
  .catch((error) => {
    console.error("❌ MongoDB bağlantı hatası:", error);
    console.log("⚠️  MongoDB bağlantısı olmadan devam ediliyor...");
  });

// Uploads klasörünü kontrol et
if (!fs.existsSync("./public/uploads")) {
  fs.mkdirSync("./public/uploads", { recursive: true });
}

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
app.get("/api/products", auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // MongoDB _id'yi id'ye çevir (eski kod uyumluluğu için)
    const formattedProducts = products.map(p => ({
      id: p._id.toString(),
      ad: p.ad,
      kategori: p.kategori,
      marka: p.marka,
      aciklama: p.aciklama,
      resim: p.resim
    }));
    res.json(formattedProducts);
  } catch (error) {
    console.error("Ürün listesi hatası:", error);
    res.status(500).json({ success: false, message: "Ürünler yüklenemedi" });
  }
});

/* Ekle */
app.post("/api/products", auth, upload.single("resim"), async (req, res) => {
  try {
    const product = new Product({
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: req.file ? req.file.filename : ""
    });

    await product.save();
    res.json({ success: true, id: product._id.toString() });
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Ürün eklenemedi" });
  }
});

/* Güncelle */
app.put("/api/products/:id", auth, upload.single("resim"), async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
    }

    product.ad = req.body.ad || "";
    product.kategori = req.body.kategori || "";
    product.marka = req.body.marka || "";
    product.aciklama = req.body.aciklama || "";
    
    if (req.file) {
      product.resim = req.file.filename;
    }

    await product.save();
    res.json({ success: true, message: "Ürün başarıyla güncellendi" });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

/* Sil */
app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
    }

    res.json({ success: true, message: "Ürün başarıyla silindi" });
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor → http://localhost:${PORT}`);
});

/* PUBLIC PRODUCTS */
app.get("/api/public/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const formattedProducts = products.map(p => ({
      id: p._id.toString(),
      ad: p.ad,
      kategori: p.kategori,
      marka: p.marka,
      aciklama: p.aciklama,
      resim: p.resim
    }));
    res.json(formattedProducts);
  } catch (error) {
    console.error("Public products hatası:", error);
    res.status(500).json({ success: false, message: "Ürünler yüklenemedi" });
  }
});
  
/* TEK ÜRÜN (PUBLIC) */
app.get("/api/public/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false });
    }
    
    res.json({
      id: product._id.toString(),
      ad: product.ad,
      kategori: product.kategori,
      marka: product.marka,
      aciklama: product.aciklama,
      resim: product.resim
    });
  } catch (error) {
    console.error("Tek ürün hatası:", error);
    res.status(500).json({ success: false, message: "Ürün bulunamadı" });
  }
});

/* =======================
   CONTACT FORM
======================= */
app.post("/api/contact", async (req, res) => {
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
    const contact = new Contact({
      adSoyad,
      email,
      telefon,
      mesaj
    });

    await contact.save();
    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
  }
});
  