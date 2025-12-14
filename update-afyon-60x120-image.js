require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

// Beyaz mermer dokulu görsel oluştur
function createMarbleImage() {
  // SVG ile mermer dokusu oluştur
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1200" viewBox="0 0 600 1200">
  <defs>
    <linearGradient id="marbleBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FAFAFA;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F5F5F5;stop-opacity:1" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
    </filter>
  </defs>
  
  <!-- Arka plan -->
  <rect width="600" height="1200" fill="url(#marbleBg)"/>
  
  <!-- Mermer damarları -->
  <path d="M 400 100 Q 450 150, 500 200 T 550 300" stroke="#E0E0E0" stroke-width="3" fill="none" opacity="0.6" filter="url(#blur)"/>
  <path d="M 350 200 Q 400 250, 450 300 T 500 400" stroke="#D0D0D0" stroke-width="2.5" fill="none" opacity="0.5" filter="url(#blur)"/>
  <path d="M 200 300 Q 250 350, 300 400 T 350 500" stroke="#E5E5E5" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  <path d="M 500 400 Q 550 450, 580 500 T 550 600" stroke="#D5D5D5" stroke-width="2.5" fill="none" opacity="0.5" filter="url(#blur)"/>
  <path d="M 100 500 Q 150 550, 200 600 T 250 700" stroke="#E8E8E8" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  <path d="M 450 600 Q 500 650, 550 700 T 500 800" stroke="#D8D8D8" stroke-width="2.5" fill="none" opacity="0.5" filter="url(#blur)"/>
  <path d="M 300 700 Q 350 750, 400 800 T 450 900" stroke="#E2E2E2" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  <path d="M 150 800 Q 200 850, 250 900 T 300 1000" stroke="#E0E0E0" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  <path d="M 500 900 Q 550 950, 580 1000 T 550 1100" stroke="#D5D5D5" stroke-width="2.5" fill="none" opacity="0.5" filter="url(#blur)"/>
  
  <!-- İnce damarlar -->
  <path d="M 250 150 Q 280 180, 300 200" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 150 250 Q 180 280, 200 300" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 450 250 Q 480 280, 500 300" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 100 400 Q 130 430, 150 450" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 350 500 Q 380 530, 400 550" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 200 600 Q 230 630, 250 650" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 450 700 Q 480 730, 500 750" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 150 850 Q 180 880, 200 900" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 400 950 Q 430 980, 450 1000" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  
  <!-- Ürün bilgisi -->
  <text x="300" y="1150" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" opacity="0.5">60X120 AFYON BEYAZ POLİSH REKTİFİYELİ</text>
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
    
    // Ürünü bul
    const product = await productsCollection.findOne({
      ad: "Yurtbay Seramik AFYON 60X120 BEYAZ POLİSH REKTİFİYELİ"
    });

    if (!product) {
      console.log("❌ Ürün bulunamadı!");
      await closeDB();
      process.exit(1);
    }

    // Mermer görseli oluştur
    const imageBase64 = createMarbleImage();
    
    // Ürünü güncelle
    await productsCollection.updateOne(
      { _id: product._id },
      { 
        $set: { 
          resimBase64: imageBase64
        }
      }
    );

    console.log("✅ Ürün görseli güncellendi!");
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

