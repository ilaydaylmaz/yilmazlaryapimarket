require("dotenv").config();
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function checkProducts() {
  try {
    console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
    await connectDB();
    
    if (!isMongoDBEnabled()) {
      console.log('❌ MongoDB bağlantısı yok!');
      return;
    }
    
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    const productsCollection = await getProductsCollection();
    
    const count = await productsCollection.countDocuments({});
    console.log(`\n📦 Toplam ürün sayısı: ${count}`);
    
    if (count > 0) {
      const products = await productsCollection.find({}).limit(10).toArray();
      console.log('\n📋 İlk 10 ürün:');
      products.forEach((p, i) => {
        console.log(`  ${i + 1}. ID: ${p._id}, Ad: ${p.ad || 'YOK'}, Kategori: ${p.kategori || 'YOK'}`);
      });
    } else {
      console.log('\n⚠️  MongoDB\'de ürün yok!');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
  process.exit(0);
}

checkProducts();
