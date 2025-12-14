require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

// Beyaz mermer dokulu görsel oluştur (60X60 - kare)
function createMarbleImage() {
  // SVG ile mermer dokusu oluştur
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
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
  <rect width="600" height="600" fill="url(#marbleBg)"/>
  
  <!-- Ana diagonal damar (üst-orta'dan alt-sol'a) -->
  <path d="M 300 50 Q 250 150, 200 250 T 100 450 Q 80 500, 100 550" stroke="#C0C0C0" stroke-width="4" fill="none" opacity="0.7" filter="url(#blur)"/>
  <path d="M 300 50 Q 250 150, 200 250 T 100 450 Q 80 500, 100 550" stroke="#D5D5D5" stroke-width="3" fill="none" opacity="0.6" filter="url(#blur)"/>
  
  <!-- Üst-sağ'tan alt-sağ'a diagonal damar -->
  <path d="M 500 50 Q 520 150, 550 250 T 580 400 Q 550 450, 500 500 T 450 550" stroke="#B8B8B8" stroke-width="5" fill="none" opacity="0.6" filter="url(#blur)"/>
  <path d="M 500 50 Q 520 150, 550 250 T 580 400 Q 550 450, 500 500 T 450 550" stroke="#D0D0D0" stroke-width="3.5" fill="none" opacity="0.5" filter="url(#blur)"/>
  
  <!-- Alt-sağ'ta konsantre gri alan -->
  <ellipse cx="520" cy="520" rx="80" ry="60" fill="#E0E0E0" opacity="0.4" filter="url(#blur)"/>
  <ellipse cx="520" cy="520" rx="60" ry="45" fill="#D5D5D5" opacity="0.3" filter="url(#blur)"/>
  
  <!-- Orta bölgede ince damarlar -->
  <path d="M 250 200 Q 280 250, 300 300" stroke="#E5E5E5" stroke-width="2.5" fill="none" opacity="0.5" filter="url(#blur)"/>
  <path d="M 350 250 Q 380 300, 400 350" stroke="#E0E0E0" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  <path d="M 200 300 Q 230 350, 250 400" stroke="#E8E8E8" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  <path d="M 400 300 Q 430 350, 450 400" stroke="#E2E2E2" stroke-width="2" fill="none" opacity="0.4" filter="url(#blur)"/>
  
  <!-- Üst bölgede ince dallanmalar -->
  <path d="M 300 100 Q 280 120, 260 140" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 320 100 Q 340 120, 360 140" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 280 150 Q 260 170, 240 190" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 340 150 Q 360 170, 380 190" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  
  <!-- Alt bölgede ince dallanmalar -->
  <path d="M 150 450 Q 130 470, 110 490" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 450 450 Q 470 470, 490 490" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 200 500 Q 180 520, 160 540" stroke="#F0F0F0" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 400 500 Q 420 520, 440 540" stroke="#F2F2F2" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  
  <!-- Orta-sol bölgede küçük damarlar -->
  <path d="M 150 250 Q 170 280, 180 310" stroke="#E8E8E8" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 180 280 Q 200 310, 220 340" stroke="#E5E5E5" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  
  <!-- Orta-sağ bölgede küçük damarlar -->
  <path d="M 450 250 Q 470 280, 480 310" stroke="#E8E8E8" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  <path d="M 420 280 Q 440 310, 460 340" stroke="#E5E5E5" stroke-width="1.5" fill="none" opacity="0.3" filter="url(#blur)"/>
  
  <!-- Ürün bilgisi -->
  <text x="300" y="580" font-family="Arial, sans-serif" font-size="12" fill="#999" text-anchor="middle" opacity="0.5">60X60 AFYON BEYAZ HİGH GLOSSY</text>
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
      ad: "Yurtbay Seramik AFYON 60X60 BEYAZ HİGH GLOSSY"
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

