require("dotenv").config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

// MongoDB bağlantı değişkenleri
let db;
let productsCollection;
let contactsCollection;

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
const DB_NAME = "yapi_market";

// MongoDB bağlantısı
let mongoClient;

async function connectToMongoDB() {
  try {
    if (!MONGODB_URI || MONGODB_URI === "mongodb://localhost:27017/yapi_market") {
      console.log("⚠️  MONGODB_URI environment variable ayarlanmamış!");
      console.log("⚠️  Render.com'da MONGODB_URI environment variable'ını ekleyin.");
      return;
    }

    console.log("🔄 MongoDB bağlantısı deneniyor...");
    console.log("📍 Connection String:", MONGODB_URI.replace(/:[^:@]+@/, ":****@"));
    
    // Connection string'e SSL parametreleri ekle (eğer yoksa)
    let connectionUri = MONGODB_URI;
    if (connectionUri.includes('mongodb+srv://') && !connectionUri.includes('tls=')) {
      // SSL parametrelerini ekle
      const separator = connectionUri.includes('?') ? '&' : '?';
      connectionUri += `${separator}tls=true&tlsAllowInvalidCertificates=false`;
    }
    
    mongoClient = new MongoClient(connectionUri, {
      serverSelectionTimeoutMS: 30000, // 30 saniye timeout
      connectTimeoutMS: 30000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      w: 'majority'
    });
    
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    productsCollection = db.collection("products");
    contactsCollection = db.collection("contacts");
    
    // Bağlantıyı test et
    await db.admin().ping();
    
    console.log("✅ MongoDB bağlantısı başarılı!");
    console.log("📊 Database:", DB_NAME);
    
    // Index oluştur
    try {
      await productsCollection.createIndex({ createdAt: -1 });
      await contactsCollection.createIndex({ createdAt: -1 });
      console.log("✅ Index'ler oluşturuldu");
    } catch (indexError) {
      console.log("⚠️  Index oluşturma hatası (önemsiz):", indexError.message);
    }
  } catch (error) {
    console.error("❌ MongoDB bağlantı hatası:");
    console.error("   Error:", error.message);
    console.error("   Code:", error.code);
    
    if (error.message.includes("authentication")) {
      console.error("   🔐 Authentication hatası: Kullanıcı adı veya şifre yanlış olabilir");
    } else if (error.message.includes("timeout")) {
      console.error("   ⏱️  Timeout hatası: Network Access ayarlarını kontrol edin");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("   🌐 DNS hatası: Connection string'i kontrol edin");
    }
    
    console.log("⚠️  MongoDB bağlantısı olmadan devam ediliyor...");
    console.log("💡 Render.com'da MONGODB_URI environment variable'ını kontrol edin");
  }
}

connectToMongoDB();

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
    if (!productsCollection) {
      console.error("❌ productsCollection tanımlı değil - MongoDB bağlantısı yok");
      return res.status(500).json({ 
        success: false, 
        message: "Veritabanı bağlantısı yok. Lütfen MONGODB_URI environment variable'ını kontrol edin." 
      });
    }
    
    const products = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();
    // MongoDB _id'yi id'ye çevir (eski kod uyumluluğu için)
    const formattedProducts = products.map(p => ({
      id: p._id.toString(),
      ad: p.ad || "",
      kategori: p.kategori || "",
      marka: p.marka || "",
      aciklama: p.aciklama || "",
      resim: p.resim || ""
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
    if (!productsCollection) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const product = {
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: req.file ? req.file.filename : "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await productsCollection.insertOne(product);
    res.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Ürün eklenemedi" });
  }
});

/* Güncelle */
app.put("/api/products/:id", auth, upload.single("resim"), async (req, res) => {
  try {
    if (!productsCollection) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const productId = req.params.id;
    
    // ObjectId kontrolü
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Geçersiz ürün ID" });
    }
    
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
    }

    const updateData = {
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      updatedAt: new Date()
    };
    
    if (req.file) {
      updateData.resim = req.file.filename;
    } else {
      updateData.resim = product.resim || "";
    }

    await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateData }
    );
    
    res.json({ success: true, message: "Ürün başarıyla güncellendi" });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

/* Sil */
app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    if (!productsCollection) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const productId = req.params.id;
    
    // ObjectId kontrolü
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Geçersiz ürün ID" });
    }
    
    const result = await productsCollection.deleteOne({ _id: new ObjectId(productId) });
    
    if (result.deletedCount === 0) {
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
    if (!productsCollection) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const products = await productsCollection.find({}).sort({ createdAt: -1 }).toArray();
    const formattedProducts = products.map(p => ({
      id: p._id.toString(),
      ad: p.ad || "",
      kategori: p.kategori || "",
      marka: p.marka || "",
      aciklama: p.aciklama || "",
      resim: p.resim || ""
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
    if (!productsCollection) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const productId = req.params.id;
    
    // ObjectId kontrolü
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Geçersiz ürün ID" });
    }
    
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    
    if (!product) {
      return res.status(404).json({ success: false });
    }
    
    res.json({
      id: product._id.toString(),
      ad: product.ad || "",
      kategori: product.kategori || "",
      marka: product.marka || "",
      aciklama: product.aciklama || "",
      resim: product.resim || ""
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
    if (!contactsCollection) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
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
      adSoyad,
      email,
      telefon,
      mesaj,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await contactsCollection.insertOne(contact);
    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
  }
});
  