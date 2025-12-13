# Supabase RLS (Row Level Security) Hatası Çözümü

## Hata Mesajı
```
new row violates row-level security policy for table "products"
```

## 🚀 HIZLI ÇÖZÜM (2 Dakika)

### Yöntem 1: RLS Politikası Ekleme (Önerilen)

1. **Supabase Dashboard'a gidin**
   - [supabase.com](https://supabase.com) → Projenize girin

2. **Table Editor'a gidin**
   - Sol menü → "Table Editor" → `products` tablosunu seçin

3. **Policies sekmesine gidin**
   - Tablonun üstünde "Policies" sekmesine tıklayın

4. **Yeni Policy Oluşturun**
   - "New Policy" butonuna tıklayın
   - **Policy Name**: `Allow all operations`
   - **Allowed Operation**: `ALL` seçin (veya sırayla INSERT, SELECT, UPDATE, DELETE ekleyin)
   - **Policy Definition**: 
     ```
     true
     ```
   - "Review" → "Save Policy" tıklayın

### Yöntem 2: SQL ile Hızlı Çözüm (Daha Hızlı!)

1. **Supabase Dashboard → SQL Editor**
2. "New query" tıklayın
3. Aşağıdaki SQL'i yapıştırın:

```sql
-- Tüm işlemlere izin ver
CREATE POLICY "Allow all operations on products" 
ON products
FOR ALL
USING (true)
WITH CHECK (true);
```

4. "Run" butonuna tıklayın
5. ✅ Tamamlandı!

### Yöntem 3: RLS'yi Geçici Olarak Kapatma (Test İçin)

1. **Table Editor → products tablosu**
2. "..." menüsü (sağ üst) → "Disable RLS"
3. ⚠️ **Dikkat**: Production'da güvenlik riski oluşturabilir

## 🔍 Kontrol

Policy eklendikten sonra:
1. Render.com'da deploy tamamlanmasını bekleyin
2. Admin panelinden ürün eklemeyi deneyin
3. Başarılı olmalı!

## 📋 Tüm İşlemler İçin Policies

Eğer tek tek eklemek isterseniz:

### INSERT Policy:
- Name: `Allow insert`
- Operation: `INSERT`
- Definition: `true`

### SELECT Policy:
- Name: `Allow select`
- Operation: `SELECT`
- Definition: `true`

### UPDATE Policy:
- Name: `Allow update`
- Operation: `UPDATE`
- Definition: `true`

### DELETE Policy:
- Name: `Allow delete`
- Operation: `DELETE`
- Definition: `true`

## 🎯 Önerilen: Tek Policy ile Tüm İşlemler

En kolay yol: **Yöntem 2 (SQL)** kullanın - tek satırda tüm işlemleri açar!

