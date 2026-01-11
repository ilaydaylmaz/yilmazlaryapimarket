const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'yapimarket';

async function checkDayson() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // Dayson ürününü bul
    const dayson = await productsCollection.findOne({
      ad: { $regex: /dayson/i }
    });
    
    if (dayson) {
      console.log('\n📦 Ürün bulundu:');
      console.log('ID:', dayson._id.toString());
      console.log('Ad:', dayson.ad);
      console.log('Kategori:', dayson.kategori);
      console.log('Alt Kategori:', dayson.altKategori || '(yok)');
      console.log('Marka:', dayson.marka || '(yok)');
    } else {
      console.log('❌ Dayson ürünü bulunamadı');
    }
    
    // Tüm hırdavat kategorili ürünleri kontrol et
    const hirdavatProducts = await productsCollection.find({
      $or: [
        { kategori: 'Hırdavat' },
        { kategori: 'Hırdavat Ürünleri' }
      ]
    }).toArray();
    
    console.log(`\n📊 Toplam ${hirdavatProducts.length} hırdavat ürünü bulundu:`);
    hirdavatProducts.forEach(p => {
      console.log(`- ${p.ad} (Kategori: ${p.kategori})`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.close();
  }
}

checkDayson();
