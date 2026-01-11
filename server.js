require("dotenv").config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
const { getProductsCollection, getContactsCollection, getReviewsCollection, getBlogCollection, getCategoryShowcaseCollection, connectDB, isMongoDBEnabled } = require("./db");
const https = require("https");
const { exec } = require("child_process");

const app = express();

/* =======================
   BODY & SESSION
======================= */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Form data için

// Session store yapılandırması
// Production'da MemoryStore uyarısını önlemek için store'u açıkça belirtiyoruz
// Basit admin paneli için MemoryStore yeterli (tek instance)
const MemoryStore = require('memorystore')(session);

app.use(session({
  secret: process.env.SESSION_SECRET || "yapi-market-secret",
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Cookie adı
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 saatte bir eski session'ları temizle (ms cinsinden)
  }),
  cookie: {
    secure: false, // HTTPS yoksa false olmalı
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 saat
    sameSite: 'lax' // CSRF koruması için
  }
}));

/* =======================
   STATIC DOSYALAR
======================= */
app.use(express.static("public"));
app.use("/admin", express.static("admin"));

/* =======================
   MULTER (RESİM VE VİDEO UPLOAD)
======================= */
// Tüm dosyaları field name'e göre farklı klasörlere kaydet
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Resimler için uploads klasörüne kaydet
    const uploadDir = "public/uploads";
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

// Resim dosyalarını kabul eden upload middleware
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (resim için)
  fileFilter: (req, file, cb) => {
    // Resim field'ları için resim dosyalarını kabul et
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları kabul edilir!'), false);
    }
  }
});

// Resmi base64'e çevir
function imageToBase64(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const imageBuffer = fs.readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(filePath).slice(1).toLowerCase(); // .png -> png
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
      return `data:image/${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error("Base64 dönüştürme hatası:", error);
  }
  return null;
}

// Resim URL'sini döndür (base64 varsa onu, yoksa dosya yolunu)
function getImageUrl(product) {
  // Önce base64 kontrolü
  if (product.resimBase64) {
    return product.resimBase64;
  }
  
  // Resim dosya adı varsa
  if (product.resim) {
    // Eğer zaten base64 string ise (data:image ile başlıyorsa) direkt döndür
    if (typeof product.resim === 'string' && product.resim.startsWith('data:image')) {
      return product.resim;
    }
    
    // Dosya sisteminde var mı kontrol et
    const filePath = path.join("public/uploads", product.resim);
    if (fs.existsSync(filePath)) {
      return `/uploads/${product.resim}`;
    }
    
    // Dosya yoksa ve base64 yoksa, boş string döndür
    console.warn(`Resim dosyası bulunamadı: ${product.resim}`);
  }
  
  return "";
}

/* =======================
   DATA
======================= */
const DATA_FILE = "./data/products.json";
const CONTACTS_FILE = "./data/contacts.json";

/* =======================
   EMAIL FUNCTION
======================= */
async function sendEmail(to, subject, html, text) {
  // SMTP ayarları yoksa email gönderme
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("SMTP ayarları yapılandırılmamış, email gönderilmedi.");
    return Promise.resolve();
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Yılmazlar Yapı Market" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email gönderildi:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email gönderme hatası:", error);
    throw error;
  }
}

/* =======================
   AUTH MIDDLEWARE
======================= */
function auth(req, res, next) {
  console.log(`🔒 Auth kontrolü - Session ID: ${req.sessionID}, Auth: ${req.session?.auth}`);
  if (req.session && req.session.auth) {
    next();
  } else {
    console.log(`❌ Yetkisiz erişim denemesi`);
    res.status(401).send("Yetkisiz erişim");
  }
}

/* =======================
   LOGIN / LOGOUT
======================= */
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 Login denemesi: ${username}`);

  if (username === "admin" && password === "1234") {
    req.session.auth = true;
    console.log(`✅ Login başarılı, session ID: ${req.sessionID}`);
    res.json({ success: true });
  } else {
    console.log(`❌ Login başarısız: ${username}`);
    res.status(401).json({ success: false, message: "Kullanıcı adı veya şifre hatalı" });
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
    // Cache'i önle
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();

      // Admin paneli için tüm ürünleri çek (filtreleme yok)
      // Admin panelinde tüm detaylar gerekli olduğu için projection kullanmıyoruz
      const products = await productsCollection.find({}).toArray();
      const formattedProducts = products.map(p => ({
        id: p._id.toString(),
        ad: p.ad,
        kategori: p.kategori,
        altKategori: p.altKategori || "",
        marka: p.marka,
        aciklama: p.aciklama,
        resim: getImageUrl(p),
        // Seramik ürünleri için özel alanlar
        urunKodu: p.urunKodu || "",
        doku: p.doku || "",
        kalinlik: p.kalinlik || "",
        icMekan: p.icMekan || "",
        disMekan: p.disMekan || "",
        kullanimAlani: p.kullanimAlani || "",
        yuzeyGorunumu: p.yuzeyGorunumu || "",
        kalip: p.kalip || "",
        bunye: p.bunye || "",
        urunGrubu: p.urunGrubu || "",
        vSkalasi: p.vSkalasi || "",
        m2Kutu: p.m2Kutu || "",
        m2Palet: p.m2Palet || "",
        kutuPalet: p.kutuPalet || "",
        paletAgirligi: p.paletAgirligi || ""
      }));
      res.json(formattedProducts);
    } else {
      // JSON fallback
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      // JSON'daki resimleri de kontrol et
      const formattedData = data.map(p => ({
        ...p,
        resim: getImageUrl(p)
      }));
      res.json(formattedData);
    }
  } catch (error) {
    console.error("Ürün listeleme hatası:", error);
    // Hata durumunda JSON'dan oku
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      const formattedData = data.map(p => ({
        ...p,
        resim: getImageUrl(p)
      }));
      res.json(formattedData);
    } catch (jsonError) {
      res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
  }
});

// Resim dosyalarını işle
const uploadProductFiles = upload.fields([
  { name: "resim", maxCount: 1 }, 
  { name: "resimler", maxCount: 10 }
]);

/* Ekle */
app.post("/api/products", auth, uploadProductFiles, async (req, res) => {
  try {
    let resimData = "";
    let resimBase64 = null;
    let resimlerData = [];
    let resimlerBase64 = [];
    
    // Tek resim (eski format - geriye dönük uyumluluk)
    if (req.files && req.files.resim && req.files.resim[0]) {
      resimData = req.files.resim[0].filename;
      const filePath = path.join("public/uploads", req.files.resim[0].filename);
      resimBase64 = imageToBase64(filePath);
    }
    
    // Birden fazla resim (yeni format)
    if (req.files && req.files.resimler && req.files.resimler.length > 0) {
      for (const file of req.files.resimler) {
        resimlerData.push(file.filename);
        const filePath = path.join("public/uploads", file.filename);
        const base64 = imageToBase64(filePath);
        if (base64) {
          resimlerBase64.push(base64);
        }
      }
      // İlk resmi ana resim olarak kullan (geriye dönük uyumluluk)
      if (resimlerData.length > 0 && !resimData) {
        resimData = resimlerData[0];
        resimBase64 = resimlerBase64[0];
      }
    }
    
    const urun = {
      id: Date.now().toString(),
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      altKategori: req.body.altKategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: resimData,
      resimBase64: resimBase64, // MongoDB'ye base64 olarak kaydet
      resimler: resimlerData.length > 0 ? resimlerData : (resimData ? [resimData] : []),
      resimlerBase64: resimlerBase64.length > 0 ? resimlerBase64 : (resimBase64 ? [resimBase64] : []),
      // Seramik ürünleri için özel alanlar
      urunKodu: req.body.urunKodu || "",
      doku: req.body.doku || "",
      kalinlik: req.body.kalinlik || "",
      icMekan: req.body.icMekan || "",
      disMekan: req.body.disMekan || "",
      kullanimAlani: req.body.kullanimAlani || "",
      yuzeyGorunumu: req.body.yuzeyGorunumu || "",
      kalip: req.body.kalip || "",
      bunye: req.body.bunye || "",
      urunGrubu: req.body.urunGrubu || "",
      vSkalasi: req.body.vSkalasi || "",
      m2Kutu: req.body.m2Kutu || "",
      m2Palet: req.body.m2Palet || "",
      kutuPalet: req.body.kutuPalet || "",
      paletAgirligi: req.body.paletAgirligi || ""
    };

    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      const mongoProduct = { ...urun };
      delete mongoProduct.id;
      mongoProduct.createdAt = new Date();
      const result = await productsCollection.insertOne(mongoProduct);
      
      // Cache'i temizle (memory temizliği)
      productsCache = null;
      productsCacheTime = null;
      if (global.gc) global.gc(); // Garbage collection (eğer --expose-gc ile başlatıldıysa)
      console.log('🔄 Ürün eklendi, cache temizlendi');
      
      res.json({ success: true, id: result.insertedId.toString() });
    } else {
      // JSON fallback
      const products = JSON.parse(fs.readFileSync(DATA_FILE));
      products.push(urun);
      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
      
      // Cache'i temizle
      productsCache = null;
      productsCacheTime = null;
      
      res.json({ success: true, id: urun.id });
    }
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    console.error("Hata detayı:", error.stack);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + (error.message || "Bilinmeyen hata") });
  }
});

