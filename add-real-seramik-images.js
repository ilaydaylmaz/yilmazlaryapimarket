require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");
const https = require("https");

// Ürün adlarına göre özel placeholder görseller oluştur
// Her ürün için farklı renk ve tasarım kullan
function createProductImage(productName) {
  const shortName = productName.replace('Yurtbay Seramik ', '').toUpperCase();
  
  // Ürün adına göre renk seç
  const colors = {
    'AFYON': { bg: '#8B7355', text: '#FFFFFF', accent: '#D4C4B0' },
    'ALDA': { bg: '#E8E8E8', text: '#333333', accent: '#B8B8B8' },
    'ALDER': { bg: '#D4A574', text: '#FFFFFF', accent: '#F5D5A8' },
    'AMALFI': { bg: '#4A90E2', text: '#FFFFFF', accent: '#7BB3F0' },
    'AMAZON': { bg: '#2D8659', text: '#FFFFFF', accent: '#5FB88A' },
    'ANDERSON': { bg: '#5C5C5C', text: '#FFFFFF', accent: '#8A8A8A' },
    'ARCADIA': { bg: '#C9A961', text: '#FFFFFF', accent: '#E5C98A' },
    'ARES': { bg: '#8B2635', text: '#FFFFFF', accent: '#B84D5F' },
    'ARTOS': { bg: '#6B4E71', text: '#FFFFFF', accent: '#9A7A9F' },
    'ASTER': { bg: '#4A7C59', text: '#FFFFFF', accent: '#6FA87F' }
  };
  
  const color = colors[shortName] || { bg: '#6C7A89', text: '#FFFFFF', accent: '#95A5A6' };
  
  const svg = `
<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${shortName}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color.accent};stop-opacity:1" />
    </linearGradient>
    <pattern id="tile${shortName}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="${color.bg}" opacity="0.1"/>
      <line x1="0" y1="0" x2="40" y2="40" stroke="${color.accent}" stroke-width="0.5" opacity="0.3"/>
    </pattern>
  </defs>
  
  <!-- Arka plan -->
  <rect width="600" height="600" fill="url(#grad${shortName})"/>
  <rect width="600" height="600" fill="url(#tile${shortName})"/>
  
  <!-- Merkez kare (seramik karo simülasyonu) -->
  <rect x="100" y="100" width="400" height="400" fill="${color.bg}" opacity="0.9" rx="10" stroke="${color.accent}" stroke-width="3"/>
  
  <!-- İç desen -->
  <rect x="150" y="150" width="300" height="300" fill="none" stroke="${color.accent}" stroke-width="2" opacity="0.5" rx="5"/>
  <rect x="200" y="200" width="200" height="200" fill="${color.accent}" opacity="0.2" rx="5"/>
  
  <!-- Ürün adı -->
  <text x="300" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="${color.text}">${shortName}</text>
  
  <!-- Alt yazı -->
  <text x="300" y="330" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="${color.text}" opacity="0.9">Yurtbay Seramik</text>
  
  <!-- Dekoratif çizgiler -->
  <line x1="150" y1="360" x2="450" y2="360" stroke="${color.accent}" stroke-width="2" opacity="0.6"/>
  <line x1="150" y1="380" x2="450" y2="380" stroke="${color.accent}" stroke-width="2" opacity="0.6"/>
  
  <!-- Köşe dekorasyonları -->
  <circle cx="120" cy="120" r="8" fill="${color.accent}" opacity="0.7"/>
  <circle cx="480" cy="120" r="8" fill="${color.accent}" opacity="0.7"/>
  <circle cx="120" cy="480" r="8" fill="${color.accent}" opacity="0.7"/>
  <circle cx="480" cy="480" r="8" fill="${color.accent}" opacity="0.7"/>
</svg>`.trim();
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function updateProductImages() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    // Yurtbay Seramik ürünlerini getir
    const products = await productsCollection.find({ 
      marka: "Yurtbay Seramik" 
    }).toArray();
    
    console.log(`\n🖼️  ${products.length} ürün için özel görseller oluşturuluyor...\n`);
    
    let updatedCount = 0;

    for (const product of products) {
      const imageBase64 = createProductImage(product.ad);
      
      await productsCollection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            resimBase64: imageBase64,
            updatedAt: new Date()
          } 
        }
      );

      console.log(`✅ Güncellendi: ${product.ad}`);
      updatedCount++;
    }

    console.log(`\n📊 Özet:`);
    console.log(`   ✅ Güncellenen: ${updatedCount}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    console.log("\n💡 Not: Gerçek ürün fotoğrafları için Yurtbay Seramik'in web sitesinden");
    console.log("   görselleri indirip admin panelinden manuel olarak ekleyebilirsiniz.\n");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
updateProductImages();

