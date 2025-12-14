require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

// Genel AFYON koleksiyonu için iç mekan görseli oluştur
function createGeneralAfyonImage() {
  // SVG ile modern iç mekan görseli oluştur
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="floorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8F8F8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F5F5F5;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FAFAFA;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F0F0F0;stop-opacity:1" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
    </filter>
    <pattern id="tilePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="#FFFFFF"/>
      <rect width="100" height="100" fill="none" stroke="#E8E8E8" stroke-width="0.5"/>
      <!-- İnce mermer damarları -->
      <path d="M 20 20 Q 40 30, 60 40 T 80 60" stroke="#E0E0E0" stroke-width="1" fill="none" opacity="0.3" filter="url(#blur)"/>
      <path d="M 30 50 Q 50 60, 70 70" stroke="#E5E5E5" stroke-width="0.8" fill="none" opacity="0.2" filter="url(#blur)"/>
    </pattern>
  </defs>
  
  <!-- Arka plan duvar -->
  <rect width="800" height="400" fill="url(#wallGradient)"/>
  
  <!-- Zemin (parlak seramikler) -->
  <rect x="0" y="400" width="800" height="200" fill="url(#tilePattern)"/>
  
  <!-- Zemin yansımaları (parlaklık efekti) -->
  <rect x="0" y="400" width="800" height="200" fill="url(#floorGradient)" opacity="0.3"/>
  
  <!-- Büyük seramik kareler (perspektif) -->
  <g transform="skewY(-5) translate(0, 400)">
    <!-- İlk sıra -->
    <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="100" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="200" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="300" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="400" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="500" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="600" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="700" y="0" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    
    <!-- İkinci sıra -->
    <rect x="50" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="150" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="250" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="350" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="450" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="550" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="650" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    <rect x="750" y="100" width="100" height="100" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.95"/>
    
    <!-- Mermer damarları (her karede) -->
    <g opacity="0.4">
      <path d="M 20 20 Q 40 30, 60 40 T 80 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 120 20 Q 140 30, 160 40 T 180 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 220 20 Q 240 30, 260 40 T 280 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 320 20 Q 340 30, 360 40 T 380 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 420 20 Q 440 30, 460 40 T 480 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 520 20 Q 540 30, 560 40 T 580 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 620 20 Q 640 30, 660 40 T 680 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
      <path d="M 720 20 Q 740 30, 760 40 T 780 60" stroke="#D5D5D5" stroke-width="1.5" fill="none" filter="url(#blur)"/>
    </g>
  </g>
  
  <!-- Yansıma efekti (parlak zemin) -->
  <ellipse cx="400" cy="500" rx="300" ry="50" fill="#FFFFFF" opacity="0.2"/>
  
  <!-- Basit mobilya silüetleri (minimal) -->
  <rect x="100" y="350" width="150" height="50" fill="#E8E8E8" opacity="0.3" rx="2"/>
  <rect x="550" y="350" width="150" height="50" fill="#E8E8E8" opacity="0.3" rx="2"/>
  
  <!-- Ürün bilgisi -->
  <text x="400" y="580" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" opacity="0.6">AFYON KOLEKSİYONU</text>
</svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

async function updateProductImage() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    // Genel AFYON ürününü bul
    const product = await productsCollection.findOne({
      ad: "Yurtbay Seramik AFYON",
      marka: "Yurtbay Seramik"
    });

    if (!product) {
      console.log("❌ Ürün bulunamadı!");
      await closeDB();
      process.exit(1);
    }

    // İç mekan görseli oluştur
    const imageBase64 = createGeneralAfyonImage();
    
    // Ürünü güncelle
    await productsCollection.updateOne(
      { _id: product._id },
      { 
        $set: { 
          resimBase64: imageBase64
        }
      }
    );

    console.log("✅ Genel AFYON ürün görseli güncellendi!");
    console.log(`   Ürün: ${product.ad}`);
    console.log(`   ID: ${product._id}`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

updateProductImage();

