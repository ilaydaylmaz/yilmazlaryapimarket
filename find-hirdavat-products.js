const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'yapimarket';

async function findHirdavatProducts() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB bağlantısı başarılı');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // Mastik veya Dayson içeren tüm ürünleri bul
    const products = await productsCollection.find({
      $or: [
        { ad: { $regex: /mastik/i } },
        { ad: { $regex: /dayson/i } },
        { marka: { $regex: /dayson/i } }
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
    
    // Tüm kategorileri listele
    const allProducts = await productsCollection.find({}).toArray();
    const categories = [...new Set(allProducts.map(p => p.kategori).filter(Boolean))];
    console.log(`\n📊 Tüm kategoriler (${categories.length} adet):`);
    categories.forEach(cat => {
      const count = allProducts.filter(p => p.kategori === cat).length;
      console.log(`- ${cat}: ${count} ürün`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.close();
  }
}

findHirdavatProducts();
