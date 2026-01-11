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
    if (!client) {
      // Eğer MONGODB_URI varsa MongoDB'ye bağlanmayı dene
      if (process.env.MONGODB_URI && process.env.MONGODB_URI !== "mongodb://localhost:27017") {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        useMongoDB = true;
        console.log("✅ MongoDB bağlantısı başarılı!");
      } else {
        // Local MongoDB'ye bağlanmayı dene
        try {
          client = new MongoClient(MONGODB_URI);
          await client.connect({ serverSelectionTimeoutMS: 2000 }); // 2 saniye timeout
          db = client.db(DB_NAME);
          useMongoDB = true;
          console.log("✅ MongoDB bağlantısı başarılı!");
        } catch (localError) {
          console.log("⚠️ MongoDB bağlantısı yok, JSON dosyaları kullanılacak");
          useMongoDB = false;
          return null;
        }
      }
    }
    return db;
  } catch (error) {
    console.log("⚠️ MongoDB bağlantı hatası, JSON dosyaları kullanılacak:", error.message);
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

module.exports = {
  connectDB,
  closeDB,
  getProductsCollection,
  getContactsCollection,
  getReviewsCollection,
  getBlogCollection,
  getCategoryShowcaseCollection,
  isMongoDBEnabled
};

