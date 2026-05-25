# Firebase Deploy (MongoDB Atlas aynı kalır)

Site: **Firebase Hosting** + **Cloud Functions** (Express API)  
Veritabanı: **MongoDB Atlas** (değişmez — `MONGODB_URI`, `DB_NAME`)

## Önemli: Blaze planı gerekir

Cloud Functions'ın MongoDB Atlas'a bağlanması için Firebase **Blaze** (kullandıkça öde) planı gerekir.  
Kart eklenir; düşük trafikte çoğu zaman **$0** kalır. Spark (ücretsiz) planında dış API (Atlas) çalışmaz.

---

## 1. Firebase projesi

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Proje adı: örn. `yilmazlar-yapi-market`
3. **Blaze** planına geçin (Upgrade)

---

## 2. CLI kurulum

```bash
npm install -g firebase-tools
firebase login
```

Proje kökünde:

```bash
cp .firebaserc.example .firebaserc
# .firebaserc içinde YOUR_FIREBASE_PROJECT_ID → gerçek proje ID
firebase use YOUR_FIREBASE_PROJECT_ID
```

---

## 3. Ortam değişkenleri (Atlas bağlantısı)

Firebase Console → **Build** → **Functions** → **Environment variables**:

| Key | Value |
|-----|--------|
| `MONGODB_URI` | `.env` dosyanızdaki Atlas connection string |
| `DB_NAME` | `yapi_market` (veya `.env` değeriniz) |
| `NODE_ENV` | `production` |

MongoDB Atlas → **Network Access** → `0.0.0.0/0` (veya Google Cloud IP aralıkları)

---

## 4. Deploy

```bash
cd /Users/ilayda/Documents/yapi_market
npm install
firebase deploy
```

İlk deploy 5–10 dakika sürebilir.

---

## 5. Site adresi

Deploy sonrası:

- **Hosting:** `https://YOUR_PROJECT_ID.web.app`
- **Alternatif:** `https://YOUR_PROJECT_ID.firebaseapp.com`

---

## Ürünler görünmüyorsa

Render'da da boş `[]` dönüyordu — genelde **ortam değişkeni eksik**:

1. `MONGODB_URI` ve `DB_NAME` Firebase Functions'ta tanımlı mı?
2. Atlas Network Access açık mı?
3. Functions log: `firebase functions:log`

Test:

```bash
curl "https://YOUR_PROJECT_ID.web.app/api/public/products"
```

Boş dizi değil, ürün listesi gelmeli.

---

## Notlar

- **Admin + dosya yükleme:** Cloud Functions geçici disk kullanır; yüklenen dosyalar kalıcı olmayabilir. Kategori görselleri `public/uploads/categories/` repoda olduğu için sorun olmaz.
- **Yerel geliştirme:** `npm start` (değişmedi)
- **Render:** İsterseniz Render servisini silebilirsiniz
