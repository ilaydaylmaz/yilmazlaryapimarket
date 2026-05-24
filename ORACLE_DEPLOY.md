# Oracle Cloud — Ücretsiz VM ile Yayınlama

Oracle **Always Free** ARM sunucu: 7/24 açık, domain gerekmez (`http://SUNUCU_IP`).

MongoDB Atlas bağlantınız **aynı kalır** — sadece `.env` dosyasını sunucuya koyarsınız.

---

## 1. Oracle hesabı ve VM

1. [cloud.oracle.com](https://cloud.oracle.com) → kayıt (kart doğrulama; ücretsiz VM için ücret alınmaz)
2. **Compute** → **Instances** → **Create instance**
3. Ayarlar:
   - **Name:** `yapi-market`
   - **Image:** Ubuntu 22.04 veya 24.04
   - **Shape:** `VM.Standard.A1.Flex` (Ampere — **Always Free**)
   - **OCPU:** 1 | **Memory:** 6 GB (veya 1 OCPU / 1 GB — yeterli)
   - **SSH key:** Yeni anahtar indirin veya mevcut public key yapıştırın
4. **Create**

---

## 2. Güvenlik duvarı (portlar)

**Networking** → **Virtual cloud networks** → VCN → **Security Lists** → **Default Security List** → **Add Ingress Rules:**

| Kaynak | Protokol | Port |
|--------|----------|------|
| `0.0.0.0/0` | TCP | 22 (SSH) |
| `0.0.0.0/0` | TCP | 80 (HTTP) |
| `0.0.0.0/0` | TCP | 443 (HTTPS, isteğe bağlı) |

Instance sayfasından **Public IP** adresini kopyalayın.

---

## 3. Sunucuya bağlanın

Yerel bilgisayarınızda (indirdiğiniz `.key` dosyası ile):

```bash
chmod 400 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@SUNUCU_IP
```

---

## 4. Otomatik kurulum

Sunucuda (SSH içinde):

```bash
git clone https://github.com/ilaydaylmaz/yilmazlaryapimarket.git ~/yapi_market
cd ~/yapi_market
bash scripts/oracle-first-setup.sh
```

Script `.env` isteyecek — **yeni terminal** açıp yerel makineden:

```bash
cd /Users/ilayda/Documents/yapi_market
scp -i ~/Downloads/ssh-key-*.key .env ubuntu@SUNUCU_IP:~/yapi_market/.env
```

Sunucuda kurulum scriptinde Enter’a basın; kurulum biter.

---

## 5. MongoDB Atlas

[Atlas](https://cloud.mongodb.com) → **Network Access** → **Add IP Address**:

- Sunucu IP’si (`SUNUCU_IP`), veya
- `0.0.0.0/0` (tüm IP’ler — test için kolay)

---

## 6. Kontrol

Tarayıcıda: `http://SUNUCU_IP/`

```bash
pm2 status
pm2 logs yapi-market
```

---

## Kod güncelleme

Sunucuda:

```bash
cd ~/yapi_market
bash scripts/deploy-vps.sh
```

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Site açılmıyor | Security List’te 80 açık mı? `sudo systemctl status nginx` |
| MongoDB bağlanmıyor | Atlas’ta IP izni; `.env` doğru mu |
| `npm install` hata | `node -v` → 20.x olmalı |
| ARM shape yok | Bölge değiştirin (Frankfurt, Amsterdam vb.) |

---

## İsteğe bağlı: HTTPS

Domain olmadan Let’s Encrypt zor. Domain alırsanız:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d siteniz.com
```
