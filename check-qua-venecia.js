require("dotenv").config();
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function checkQuaVenecia() {
  try {
    console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
    await connectDB();
    
    if (!isMongoDBEnabled()) {
      console.log('❌ MongoDB bağlantısı yok!');
      return;
    }
    
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    const productsCollection = await getProductsCollection();
    
    // Qua veya venecia içeren ürünleri bul
    const products = await productsCollection.find({
      $or: [
        { ad: { $regex: /qua/i } },
        { ad: { $regex: /venecia/i } },
        { marka: { $regex: /qua/i } }
      ]
    }).toArray();
    
    console.log(`\n📦 Bulunan ürün sayısı: ${products.length}`);
    
    products.forEach((p, i) => {
      console.log(`\n${i + 1}. Ürün:`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Ad: "${p.ad || 'YOK'}"`);
      console.log(`   Kategori: "${p.kategori || 'YOK'}"`);
      console.log(`   Marka: "${p.marka || 'YOK'}"`);
      console.log(`   Alt Kategori: "${p.altKategori || 'YOK'}"`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
  process.exit(0);
}

checkQuaVenecia();
