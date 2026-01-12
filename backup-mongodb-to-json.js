require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getProductsCollection, getContactsCollection, getCategoryShowcaseCollection, connectDB, isMongoDBEnabled } = require("./db");

async function backupMongoDBToJSON() {
  try {
    console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
    
    // Bağlantıyı birkaç kez dene
    let connected = false;
    for (let i = 0; i < 3; i++) {
      try {
        await connectDB();
        if (isMongoDBEnabled()) {
          connected = true;
          break;
        }
      } catch (error) {
        console.log(`⏳ Bağlantı denemesi ${i + 1}/3 başarısız, tekrar deneniyor...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 saniye bekle
      }
    }
    
    if (!connected || !isMongoDBEnabled()) {
      console.log('❌ MongoDB bağlantısı yapılamadı!');
      return;
    }
    
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    const productsCollection = await getProductsCollection();
    const contactsCollection = await getContactsCollection();
    const categoryShowcaseCollection = await getCategoryShowcaseCollection();
    
    // 1. PRODUCTS YEDEKLEME
    console.log('\n📦 Products yedekleniyor...');
    
    // Önce say
    const productCount = await productsCollection.countDocuments({});
    console.log(`   Toplam ${productCount} ürün bulundu`);
    
    // Küçük batch'ler halinde çek (timeout'u önlemek için)
    const products = [];
    const batchSize = 20;
    let skip = 0;
    
    while (skip < productCount) {
      console.log(`   ${skip + 1}-${Math.min(skip + batchSize, productCount)} ürün çekiliyor...`);
      
      try {
        const batch = await productsCollection.find({})
          .skip(skip)
          .limit(batchSize)
          .toArray();
        
        if (batch.length === 0) break;
        
        products.push(...batch);
        skip += batchSize;
        
        console.log(`   ✅ ${products.length}/${productCount} ürün çekildi`);
        
        // Her batch arasında bekleme (MongoDB Atlas yavaş olabilir)
        if (skip < productCount) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
        }
      } catch (batchError) {
        console.error(`   ⚠️  Batch hatası (${skip + 1}-${Math.min(skip + batchSize, productCount)}):`, batchError.message);
        console.log(`   ⏳ 2 saniye bekleyip tekrar deneniyor...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Aynı batch'i tekrar dene
        continue;
      }
    }
    
    console.log(`   ✅ ${products.length} ürün çekildi`);
    
    // MongoDB formatını JSON formatına çevir
    const productsJSON = products.map(p => {
      const jsonProduct = {
        id: p._id.toString(), // ObjectId'yi string'e çevir
        ad: p.ad || "",
        kategori: p.kategori || "",
        altKategori: p.altKategori || "",
        marka: p.marka || "",
        aciklama: p.aciklama || "",
        resim: p.resim || "",
        resimBase64: p.resimBase64 || null,
        resimler: p.resimler || (p.resim ? [p.resim] : []),
        resimlerBase64: p.resimlerBase64 || (p.resimBase64 ? [p.resimBase64] : []),
        video: p.video || "",
        viewCount: p.viewCount || 0,
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
      };
      
      // Tarih alanlarını string'e çevir
      if (p.createdAt) {
        jsonProduct.createdAt = p.createdAt.toISOString();
      }
      if (p.updatedAt) {
        jsonProduct.updatedAt = p.updatedAt.toISOString();
      }
      
      return jsonProduct;
    });
    
    // Mevcut products.json'u yedekle
    const productsJsonFile = path.join(__dirname, 'data', 'products.json');
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Eski products.json varsa yedekle
    if (fs.existsSync(productsJsonFile)) {
      const oldBackupFile = path.join(backupDir, `products-old-${timestamp}.json`);
      fs.copyFileSync(productsJsonFile, oldBackupFile);
      console.log(`   Eski products.json yedeklendi: ${oldBackupFile}`);
    }
    
    // Yeni products.json'u kaydet
    fs.writeFileSync(productsJsonFile, JSON.stringify(productsJSON, null, 2), 'utf8');
    console.log(`✅ ${productsJSON.length} ürün products.json'a kaydedildi`);
    
    // 2. CONTACTS YEDEKLEME
    console.log('\n📧 Contacts yedekleniyor...');
    const contacts = await contactsCollection.find({}).toArray();
    console.log(`   Toplam ${contacts.length} mesaj bulundu`);
    
    const contactsJSON = contacts.map(c => {
      const jsonContact = {
        id: c._id.toString(),
        adSoyad: c.adSoyad || "",
        email: c.email || "",
        telefon: c.telefon || "",
        mesaj: c.mesaj || "",
        cevaplandı: c.cevaplandı || false,
        cevap: c.cevap || ""
      };
      
      if (c.tarih) {
        jsonContact.tarih = c.tarih.toISOString();
      }
      if (c.cevapTarihi) {
        jsonContact.cevapTarihi = c.cevapTarihi.toISOString();
      }
      
      return jsonContact;
    });
    
    const contactsJsonFile = path.join(__dirname, 'data', 'contacts.json');
    if (fs.existsSync(contactsJsonFile)) {
      const oldBackupFile = path.join(backupDir, `contacts-old-${timestamp}.json`);
      fs.copyFileSync(contactsJsonFile, oldBackupFile);
      console.log(`   Eski contacts.json yedeklendi: ${oldBackupFile}`);
    }
    
    fs.writeFileSync(contactsJsonFile, JSON.stringify(contactsJSON, null, 2), 'utf8');
    console.log(`✅ ${contactsJSON.length} mesaj contacts.json'a kaydedildi`);
    
    // 3. CATEGORY SHOWCASE YEDEKLEME
    console.log('\n🎨 Category Showcase yedekleniyor...');
    const showcase = await categoryShowcaseCollection.find({}).toArray();
    console.log(`   Toplam ${showcase.length} kategori showcase bulundu`);
    
    if (showcase.length > 0) {
      const showcaseJSON = showcase.map(s => {
        const jsonShowcase = {
          id: s._id.toString(),
          categories: s.categories || []
        };
        return jsonShowcase;
      });
      
      const showcaseJsonFile = path.join(__dirname, 'data', 'category-showcase.json');
      if (fs.existsSync(showcaseJsonFile)) {
        const oldBackupFile = path.join(backupDir, `category-showcase-old-${timestamp}.json`);
        fs.copyFileSync(showcaseJsonFile, oldBackupFile);
        console.log(`   Eski category-showcase.json yedeklendi: ${oldBackupFile}`);
      }
      
      fs.writeFileSync(showcaseJsonFile, JSON.stringify(showcaseJSON, null, 2), 'utf8');
      console.log(`✅ ${showcaseJSON.length} kategori showcase kaydedildi`);
    } else {
      console.log('   Kategori showcase yok, atlanıyor');
    }
    
    // 4. ÖZET
    console.log('\n📊 Yedekleme Özeti:');
    console.log(`   ✅ Products: ${productsJSON.length} ürün → data/products.json`);
    console.log(`   ✅ Contacts: ${contactsJSON.length} mesaj → data/contacts.json`);
    console.log(`   ✅ Category Showcase: ${showcase.length} kategori`);
    console.log(`   📁 Eski dosyalar: ${backupDir}`);
    console.log('\n✅ Yedekleme tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error);
    console.error('❌ Hata detayı:', error.stack);
  }
  process.exit(0);
}

backupMongoDBToJSON();
