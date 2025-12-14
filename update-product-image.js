require("dotenv").config();
const { connectDB, getProductsCollection, isMongoDBEnabled } = require("./db");
const fs = require("fs");
const path = require("path");

// Resmi base64'e çevir
function imageToBase64(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const imageBuffer = fs.readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
      return `data:image/${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error("Base64 dönüştürme hatası:", error);
  }
  return null;
}

async function updateProductImage() {
  try {
    const productName = "X1 ALL Beyaz - 0,75 L";
    
    if (isMongoDBEnabled()) {
      const productsCollection = await getProductsCollection();
      
      // Ürünü bul
      const product = await productsCollection.findOne({ 
        ad: productName
      });
      
      if (!product) {
        console.log("❌ Ürün bulunamadı!");
        return;
      }
      
      console.log("✅ Ürün bulundu:", product.ad);
      console.log("📝 Resim eklemek için:");
      console.log("1. Ürün resmini 'public/uploads/' klasörüne kaydedin");
      console.log("2. Resim dosya adını aşağıya yazın");
      console.log("3. Veya admin panelinden ürünü düzenleyip resim ekleyin");
      console.log("\nÜrün ID:", product._id.toString());
      
      // Eğer komut satırından dosya adı verilmişse
      const imageFileName = process.argv[2];
      if (imageFileName) {
        const imagePath = path.join("public/uploads", imageFileName);
        const base64 = imageToBase64(imagePath);
        
        if (base64) {
          await productsCollection.updateOne(
            { _id: product._id },
            {
              $set: {
                resim: imageFileName,
                resimBase64: base64
              }
            }
          );
          console.log("✅ Resim başarıyla eklendi!");
        } else {
          console.log("❌ Resim dosyası bulunamadı:", imagePath);
        }
      }
    } else {
      console.log("⚠️ MongoDB bağlantısı yok, JSON dosyaları kullanılıyor");
      const DATA_FILE = "./data/products.json";
      let products = [];
      
      if (fs.existsSync(DATA_FILE)) {
        products = JSON.parse(fs.readFileSync(DATA_FILE));
      }
      
      const product = products.find(p => p.ad === productName);
      if (!product) {
        console.log("❌ Ürün bulunamadı!");
        return;
      }
      
      console.log("✅ Ürün bulundu:", product.ad);
      console.log("📝 Resim eklemek için admin panelinden ürünü düzenleyin");
    }
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

// Bağlantıyı başlat
connectDB().then(() => {
  updateProductImage();
}).catch(err => {
  console.error("MongoDB bağlantı hatası:", err);
  updateProductImage();
});