/* Güncelle */
app.put("/api/products/:id", auth, uploadProductFiles, async (req, res) => {
  try {
    const productId = String(req.params.id);
    
    if (isMongoDBEnabled() && ObjectId.isValid(productId)) {
      const productsCollection = await getProductsCollection();
      const existingProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
      
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }

      let resimData = existingProduct.resim || "";
      let resimBase64 = existingProduct.resimBase64 || null;
      let resimlerData = existingProduct.resimler || (existingProduct.resim ? [existingProduct.resim] : []);
      let resimlerBase64 = existingProduct.resimlerBase64 || (existingProduct.resimBase64 ? [existingProduct.resimBase64] : []);
      // Tek resim güncelleme (eski format)
      if (req.files && req.files.resim && req.files.resim[0]) {
        resimData = req.files.resim[0].filename;
        const filePath = path.join("public/uploads", req.files.resim[0].filename);
        resimBase64 = imageToBase64(filePath);
        // Tek resim güncellenirse, resimler array'ini de güncelle
        if (resimlerData.length === 0 || resimlerData.length === 1) {
          resimlerData = [resimData];
          resimlerBase64 = resimBase64 ? [resimBase64] : [];
        }
      }
      
      // Birden fazla resim ekleme (yeni format)
      if (req.files && req.files.resimler && req.files.resimler.length > 0) {
        const newResimlerData = [];
        const newResimlerBase64 = [];
        for (const file of req.files.resimler) {
          newResimlerData.push(file.filename);
          const filePath = path.join("public/uploads", file.filename);
          const base64 = imageToBase64(filePath);
          if (base64) {
            newResimlerBase64.push(base64);
          }
        }
        // Mevcut resimlerle birleştir
        resimlerData = [...resimlerData, ...newResimlerData];
        resimlerBase64 = [...resimlerBase64, ...newResimlerBase64];
        // İlk resmi ana resim olarak kullan
        if (resimlerData.length > 0 && !resimData) {
          resimData = resimlerData[0];
          resimBase64 = resimlerBase64[0] || null;
        }
      }
      
      // Silinecek resimler (req.body'den gelir)
      if (req.body.silinecekResimler) {
        try {
          const silinecekIndeksler = JSON.parse(req.body.silinecekResimler);
          // Ters sırada sil (indeks kaymasını önlemek için)
          silinecekIndeksler.sort((a, b) => b - a).forEach(index => {
            if (index >= 0 && index < resimlerData.length) {
              resimlerData.splice(index, 1);
              if (index < resimlerBase64.length) {
                resimlerBase64.splice(index, 1);
              }
            }
          });
          // Ana resmi güncelle
          if (resimlerData.length > 0) {
            resimData = resimlerData[0];
            resimBase64 = resimlerBase64[0] || null;
          } else {
            resimData = "";
            resimBase64 = null;
          }
        } catch (e) {
          console.error("Silinecek resimler parse hatası:", e);
        }
      }
      
      const updateData = {
        ad: req.body.ad || "",
        kategori: req.body.kategori || "",
        altKategori: req.body.altKategori || "",
        marka: req.body.marka || "",
        aciklama: req.body.aciklama || "",
        resim: resimData,
        resimBase64: resimBase64,
        resimler: resimlerData,
        resimlerBase64: resimlerBase64,
        updatedAt: new Date(),
        // Seramik ürünleri için özel alanlar
        urunKodu: req.body.urunKodu || "",
        doku: req.body.doku || "",
        kalinlik: req.body.kalinlik || "",
        icMekan: req.body.icMekan || "",
        disMekan: req.body.disMekan || "",
        kullanimAlani: req.body.kullanimAlani || "",
        yuzeyGorunumu: req.body.yuzeyGorunumu || "",
        kalip: req.body.kalip || "",
        bunye: req.body.bunye || "",
        urunGrubu: req.body.urunGrubu || "",
        vSkalasi: req.body.vSkalasi || "",
        m2Kutu: req.body.m2Kutu || "",
        m2Palet: req.body.m2Palet || "",
        kutuPalet: req.body.kutuPalet || "",
        paletAgirligi: req.body.paletAgirligi || ""
      };

      const result = await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }
      
      // Güncelleme sonrası güncel veriyi tekrar oku
      const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
      console.log("Güncelleme sonucu:", result);
      console.log("Güncellenmiş ürün:", {
        id: updatedProduct._id.toString(),
        ad: updatedProduct.ad,
        urunKodu: updatedProduct.urunKodu,
        doku: updatedProduct.doku,
        kalinlik: updatedProduct.kalinlik
      });
      
      // Cache'i temizle
      productsCache = null;
      productsCacheTime = null;
      console.log('🔄 Ürün güncellendi, cache temizlendi');
      
      res.json({ success: true, message: "Ürün başarıyla güncellendi", product: updatedProduct });
    } else {
      // JSON fallback
      let products = JSON.parse(fs.readFileSync(DATA_FILE));
      const index = products.findIndex(p => String(p.id) === productId);
      
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }

      let resimData = products[index].resim || "";
      let resimBase64 = products[index].resimBase64 || null;
      let resimlerData = products[index].resimler || (products[index].resim ? [products[index].resim] : []);
      let resimlerBase64 = products[index].resimlerBase64 || (products[index].resimBase64 ? [products[index].resimBase64] : []);
      let videoData = products[index].video || "";
      
      // Tek resim güncelleme
      if (req.files && req.files.resim && req.files.resim[0]) {
        resimData = req.files.resim[0].filename;
        const filePath = path.join("public/uploads", req.files.resim[0].filename);
        resimBase64 = imageToBase64(filePath);
      }
      
      // Birden fazla resim ekleme
      if (req.files && req.files.resimler && req.files.resimler.length > 0) {
        const newResimlerData = [];
        const newResimlerBase64 = [];
        for (const file of req.files.resimler) {
          newResimlerData.push(file.filename);
          const filePath = path.join("public/uploads", file.filename);
          const base64 = imageToBase64(filePath);
          if (base64) {
            newResimlerBase64.push(base64);
          }
        }
        resimlerData = [...resimlerData, ...newResimlerData];
        resimlerBase64 = [...resimlerBase64, ...newResimlerBase64];
      }
      
      products[index] = {
        id: productId,
        ad: req.body.ad || "",
        kategori: req.body.kategori || "",
        altKategori: req.body.altKategori || "",
        marka: req.body.marka || "",
        aciklama: req.body.aciklama || "",
        resim: resimData,
        resimBase64: resimBase64,
        resimler: resimlerData,
        resimlerBase64: resimlerBase64
      };

      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
      
      // Cache'i temizle
      productsCache = null;
      productsCacheTime = null;
      console.log('🔄 Ürün güncellendi (JSON), cache temizlendi');
      
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
      
      // Cache'i temizle
      productsCache = null;
      productsCacheTime = null;
      console.log('🔄 Ürün silindi, cache temizlendi');
      
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
      
      // Cache'i temizle
      productsCache = null;
      productsCacheTime = null;
      
      res.json({ success: true, message: "Ürün başarıyla silindi" });
    }
  } catch (error) {
    console.error("Silme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

/* =======================
   HEALTH CHECK
======================= */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 3000;

// Server'ı hemen başlat (MongoDB bağlantısı arka planda yapılacak)
app.listen(PORT, () => {
  console.log(`✅ Server çalışıyor → http://localhost:${PORT}`);
  
  // MongoDB bağlantısını arka planda dene
  connectDB()
    .then(() => {
      if (isMongoDBEnabled()) {
        console.log("✅ MongoDB bağlantısı aktif");
      } else {
        console.log("📄 JSON dosyaları kullanılıyor (MongoDB bağlantısı yok)");
      }
    })
    .catch((error) => {
      console.log("📄 JSON dosyaları kullanılıyor (MongoDB bağlantısı yok)");
    });
});

/* PUBLIC PRODUCTS */
// API Cache (1 dakika - memory için optimize edildi, base64 görselleri de içeriyor)
let productsCache = null;
let productsCacheTime = null;
const CACHE_DURATION = 1 * 60 * 1000; // 1 dakika (memory için azaltıldı)

app.get("/api/public/products", async (req, res) => {
  try {
    console.log("📥 /api/public/products isteği alındı");
    const now = Date.now();
    const includeDetails = req.query.details === 'true'; // Detay sayfası için
    
    // Cache kontrolü (sadece liste sayfası için)
    if (productsCache && productsCacheTime && (now - productsCacheTime) < CACHE_DURATION && !includeDetails) {
      console.log("💾 Cache'den ürünler döndürülüyor");
      // Cache'den dönen veriyi de görüntülenme sayısına göre sırala
      const sortedCache = [...productsCache].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1 dakika browser cache
      return res.json(sortedCache);
    }
    
    console.log(`🔍 MongoDB durumu: ${isMongoDBEnabled() ? 'Aktif' : 'Pasif'}`);
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      
      // Liste sayfası için projection kullan (sadece gereksiz alanları çıkar, base64 görselleri çek - görseller için gerekli)
      let mongoFindOptions = {};
      if (!includeDetails) {
        mongoFindOptions = {
          projection: {
            // Base64 görselleri tut (görseller için gerekli, ama cache'de tutmayacağız)
            // resimBase64 ve resimlerBase64 projection'dan çıkarılmadı - görseller için gerekli
            // Gereksiz alanları çıkar
            aciklama: 0,
            urunKodu: 0,
            doku: 0,
            kalinlik: 0,
            icMekan: 0,
            disMekan: 0,
            kullanimAlani: 0,
            yuzeyGorunumu: 0,
            kalip: 0,
            bunye: 0,
            urunGrubu: 0,
            vSkalasi: 0,
            m2Kutu: 0,
            m2Palet: 0,
            kutuPalet: 0,
            paletAgirligi: 0,
          },
        };
      }
      
      console.log("⏳ MongoDB query başlatılıyor...");
      const startTime = Date.now();
      
      let products;
      try {
        // MongoDB query'sine timeout ekle (15 saniye)
        const queryPromise = productsCollection.find({}, mongoFindOptions).toArray();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB query timeout (15s)')), 15000)
        );
        
        products = await Promise.race([queryPromise, timeoutPromise]);
        
        const queryTime = Date.now() - startTime;
        console.log(`📦 MongoDB'den ${products.length} ürün çekildi (${includeDetails ? 'detaylı' : 'liste'}) - ${queryTime}ms`);
      } catch (queryError) {
        const queryTime = Date.now() - startTime;
        console.error(`❌ MongoDB query hatası (${queryTime}ms):`, queryError.message);
        // Timeout veya hata durumunda JSON fallback'e geç
        throw new Error(`MongoDB query failed: ${queryError.message}`);
      }
      
      if (products.length === 0) {
        console.warn("⚠️ MongoDB'den hiç ürün gelmedi!");
        // Boş array döndür
        res.json([]);
        return;
      }
      
      console.log("🔄 Ürünler formatlanıyor...");
      const formatStartTime = Date.now();
      
      const formattedProducts = products.map(p => {
        try {
          // Görsel URL'ini oluştur - getImageUrl fonksiyonunu kullan
          let imageUrl = getImageUrl(p);
          
          const baseProduct = {
            id: p._id.toString(),
            ad: p.ad || "İsimsiz Ürün",
            kategori: p.kategori || "",
            altKategori: p.altKategori || "",
            marka: p.marka || "",
            resim: imageUrl, // Görsel URL'i (dosya yolu veya base64 - sadece detay için)
            resimler: p.resimler || (p.resim ? [p.resim] : []),
            viewCount: p.viewCount || 0, // Görüntülenme sayısı
          };
          
          // Detay sayfası için base64 görselleri ve ek alanlar ekle
          if (includeDetails) {
            baseProduct.resimBase64 = p.resimBase64 || null;
            baseProduct.resimlerBase64 = p.resimlerBase64 || (p.resimBase64 ? [p.resimBase64] : []);
            baseProduct.aciklama = p.aciklama;
            baseProduct.urunKodu = p.urunKodu || "";
            baseProduct.doku = p.doku || "";
            baseProduct.kalinlik = p.kalinlik || "";
            baseProduct.icMekan = p.icMekan || "";
            baseProduct.disMekan = p.disMekan || "";
            baseProduct.kullanimAlani = p.kullanimAlani || "";
            baseProduct.yuzeyGorunumu = p.yuzeyGorunumu || "";
            baseProduct.kalip = p.kalip || "";
            baseProduct.bunye = p.bunye || "";
            baseProduct.urunGrubu = p.urunGrubu || "";
            baseProduct.vSkalasi = p.vSkalasi || "";
            baseProduct.m2Kutu = p.m2Kutu || "";
            baseProduct.m2Palet = p.m2Palet || "";
            baseProduct.kutuPalet = p.kutuPalet || "";
            baseProduct.paletAgirligi = p.paletAgirligi || "";
          }
          
          return baseProduct;
        } catch (err) {
          console.error(`❌ Ürün formatlama hatası (ID: ${p._id}):`, err);
          // Hatalı ürünü atla veya minimal veri döndür
          return {
            id: p._id ? p._id.toString() : "unknown",
            ad: p.ad || "Hatalı Ürün",
            kategori: p.kategori || "",
            altKategori: "",
            marka: "",
            resim: "",
            resimler: [],
            viewCount: 0
          };
        }
      });
      
      // Popüler ürünler için görüntülenme sayısına göre sırala
      const sortedProducts = formattedProducts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      
      // Cache'e kaydet (sadece liste için - base64 görselleri cache'den çıkar, sadece URL'leri tut)
      if (!includeDetails) {
        // Base64 görselleri cache'den çıkar (memory tasarrufu), sadece URL formatında tut
        const cacheData = sortedProducts.map(p => {
          const cached = { ...p };
          // Base64 string'leri cache'den çıkar, sadece URL formatında tut
          if (cached.resim && cached.resim.startsWith('data:image')) {
            // Base64 string'i cache'den çıkar, response'da gönder ama cache'de tutma
            // Cache'de sadece bir flag tut
            cached._hasBase64Image = true;
          }
          // resimBase64 ve resimlerBase64'ü cache'den çıkar
          delete cached.resimBase64;
          delete cached.resimlerBase64;
          return cached;
        });
        productsCache = cacheData;
        productsCacheTime = now;
        res.setHeader('Cache-Control', 'public, max-age=60'); // 1 dakika browser cache
        console.log(`💾 Cache'e kaydedildi (${cacheData.length} ürün, base64 görselleri cache'den çıkarıldı)`);
      } else {
        res.setHeader('Cache-Control', 'no-cache'); // Detay için cache yok
      }
      
      console.log(`✅ ${sortedProducts.length} ürün başarıyla döndürülüyor`);
      res.json(sortedProducts);
    } else {
      // JSON fallback
      console.log("📄 JSON fallback kullanılıyor");
      if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ JSON dosyası bulunamadı: ${DATA_FILE}`);
        res.json([]);
        return;
      }
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      console.log(`📄 JSON'dan ${data.length} ürün çekildi`);
      const formattedData = data.map(p => {
        // Görsel URL'ini oluştur (base64 varsa onu, yoksa dosya yolunu kullan)
        let imageUrl = getImageUrl(p);
        
        const baseProduct = {
          ...p,
          resim: imageUrl, // Görsel URL'i (base64 veya dosya yolu)
          resimler: p.resimler || (p.resim ? [p.resim] : []),
          viewCount: p.viewCount || 0, // Görüntülenme sayısı
        };
        
        // Detay sayfası için base64 görselleri ekle
        if (includeDetails) {
          baseProduct.resimBase64 = p.resimBase64 || null;
          baseProduct.resimlerBase64 = p.resimlerBase64 || (p.resimBase64 ? [p.resimBase64] : []);
        }
        
        // Liste sayfası için gereksiz alanları kaldır
        if (!includeDetails) {
          delete baseProduct.aciklama;
          delete baseProduct.urunKodu;
          delete baseProduct.doku;
          delete baseProduct.kalinlik;
          // ... diğer seramik alanları
        }
        
        return baseProduct;
      });
      
      // Popüler ürünler için görüntülenme sayısına göre sırala
      const sortedData = formattedData.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      
      // Cache'e kaydet (sadece liste için - base64 görselleri de cache'de tut, ama kısa süre)
      if (!includeDetails) {
        // Base64 görselleri cache'de tut (görseller için gerekli), ama cache süresi kısa (1 dakika)
        productsCache = sortedData;
        productsCacheTime = now;
        res.setHeader('Cache-Control', 'public, max-age=60'); // 1 dakika browser cache
        console.log(`💾 Cache'e kaydedildi (${sortedData.length} ürün, base64 görselleri dahil)`);
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      
      res.json(sortedData);
    }
  } catch (error) {
    console.error("❌ Ürün listeleme hatası:", error);
    console.error("❌ Hata detayı:", error.stack);
    console.error("❌ Hata mesajı:", error.message);
    // Hata durumunda JSON'dan oku
    try {
      if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ JSON dosyası bulunamadı: ${DATA_FILE}`);
        res.status(500).json({ 
          success: false, 
          message: "Sunucu hatası", 
          error: error.message,
          products: [] 
        });
        return;
      }
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      console.log(`📄 Hata durumunda JSON'dan ${data.length} ürün çekildi`);
      const formattedData = data.map(p => {
        try {
          return {
            ...p,
            resim: getImageUrl(p),
            viewCount: p.viewCount || 0
          };
        } catch (err) {
          console.error("❌ JSON ürün formatlama hatası:", err);
          return { ...p, resim: "", viewCount: 0 };
        }
      });
      res.json(formattedData);
    } catch (jsonError) {
      console.error("❌ JSON okuma hatası:", jsonError);
      // Boş array döndür, frontend hata mesajı gösterebilir
      res.status(500).json({ 
        success: false, 
        message: "Sunucu hatası", 
        error: error.message,
        products: [] 
      });
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
        altKategori: urun.altKategori || "",
        marka: urun.marka,
        aciklama: urun.aciklama,
        resim: getImageUrl(urun),
        viewCount: urun.viewCount || 0,
        // Seramik ürünleri için özel alanlar
        urunKodu: urun.urunKodu || "",
        doku: urun.doku || "",
        kalinlik: urun.kalinlik || "",
        icMekan: urun.icMekan || "",
        disMekan: urun.disMekan || "",
        kullanimAlani: urun.kullanimAlani || "",
        yuzeyGorunumu: urun.yuzeyGorunumu || "",
        kalip: urun.kalip || "",
        bunye: urun.bunye || "",
        urunGrubu: urun.urunGrubu || "",
        vSkalasi: urun.vSkalasi || "",
        m2Kutu: urun.m2Kutu || "",
        m2Palet: urun.m2Palet || "",
        kutuPalet: urun.kutuPalet || "",
        paletAgirligi: urun.paletAgirligi || ""
      });
    } else {
      // JSON fallback
      const products = JSON.parse(fs.readFileSync(DATA_FILE));
      const urun = products.find(p => String(p.id) === String(productId));
      
      if (!urun) {
        return res.status(404).json({ success: false });
      }
      
      res.json({
        ...urun,
        resim: getImageUrl(urun),
        viewCount: urun.viewCount || 0
      });
    }
  } catch (error) {
    console.error("Ürün detay hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

// Ürün görüntülenme sayısını artır
app.post("/api/public/products/:id/view", async (req, res) => {
  try {
    const productId = req.params.id;
    
    if (isMongoDBEnabled() && ObjectId.isValid(productId)) {
      const productsCollection = await getProductsCollection();
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $inc: { viewCount: 1 } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }
      
      res.json({ success: true });
    } else {
      // JSON fallback
      const products = JSON.parse(fs.readFileSync(DATA_FILE));
      const urunIndex = products.findIndex(p => String(p.id) === String(productId));
      
      if (urunIndex === -1) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }
      
      products[urunIndex].viewCount = (products[urunIndex].viewCount || 0) + 1;
      fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
      
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Görüntülenme sayısı artırma hatası:", error);
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
      mongoContact.cevaplandı = false;
      await contactsCollection.insertOne(mongoContact);
    } else {
      // JSON fallback
      // data klasörünü oluştur
      const dataDir = path.dirname(CONTACTS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      let contacts = [];
      if (fs.existsSync(CONTACTS_FILE)) {
        try {
          contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
        } catch (err) {
          console.error("Contacts dosyası okuma hatası:", err);
          contacts = [];
        }
      }
      contact.cevaplandı = false;
      contacts.push(contact);
      
      try {
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf8');
      } catch (err) {
        console.error("Contacts dosyası yazma hatası:", err);
        throw new Error("Form kaydedilemedi. Lütfen tekrar deneyin.");
      }
    }

    // Mail gönder (admin'e bildirim)
    const adminEmail = process.env.ADMIN_EMAIL || "yilmazlarvize@gmail.com";
    const emailSubject = `Yeni İletişim Formu: ${adSoyad}`;
    const emailHtml = `
      <h2>Yeni İletişim Formu Mesajı</h2>
      <p><strong>Ad Soyad:</strong> ${adSoyad}</p>
      <p><strong>E-posta:</strong> ${email}</p>
      <p><strong>Telefon:</strong> ${telefon}</p>
      <p><strong>Mesaj:</strong></p>
      <p>${mesaj.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Bu mesaj ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.</small></p>
    `;
    const emailText = `
Yeni İletişim Formu Mesajı

Ad Soyad: ${adSoyad}
E-posta: ${email}
Telefon: ${telefon}

Mesaj:
${mesaj}

---
Bu mesaj ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.
    `;
    
    // Mail göndermeyi arka planda yap (hata olsa bile form kaydedilsin)
    sendEmail(adminEmail, emailSubject, emailHtml, emailText).catch(err => {
      console.error("Mail gönderme hatası (form kaydedildi):", err);
    });

    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    const errorMessage = error.message || "Bir hata oluştu. Lütfen tekrar deneyin.";
    res.status(500).json({ success: false, message: errorMessage });
  }
});

/* =======================
   ADMIN - CONTACTS
======================= */

// Mesajları listele
app.get("/api/contacts", auth, async (req, res) => {
  try {
    let contacts = [];
    
    if (isMongoDBEnabled()) {
      const contactsCollection = await getContactsCollection();
      contacts = await contactsCollection.find({}).sort({ tarih: -1 }).toArray();
      // MongoDB'den gelen verileri formatla
      contacts = contacts.map(c => ({
        id: c._id.toString(),
        adSoyad: c.adSoyad,
        email: c.email,
        telefon: c.telefon,
        mesaj: c.mesaj,
        tarih: c.tarih ? c.tarih.toISOString() : new Date().toISOString(),
        cevaplandı: c.cevaplandı || false,
        cevap: c.cevap || null,
        cevapTarihi: c.cevapTarihi ? c.cevapTarihi.toISOString() : null
      }));
    } else {
      // JSON fallback
      if (fs.existsSync(CONTACTS_FILE)) {
        contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
        // Tarihe göre sırala (en yeni önce)
        contacts.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
      }
    }
    
    res.json(contacts);
  } catch (error) {
    console.error("Mesaj listeleme hatası:", error);
    res.status(500).json({ success: false, message: "Mesajlar yüklenemedi." });
  }
});

// Mesaja cevap ver
app.post("/api/contacts/:id/reply", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cevap } = req.body;
    
    if (!cevap || !cevap.trim()) {
      return res.status(400).json({ success: false, message: "Cevap metni boş olamaz." });
    }
    
    if (isMongoDBEnabled()) {
      const contactsCollection = await getContactsCollection();
      const contact = await contactsCollection.findOne({ _id: new ObjectId(id) });
      
      if (!contact) {
        return res.status(404).json({ success: false, message: "Mesaj bulunamadı." });
      }
      
      // Mesajı güncelle
      await contactsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            cevaplandı: true,
            cevap: cevap.trim(),
            cevapTarihi: new Date()
          }
        }
      );
      
      // Mail gönder
      const emailSubject = `Yılmazlar Yapı Market - Mesajınıza Cevap`;
      const emailHtml = `
        <h2>Merhaba ${contact.adSoyad},</h2>
        <p>Size gönderdiğiniz mesajınıza cevap vermek istiyoruz:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Orijinal Mesajınız:</strong></p>
          <p>${contact.mesaj.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Cevabımız:</strong></p>
          <p>${cevap.replace(/\n/g, '<br>')}</p>
        </div>
        <hr>
        <p><small>Bu mesaj ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.</small></p>
        <p><small>Yılmazlar Yapı Market - Kırklareli / Vize</small></p>
      `;
      const emailText = `
Merhaba ${contact.adSoyad},

Size gönderdiğiniz mesajınıza cevap vermek istiyoruz:

Orijinal Mesajınız:
${contact.mesaj}

Cevabımız:
${cevap}

---
Bu mesaj ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.
Yılmazlar Yapı Market - Kırklareli / Vize
      `;
      
      await sendEmail(contact.email, emailSubject, emailHtml, emailText);
      
      res.json({ success: true, message: "Cevap başarıyla gönderildi!" });
    } else {
      // JSON fallback
      let contacts = [];
      if (fs.existsSync(CONTACTS_FILE)) {
        contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
      }
      
      const contactIndex = contacts.findIndex(c => c.id === id);
      if (contactIndex === -1) {
        return res.status(404).json({ success: false, message: "Mesaj bulunamadı." });
      }
      
      contacts[contactIndex].cevaplandı = true;
      contacts[contactIndex].cevap = cevap.trim();
      contacts[contactIndex].cevapTarihi = new Date().toISOString();
      
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
      
      // Mail gönder
      const contact = contacts[contactIndex];
      const emailSubject = `Yılmazlar Yapı Market - Mesajınıza Cevap`;
      const emailHtml = `
        <h2>Merhaba ${contact.adSoyad},</h2>
        <p>Size gönderdiğiniz mesajınıza cevap vermek istiyoruz:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Orijinal Mesajınız:</strong></p>
          <p>${contact.mesaj.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Cevabımız:</strong></p>
          <p>${cevap.replace(/\n/g, '<br>')}</p>
        </div>
        <hr>
        <p><small>Bu mesaj ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.</small></p>
        <p><small>Yılmazlar Yapı Market - Kırklareli / Vize</small></p>
      `;
      const emailText = `
Merhaba ${contact.adSoyad},

Size gönderdiğiniz mesajınıza cevap vermek istiyoruz:

Orijinal Mesajınız:
${contact.mesaj}

Cevabımız:
${cevap}

---
Bu mesaj ${new Date().toLocaleString('tr-TR')} tarihinde gönderilmiştir.
Yılmazlar Yapı Market - Kırklareli / Vize
      `;
      
      await sendEmail(contact.email, emailSubject, emailHtml, emailText);
      
      res.json({ success: true, message: "Cevap başarıyla gönderildi!" });
    }
  } catch (error) {
    console.error("Cevap gönderme hatası:", error);
    res.status(500).json({ success: false, message: "Cevap gönderilemedi." });
  }
});

