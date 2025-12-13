const { MongoClient } = require("mongodb");

// MongoDB connection string - environment variable'dan al veya local için varsayılan
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "yapi_market";

let client = null;
let db = null;

// MongoDB bağlantısı
async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      db = client.db(DB_NAME);
      console.log("MongoDB bağlantısı başarılı!");
    }
    return db;
  } catch (error) {
    console.error("MongoDB bağlantı hatası:", error);
    throw error;
  }
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
  return database.collection("products");
}

async function getContactsCollection() {
  const database = await connectDB();
  return database.collection("contacts");
}

module.exports = {
  connectDB,
  closeDB,
  getProductsCollection,
  getContactsCollection
};

