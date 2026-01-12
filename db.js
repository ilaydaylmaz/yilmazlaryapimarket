require("dotenv").config();
const { MongoClient } = require("mongodb");

// MongoDB connection string - environment variable'dan al veya local için varsayılan
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "yapi_market";

let client = null;
let db = null;
let useMongoDB = false; // MongoDB kullanılıyor mu?

// MongoDB bağlantısı
async function connectDB() {
  try {
    // Eğer MONGODB_URI varsa MongoDB'ye bağlanmayı dene
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "mongodb://localhost:27017") {
      // Eski bağlantıyı kapat
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          // Bağlantı zaten kapalı olabilir, sorun değil
        }
      }
      
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000, // 30 saniye timeout (Atlas için daha uzun)
        connectTimeoutMS: 30000, // 30 saniye bağlantı timeout
        socketTimeoutMS: 60000, // 60 saniye socket timeout
        maxPoolSize: 10, // Connection pool size
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
        // Retry ayarları
        retryReads: {
          retryableErrors: [
            { code: 6 }, // HostUnreachable
            { code: 7 }, // HostNotFound
            { code: 89 }, // NetworkTimeout
            { code: 91 }, // ShutdownInProgress
            { code: 189 }, // PrimarySteppedDown
            { code: 9001 } // SocketException
          ]
        }
      });
      
      await client.connect();
      db = client.db(DB_NAME);
      useMongoDB = true;
      console.log("✅ MongoDB bağlantısı başarılı!");
      return db;
    } else {
      // Local MongoDB'ye bağlanmayı dene
      try {
        if (client) {
          try {
            await client.close();
          } catch (closeError) {
            // Bağlantı zaten kapalı olabilir, sorun değil
          }
        }
        
        client = new MongoClient(MONGODB_URI, {
          serverSelectionTimeoutMS: 2000 // 2 saniye timeout
        });
        await client.connect();
        db = client.db(DB_NAME);
        useMongoDB = true;
        console.log("✅ MongoDB bağlantısı başarılı!");
        return db;
      } catch (localError) {
        console.log("⚠️ MongoDB bağlantısı yok, JSON dosyaları kullanılacak");
        useMongoDB = false;
        return null;
      }
    }
  } catch (error) {
    console.log("⚠️ MongoDB bağlantı hatası, JSON dosyaları kullanılacak:", error.message);
    useMongoDB = false;
    client = null;
    db = null;
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

// Bağlantıyı kontrol et ve gerekirse yeniden bağlan
async function ensureConnection() {
  try {
    // Eğer client yoksa veya bağlantı kopmuşsa yeniden bağlan
    if (!client || !db) {
      console.log('🔄 MongoDB bağlantısı yok, yeniden bağlanılıyor...');
      client = null;
      db = null;
      useMongoDB = false;
      await connectDB();
    } else {
      // Bağlantının hala aktif olduğunu kontrol et (ping yerine daha basit bir kontrol)
      try {
        // Ping yerine basit bir işlem yap (daha hızlı)
        await db.admin().ping();
      } catch (pingError) {
        console.log('⚠️ MongoDB bağlantısı kopmuş, yeniden bağlanılıyor...', pingError.message);
        client = null;
        db = null;
        useMongoDB = false;
        await connectDB();
      }
    }
    
    // Bağlantı hala yoksa hata fırlat
    if (!db) {
      throw new Error("MongoDB bağlantısı kurulamadı");
    }
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası (ensureConnection):', error.message);
    useMongoDB = false;
    throw error;
  }
}

// Collections - cache'lenmiş db kullan (daha hızlı)
async function getProductsCollection() {
  await ensureConnection();
  if (!db) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return db.collection("products");
}

async function getContactsCollection() {
  await ensureConnection();
  if (!db) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return db.collection("contacts");
}

async function getReviewsCollection() {
  await ensureConnection();
  if (!db) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return db.collection("reviews");
}

async function getBlogCollection() {
  await ensureConnection();
  if (!db) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return db.collection("blog");
}

async function getCategoryShowcaseCollection() {
  await ensureConnection();
  if (!db) {
    throw new Error("MongoDB bağlantısı yok");
  }
  return db.collection("category_showcase");
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
  ensureConnection
};

