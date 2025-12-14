require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");
const https = require("https");
const fs = require("fs");
const path = require("path");

// İlk 10 Yurtbay Seramik ürünü
const products = [
  {
    ad: "Yurtbay Seramik AFYON",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Mermer dokusuyla mekanlara zarif bir görünüm kazandıran AFYON koleksiyonu. İç ve dış mekan kullanımına uygundur."
  },
  {
    ad: "Yurtbay Seramik ALDA",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Modern tasarımıyla dikkat çeken ALDA serisi, iç mekanlara şıklık katar. Çeşitli ebat ve renk seçenekleri mevcuttur."
  },
  {
    ad: "Yurtbay Seramik ALDER",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Doğal ahşap dokusunu seramikle buluşturan ALDER koleksiyonu, sıcak bir atmosfer yaratır. Mutfak ve banyo için idealdir."
  },
  {
    ad: "Yurtbay Seramik AMALFI",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Akdeniz esintilerini mekanlarınıza taşıyan AMALFI serisi, ferah bir his uyandırır. Parlak ve mat yüzey seçenekleri mevcuttur."
  },
  {
    ad: "Yurtbay Seramik AMAZON",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Doğanın renklerini ve desenlerini yansıtan AMAZON koleksiyonu, enerjik bir ortam sunar. Çeşitli ebatlarda mevcuttur."
  },
  {
    ad: "Yurtbay Seramik ANDERSON",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Endüstriyel tasarımıyla modern ve sofistike mekanlar oluşturan ANDERSON serisi. İç ve dış mekan kullanımına uygundur."
  },
  {
    ad: "Yurtbay Seramik ARCADIA",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Klasik ve zamansız tasarımıyla her döneme hitap eden ARCADIA koleksiyonu. Geniş renk ve ebat yelpazesi sunar."
  },
  {
    ad: "Yurtbay Seramik ARES",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Güçlü ve cesur desenleriyle mekanlara karakter katan ARES serisi. Yüksek kalite ve dayanıklılık özelliklerine sahiptir."
  },
  {
    ad: "Yurtbay Seramik ARTOS",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Sanatsal dokunuşlarıyla estetik bir atmosfer yaratan ARTOS koleksiyonu. Özel projeler için idealdir."
  },
  {
    ad: "Yurtbay Seramik ASTER",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "Zarif ve ince detaylarıyla mekanlara sofistike bir hava katan ASTER serisi. Mutfak, banyo ve salon için uygundur."
  }
];

// Görsel URL'lerini indirip base64'e çevir
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const contentType = response.headers['content-type'] || 'image/jpeg';
          resolve(`data:${contentType};base64,${base64}`);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Redirect takip et
        downloadImage(response.headers.location).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Placeholder görsel oluştur (ürün adına göre)
function createPlaceholderImage(productName) {
  // Basit bir placeholder base64 görseli
  // Gerçek görseller için Yurtbay Seramik'in web sitesinden indirilebilir
  return null; // Şimdilik null, sonra gerçek görseller eklenebilir
}

async function addProducts() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      console.log("💡 Lütfen .env dosyasında MONGODB_URI'yi ayarlayın");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    console.log(`\n📦 ${products.length} ürün ekleniyor...\n`);
    
    let addedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Aynı isimde ürün var mı kontrol et
      const existing = await productsCollection.findOne({ 
        ad: product.ad,
        marka: product.marka 
      });

      if (existing) {
        console.log(`⏭️  Atlandı: ${product.ad} (zaten mevcut)`);
        skippedCount++;
        continue;
      }

      // Ürünü ekle
      const productToInsert = {
        ...product,
        resim: "",
        resimBase64: null, // Görseller sonra eklenebilir
        createdAt: new Date()
      };

      const result = await productsCollection.insertOne(productToInsert);
      console.log(`✅ Eklendi: ${product.ad} (ID: ${result.insertedId})`);
      addedCount++;
    }

    console.log(`\n📊 Özet:`);
    console.log(`   ✅ Eklenen: ${addedCount}`);
    console.log(`   ⏭️  Atlanan: ${skippedCount}`);
    console.log(`   📦 Toplam: ${products.length}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
addProducts();

