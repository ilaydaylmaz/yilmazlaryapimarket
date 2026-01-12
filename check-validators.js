require("dotenv").config();
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function checkValidators() {
  try {
    console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
    await connectDB();
    
    if (!isMongoDBEnabled()) {
      console.log('❌ MongoDB bağlantısı yok!');
      return;
    }
    
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    const productsCollection = await getProductsCollection();
    
    // Collection validators'ı kontrol et
    const collectionInfo = await productsCollection.db.listCollections({ name: 'products' }).toArray();
    
    if (collectionInfo.length > 0) {
      const validator = collectionInfo[0].options?.validator;
      if (validator) {
        console.log('\n📋 Collection Validators:');
        console.log(JSON.stringify(validator, null, 2));
      } else {
        console.log('\n✅ Collection\'da validator yok');
      }
    }
    
    // Bir örnek ürün al ve alanları kontrol et
    const sampleProduct = await productsCollection.findOne({});
    if (sampleProduct) {
      console.log('\n📦 Örnek ürün alanları:');
      Object.keys(sampleProduct).forEach(key => {
        const value = sampleProduct[key];
        const type = typeof value;
        const isString = type === 'string';
        const isEmpty = isString && value.trim() === '';
        console.log(`  ${key}: ${type}${isString ? ` (length: ${value.length}, empty: ${isEmpty})` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
  process.exit(0);
}

checkValidators();
