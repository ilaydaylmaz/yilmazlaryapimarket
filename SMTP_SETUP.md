# SMTP Email Ayarları Rehberi

## 📧 Gmail ile Email Gönderme

### 1️⃣ Gmail App Password Oluşturma

1. **Google Hesabınıza giriş yapın**
2. **Güvenlik** sayfasına gidin: https://myaccount.google.com/security
3. **2 Adımlı Doğrulama** açık olmalı (yoksa önce bunu açın)
4. **Uygulama şifreleri** bölümüne gidin
5. **Uygulama seç** → **Mail** seçin
6. **Cihaz seç** → **Diğer (Özel ad)** → "Yılmazlar Yapı Market" yazın
7. **Oluştur** butonuna tıklayın
8. **16 haneli şifreyi kopyalayın** (örnek: `abcd efgh ijkl mnop`)
   - Boşlukları kaldırın: `abcdefghijklmnop`

### 2️⃣ Render.com'da Environment Variables Ekleme

1. **Render Dashboard**'a gidin: https://dashboard.render.com
2. **Service'inize** tıklayın (yapi-market veya benzeri)
3. Sol menüden **Environment** sekmesine tıklayın
4. **"Add Environment Variable"** butonuna tıklayın
5. Şu değişkenleri **tek tek** ekleyin:

#### Değişken 1: ADMIN_EMAIL
- **Key:** `ADMIN_EMAIL`
- **Value:** `yilmazlarvize@gmail.com` (veya istediğiniz email)
- **Add** butonuna tıklayın

#### Değişken 2: SMTP_HOST
- **Key:** `SMTP_HOST`
- **Value:** `smtp.gmail.com`
- **Add** butonuna tıklayın

#### Değişken 3: SMTP_PORT
- **Key:** `SMTP_PORT`
- **Value:** `587`
- **Add** butonuna tıklayın

#### Değişken 4: SMTP_SECURE
- **Key:** `SMTP_SECURE`
- **Value:** `false`
- **Add** butonuna tıklayın

#### Değişken 5: SMTP_USER
- **Key:** `SMTP_USER`
- **Value:** `yilmazlarvize@gmail.com` (Gmail adresiniz)
- **Add** butonuna tıklayın

#### Değişken 6: SMTP_PASS
- **Key:** `SMTP_PASS`
- **Value:** `abcdefghijklmnop` (Oluşturduğunuz 16 haneli App Password - boşluksuz)
- **Add** butonuna tıklayın

### 3️⃣ Deploy Yenileme

1. Environment variable'ları ekledikten sonra
2. **Manual Deploy** → **Deploy latest commit** tıklayın
3. Veya yeni bir commit push edin (otomatik deploy olur)

### 4️⃣ Test Etme

1. İletişim formundan test mesajı gönderin
2. Admin panelinden mesaja cevap verin
3. Email'inizin gelen kutusunu kontrol edin

---

## 🏠 Local Geliştirme İçin (.env Dosyası)

Proje klasöründe `.env` dosyası oluşturun:

```env
# MongoDB (zaten varsa eklemeyin)
MONGODB_URI=mongodb://localhost:27017
DB_NAME=yapi_market

# Email Ayarları
ADMIN_EMAIL=yilmazlarvize@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yilmazlarvize@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**ÖNEMLİ:** `.env` dosyası zaten `.gitignore`'da, GitHub'a gitmez.

---

## 🔍 Sorun Giderme

### Email gönderilmiyor

1. **Console loglarını kontrol edin:**
   - Render Dashboard → Logs sekmesi
   - "Email gönderme hatası" mesajı var mı?

2. **App Password doğru mu?**
   - Boşluk olmamalı
   - 16 karakter olmalı
   - 2 Adımlı Doğrulama açık olmalı

3. **SMTP ayarları doğru mu?**
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_SECURE`: `false`
   - `SMTP_USER`: Gmail adresiniz
   - `SMTP_PASS`: App Password (boşluksuz)

### "Invalid login" hatası

- App Password'u yanlış kopyalamış olabilirsiniz
- 2 Adımlı Doğrulama açık değilse açın
- Yeni bir App Password oluşturun

### Email spam'e düşüyor

- İlk birkaç email spam'e düşebilir
- Gmail'de "Spam değil" olarak işaretleyin
- Sonraki emailler normal gelecektir

---

## 📝 Diğer Email Sağlayıcıları

### Outlook/Hotmail
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Özel SMTP Sunucusu
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587 (veya 465)
SMTP_SECURE=true (SSL için) veya false (TLS için)
```

---

## ✅ Başarı Kontrolü

Email ayarları doğru çalışıyorsa:
- ✅ İletişim formu gönderildiğinde admin email'e bildirim gelir
- ✅ Admin panelinden cevap gönderildiğinde müşteri email'ine cevap gider
- ✅ Console'da "Email gönderildi" mesajı görünür

