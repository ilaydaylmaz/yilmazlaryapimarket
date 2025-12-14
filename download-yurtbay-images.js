require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");
const https = require("https");
const http = require("http");

// Yurtbay Seramik ürün görselleri için URL'ler
// Yurtbay Seramik'in CDN'inden görselleri çekmeye çalışacağız
const productImageUrls = {
  "Yurtbay Seramik AFYON": [
    "https://www.yurtbayseramik.com/tr/urunler/afyon",
    "https://www.yurtbayseramik.com/media/catalog/product/a/f/afyon.jpg",
    "https://www.yurtbayseramik.com/media/catalog/product/a/f/afyon_1.jpg"
  ],
  "Yurtbay Seramik ALDA": [
    "https://www.yurtbayseramik.com/tr/urunler/alda",
    "https://www.yurtbayseramik.com/media/catalog/product/a/l/alda.jpg",
    "https://www.yurtbayseramik.com/media/catalog/product/a/l/alda_1.jpg"
  ],
  "Yurtbay Seramik ALDER": [
    "https://www.yurtbayseramik.com/tr/urunler/alder",
    "https://www.yurtbayseramik.com/media/catalog/product/a/l/alder.jpg"
  ],
  "Yurtbay Seramik AMALFI": [
    "https://www.yurtbayseramik.com/tr/urunler/amalfi",
    "https://www.yurtbayseramik.com/media/catalog/product/a/m/amalfi.jpg"
  ],
  "Yurtbay Seramik AMAZON": [
    "https://www.yurtbayseramik.com/tr/urunler/amazon",
    "https://www.yurtbayseramik.com/media/catalog/product/a/m/amazon.jpg"
  ],
  "Yurtbay Seramik ANDERSON": [
    "https://www.yurtbayseramik.com/tr/urunler/anderson",
    "https://www.yurtbayseramik.com/media/catalog/product/a/n/anderson.jpg"
  ],
  "Yurtbay Seramik ARCADIA": [
    "https://www.yurtbayseramik.com/tr/urunler/arcadia",
    "https://www.yurtbayseramik.com/media/catalog/product/a/r/arcadia.jpg"
  ],
  "Yurtbay Seramik ARES": [
    "https://www.yurtbayseramik.com/tr/urunler/ares",
    "https://www.yurtbayseramik.com/media/catalog/product/a/r/ares.jpg"
  ],
  "Yurtbay Seramik ARTOS": [
    "https://www.yurtbayseramik.com/tr/urunler/artos",
    "https://www.yurtbayseramik.com/media/catalog/product/a/r/artos.jpg"
  ],
  "Yurtbay Seramik ASTER": [
    "https://www.yurtbayseramik.com/tr/urunler/aster",
    "https://www.yurtbayseramik.com/media/catalog/product/a/s/aster.jpg"
  ]
};

// HTML sayfasından görsel URL'lerini çıkar
function extractImageFromHTML(html, productName) {
  // Çeşitli pattern'ler dene
  const productNameLower = productName.toLowerCase().replace('yurtbay seramik ', '');
  const patterns = [
    new RegExp('<img[^>]+src=["\']([^"\']*' + productNameLower + '[^"\']*\\.(?:jpg|jpeg|png|webp))[^"\']*["\']', 'i'),
    new RegExp('<img[^>]+data-src=["\']([^"\']*\\.(?:jpg|jpeg|png|webp))[^"\']*["\']', 'i'),
    new RegExp('background-image:\\s*url\\(["\']?([^"\')]*\\.(?:jpg|jpeg|png|webp))[^"\')]*["\']?\\)', 'i'),
    new RegExp('src=["\']([^"\']*\\.(?:jpg|jpeg|png|webp))[^"\']*["\']', 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let url = match[1];
      if (url.startsWith('//')) {
        url = 'https:' + url;
      } else if (url.startsWith('/')) {
        url = 'https://www.yurtbayseramik.com' + url;
      }
      return url;
    }
  }

  return null;
}

// HTML sayfasını indir
function downloadHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    protocol.get(url, options, (response) => {
      if (response.statusCode === 200) {
        let html = '';
        response.on('data', (chunk) => html += chunk);
        response.on('end', () => resolve(html));
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        downloadHTML(response.headers.location).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Görsel indir ve base64'e çevir
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    };

    protocol.get(url, options, (response) => {
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

// Placeholder görsel oluştur
function createPlaceholderSVG(productName) {
  const shortName = productName.replace('Yurtbay Seramik ', '');
  const svg = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8e8e8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d0d0d0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#grad)"/>
  <rect x="50" y="50" width="300" height="300" fill="#fff" stroke="#ccc" stroke-width="2" rx="5"/>
  <text x="200" y="180" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">${shortName}</text>
  <text x="200" y="220" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#666">Yurtbay Seramik</text>
  <circle cx="200" cy="280" r="30" fill="#4a90e2" opacity="0.3"/>
  <text x="200" y="330" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#999">Seramik Ürünü</text>
</svg>`.trim();
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function addRealImages() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();
    
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();
    
    console.log(`\n🖼️  Gerçek görseller indiriliyor...\n`);
    
    let updatedCount = 0;
    let failedCount = 0;

    for (const [productName, urls] of Object.entries(productImageUrls)) {
      const product = await productsCollection.findOne({ ad: productName });
      
      if (!product) {
        console.log(`⚠️  Bulunamadı: ${productName}`);
        continue;
      }

      console.log(`\n📦 ${productName} için görsel aranıyor...`);

      let imageBase64 = null;
      let found = false;

      // Önce doğrudan görsel URL'lerini dene
      for (const url of urls.slice(1)) {
        try {
          console.log(`   🔍 Deneniyor: ${url}`);
          imageBase64 = await downloadImage(url);
          console.log(`   ✅ Görsel bulundu: ${url}`);
          found = true;
          break;
        } catch (error) {
          // Devam et, bir sonraki URL'yi dene
        }
      }

      // Eğer doğrudan görsel bulunamadıysa, HTML sayfasından çıkarmayı dene
      if (!found && urls[0]) {
        try {
          console.log(`   🌐 HTML sayfası indiriliyor: ${urls[0]}`);
          const html = await downloadHTML(urls[0]);
          const imageUrl = extractImageFromHTML(html, productName);
          
          if (imageUrl) {
            console.log(`   🖼️  Görsel URL bulundu: ${imageUrl}`);
            imageBase64 = await downloadImage(imageUrl);
            found = true;
          }
        } catch (error) {
          console.log(`   ⚠️  HTML indirme hatası: ${error.message}`);
        }
      }

      // Eğer hala görsel bulunamadıysa placeholder kullan
      if (!found) {
        console.log(`   📝 Placeholder görsel kullanılıyor`);
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

      if (found) {
        console.log(`   ✅ Güncellendi: ${productName}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  Placeholder ile güncellendi: ${productName}`);
        failedCount++;
      }

      // Rate limiting için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Özet:`);
    console.log(`   ✅ Gerçek görsel ile güncellenen: ${updatedCount}`);
    console.log(`   ⚠️  Placeholder ile güncellenen: ${failedCount}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
    
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
addRealImages();

