require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getProductsCollection, connectDB, closeDB } = require("./db");

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

async function convertImages() {
  try {
    console.log("Mevcut ürünlerin resimlerini base64'e çeviriyor...");
    
    const db = await connectDB();
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }
    
    const productsCollection = await getProductsCollection();
    const products = await productsCollection.find({}).toArray();
    
    let updated = 0;
    
    for (const product of products) {
      // Zaten base64 varsa atla
      if (product.resimBase64) {
        console.log(`✓ ${product.ad} - Zaten base64 var`);
        continue;
      }
      
      // Resim dosyası varsa base64'e çevir
      if (product.resim) {
        const filePath = path.join("public/uploads", product.resim);
        const base64 = imageToBase64(filePath);
        
        if (base64) {
          await productsCollection.updateOne(
            { _id: product._id },
            { $set: { resimBase64: base64 } }
          );
          console.log(`✓ ${product.ad} - Base64'e çevrildi`);
          updated++;
        } else {
          console.log(`⚠ ${product.ad} - Resim dosyası bulunamadı: ${product.resim}`);
        }
      }
    }
    
    console.log(`\n✅ Toplam ${updated} ürün güncellendi!`);
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

convertImages();

