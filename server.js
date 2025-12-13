const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { ObjectId } = require("mongodb");
const { getProductsCollection, getContactsCollection, connectDB } = require("./db");

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
app.use("/admin", express.static("admin"));

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
app.get("/api/products", auth, async (req, res) => {
  try {
    const productsCollection = await getProductsCollection();
    const products = await productsCollection.find({}).toArray();
    // MongoDB ObjectId'yi string id'ye çevir
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
    console.error("Ürün listeleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

/* Ekle */
app.post("/api/products", auth, upload.single("resim"), async (req, res) => {
  try {
    const productsCollection = await getProductsCollection();

    const urun = {
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: req.file ? req.file.filename : "",
      createdAt: new Date()
    };

    const result = await productsCollection.insertOne(urun);
    res.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

/* Güncelle */
app.put("/api/products/:id", auth, upload.single("resim"), async (req, res) => {
  try {
    console.log("PUT request alındı - ID:", req.params.id);
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    const productsCollection = await getProductsCollection();
    let productId = req.params.id;
    
    // ObjectId geçerli mi kontrol et
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Geçersiz ürün ID'si" });
    }

    // Mevcut ürünü bul
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
    
    if (!existingProduct) {
      console.error("Ürün bulunamadı! ID:", productId);
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
    }

    // Güncelleme verileri
    const updateData = {
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      updatedAt: new Date()
    };

    // Resim değiştirildiyse güncelle
    if (req.file) {
      updateData.resim = req.file.filename;
    } else {
      updateData.resim = existingProduct.resim;
    }

    await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateData }
    );

    console.log("Ürün başarıyla güncellendi");
    res.json({ success: true, message: "Ürün başarıyla güncellendi" });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

/* Sil */
app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    const productsCollection = await getProductsCollection();
    const productId = req.params.id;
    
    // ObjectId geçerli mi kontrol et
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Geçersiz ürün ID'si" });
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

// MongoDB bağlantısını başlat ve sunucuyu başlat
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server çalışıyor → http://localhost:${PORT}`);
      console.log("MongoDB bağlantısı aktif");
    });
  })
  .catch((error) => {
    console.error("MongoDB bağlantı hatası, sunucu başlatılamadı:", error);
    process.exit(1);
  });

/* PUBLIC PRODUCTS */
app.get("/api/public/products", async (req, res) => {
  try {
    const productsCollection = await getProductsCollection();
    const products = await productsCollection.find({}).toArray();
    // MongoDB ObjectId'yi string id'ye çevir
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
    console.error("Ürün listeleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});
  
/* TEK ÜRÜN (PUBLIC) */
app.get("/api/public/products/:id", async (req, res) => {
  try {
    const productsCollection = await getProductsCollection();
    const productId = req.params.id;
    
    // ObjectId geçerli mi kontrol et
    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Geçersiz ürün ID'si" });
    }

    const urun = await productsCollection.findOne({ _id: new ObjectId(productId) });
  
    if (!urun) {
      return res.status(404).json({ success: false });
    }
  
    res.json({
      id: urun._id.toString(),
      ad: urun.ad,
      kategori: urun.kategori,
      marka: urun.marka,
      aciklama: urun.aciklama,
      resim: urun.resim
    });
  } catch (error) {
    console.error("Ürün detay hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
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
    const contact = {
      adSoyad,
      email,
      telefon,
      mesaj,
      tarih: new Date()
    };

    const contactsCollection = await getContactsCollection();
    await contactsCollection.insertOne(contact);

    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
  }
});
  