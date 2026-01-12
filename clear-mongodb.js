require("dotenv").config();
const { getProductsCollection, getContactsCollection, getCategoryShowcaseCollection, connectDB, isMongoDBEnabled } = require("./db");

async function clearMongoDB() {
  try {
    console.log('🔍 MongoDB bağlantısı kontrol ediliyor...');
    
    // Bağlantıyı birkaç kez dene
    let connected = false;
    for (let i = 0; i < 3; i++) {
      try {
        await connectDB();
        if (isMongoDBEnabled()) {
          connected = true;
          break;
        }
      } catch (error) {
        console.log(`⏳ Bağlantı denemesi ${i + 1}/3 başarısız, tekrar deneniyor...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (!connected || !isMongoDBEnabled()) {
      console.log('❌ MongoDB bağlantısı yapılamadı!');
      return;
    }
    
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    const productsCollection = await getProductsCollection();
    const contactsCollection = await getContactsCollection();
    const categoryShowcaseCollection = await getCategoryShowcaseCollection();
    
    // Mevcut sayıları göster
    const productsCount = await productsCollection.countDocuments({});
    const contactsCount = await contactsCollection.countDocuments({});
    const showcaseCount = await categoryShowcaseCollection.countDocuments({});
    
    console.log('\n📊 Mevcut Durum:');
    console.log(`   Products: ${productsCount} ürün`);
    console.log(`   Contacts: ${contactsCount} mesaj`);
    console.log(`   Category Showcase: ${showcaseCount} kategori`);
    
    // TEMİZLEME
    console.log('\n🗑️  MongoDB temizleniyor...');
    
    const productsDeleteResult = await productsCollection.deleteMany({});
    console.log(`✅ ${productsDeleteResult.deletedCount} ürün silindi`);
    
    const contactsDeleteResult = await contactsCollection.deleteMany({});
    console.log(`✅ ${contactsDeleteResult.deletedCount} mesaj silindi`);
    
    const showcaseDeleteResult = await categoryShowcaseCollection.deleteMany({});
    console.log(`✅ ${showcaseDeleteResult.deletedCount} kategori showcase silindi`);
    
    // Son durum
    console.log('\n📊 Yeni Durum:');
    const newProductsCount = await productsCollection.countDocuments({});
    const newContactsCount = await contactsCollection.countDocuments({});
    const newShowcaseCount = await categoryShowcaseCollection.countDocuments({});
    
    console.log(`   Products: ${newProductsCount} ürün`);
    console.log(`   Contacts: ${newContactsCount} mesaj`);
    console.log(`   Category Showcase: ${newShowcaseCount} kategori`);
    
    console.log('\n✅ MongoDB temizlendi!');
    console.log('📝 Artık admin panelinden ürün ekleyebilirsiniz.');
    
  } catch (error) {
    console.error('❌ Hata:', error);
    console.error('❌ Hata detayı:', error.stack);
  }
  process.exit(0);
}

clearMongoDB();
