require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getProductsCollection, connectDB, closeDB } = require("./db");

// JSON dosyasından Çamsan Parke ürünlerini oku
function loadCamsanparkeProducts() {
  const filePath = path.join(__dirname, "data", "camsanparke-products.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("data/camsanparke-products.json bulunamadı.");
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);

  if (!json.products || !Array.isArray(json.products)) {
    throw new Error("data/camsanparke-products.json içinde 'products' dizisi bulunamadı.");
  }

  return json.products;
}

async function addCamsanparkeProducts() {
  try {
    const products = loadCamsanparkeProducts();

    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();

    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      console.log("💡 Lütfen .env dosyasında MONGODB_URI'yi ayarlayın");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();

    console.log(`\n📦 ${products.length} Çamsan Parke ürünü ekleniyor...\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Marka veya kategori eksikse varsayılanları doldur
      const normalizedProduct = {
        kategori: "Parke Ürünleri",
        marka: "Çamsan Parke",
        ...product
      };

      // Aynı isim + marka varsa atla
      const existing = await productsCollection.findOne({
        ad: normalizedProduct.ad,
        marka: normalizedProduct.marka
      });

      if (existing) {
        console.log(`⏭️  Atlandı: ${normalizedProduct.ad} (zaten mevcut)`);
        skippedCount++;
        continue;
      }

      const productToInsert = {
        ...normalizedProduct,
        // Eğer 'resim' alanına bir dosya adı yazarsanız, /public/uploads içine o dosyayı koymanız yeterli
        resimBase64: null,
        createdAt: new Date()
      };

      const result = await productsCollection.insertOne(productToInsert);
      console.log(`✅ Eklendi: ${normalizedProduct.ad} (ID: ${result.insertedId})`);
      addedCount++;
    }

    console.log(`\n📊 Özet:`);
    console.log(`   ✅ Eklenen: ${addedCount}`);
    console.log(`   ⏭️  Atlanan: ${skippedCount}`);
    console.log(`   📦 Toplam: ${products.length}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

addCamsanparkeProducts();