/* =======================
   PRODUCT REVIEWS
======================= */

// Ürün yorumlarını getir
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isMongoDBEnabled()) {
      const reviewsCollection = await getReviewsCollection();
      const reviews = await reviewsCollection.find({ productId: id, onaylandı: true }).sort({ tarih: -1 }).toArray();
      res.json(reviews.map(r => ({
        id: r._id.toString(),
        productId: r.productId,
        ad: r.ad,
        yorum: r.yorum,
        puan: r.puan,
        tarih: r.tarih ? r.tarih.toISOString() : new Date().toISOString()
      })));
    } else {
      // JSON fallback
      const reviewsFile = "./data/reviews.json";
      let reviews = [];
      if (fs.existsSync(reviewsFile)) {
        reviews = JSON.parse(fs.readFileSync(reviewsFile));
      }
      reviews = reviews.filter(r => r.productId === id && r.onaylandı !== false);
      res.json(reviews);
    }
  } catch (error) {
    console.error("Yorum getirme hatası:", error);
    res.status(500).json({ success: false, message: "Yorumlar yüklenemedi." });
  }
});

// Yorum ekle
app.post("/api/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { ad, yorum, puan } = req.body;
    
    if (!ad || !yorum || !puan) {
      return res.status(400).json({ success: false, message: "Tüm alanlar doldurulmalıdır." });
    }
    
    if (puan < 1 || puan > 5) {
      return res.status(400).json({ success: false, message: "Puan 1-5 arası olmalıdır." });
    }
    
    const review = {
      productId: id,
      ad: ad.trim(),
      yorum: yorum.trim(),
      puan: parseInt(puan),
      tarih: new Date(),
      onaylandı: false // Admin onayı bekliyor
    };
    
    if (isMongoDBEnabled()) {
      const reviewsCollection = await getReviewsCollection();
      await reviewsCollection.insertOne(review);
    } else {
      // JSON fallback
      const reviewsFile = "./data/reviews.json";
      let reviews = [];
      if (fs.existsSync(reviewsFile)) {
        reviews = JSON.parse(fs.readFileSync(reviewsFile));
      }
      review.id = Date.now().toString();
      reviews.push(review);
      fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
    }
    
    res.json({ success: true, message: "Yorumunuz gönderildi. Onaylandıktan sonra yayınlanacaktır." });
  } catch (error) {
    console.error("Yorum ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Yorum eklenemedi." });
  }
});

