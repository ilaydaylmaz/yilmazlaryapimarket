const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'yapimarket';

async function checkPerla() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // Perla ürününü bul
    const perla = await productsCollection.findOne({
      ad: { $regex: /perla/i }
    });
    
    if (perla) {
      console.log('\n📦 Ürün bulundu:');
      console.log('ID:', perla._id.toString());
      console.log('Ad:', perla.ad);
      console.log('Kategori:', perla.kategori);
      console.log('Alt Kategori:', perla.altKategori || '(yok)');
      console.log('Marka:', perla.marka || '(yok)');
    } else {
      console.log('❌ Perla ürünü bulunamadı');
    }
    
    // Tüm boya kategorili ürünleri kontrol et
    const boyaProducts = await productsCollection.find({
      $or: [
        { kategori: 'Boya' },
        { kategori: 'Boya Ürünleri' }
      ]
    }).toArray();
    
    console.log(`\n📊 Toplam ${boyaProducts.length} boya ürünü bulundu:`);
    boyaProducts.forEach(p => {
      console.log(`- ${p.ad} (Kategori: ${p.kategori})`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.close();
  }
}

checkPerla();
