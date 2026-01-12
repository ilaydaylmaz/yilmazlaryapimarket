require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function checkProductImage() {
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
      console.log(`   Ad: ${p.ad || 'YOK'}`);
      console.log(`   Resim (MongoDB): "${p.resim || 'YOK'}"`);
      console.log(`   Resimler (MongoDB): ${JSON.stringify(p.resimler || [])}`);
      console.log(`   ResimBase64 var mı: ${!!p.resimBase64}`);
      
      // Resim dosyasını kontrol et
      if (p.resim) {
        const imagePath = path.join(__dirname, 'public', 'uploads', p.resim);
        const imageExists = fs.existsSync(imagePath);
        console.log(`   Resim dosyası var mı: ${imageExists}`);
        if (imageExists) {
          const stats = fs.statSync(imagePath);
          console.log(`   Resim dosya boyutu: ${(stats.size / 1024).toFixed(2)} KB`);
        } else {
          console.log(`   ⚠️  Resim dosyası bulunamadı: ${imagePath}`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
  process.exit(0);
}

checkProductImage();
