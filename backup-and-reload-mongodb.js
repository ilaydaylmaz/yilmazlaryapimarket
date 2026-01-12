require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getProductsCollection, getContactsCollection, getCategoryShowcaseCollection, connectDB, isMongoDBEnabled } = require("./db");

async function backupAndReloadMongoDB() {
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
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
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
    
    // 1. YEDEKLEME
    console.log('\n📦 Mevcut veriler yedekleniyor...');
    
    // Products yedeği
    const products = await productsCollection.find({}).toArray();
    const productsBackup = products.map(p => {
      const backup = { ...p };
      backup._id = p._id.toString(); // ObjectId'yi string'e çevir
      return backup;
    });
    
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const productsBackupFile = path.join(backupDir, `products-backup-${timestamp}.json`);
    fs.writeFileSync(productsBackupFile, JSON.stringify(productsBackup, null, 2));
    console.log(`✅ Products yedeği kaydedildi: ${productsBackupFile}`);
    console.log(`   Toplam ${products.length} ürün yedeklendi`);
    
    // Contacts yedeği
    const contacts = await contactsCollection.find({}).toArray();
    const contactsBackup = contacts.map(c => {
      const backup = { ...c };
      backup._id = c._id.toString();
      return backup;
    });
    
    const contactsBackupFile = path.join(backupDir, `contacts-backup-${timestamp}.json`);
    fs.writeFileSync(contactsBackupFile, JSON.stringify(contactsBackup, null, 2));
    console.log(`✅ Contacts yedeği kaydedildi: ${contactsBackupFile}`);
    console.log(`   Toplam ${contacts.length} mesaj yedeklendi`);
    
    // Category Showcase yedeği
    const showcase = await categoryShowcaseCollection.find({}).toArray();
    const showcaseBackup = showcase.map(s => {
      const backup = { ...s };
      backup._id = s._id.toString();
      return backup;
    });
    
    const showcaseBackupFile = path.join(backupDir, `category-showcase-backup-${timestamp}.json`);
    fs.writeFileSync(showcaseBackupFile, JSON.stringify(showcaseBackup, null, 2));
    console.log(`✅ Category Showcase yedeği kaydedildi: ${showcaseBackupFile}`);
    console.log(`   Toplam ${showcase.length} kategori showcase yedeklendi`);
    
    // 2. TEMİZLEME
    console.log('\n🗑️  MongoDB temizleniyor...');
    
    const productsDeleteResult = await productsCollection.deleteMany({});
    console.log(`✅ ${productsDeleteResult.deletedCount} ürün silindi`);
    
    const contactsDeleteResult = await contactsCollection.deleteMany({});
    console.log(`✅ ${contactsDeleteResult.deletedCount} mesaj silindi`);
    
    const showcaseDeleteResult = await categoryShowcaseCollection.deleteMany({});
    console.log(`✅ ${showcaseDeleteResult.deletedCount} kategori showcase silindi`);
    
    // 3. JSON DOSYALARINDAN YENİDEN YÜKLEME
    console.log('\n📥 JSON dosyalarından veriler yükleniyor...');
    
    // Products yükleme
    const productsJsonFile = path.join(__dirname, 'data', 'products.json');
    if (fs.existsSync(productsJsonFile)) {
      const productsData = JSON.parse(fs.readFileSync(productsJsonFile, 'utf8'));
      console.log(`📦 ${productsData.length} ürün JSON'dan okundu`);
      
      if (productsData.length > 0) {
        // JSON formatını MongoDB formatına çevir
        const mongoProducts = productsData.map(p => {
          const mongoProduct = { ...p };
          delete mongoProduct.id; // id'yi sil (MongoDB _id kullanacak)
          mongoProduct.createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
          mongoProduct.viewCount = p.viewCount || 0;
          return mongoProduct;
        });
        
        const insertResult = await productsCollection.insertMany(mongoProducts);
        console.log(`✅ ${insertResult.insertedCount} ürün MongoDB'ye yüklendi`);
      }
    } else {
      console.log('⚠️  products.json dosyası bulunamadı!');
    }
    
    // Category Showcase yükleme (eğer varsa)
    const showcaseJsonFile = path.join(__dirname, 'data', 'category-showcase.json');
    if (fs.existsSync(showcaseJsonFile)) {
      const showcaseData = JSON.parse(fs.readFileSync(showcaseJsonFile, 'utf8'));
      console.log(`📦 ${showcaseData.length} kategori showcase JSON'dan okundu`);
      
      if (showcaseData.length > 0) {
        const mongoShowcase = showcaseData.map(s => {
          const mongoItem = { ...s };
          delete mongoItem.id;
          return mongoItem;
        });
        
        const insertResult = await categoryShowcaseCollection.insertMany(mongoShowcase);
        console.log(`✅ ${insertResult.insertedCount} kategori showcase MongoDB'ye yüklendi`);
      }
    } else {
      console.log('⚠️  category-showcase.json dosyası bulunamadı (opsiyonel)');
    }
    
    // 4. SONUÇ
    console.log('\n📊 Yeni durum:');
    const newProductsCount = await productsCollection.countDocuments({});
    const newContactsCount = await contactsCollection.countDocuments({});
    const newShowcaseCount = await categoryShowcaseCollection.countDocuments({});
    
    console.log(`   Products: ${newProductsCount} ürün`);
    console.log(`   Contacts: ${newContactsCount} mesaj`);
    console.log(`   Category Showcase: ${newShowcaseCount} kategori`);
    
    console.log('\n✅ MongoDB temizleme ve yeniden yükleme tamamlandı!');
    console.log(`📁 Yedekler: ${backupDir}`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
    console.error('❌ Hata detayı:', error.stack);
  }
  process.exit(0);
}

// Kullanıcıdan onay iste
console.log('⚠️  UYARI: Bu işlem MongoDB\'deki TÜM verileri silecek ve JSON dosyalarından yeniden yükleyecek!');
console.log('📁 Yedekler "backups" klasörüne kaydedilecek.');
console.log('\nDevam etmek için scripti çalıştırın: node backup-and-reload-mongodb.js');

backupAndReloadMongoDB();