/* =======================
   BLOG
======================= */

// Blog yazılarını getir
app.get("/api/blog", async (req, res) => {
  try {
    if (isMongoDBEnabled()) {
      const blogCollection = await getBlogCollection();
      const posts = await blogCollection.find({}).sort({ tarih: -1 }).toArray();
      res.json(posts.map(p => ({
        id: p._id.toString(),
        baslik: p.baslik,
        ozet: p.ozet,
        icerik: p.icerik,
        resim: p.resim,
        tarih: p.tarih ? p.tarih.toISOString() : new Date().toISOString(),
        yazar: p.yazar || "Yılmazlar Yapı Market"
      })));
    } else {
      // JSON fallback
      const blogFile = "./data/blog.json";
      let posts = [];
      if (fs.existsSync(blogFile)) {
        posts = JSON.parse(fs.readFileSync(blogFile));
      }
      res.json(posts);
    }
  } catch (error) {
    console.error("Blog getirme hatası:", error);
    res.status(500).json({ success: false, message: "Blog yazıları yüklenemedi." });
  }
});

// Blog yazısı getir
app.get("/api/blog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isMongoDBEnabled()) {
      const blogCollection = await getBlogCollection();
      const post = await blogCollection.findOne({ _id: new ObjectId(id) });
      if (!post) {
        return res.status(404).json({ success: false, message: "Yazı bulunamadı." });
      }
      res.json({
        id: post._id.toString(),
        baslik: post.baslik,
        ozet: post.ozet,
        icerik: post.icerik,
        resim: post.resim,
        tarih: post.tarih ? post.tarih.toISOString() : new Date().toISOString(),
        yazar: post.yazar || "Yılmazlar Yapı Market"
      });
    } else {
      // JSON fallback
      const blogFile = "./data/blog.json";
      let posts = [];
      if (fs.existsSync(blogFile)) {
        posts = JSON.parse(fs.readFileSync(blogFile));
      }
      const post = posts.find(p => p.id === id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Yazı bulunamadı." });
      }
      res.json(post);
    }
  } catch (error) {
    console.error("Blog yazısı getirme hatası:", error);
    res.status(500).json({ success: false, message: "Yazı yüklenemedi." });
  }
});

