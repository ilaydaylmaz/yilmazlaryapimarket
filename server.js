require("dotenv").config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
const { getProductsCollection, getContactsCollection, getReviewsCollection, getBlogCollection, connectDB, isMongoDBEnabled } = require("./db");
const https = require("https");

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
// Resimleri hem dosya sistemine hem de base64 olarak kaydet
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Klasör yoksa oluştur
    const uploadDir = "public/uploads";
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

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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
    // Cache'i önle
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      const products = await productsCollection.find({}).toArray();
      const formattedProducts = products.map(p => ({
        id: p._id.toString(),
        ad: p.ad,
        kategori: p.kategori,
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

/* Ekle */
app.post("/api/products", auth, upload.single("resim"), async (req, res) => {
  try {
    let resimData = "";
    let resimBase64 = null;
    
    // Resim varsa hem dosya adını hem de base64'ü kaydet
    if (req.file) {
      resimData = req.file.filename;
      // Base64'e çevir (Render'da kalıcı olması için)
      const filePath = path.join("public/uploads", req.file.filename);
      resimBase64 = imageToBase64(filePath);
    }
    
    const urun = {
      id: Date.now().toString(),
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: resimData,
      resimBase64: resimBase64, // MongoDB'ye base64 olarak kaydet
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

      let resimData = existingProduct.resim;
      let resimBase64 = existingProduct.resimBase64 || null;
      
      // Yeni resim yüklendiyse
      if (req.file) {
        resimData = req.file.filename;
        const filePath = path.join("public/uploads", req.file.filename);
        resimBase64 = imageToBase64(filePath);
      }
      
      const updateData = {
        ad: req.body.ad || "",
        kategori: req.body.kategori || "",
        marka: req.body.marka || "",
        aciklama: req.body.aciklama || "",
        resim: resimData,
        resimBase64: resimBase64,
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
      
      res.json({ success: true, message: "Ürün başarıyla güncellendi", product: updatedProduct });
    } else {
      // JSON fallback
      let products = JSON.parse(fs.readFileSync(DATA_FILE));
      const index = products.findIndex(p => String(p.id) === productId);
      
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }

      let resimData = products[index].resim;
      let resimBase64 = products[index].resimBase64 || null;
      
      if (req.file) {
        resimData = req.file.filename;
        const filePath = path.join("public/uploads", req.file.filename);
        resimBase64 = imageToBase64(filePath);
      }
      
      products[index] = {
        id: productId,
        ad: req.body.ad || "",
        kategori: req.body.kategori || "",
        marka: req.body.marka || "",
        aciklama: req.body.aciklama || "",
        resim: resimData,
        resimBase64: resimBase64
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
    // Cache'i önle
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      const products = await productsCollection.find({}).toArray();
      const formattedProducts = products.map(p => ({
        id: p._id.toString(),
        ad: p.ad,
        kategori: p.kategori,
        marka: p.marka,
        aciklama: p.aciklama,
        resim: getImageUrl(p),
        resimBase64: p.resimBase64 || null,
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
        resim: getImageUrl(urun),
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
        resim: getImageUrl(urun)
      });
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
      mongoContact.cevaplandı = false;
      await contactsCollection.insertOne(mongoContact);
    } else {
      // JSON fallback
      let contacts = [];
      if (fs.existsSync(CONTACTS_FILE)) {
        contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
      }
      contact.cevaplandı = false;
      contacts.push(contact);
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
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
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
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
  