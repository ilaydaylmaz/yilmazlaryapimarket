require("dotenv").config();
const { getProductsCollection, connectDB, closeDB } = require("./db");

// Akçalı Sprey için temel ürünler
const akcaliProducts = [
  {
    ad: "Akçalı Sprey Boya 400 ml",
    kategori: "Boya Ürünleri",
    marka: "Akçalı Sprey Boya",
    aciklama:
      "Akçalı Sprey, iç ve dış mekân ahşap, metal, beton, sıva, çimento vb. yüzeyler için hızlı kuruyan, solmaya dirençli, parlak görünümlü son kat solvent bazlı sprey boyadır. Hobi, dekorasyon ve onarım işlerinde pratik kullanım sunar.",
    // Bu dosya adını, public/uploads klasörüne yükleyeceğiniz görsel ile eşleştirin
    resim: "akcali-sprey-400ml.png"
  }
];

async function addAkcaliProducts() {
  try {
    console.log("MongoDB'ye bağlanılıyor...");
    const db = await connectDB();

    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      console.log("💡 Lütfen .env dosyasında MONGODB_URI'yi ayarlayın");
      process.exit(1);
    }

    const productsCollection = await getProductsCollection();

    console.log(`\n📦 ${akcaliProducts.length} Akçalı Sprey ürünü ekleniyor...\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const product of akcaliProducts) {
      const existing = await productsCollection.findOne({
        ad: product.ad,
        marka: product.marka
      });

      if (existing) {
        console.log(`⏭️  Atlandı: ${product.ad} (zaten mevcut)`);
        skippedCount++;
        continue;
      }

      const productToInsert = {
        ...product,
        // Eğer dosya adı verildiyse /uploads altından kullanılacak
        // veya admin panelinden Base64 görsel eklenebilir
        resimBase64: null,
        createdAt: new Date()
      };

      const result = await productsCollection.insertOne(productToInsert);
      console.log(`✅ Eklendi: ${product.ad} (ID: ${result.insertedId})`);
      addedCount++;
    }

    console.log(`\n📊 Özet:`);
    console.log(`   ✅ Eklenen: ${addedCount}`);
    console.log(`   ⏭️  Atlanan: ${skippedCount}`);
    console.log(`   📦 Toplam: ${akcaliProducts.length}\n`);

    await closeDB();
    console.log("✅ İşlem tamamlandı!");
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

// Script çalıştır
addAkcaliProducts();


