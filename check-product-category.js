require("dotenv").config();
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function checkProductCategory() {
  try {
    console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
    await connectDB();
    
    if (!isMongoDBEnabled()) {
      console.log('❌ MongoDB bağlantısı yok!');
      return;
    }
    
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    const productsCollection = await getProductsCollection();
    
    const products = await productsCollection.find({}).toArray();
    console.log(`\n📦 Toplam ürün sayısı: ${products.length}`);
    
    products.forEach((p, i) => {
      console.log(`\n${i + 1}. Ürün:`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Ad: ${p.ad || 'YOK'}`);
      console.log(`   Kategori: "${p.kategori || 'YOK'}"`);
      console.log(`   Alt Kategori: "${p.altKategori || 'YOK'}"`);
      console.log(`   Marka: "${p.marka || 'YOK'}"`);
      console.log(`   Resim: ${p.resim || 'YOK'}`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
  process.exit(0);
}

checkProductCategory();
