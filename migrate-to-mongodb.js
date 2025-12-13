require("dotenv").config();
const fs = require("fs");
const { getProductsCollection, getContactsCollection, connectDB, closeDB } = require("./db");

async function migrate() {
  try {
    console.log("MongoDB'ye veri aktarımı başlıyor...");
    
    const db = await connectDB();
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      console.log("💡 Lütfen .env dosyasında MONGODB_URI'yi ayarlayın:");
      console.log("   MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/");
      process.exit(1);
    }
    
    const productsCollection = await getProductsCollection();
    const contactsCollection = await getContactsCollection();

    // Products JSON'dan MongoDB'ye aktar
    const productsFile = "./data/products.json";
    if (fs.existsSync(productsFile)) {
      const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
      
      if (products.length > 0) {
        // Mevcut ürünleri kontrol et
        const existingCount = await productsCollection.countDocuments();
        
        if (existingCount === 0) {
          // JSON'daki id'yi _id'ye çevir
          const productsToInsert = products.map(p => {
            const product = {
              ad: p.ad || "",
              kategori: p.kategori || "",
              marka: p.marka || "",
              aciklama: p.aciklama || "",
              resim: p.resim || "",
              createdAt: new Date()
            };
            
            // Eğer id varsa ve ObjectId formatındaysa kullan
            const { ObjectId } = require("mongodb");
            if (p.id && ObjectId.isValid(p.id)) {
              product._id = new ObjectId(p.id);
            }
            
            return product;
          });
          
          await productsCollection.insertMany(productsToInsert);
          console.log(`${products.length} ürün MongoDB'ye aktarıldı`);
        } else {
          console.log("MongoDB'de zaten ürünler var, atlanıyor...");
        }
      }
    }

    // Contacts JSON'dan MongoDB'ye aktar
    const contactsFile = "./data/contacts.json";
    if (fs.existsSync(contactsFile)) {
      const contacts = JSON.parse(fs.readFileSync(contactsFile, "utf8"));
      
      if (contacts.length > 0) {
        const existingCount = await contactsCollection.countDocuments();
        
        if (existingCount === 0) {
          const contactsToInsert = contacts.map(c => ({
            adSoyad: c.adSoyad || "",
            email: c.email || "",
            telefon: c.telefon || "",
            mesaj: c.mesaj || "",
            tarih: c.tarih ? new Date(c.tarih) : new Date()
          }));
          
          await contactsCollection.insertMany(contactsToInsert);
          console.log(`${contacts.length} iletişim kaydı MongoDB'ye aktarıldı`);
        } else {
          console.log("MongoDB'de zaten iletişim kayıtları var, atlanıyor...");
        }
      }
    }

    console.log("Veri aktarımı tamamlandı!");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("Aktarım hatası:", error);
    await closeDB();
    process.exit(1);
  }
}

migrate();

