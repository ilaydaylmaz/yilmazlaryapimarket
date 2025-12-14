require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

// AFYON ürünleri için özel görseller
function createAfyonProductImage(productName) {
  const is60x120 = productName.includes('60X120');
  const isPolish = productName.includes('POLİSH');
  const isHighGlossy = productName.includes('HİGH GLOSSY');
  
  // 60x120 için dikey, 60x60 için kare görsel
  const width = is60x120 ? 400 : 600;
  const height = is60x120 ? 800 : 600;
  
  const bgColor = '#F5F5F5';
  const tileColor = '#FFFFFF';
  const accentColor = isPolish ? '#E8E8E8' : '#D0D0D0';
  const veiningColor = '#C0C0C0';
  
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradAfyon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:1" />
    </linearGradient>
    <pattern id="marblePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="${tileColor}"/>
      <path d="M20,20 Q50,30 80,20 T140,20" stroke="${veiningColor}" stroke-width="1.5" fill="none" opacity="0.4"/>
      <path d="M30,40 Q60,50 90,40 T150,40" stroke="${veiningColor}" stroke-width="1" fill="none" opacity="0.3"/>
      <path d="M10,60 Q40,70 70,60 T130,60" stroke="${veiningColor}" stroke-width="1.2" fill="none" opacity="0.35"/>
    </pattern>
  </defs>
  
  <!-- Arka plan -->
  <rect width="${width}" height="${height}" fill="url(#gradAfyon)"/>
  
  <!-- Seramik karo -->
  <rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.8}" 
        fill="url(#marblePattern)" rx="5" stroke="${accentColor}" stroke-width="2"/>
  
  <!-- Parlaklık efekti (glossy/polish için) -->
  ${isPolish || isHighGlossy ? `
  <defs>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.4}" 
        fill="url(#shine)" rx="5"/>
  ` : ''}
  
  <!-- Ebat bilgisi -->
  <text x="${width / 2}" y="${height * 0.15}" font-family="Arial, sans-serif" font-size="24" 
        font-weight="bold" text-anchor="middle" fill="#333">${is60x120 ? '60x120 cm' : '60x60 cm'}</text>
  
  <!-- Ürün özellikleri -->
  <text x="${width / 2}" y="${height * 0.85}" font-family="Arial, sans-serif" font-size="16" 
        text-anchor="middle" fill="#666">AFYON</text>
  <text x="${width / 2}" y="${height * 0.9}" font-family="Arial, sans-serif" font-size="14" 
        text-anchor="middle" fill="#999">${isPolish ? 'POLİSH REKTİFİYELİ' : isHighGlossy ? 'HİGH GLOSSY' : 'BEYAZ'}</text>
  
  <!-- Köşe dekorasyonları -->
  <circle cx="${width * 0.15}" cy="${height * 0.15}" r="4" fill="${accentColor}" opacity="0.6"/>
  <circle cx="${width * 0.85}" cy="${height * 0.15}" r="4" fill="${accentColor}" opacity="0.6"/>
  <circle cx="${width * 0.15}" cy="${height * 0.85}" r="4" fill="${accentColor}" opacity="0.6"/>
  <circle cx="${width * 0.85}" cy="${height * 0.85}" r="4" fill="${accentColor}" opacity="0.6"/>
</svg>`.trim();
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function updateAfyonImages() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    // AFYON ürünlerini getir
    const products = await productsCollection.find({ 
      marka: "Yurtbay Seramik",
      ad: { $regex: /AFYON/ }
    }).toArray();
    
    console.log(`\n🖼️  ${products.length} AFYON ürünü için görseller oluşturuluyor...\n`);
    
    let updatedCount = 0;

    for (const product of products) {
      const imageBase64 = createAfyonProductImage(product.ad);
      
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
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
updateAfyonImages();