// Blog yazısı ekle (admin)
app.post("/api/blog", auth, async (req, res) => {
  try {
    const { baslik, ozet, icerik, resim } = req.body;
    
    if (!baslik || !icerik) {
      return res.status(400).json({ success: false, message: "Başlık ve içerik zorunludur." });
    }
    
    const post = {
      baslik: baslik.trim(),
      ozet: ozet ? ozet.trim() : "",
      icerik: icerik.trim(),
      resim: resim || "",
      tarih: new Date(),
      yazar: "Yılmazlar Yapı Market"
    };
    
    if (isMongoDBEnabled()) {
      const blogCollection = await getBlogCollection();
      await blogCollection.insertOne(post);
    } else {
      // JSON fallback
      const blogFile = "./data/blog.json";
      let posts = [];
      if (fs.existsSync(blogFile)) {
        posts = JSON.parse(fs.readFileSync(blogFile));
      }
      post.id = Date.now().toString();
      posts.push(post);
      fs.writeFileSync(blogFile, JSON.stringify(posts, null, 2));
    }
    
    res.json({ success: true, message: "Blog yazısı eklendi!" });
  } catch (error) {
    console.error("Blog ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Blog yazısı eklenemedi." });
  }
});

/* =======================
   PDF CATALOG
======================= */

