require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

// AFYON koleksiyonuna ait 2 ürün
const afyonProducts = [
  {
    ad: "Yurtbay Seramik AFYON 60X120 BEYAZ POLİSH REKTİFİYELİ",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "AFYON koleksiyonuna ait 60x120 cm ebatında, beyaz renkli, polish (parlak) yüzeyli ve rektifiye kenarlı seramik karo. Mermer dokusuyla mekanlara zarif bir görünüm kazandırır. İç ve dış mekan kullanımına uygundur."
  },
  {
    ad: "Yurtbay Seramik AFYON 60X60 BEYAZ HİGH GLOSSY",
    kategori: "Seramik Ürünleri",
    marka: "Yurtbay Seramik",
    aciklama: "AFYON koleksiyonuna ait 60x60 cm ebatında, beyaz renkli, high glossy (yüksek parlaklık) yüzeyli seramik karo. Mermer dokusuyla mekanlara zarif bir görünüm kazandırır. Mutfak, banyo ve salon için idealdir."
  }
];

async function addAfyonProducts() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      console.log("💡 Lütfen .env dosyasında MONGODB_URI'yi ayarlayın");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    console.log(`\n📦 ${afyonProducts.length} AFYON ürünü ekleniyor...\n`);
    
    let addedCount = 0;
    let skippedCount = 0;

    for (const product of afyonProducts) {
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
    console.log(`   📦 Toplam: ${afyonProducts.length}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
addAfyonProducts();

