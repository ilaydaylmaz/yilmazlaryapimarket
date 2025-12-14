require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

async function removeGeneralAfyon() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    // Genel "Yurtbay Seramik AFYON" ürününü bul ve sil
    const result = await productsCollection.deleteOne({
      ad: "Yurtbay Seramik AFYON",
      marka: "Yurtbay Seramik"
    });
    
    if (result.deletedCount > 0) {
      console.log("✅ Genel AFYON ürünü silindi");
    } else {
      console.log("⚠️  Genel AFYON ürünü bulunamadı (zaten silinmiş olabilir)");
    }

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

removeGeneralAfyon();

