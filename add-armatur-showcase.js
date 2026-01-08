require("dotenv").config();
const { getCategoryShowcaseCollection, connectDB, closeDB } = require("./db");

async function addArmaturCategory() {
  try {
    console.log("📦 Armatür kategorisi showcase'e ekleniyor...");

    const db = await connectDB();
    if (!db) {
      console.error("❌ MongoDB bağlantısı yapılamadı!");
      process.exit(1);
    }

    const showcaseCollection = await getCategoryShowcaseCollection();
    const data = await showcaseCollection.findOne({ type: "category_showcase" });

    if (!data) {
      console.log("⚠️ category_showcase dokümanı bulunamadı. Admin panelinden bir kez kaydetmeniz gerekebilir.");
      await closeDB();
      process.exit(0);
    }

    const categories = data.categories || [];
    const exists = categories.some((cat) => cat.id === "armatur" || cat.name === "Armatür");

    if (exists) {
      console.log("ℹ️ Armatür kategorisi zaten mevcut, değişiklik yapılmadı.");
      await closeDB();
      process.exit(0);
    }

    const newCategory = {
      id: "armatur",
      name: "Armatür",
      image: "/uploads/categories/armatur.jpg",
      url: "/armatur-urunleri.html",
      createdAt: new Date(),
    };

    categories.push(newCategory);

    await showcaseCollection.updateOne(
      { type: "category_showcase" },
      {
        $set: {
          categories,
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Armatür kategorisi showcase'e eklendi!");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error);
    await closeDB();
    process.exit(1);
  }
}

addArmaturCategory();

