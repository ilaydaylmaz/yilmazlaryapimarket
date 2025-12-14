require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

async function addGeneralAfyon() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    // Genel AFYON ürününü kontrol et
    const existing = await productsCollection.findOne({
      ad: "Yurtbay Seramik AFYON",
      marka: "Yurtbay Seramik"
    });

    if (existing) {
      console.log("✅ Genel AFYON ürünü zaten mevcut");
    } else {
      // Genel AFYON ürününü ekle
      const product = {
        ad: "Yurtbay Seramik AFYON",
        kategori: "Seramik Ürünleri",
        marka: "Yurtbay Seramik",
        aciklama: "Mermer dokusuyla mekanlara zarif bir görünüm kazandıran AFYON koleksiyonu. İç ve dış mekan kullanımına uygundur.",
        resim: "",
        resimBase64: null,
        createdAt: new Date()
      };

      const result = await productsCollection.insertOne(product);
      console.log(`✅ Genel AFYON ürünü eklendi (ID: ${result.insertedId})`);
    }

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

addGeneralAfyon();

