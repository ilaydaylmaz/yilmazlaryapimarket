const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'yapimarket';

async function findPerla() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // Silikonlu veya Perla içeren tüm ürünleri bul
    const products = await productsCollection.find({
      $or: [
        { ad: { $regex: /perla/i } },
        { ad: { $regex: /silikonlu/i } },
        { marka: { $regex: /polisan/i } }
      ]
    }).toArray();
    
    console.log(`\n📦 ${products.length} ürün bulundu:\n`);
    products.forEach(p => {
      console.log('ID:', p._id.toString());
      console.log('Ad:', p.ad);
      console.log('Kategori:', p.kategori || '(yok)');
      console.log('Alt Kategori:', p.altKategori || '(yok)');
      console.log('Marka:', p.marka || '(yok)');
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.close();
  }
}

findPerla();
