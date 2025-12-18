require("dotenv").config();
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function updateCategories() {
  try {
    if (!isMongoDBEnabled()) {
      console.log("MongoDB aktif değil. JSON dosyası kullanılıyor.");
      return;
    }

    await connectDB();
    const productsCollection = await getProductsCollection();
    
    // Tüm ürünleri getir
    const products = await productsCollection.find({}).toArray();
    console.log(`Toplam ${products.length} ürün bulundu.`);
    
    // Kategori güncellemeleri
    const categoryUpdates = {
      "Boya": "Boya Ürünleri",
      "Ahşap Boyaları": "Boya Ürünleri",
      "Hırdavat": "Hırdavat Ürünleri",
      "Elektrik": "Elektrik Ürünleri",
      "Tesisat": "Tesisat Ürünleri",
      "Yapı Malzemeleri": "Yapı Malzemeleri",
      "Aletler": "El Aletleri Ürünleri",
      "El Aletleri": "El Aletleri Ürünleri",
      "Seramik": "Seramik Ürünleri",
      "Banyo": "Banyo Dolapları",
      "Parke": "Parke Ürünleri",
      "Mutfak": "Mutfak Ürünleri",
      "Kaba": "Kaba Grubu",
      "İnşaat Malzemeleri": "Yapı Malzemeleri"
    };
    
    let updatedCount = 0;
    
    for (const product of products) {
      const oldCategory = product.kategori;
      const newCategory = categoryUpdates[oldCategory];
      
      if (newCategory && oldCategory !== newCategory) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { kategori: newCategory, updatedAt: new Date() } }
        );
        console.log(`✓ ${product.ad} - "${oldCategory}" → "${newCategory}"`);
        updatedCount++;
      } else if (!oldCategory || oldCategory === "") {
        // Kategori yoksa "Boya Ürünleri" yap
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { kategori: "Boya Ürünleri", updatedAt: new Date() } }
        );
        console.log(`✓ ${product.ad} - Kategori yok → "Boya Ürünleri"`);
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Toplam ${updatedCount} ürün güncellendi.`);
    
    // Güncellenmiş ürünleri göster
    const updatedProducts = await productsCollection.find({}).toArray();
    console.log("\n📊 Güncel kategori dağılımı:");
    const categoryCounts = {};
    updatedProducts.forEach(p => {
      const cat = p.kategori || "Kategori Yok";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} ürün`);
    });
    
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    process.exit(0);
  }
}

updateCategories();

