// dotenv sadece local development için (Railway'de environment variable'lar otomatik yüklenir)
if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}

const { MongoClient } = require("mongodb");

// MongoDB connection string - environment variable'dan al veya local için varsayılan
// Railway.app build sırasında bu değişken olmayabilir, bu normal (runtime'da olacak)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
// Hem DB_NAME hem MONGODB_DB_NAME destekleniyor (Railway uyumluluğu için)
const DB_NAME = process.env.MONGODB_DB_NAME || process.env.DB_NAME || "yapimarket";

let client = null;
let db = null;
let useMongoDB = false; // MongoDB kullanılıyor mu?

// MongoDB bağlantısı
async function connectDB() {
  try {
    if (!client) {
      console.log(`🔌 MongoDB bağlantısı deneniyor...`);
      console.log(`📍 MONGODB_URI: ${process.env.MONGODB_URI ? 'Var' : 'YOK'}`);
      console.log(`📍 DB_NAME: ${DB_NAME}`);
      
      // Eğer MONGODB_URI varsa MongoDB'ye bağlanmayı dene
      if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "mongodb://localhost:27017") {
        console.log(`🔗 MongoDB Atlas'a bağlanılıyor...`);
        client = new MongoClient(MONGODB_URI, {
          serverSelectionTimeoutMS: 10000, // 10 saniye timeout (Railway için artırıldı)
          connectTimeoutMS: 10000,
        });
        await client.connect();
        db = client.db(DB_NAME);
        useMongoDB = true;
        console.log(`✅ MongoDB bağlantısı başarılı! (DB: ${DB_NAME})`);
      } else {
        // Local MongoDB'ye bağlanmayı dene
        console.log(`🔗 Local MongoDB'ye bağlanılıyor...`);
        try {
          client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 2000 // 2 saniye timeout
          });
          await client.connect();
          db = client.db(DB_NAME);
          useMongoDB = true;
          console.log(`✅ MongoDB bağlantısı başarılı! (DB: ${DB_NAME})`);
        } catch (localError) {
          console.log("⚠️ MongoDB bağlantısı yok, JSON dosyaları kullanılacak");
          console.log(`❌ Hata: ${localError.message}`);
          useMongoDB = false;
          return null;
        }
      }
    }
    return db;
  } catch (error) {
    console.log("⚠️ MongoDB bağlantı hatası, JSON dosyaları kullanılacak");
    console.error(`❌ Hata detayı: ${error.message}`);
    console.error(`❌ Stack: ${error.stack}`);
    useMongoDB = false;
    return null;
  }
}

// MongoDB kullanılıyor mu kontrol et
function isMongoDBEnabled() {
  return useMongoDB;
}

// Bağlantıyı kapat
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB bağlantısı kapatıldı");
  }
}

// Collections
async function getProductsCollection() {
  const database = await connectDB();
  if (!database) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return database.collection("products");
}

async function getContactsCollection() {
  const database = await connectDB();
  if (!database) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return database.collection("contacts");
}

async function getReviewsCollection() {
  const database = await connectDB();
  if (!database) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return database.collection("reviews");
}

async function getBlogCollection() {
  const database = await connectDB();
  if (!database) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return database.collection("blog");
}

async function getCategoryShowcaseCollection() {
  const database = await connectDB();
  if (!database) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return database.collection("category_showcase");
}

// DB instance'ını döndür
function getDb() {
  return db;
}

// Client instance'ını döndür
function getClient() {
  return client;
}

module.exports = {
  connectDB,
  closeDB,
  getProductsCollection,
  getContactsCollection,
  getReviewsCollection,
  getBlogCollection,
  getCategoryShowcaseCollection,
  isMongoDBEnabled,
  getDb,
  getClient
};

