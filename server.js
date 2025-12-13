require("dotenv").config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { ObjectId } = require("mongodb");
const { getProductsCollection, getContactsCollection, connectDB, isMongoDBEnabled } = require("./db");

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
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      const products = await productsCollection.find({}).toArray();
      const formattedProducts = products.map(p => ({
        id: p._id.toString(),
        ad: p.ad,
        kategori: p.kategori,
        marka: p.marka,
        aciklama: p.aciklama,
        resim: p.resim
      }));
      res.json(formattedProducts);
    } else {
      // JSON fallback
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      res.json(data);
    }
  } catch (error) {
    console.error("Ürün listeleme hatası:", error);
    // Hata durumunda JSON'dan oku
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      res.json(data);
    } catch (jsonError) {
      res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
  }
});

/* Ekle */
app.post("/api/products", auth, upload.single("resim"), async (req, res) => {
  try {
    const urun = {
      id: Date.now().toString(),
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: req.file ? req.file.filename : ""
    };

    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      const mongoProduct = { ...urun };
      delete mongoProduct.id;
      mongoProduct.createdAt = new Date();
      const result = await productsCollection.insertOne(mongoProduct);
      res.json({ success: true, id: result.insertedId.toString() });
    } else {
      // JSON fallback
      const products = JSON.parse(fs.readFileSync(DATA_FILE));
      products.push(urun);
      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
      res.json({ success: true, id: urun.id });
    }
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

/* Güncelle */
app.put("/api/products/:id", auth, upload.single("resim"), async (req, res) => {
  try {
    const productId = String(req.params.id);
    
    if (isMongoDBEnabled() && ObjectId.isValid(productId)) {
      const productsCollection = await getProductsCollection();
      const existingProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
      
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }

      const updateData = {
        ad: req.body.ad || "",
        kategori: req.body.kategori || "",
        marka: req.body.marka || "",
        aciklama: req.body.aciklama || "",
        resim: req.file ? req.file.filename : existingProduct.resim,
        updatedAt: new Date()
      };

      await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateData }
      );
      res.json({ success: true, message: "Ürün başarıyla güncellendi" });
    } else {
      // JSON fallback
      let products = JSON.parse(fs.readFileSync(DATA_FILE));
      const index = products.findIndex(p => String(p.id) === productId);
      
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }

      products[index] = {
        id: productId,
        ad: req.body.ad || "",
        kategori: req.body.kategori || "",
        marka: req.body.marka || "",
        aciklama: req.body.aciklama || "",
        resim: req.file ? req.file.filename : products[index].resim
      };

      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
      res.json({ success: true, message: "Ürün başarıyla güncellendi" });
    }
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

/* Sil */
app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    const productId = String(req.params.id);
    
    if (isMongoDBEnabled() && ObjectId.isValid(productId)) {
      const productsCollection = await getProductsCollection();
      const result = await productsCollection.deleteOne({ _id: new ObjectId(productId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }
      res.json({ success: true, message: "Ürün başarıyla silindi" });
    } else {
      // JSON fallback
      let products = JSON.parse(fs.readFileSync(DATA_FILE));
      const beforeLength = products.length;
      products = products.filter(p => String(p.id) !== productId);

      if (products.length === beforeLength) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
      res.json({ success: true, message: "Ürün başarıyla silindi" });
    }
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 3000;

// MongoDB bağlantısını dene (başarısız olursa JSON kullanılacak)
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server çalışıyor → http://localhost:${PORT}`);
      if (isMongoDBEnabled()) {
        console.log("✅ MongoDB bağlantısı aktif");
      } else {
        console.log("📄 JSON dosyaları kullanılıyor (MongoDB bağlantısı yok)");
      }
    });
  })
  .catch((error) => {
    // MongoDB bağlantısı yoksa da server'ı başlat
    app.listen(PORT, () => {
      console.log(`✅ Server çalışıyor → http://localhost:${PORT}`);
      console.log("📄 JSON dosyaları kullanılıyor (MongoDB bağlantısı yok)");
    });
  });

/* PUBLIC PRODUCTS */
app.get("/api/public/products", async (req, res) => {
  try {
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      const products = await productsCollection.find({}).toArray();
      const formattedProducts = products.map(p => ({
        id: p._id.toString(),
        ad: p.ad,
        kategori: p.kategori,
        marka: p.marka,
        aciklama: p.aciklama,
        resim: p.resim
      }));
      res.json(formattedProducts);
    } else {
      // JSON fallback
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      res.json(data);
    }
  } catch (error) {
    console.error("Ürün listeleme hatası:", error);
    // Hata durumunda JSON'dan oku
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      res.json(data);
    } catch (jsonError) {
      res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
  }
});
  
/* TEK ÜRÜN (PUBLIC) */
app.get("/api/public/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    
    if (isMongoDBEnabled() && ObjectId.isValid(productId)) {
      const productsCollection = await getProductsCollection();
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
    } else {
      // JSON fallback
      const products = JSON.parse(fs.readFileSync(DATA_FILE));
      const urun = products.find(p => String(p.id) === String(productId));
      
      if (!urun) {
        return res.status(404).json({ success: false });
      }
      
      res.json(urun);
    }
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
      id: Date.now().toString(),
      adSoyad,
      email,
      telefon,
      mesaj,
      tarih: new Date().toISOString()
    };

    if (isMongoDBEnabled()) {
      const contactsCollection = await getContactsCollection();
      const mongoContact = { ...contact };
      delete mongoContact.id;
      mongoContact.tarih = new Date();
      await contactsCollection.insertOne(mongoContact);
    } else {
      // JSON fallback
      let contacts = [];
      if (fs.existsSync(CONTACTS_FILE)) {
        contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
      }
      contacts.push(contact);
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    }

    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
  }
});
  