// PDF katalog indirme
app.get("/api/catalog/download", (req, res) => {
  const catalogPath = path.join(__dirname, "public", "catalog.pdf");
  if (fs.existsSync(catalogPath)) {
    res.download(catalogPath, "Yilmazlar_Yapi_Market_Katalog.pdf", (err) => {
      if (err) {
        console.error("PDF indirme hatası:", err);
        res.status(500).json({ success: false, message: "Katalog indirilemedi." });
      }
    });
  } else {
    // Katalog dosyası yoksa bilgilendirme sayfasına yönlendir
    res.redirect("/iletisim.html?katalog=yok");
  }
});

// Katalog bilgilendirme endpoint'i
app.get("/api/catalog/info", (req, res) => {
  const catalogPath = path.join(__dirname, "public", "catalog.pdf");
  res.json({ 
    exists: fs.existsSync(catalogPath),
    message: fs.existsSync(catalogPath) 
      ? "Katalog mevcut" 
      : "Katalog henüz hazırlanmamış. Lütfen bizimle iletişime geçin."
  });
});

// Instagram oEmbed endpoint
app.get("/api/instagram/oembed", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL parametresi gerekli" });
    }

    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
    
    https.get(oembedUrl, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const oembed = JSON.parse(data);
          res.json({ success: true, data: oembed });
        } catch (error) {
          res.status(500).json({ success: false, message: "Instagram oEmbed parse hatası" });
        }
      });
    }).on('error', (error) => {
      res.status(500).json({ success: false, message: "Instagram oEmbed hatası: " + error.message });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

/* =======================
   CATEGORY SHOWCASE API
======================= */
const CATEGORY_SHOWCASE_FILE = path.join(__dirname, "data", "category-showcase.json");
const CATEGORIES_CONFIG_FILE = path.join(__dirname, "data", "categories.json");

// Otomatik Git Commit Fonksiyonu
function autoCommitCategoryImage(imagePath, categoryId) {
  // Kategori görselleri her zaman commit edilmeli (deploy için kritik)
  const imageRelativePath = `public/uploads/categories/${path.basename(imagePath)}`;
  const commitMessage = `Kategori görseli güncellendi: ${categoryId}`;

  console.log('🔄 Git commit başlatılıyor...', imageRelativePath);
  
  // Git add
  exec(`git add "${imageRelativePath}"`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git add hatası:', error.message);
      return;
    }
    
    console.log('✅ Git add başarılı:', imageRelativePath);
    
    // Git commit
    exec(`git commit -m "${commitMessage}"`, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        // Commit hatası olabilir (değişiklik yoksa)
        if (error.message.includes('nothing to commit') || error.message.includes('no changes')) {
          console.log('ℹ️ Commit edilecek değişiklik yok (dosya zaten commit edilmiş)');
        } else {
          console.error('❌ Git commit hatası:', error.message);
        }
        return;
      }
      
      console.log('✅ Git commit başarılı:', commitMessage);
      
      // Git push (opsiyonel - dikkatli kullanın)
      if (process.env.AUTO_PUSH === 'true') {
        exec('git push', { cwd: __dirname }, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Git push hatası:', error.message);
            console.log('ℹ️ Manuel olarak push yapabilirsiniz: git push');
          } else {
            console.log('✅ Git push başarılı');
          }
        });
      } else {
        console.log('ℹ️ AUTO_PUSH kapalı, manuel push yapabilirsiniz: git push');
      }
    });
  });
}

// Data klasörünü oluştur
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
}

// Kategorileri getir (config dosyasından)
const CATEGORIES_FILE = path.join(__dirname, "data", "categories.json");

app.get("/api/categories", auth, (req, res) => {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
      res.json(data);
    } else {
      // Varsayılan kategoriler
      const defaultCategories = {
        categories: [
          { id: "boya", name: "Boya", slug: "boya-urunleri", subCategories: [] },
          { id: "hirdavat", name: "Hırdavat", slug: "hirdavat-urunleri", subCategories: [] },
          { id: "yapi-malzemeleri", name: "Yapı Malzemeleri", slug: "yapi-malzemeleri", subCategories: [] },
          { id: "elektrikli-el-aletleri", name: "Elektrikli El Aletleri", slug: "elektrikli-el-aletleri-urunleri", subCategories: [] },
          { id: "seramik", name: "Seramik ve Fayans", slug: "seramik-urunleri", subCategories: [] },
          { id: "banyo", name: "Banyo", slug: "banyo-urunleri", subCategories: [] },
          { id: "parke", name: "Parke", slug: "parke-urunleri", subCategories: [] },
          { id: "armatur", name: "Armatür", slug: "armatur-urunleri", subCategories: [] }
        ]
      };
      res.json(defaultCategories);
    }
  } catch (error) {
    console.error("Kategoriler okuma hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası", categories: [] });
  }
});

