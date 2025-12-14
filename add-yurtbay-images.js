require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");
const https = require("https");
const http = require("http");

// Yurtbay Seramik ürün görselleri için URL'ler
// Not: Bu URL'ler Yurtbay Seramik'in web sitesinden alınmalıdır
// Şimdilik placeholder görseller kullanacağız veya kullanıcı manuel olarak ekleyebilir

const productImages = {
  "Yurtbay Seramik AFYON": null,
  "Yurtbay Seramik ALDA": null,
  "Yurtbay Seramik ALDER": null,
  "Yurtbay Seramik AMALFI": null,
  "Yurtbay Seramik AMAZON": null,
  "Yurtbay Seramik ANDERSON": null,
  "Yurtbay Seramik ARCADIA": null,
  "Yurtbay Seramik ARES": null,
  "Yurtbay Seramik ARTOS": null,
  "Yurtbay Seramik ASTER": null
};

// Görsel indir ve base64'e çevir
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const contentType = response.headers['content-type'] || 'image/jpeg';
          resolve(`data:${contentType};base64,${base64}`);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Placeholder görsel oluştur (basit bir SVG)
function createPlaceholderSVG(productName) {
  const svg = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#f0f0f0"/>
  <text x="200" y="180" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">${productName}</text>
  <text x="200" y="220" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666">Yurtbay Seramik</text>
  <rect x="50" y="250" width="300" height="100" fill="#ddd" stroke="#999" stroke-width="2"/>
  <text x="200" y="310" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#999">Görsel Yüklenecek</text>
</svg>`.trim();
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function addImages() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    console.log(`\n🖼️  Görseller ekleniyor...\n`);
    
    let updatedCount = 0;

    for (const [productName, imageUrl] of Object.entries(productImages)) {
      const product = await productsCollection.findOne({ ad: productName });
      
      if (!product) {
        console.log(`⚠️  Bulunamadı: ${productName}`);
        continue;
      }

      // Eğer zaten görsel varsa atla
      if (product.resimBase64) {
        console.log(`⏭️  Atlandı: ${productName} (zaten görsel var)`);
        continue;
      }

      let imageBase64 = null;

      if (imageUrl) {
        try {
          console.log(`📥 İndiriliyor: ${productName}...`);
          imageBase64 = await downloadImage(imageUrl);
        } catch (error) {
          console.log(`⚠️  Görsel indirilemedi: ${productName} - ${error.message}`);
          // Placeholder kullan
          imageBase64 = createPlaceholderSVG(productName);
        }
      } else {
        // Placeholder kullan
        imageBase64 = createPlaceholderSVG(productName);
      }

      // Güncelle
      await productsCollection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            resimBase64: imageBase64,
            updatedAt: new Date()
          } 
        }
      );

      console.log(`✅ Güncellendi: ${productName}`);
      updatedCount++;
    }

    console.log(`\n📊 Özet:`);
    console.log(`   ✅ Güncellenen: ${updatedCount}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
addImages();

