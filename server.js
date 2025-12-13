require("dotenv").config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase bağlantısı hazır!");
} else {
  console.log("⚠️  SUPABASE_URL ve SUPABASE_KEY environment variable'ları ayarlanmamış!");
}

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
   SUPABASE CONNECTION
======================= */
// Supabase bağlantısı yukarıda yapıldı

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
    if (!supabase) {
      return res.status(500).json({ 
        success: false, 
        message: "Veritabanı bağlantısı yok. Lütfen SUPABASE_URL ve SUPABASE_KEY environment variable'larını kontrol edin." 
      });
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedProducts = (data || []).map(p => ({
      id: p.id,
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
    if (!supabase) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const product = {
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      resim: req.file ? req.file.filename : ""
    };

    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Ürün ekleme hatası:", error);
    res.status(500).json({ success: false, message: "Ürün eklenemedi" });
  }
});

/* Güncelle */
app.put("/api/products/:id", auth, upload.single("resim"), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const productId = req.params.id;
    
    // Mevcut ürünü kontrol et
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (fetchError || !existingProduct) {
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
    }

    const updateData = {
      ad: req.body.ad || "",
      kategori: req.body.kategori || "",
      marka: req.body.marka || "",
      aciklama: req.body.aciklama || "",
      updated_at: new Date().toISOString()
    };
    
    if (req.file) {
      updateData.resim = req.file.filename;
    } else {
      updateData.resim = existingProduct.resim || "";
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);
    
    if (error) throw error;
    
    res.json({ success: true, message: "Ürün başarıyla güncellendi" });
  } catch (error) {
    console.error("Güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  }
});

/* Sil */
app.delete("/api/products/:id", auth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const productId = req.params.id;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }
      throw error;
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
    if (!supabase) {
      return res.json([]); // Boş array döndür
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const formattedProducts = (data || []).map(p => ({
      id: p.id,
      ad: p.ad || "",
      kategori: p.kategori || "",
      marka: p.marka || "",
      aciklama: p.aciklama || "",
      resim: p.resim || ""
    }));
    
    res.json(formattedProducts);
  } catch (error) {
    console.error("Public products hatası:", error);
    res.json([]); // Hata durumunda boş array
  }
});
  
/* TEK ÜRÜN (PUBLIC) */
app.get("/api/public/products/:id", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: "Veritabanı bağlantısı yok" });
    }
    
    const productId = req.params.id;
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error || !product) {
      return res.status(404).json({ success: false });
    }
    
    res.json({
      id: product.id,
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
    if (!supabase) {
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
      ad_soyad: adSoyad,
      email,
      telefon,
      mesaj
    };

    const { error } = await supabase
      .from('contacts')
      .insert([contact]);
    
    if (error) throw error;
    
    res.json({ success: true, message: "Formunuz başarıyla gönderildi!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." });
  }
});
  