require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getCategoryShowcaseCollection, connectDB, closeDB } = require("./db");

async function migrateCategoryShowcase() {
  try {
    console.log("📦 Category Showcase MongoDB'ye aktarımı başlıyor...");
    
    const db = await connectDB();
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      console.log("💡 Lütfen .env dosyasında MONGODB_URI'yi ayarlayın:");
      console.log("   MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/");
      process.exit(1);
    }
    
    const showcaseCollection = await getCategoryShowcaseCollection();
    
    // JSON dosyasından oku
    const showcaseFile = "./data/category-showcase.json";
    
    if (fs.existsSync(showcaseFile)) {
      const data = JSON.parse(fs.readFileSync(showcaseFile, "utf8"));
      
      if (data.categories && data.categories.length > 0) {
        // Mevcut veriyi kontrol et
        const existingData = await showcaseCollection.findOne({ type: 'category_showcase' });
        
        if (existingData) {
          console.log("⚠️ MongoDB'de zaten category showcase verisi var.");
          console.log("💡 Mevcut veriyi güncellemek için '--force' parametresi kullanın.");
          console.log("   Örnek: node migrate-category-showcase.js --force");
          
          // Mevcut veriyi göster
          console.log("\n📋 MongoDB'deki mevcut kategoriler:");
          existingData.categories.forEach(cat => {
            const hasBase64 = !!(cat.imageBase64 || (cat.image && cat.image.startsWith('data:')));
            console.log(`  - ${cat.name} (${cat.id}): ${hasBase64 ? '✅ Base64 görsel var' : '❌ Base64 görsel yok'}`);
          });
          
          console.log("\n📋 JSON dosyasındaki kategoriler:");
          data.categories.forEach(cat => {
            const hasBase64 = !!(cat.imageBase64 || (cat.image && cat.image.startsWith('data:')));
            console.log(`  - ${cat.name} (${cat.id}): ${hasBase64 ? '✅ Base64 görsel var' : '❌ Base64 görsel yok'}`);
          });
        } else {
          // Yeni veri ekle
          const showcaseData = {
            type: 'category_showcase',
            categories: data.categories,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
          };
          
          await showcaseCollection.insertOne(showcaseData);
          console.log(`✅ ${data.categories.length} kategori MongoDB'ye aktarıldı`);
          
          // Base64 görsel sayısını göster
          const base64Count = data.categories.filter(cat => 
            cat.imageBase64 || (cat.image && cat.image.startsWith('data:'))
          ).length;
          console.log(`📸 ${base64Count} kategori base64 görsel içeriyor`);
        }
      } else {
        console.log("⚠️ JSON dosyasında kategori bulunamadı.");
      }
    } else {
      console.log("⚠️ JSON dosyası bulunamadı: " + showcaseFile);
      console.log("💡 Önce admin panelinden kategori görselleri yükleyin.");
    }
    
    // Force parametresi ile güncelleme
    if (process.argv.includes('--force') && fs.existsSync(showcaseFile)) {
      const data = JSON.parse(fs.readFileSync(showcaseFile, "utf8"));
      
      if (data.categories && data.categories.length > 0) {
        await showcaseCollection.updateOne(
          { type: 'category_showcase' },
          {
            $set: {
              categories: data.categories,
              updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
            }
          },
          { upsert: true }
        );
        console.log("\n✅ Category showcase MongoDB'de güncellendi (--force)");
      }
    }
    
    console.log("\n✅ Aktarım tamamlandı!");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Aktarım hatası:", error);
    await closeDB();
    process.exit(1);
  }
}

migrateCategoryShowcase();

