require("dotenv").config();
const { getProductsCollection, connectDB, isMongoDBEnabled } = require("./db");

async function updateBanyoCategories() {
  try {
    if (!isMongoDBEnabled()) {
      console.log("⚠️ MongoDB aktif değil. Bu script sadece MongoDB ile çalışır.");
      return;
    }

    await connectDB();
    const productsCollection = await getProductsCollection();

    // Banyo ile ilgili eski kategori isimleri
    const oldCategoryNames = [
      "Banyo Dolapları",
      "Banyo Ürünleri",
      "Banyo"
    ];

    console.log("📦 Banyo kategorisindeki ürünler güncelleniyor...");

    // Eski banyo kategorilerinde olan tüm ürünleri bul
    const query = {
      kategori: { $in: oldCategoryNames }
    };

    const products = await productsCollection.find(query).toArray();
    console.log(`🔎 Toplam ${products.length} banyo ürünü bulundu.`);

    if (!products.length) {
      console.log("⚠️ Güncellenecek ürün bulunamadı.");
      return;
    }

    let updatedCount = 0;

    for (const product of products) {
      const updates = {
        kategori: "Banyo",
        updatedAt: new Date()
      };

      // Eğer altKategori yoksa veya boşsa Banyo Dolapları yap
      if (!product.altKategori || product.altKategori.trim() === "") {
        updates.altKategori = "Banyo Dolapları";
      }

      await productsCollection.updateOne(
        { _id: product._id },
        { $set: updates }
      );

      console.log(
        `✅ ${product.ad || "(İsimsiz Ürün)"} → kategori: "${
          product.kategori
        }" → "Banyo", altKategori: "${product.altKategori || "-"}" → "${
          updates.altKategori || product.altKategori || "-"
        }"`
      );
      updatedCount++;
    }

    console.log(`\n🎉 Toplam ${updatedCount} banyo ürünü güncellendi.`);

    // Son dağılımı göster
    const updatedProducts = await productsCollection.find({}).toArray();
    const categoryCounts = {};
    updatedProducts.forEach((p) => {
      const key = `${p.kategori || "Kategori Yok"}${
        p.altKategori ? " / " + p.altKategori : ""
      }`;
      categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    });

    console.log("\n📊 Güncel Banyo kategori dağılımı:");
    Object.entries(categoryCounts)
      .filter(([key]) => key.startsWith("Banyo"))
      .forEach(([key, count]) => {
        console.log(`  ${key}: ${count} ürün`);
      });
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

updateBanyoCategories();