// Kategori showcase ayarlarını getir
app.get("/api/category-showcase", auth, async (req, res) => {
  try {
    // Varsayılan kategoriler (Ürün Grupları vitrininde gösterilecekler)
    const defaultCategories = [
      { id: "boya", name: "Boya", image: "/uploads/categories/boya.jpg", url: "/boya-urunleri.html" },
      { id: "hirdavat", name: "Hırdavat", image: "/uploads/categories/hirdavat.jpg", url: "/hirdavat-urunleri.html" },
      { id: "yapi-malzemeleri", name: "Yapı Malzemeleri", image: "/uploads/categories/yapi-malzemeleri.jpg", url: "/yapi-malzemeleri.html" },
      { id: "elektrikli-el-aletleri", name: "Elektrikli El Aletleri", image: "/uploads/categories/elektrikli-el-aletleri.jpg", url: "/elektrikli-el-aletleri-urunleri.html" },
      { id: "seramik", name: "Seramik ve Fayans", image: "/uploads/categories/seramik.jpg", url: "/seramik-urunleri.html" },
      { id: "banyo", name: "Banyo", image: "/uploads/categories/banyo.jpg", url: "/banyo-urunleri.html" },
      { id: "armatur", name: "Armatür", image: "/uploads/categories/armatur.jpg", url: "/armatur-urunleri.html" },
      { id: "parke", name: "Parke", image: "/uploads/categories/parke.jpg", url: "/parke-urunleri.html" }
    ];

    if (isMongoDBEnabled()) {
      const showcaseCollection = await getCategoryShowcaseCollection();
      const data = await showcaseCollection.findOne({ type: 'category_showcase' });
      if (data && data.categories) {
        // Eski kayıtlardaki Tesisat kategorisini gizle, Armatür yoksa ekle
        let categories = data.categories.filter(
          (cat) => !(cat.id === "tesisat" || cat.name === "Tesisat")
        );

        const hasArmatur = categories.some(
          (cat) => cat.id === "armatur" || cat.name === "Armatür"
        );
        if (!hasArmatur) {
          categories.push({
            id: "armatur",
            name: "Armatür",
            image: "/uploads/categories/armatur.jpg",
            url: "/armatur-urunleri.html",
          });
        }

        res.json({ categories });
      } else {
        res.json({ categories: defaultCategories });
      }
    } else {
      // JSON fallback
      if (fs.existsSync(CATEGORY_SHOWCASE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CATEGORY_SHOWCASE_FILE, 'utf8'));
        res.json(data);
      } else {
        res.json({ categories: defaultCategories });
      }
    }
  } catch (error) {
    console.error("Kategori showcase okuma hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

// Kategori showcase ayarlarını kaydet
app.post("/api/category-showcase", auth, async (req, res) => {
  try {
    console.log('📥 Kategori showcase kaydetme isteği alındı');
    console.log('📥 Request body:', JSON.stringify(req.body).substring(0, 200) + '...');
    
    const { categories } = req.body;
    
    if (!categories) {
      console.error('❌ Categories field eksik');
      return res.status(400).json({ success: false, message: "Categories field gerekli" });
    }
    
    if (!Array.isArray(categories)) {
      console.error('❌ Categories bir array değil:', typeof categories, categories);
      return res.status(400).json({ 
        success: false, 
        message: "Categories bir array olmalı. Alınan tip: " + typeof categories 
      });
    }
    
    if (categories.length === 0) {
      console.warn('⚠️ Boş kategori listesi gönderildi');
      return res.status(400).json({ success: false, message: "En az bir kategori gerekli" });
    }
    
    console.log('💾 Kategori showcase kaydediliyor:', categories.length, 'kategori');
    
    // Base64 görselleri kontrol et ve logla
    categories.forEach(cat => {
      if (cat.imageBase64) {
        console.log(`  - ${cat.name}: Base64 görsel var (${Math.round(cat.imageBase64.length / 1024)} KB)`);
      } else if (cat.image && cat.image.startsWith('data:')) {
        console.log(`  - ${cat.name}: Base64 görsel image field'ında (${Math.round(cat.image.length / 1024)} KB)`);
        // imageBase64 field'ı yoksa image'den kopyala
        if (!cat.imageBase64) {
          cat.imageBase64 = cat.image;
        }
      } else {
        console.log(`  - ${cat.name}: Dosya yolu kullanılıyor: ${cat.image}`);
      }
    });
    
    const data = {
      categories: categories,
      updatedAt: new Date()
    };
    
    if (isMongoDBEnabled()) {
      // MongoDB'ye kaydet
      const showcaseCollection = await getCategoryShowcaseCollection();
      await showcaseCollection.updateOne(
        { type: 'category_showcase' },
        { $set: data },
        { upsert: true }
      );
      console.log('✅ Kategori showcase MongoDB\'ye kaydedildi');
    } else {
      // JSON fallback
      fs.writeFileSync(CATEGORY_SHOWCASE_FILE, JSON.stringify({ ...data, updatedAt: data.updatedAt.toISOString() }, null, 2), 'utf8');
      console.log('✅ Kategori showcase JSON dosyasına kaydedildi:', CATEGORY_SHOWCASE_FILE);
    }
    
    res.json({ success: true, message: "Kategori showcase ayarları kaydedildi" });
  } catch (error) {
    console.error("❌ Kategori showcase kaydetme hatası:", error);
    console.error("❌ Hata detayları:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

// Kategori görseli yükle
const uploadCategoryImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "public/uploads/categories";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Geçici dosya adı - endpoint'te categoryId'ye göre yeniden adlandırılacak
      const ext = path.extname(file.originalname).toLowerCase();
      const tempFilename = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      cb(null, tempFilename);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları kabul edilir!'), false);
    }
  }
});

app.post("/api/category-showcase/image", auth, uploadCategoryImage.single("image"), async (req, res) => {
  try {
    console.log('📤 Görsel yükleme isteği - req.body:', req.body, 'filename:', req.file?.filename);
    
    if (!req.file) {
      // Multer hatası olabilir - kontrol et
      if (req.fileValidationError) {
        return res.status(400).json({ success: false, message: req.fileValidationError });
      }
      return res.status(400).json({ success: false, message: "Görsel yüklenmedi. Lütfen bir resim dosyası seçin (JPG, PNG, GIF - max 10MB)" });
    }
    
    // categoryId ve categoryName'i kontrol et
    let categoryId = req.body.categoryId;
    let categoryName = req.body.categoryName || categoryId;
    
    if (!categoryId || categoryId === 'category' || categoryId === 'undefined' || categoryId === 'null') {
      // Yüklenen dosyayı sil
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.warn('⚠️ Geçici dosya silme hatası:', unlinkError.message);
        }
      }
      return res.status(400).json({ success: false, message: "Category ID gerekli. Lütfen sayfayı yenileyin ve tekrar deneyin." });
    }
    
    // categoryId'yi temizle ve dosya adı oluştur
    let cleanCategoryId = String(categoryId).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    cleanCategoryId = cleanCategoryId.replace(/-+/g, '-');
    cleanCategoryId = cleanCategoryId.replace(/^-+|-+$/g, '');
    
    if (!cleanCategoryId || cleanCategoryId === '-' || cleanCategoryId.length === 0) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.warn('⚠️ Geçici dosya silme hatası:', unlinkError.message);
        }
      }
      return res.status(400).json({ success: false, message: "Geçersiz Category ID" });
    }
    
    // Dosyayı categoryId'ye göre yeniden adlandır
    const ext = path.extname(req.file.filename);
    const newFilename = `${cleanCategoryId}${ext}`;
    const newPath = path.join(path.dirname(req.file.path), newFilename);
    
    // Eğer aynı isimde dosya varsa sil
    if (fs.existsSync(newPath) && newPath !== req.file.path) {
      fs.unlinkSync(newPath);
    }
    
    // Dosyayı yeniden adlandır
    try {
      fs.renameSync(req.file.path, newPath);
      console.log('✅ Dosya yeniden adlandırıldı:', req.file.filename, '->', newFilename);
    } catch (renameError) {
      console.error('❌ Dosya yeniden adlandırma hatası:', renameError);
      // Geçici dosyayı sil
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ success: false, message: "Dosya işleme hatası: " + renameError.message });
    }
    
    categoryId = cleanCategoryId; // Temizlenmiş categoryId'yi kullan
    
    // Görseli base64'e çevir (Git'te kalması için)
    let imageBuffer, imageBase64, imageDataUri;
    try {
      if (!fs.existsSync(newPath)) {
        throw new Error('Dosya bulunamadı: ' + newPath);
      }
      imageBuffer = fs.readFileSync(newPath);
      imageBase64 = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      imageDataUri = `data:${mimeType};base64,${imageBase64}`;
      console.log('✅ Görsel base64\'e çevrildi, boyut:', Math.round(imageBase64.length / 1024), 'KB');
    } catch (base64Error) {
      console.error('❌ Base64 çevirme hatası:', base64Error);
      // Dosyayı sil
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }
      return res.status(500).json({ success: false, message: "Görsel işleme hatası: " + base64Error.message });
    }
    
    // Yeni dosya adını kullan (yeniden adlandırılmış dosya)
    const newImagePath = `/uploads/categories/${newFilename}`;
    console.log('📁 Yeni görsel yolu:', newImagePath);
    console.log('📦 Base64 görsel boyutu:', Math.round(imageBase64.length / 1024), 'KB');
    
    // Kategoriyi bul veya oluştur
    const category = { 
      id: categoryId, 
      name: categoryName, 
      image: imageDataUri, // Base64 görseli direkt image field'ına kopyala
      imageBase64: imageDataUri,
      url: `/urunler.html?kategori=${categoryId}`
    };
    
    // MongoDB'ye veya JSON dosyasına kaydet
    try {
      if (isMongoDBEnabled()) {
        // MongoDB'ye kaydet
        const showcaseCollection = await getCategoryShowcaseCollection();
        const existingData = await showcaseCollection.findOne({ type: 'category_showcase' });
        
        let categories = [];
        if (existingData && existingData.categories) {
          categories = existingData.categories;
          // Mevcut kategoriyi bul ve güncelle
          const existingIndex = categories.findIndex(c => c.id === categoryId);
          if (existingIndex >= 0) {
            categories[existingIndex] = category;
          } else {
            categories.push(category);
          }
        } else {
          categories = [category];
        }
        
        await showcaseCollection.updateOne(
          { type: 'category_showcase' },
          { 
            $set: { 
              categories: categories,
              updatedAt: new Date()
            } 
          },
          { upsert: true }
        );
        console.log('✅ Base64 görsel MongoDB\'ye kaydedildi');
      } else {
        // JSON fallback
        let showcaseData = { categories: [] };
        if (fs.existsSync(CATEGORY_SHOWCASE_FILE)) {
          showcaseData = JSON.parse(fs.readFileSync(CATEGORY_SHOWCASE_FILE, 'utf8'));
        }
        
        // Kategoriyi bul veya oluştur
        const existingIndex = showcaseData.categories?.findIndex(c => c.id === categoryId);
        if (existingIndex >= 0) {
          showcaseData.categories[existingIndex] = category;
        } else {
          if (!showcaseData.categories) {
            showcaseData.categories = [];
          }
          showcaseData.categories.push(category);
        }
        
        showcaseData.updatedAt = new Date().toISOString();
        fs.writeFileSync(CATEGORY_SHOWCASE_FILE, JSON.stringify(showcaseData, null, 2), 'utf8');
        console.log('✅ Base64 görsel JSON dosyasına kaydedildi');
      }
      
      // Eski görseli sil (eğer varsa ve farklıysa) - sadece JSON fallback için
      if (!isMongoDBEnabled() && category.image && category.image !== newImagePath && !category.image.startsWith('data:')) {
        const oldImagePath = category.image.replace(/^\//, '');
        const fullOldPath = path.join('public', oldImagePath);
        if (fs.existsSync(fullOldPath) && oldImagePath.includes('/categories/')) {
          try {
            fs.unlinkSync(fullOldPath);
            console.log('🗑️ Eski görsel dosyası silindi:', fullOldPath);
          } catch (unlinkError) {
            console.warn('⚠️ Eski görsel silme hatası (önemli değil):', unlinkError.message);
          }
        }
      }
    } catch (saveError) {
      console.error('❌ Kategori kaydetme hatası:', saveError);
      // Hata olsa bile devam et
    }
    
    console.log('✅ Görsel başarıyla yüklendi:', newImagePath, 'Category ID:', categoryId);
    
    // Otomatik git commit (hem dosya hem JSON)
    autoCommitCategoryImage(newPath, categoryId);
    // JSON dosyasını da commit et
    try {
      exec(`git add "${CATEGORY_SHOWCASE_FILE}"`, { cwd: __dirname }, (error) => {
        if (!error) {
          exec(`git commit -m "Kategori görseli base64 olarak kaydedildi: ${categoryId}"`, { cwd: __dirname }, (error) => {
            if (!error) {
              console.log('✅ JSON dosyası commit edildi');
            }
          });
        }
      });
    } catch (gitError) {
      console.warn('⚠️ Git commit hatası (önemli değil):', gitError.message);
    }
    
    res.json({ 
      success: true, 
      imagePath: newImagePath, 
      imageBase64: imageDataUri,
      message: "Görsel yüklendi ve base64 olarak kaydedildi" 
    });
  } catch (error) {
    console.error("❌ Kategori görsel yükleme hatası:", error);
    console.error("❌ Hata detayları:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      file: req.file ? { filename: req.file.filename, path: req.file.path } : null
    });
    
    // Yüklenen dosyayı temizle
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Hata nedeniyle geçici dosya silindi');
      } catch (unlinkError) {
        console.warn('⚠️ Geçici dosya silme hatası:', unlinkError.message);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Sunucu hatası: " + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Multer hata yakalama middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer hatası:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: "Dosya boyutu çok büyük! Maksimum 10MB olmalı." });
    }
    return res.status(400).json({ success: false, message: "Dosya yükleme hatası: " + error.message });
  }
  if (error) {
    console.error('❌ Dosya yükleme hatası:', error);
    return res.status(400).json({ success: false, message: error.message || "Dosya yükleme hatası" });
  }
  next();
});

