#!/usr/bin/env node

/**
 * Kategori görsellerini otomatik olarak git'e commit eden script
 * 
 * Kullanım:
 *   node auto-commit-category-images.js
 * 
 * Veya package.json'a ekleyin:
 *   "scripts": {
 *     "commit-images": "node auto-commit-category-images.js"
 *   }
 * 
 * Sonra çalıştırın:
 *   npm run commit-images
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const categoriesDir = path.join(__dirname, "public", "uploads", "categories");

function commitCategoryImages() {
  // Klasör var mı kontrol et
  if (!fs.existsSync(categoriesDir)) {
    console.log("❌ Kategori görselleri klasörü bulunamadı:", categoriesDir);
    process.exit(1);
  }

  // Tüm görselleri listele
  const files = fs.readdirSync(categoriesDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  if (files.length === 0) {
    console.log("ℹ️ Commit edilecek görsel bulunamadı");
    process.exit(0);
  }

  console.log(`📦 ${files.length} görsel bulundu, git'e ekleniyor...`);

  // Tüm görselleri git'e ekle
  const filesToAdd = files.map(file => 
    `public/uploads/categories/${file}`
  ).join(' ');

  exec(`git add ${filesToAdd}`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Git add hatası:", error.message);
      process.exit(1);
    }

    // Commit yap
    const commitMessage = `Kategori görselleri güncellendi: ${files.join(', ')}`;
    
    exec(`git commit -m "${commitMessage}"`, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes('nothing to commit')) {
          console.log("ℹ️ Commit edilecek değişiklik yok (tüm görseller zaten commit edilmiş)");
          process.exit(0);
        } else {
          console.error("❌ Git commit hatası:", error.message);
          process.exit(1);
        }
      }

      console.log("✅ Git commit başarılı!");
      console.log(`   Commit mesajı: ${commitMessage}`);
      console.log(`   Commit edilen dosyalar: ${files.length}`);
      
      // Push yapmak ister misiniz?
      console.log("\n💡 Push yapmak için: git push");
      console.log("   Veya otomatik push için: AUTO_PUSH=true npm run commit-images");
      
      // AUTO_PUSH environment variable kontrolü
      if (process.env.AUTO_PUSH === 'true') {
        console.log("\n🚀 Otomatik push yapılıyor...");
        exec('git push', { cwd: __dirname }, (error, stdout, stderr) => {
          if (error) {
            console.error("❌ Git push hatası:", error.message);
            process.exit(1);
          }
          console.log("✅ Git push başarılı!");
        });
      }
    });
  });
}

// Script'i çalıştır
commitCategoryImages();