// Public kategori showcase (ana sayfa için)
app.get("/api/public/category-showcase", async (req, res) => {
  try {
    // Cache'i önle
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Varsayılan kategoriler (Ürün Grupları vitrininde gösterilecekler)
    // Gerçek dosya adlarına göre güncellendi
    const defaultCategories = [
      { id: "boya", name: "Boya", image: "/uploads/categories/boya2.png", url: "/boya-urunleri.html" },
      { id: "hirdavat", name: "Hırdavat", image: "/uploads/categories/Hırdavat.jpeg", url: "/hirdavat-urunleri.html" },
      { id: "yapi-malzemeleri", name: "Yapı Malzemeleri", image: "/uploads/categories/yapi-malzemeleri.jpg", url: "/yapi-malzemeleri.html" },
      { id: "elektrikli-el-aletleri", name: "Elektrikli El Aletleri", image: "/uploads/categories/elektrikli-el-aletleri.jpg", url: "/el-aletleri-urunleri.html" },
      { id: "seramik", name: "Seramik ve Fayans", image: "/uploads/categories/seramik.jpg", url: "/seramik-urunleri.html" },
      { id: "banyo", name: "Banyo", image: "/uploads/categories/banyodolabi.png", url: "/banyo-urunleri.html" },
      { id: "armatur", name: "Armatür", image: "/uploads/categories/armatur.jpg", url: "/armatur-urunleri.html" },
      { id: "parke", name: "Parke", image: "/uploads/categories/parke.JPG", url: "/parke-urunleri.html" }
    ];
    
    if (isMongoDBEnabled()) {
      // MongoDB'den oku
      const showcaseCollection = await getCategoryShowcaseCollection();
      const data = await showcaseCollection.findOne({ type: 'category_showcase' });
      
      if (data && data.categories && data.categories.length > 0) {
        // Önce Tesisat'ı gizle, Armatür yoksa ekle
        let categoriesRaw = data.categories.filter(
          (cat) => !(cat.id === "tesisat" || cat.name === "Tesisat")
        );

        const hasArmatur = categoriesRaw.some(
          (cat) => cat.id === "armatur" || cat.name === "Armatür"
        );
        if (!hasArmatur) {
          categoriesRaw.push({
            id: "armatur",
            name: "Armatür",
            image: "/uploads/categories/armatur.jpg",
            url: "/armatur-urunleri.html",
          });
        }

        // Base64 görselleri varsa onları kullan, yoksa dosya yolunu kullan
        const categories = categoriesRaw.map(cat => {
          let imageUrl = cat.image || cat.imageBase64 || '';
          
          // Base64 görsel varsa onu kullan
          if (cat.imageBase64) {
            imageUrl = cat.imageBase64;
          } else if (cat.image) {
            // Dosya yolu varsa kontrol et
            const filePath = path.join(__dirname, 'public', cat.image);
            if (fs.existsSync(filePath)) {
              imageUrl = cat.image;
            } else {
              // Dosya yoksa default'tan al
              const defaultCat = defaultCategories.find(dc => dc.id === cat.id || dc.name === cat.name);
              imageUrl = defaultCat ? defaultCat.image : cat.image;
            }
          } else {
            // Hiç görsel yoksa default'tan al
            const defaultCat = defaultCategories.find(dc => dc.id === cat.id || dc.name === cat.name);
            imageUrl = defaultCat ? defaultCat.image : '';
          }
          
          return {
            ...cat,
            image: imageUrl,
            url: cat.url || (defaultCategories.find(dc => dc.id === cat.id || dc.name === cat.name)?.url || '#')
          };
        });

        console.log(`📸 Kategori showcase: ${categories.length} kategori yüklendi`);
        res.json({ categories });
      } else {
        console.log('📸 Kategori showcase: MongoDB\'de veri yok, default kategoriler kullanılıyor');
        res.json({ categories: defaultCategories });
      }
    } else {
      // JSON fallback
      if (fs.existsSync(CATEGORY_SHOWCASE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CATEGORY_SHOWCASE_FILE, 'utf8'));
        
        // Base64 görselleri varsa onları kullan, yoksa dosya yolunu kullan
        if (data.categories) {
          data.categories = data.categories.map(cat => {
            // Base64 görsel varsa onu kullan (öncelikli)
            if (cat.imageBase64) {
              return { ...cat, image: cat.imageBase64 };
            }
            // Base64 yoksa dosya yolunu kullan
            return cat;
          });
        }
        
        console.log(`📸 Kategori showcase: JSON'dan ${data.categories?.length || 0} kategori yüklendi`);
        res.json(data);
      } else {
        console.log('📸 Kategori showcase: JSON dosyası yok, default kategoriler kullanılıyor');
        res.json({ categories: defaultCategories });
      }
    }
  } catch (error) {
    console.error("❌ Kategori showcase hatası:", error);
    console.error("Hata detayı:", error.stack);
    // Hata durumunda da default kategorileri döndür
    const defaultCategories = [
      { id: "boya", name: "Boya", image: "/uploads/categories/boya2.png", url: "/boya-urunleri.html" },
      { id: "hirdavat", name: "Hırdavat", image: "/uploads/categories/Hırdavat.jpeg", url: "/hirdavat-urunleri.html" },
      { id: "banyo", name: "Banyo", image: "/uploads/categories/banyodolabi.png", url: "/banyo-urunleri.html" },
      { id: "armatur", name: "Armatür", image: "/uploads/categories/armatur.jpg", url: "/armatur-urunleri.html" },
      { id: "parke", name: "Parke", image: "/uploads/categories/parke.JPG", url: "/parke-urunleri.html" }
    ];
    res.status(500).json({ categories: defaultCategories });
  }
});
  