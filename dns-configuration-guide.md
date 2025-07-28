# 🌐 DNS Configuration Guide
## WhatsApp Advanced - Domain Setup

### **Current Server Details**
- **Internal IP**: `192.168.1.230` (Local network)
- **Public IP**: `100.115.3.36` (Internet facing)
- **Frontend Port**: `3008`
- **Backend Port**: `3006`
- **Database**: PostgreSQL (Port 5432)

### **Important**:
- Use **Public IP** (`100.115.3.36`) for DNS records
- Use **Internal IP** (`192.168.1.230`) for local configuration

---

## **Step 1: DNS Records Setup**

### **Required DNS Records**

#### **A Records** (Point domain to PUBLIC IP)
```
Type: A
Name: @
Value: 100.115.3.36
TTL: 3600

Type: A
Name: www
Value: 100.115.3.36
TTL: 3600

Type: A
Name: api
Value: 100.115.3.36
TTL: 3600
```

**⚠️ Important**: Always use your **PUBLIC IP** (100.115.3.36) for DNS records, not internal IP (192.168.1.230)

#### **CNAME Records** (Optional subdomains)
```
Type: CNAME
Name: app
Value: your-domain.com
TTL: 3600

Type: CNAME
Name: admin
Value: your-domain.com
TTL: 3600
```

---

## **Step 2: Domain Registrar Configuration**

### **For GoDaddy**
1. Login to GoDaddy account
2. Go to "My Products" → "DNS"
3. Click "Manage" next to your domain
4. Add the A records mentioned above
5. Save changes

### **For Namecheap**
1. Login to Namecheap account
2. Go to "Domain List" → "Manage"
3. Click "Advanced DNS"
4. Add the A records mentioned above
5. Save changes

### **For Cloudflare** (Recommended for security)
1. Login to Cloudflare
2. Add your domain
3. Update nameservers at your registrar
4. Add DNS records:
   ```
   Type: A, Name: @, Content: 100.115.3.36, Proxy: ON
   Type: A, Name: www, Content: 100.115.3.36, Proxy: ON
   Type: A, Name: api, Content: 100.115.3.36, Proxy: ON
   ```

---

## **Step 3: SSL Certificate Options**

### **Option 1: Let's Encrypt (Free)**
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Option 2: Cloudflare SSL (Free)**
1. Enable SSL in Cloudflare dashboard
2. Set SSL mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "HTTP Strict Transport Security (HSTS)"

### **Option 3: Commercial SSL**
- Purchase SSL from registrar
- Upload certificate files to server
- Update nginx configuration

---

## **Step 4: Verification Commands**

### **Check DNS Propagation**
```bash
# Check A record
nslookup your-domain.com

# Check from different locations
dig @8.8.8.8 your-domain.com
dig @1.1.1.1 your-domain.com

# Online tools
# https://dnschecker.org/
# https://whatsmydns.net/
```

### **Test Domain Access**
```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://your-domain.com

# Test HTTPS
curl -I https://your-domain.com

# Test API endpoint
curl https://api.your-domain.com/health
```

---

## **Step 5: Common DNS Record Examples**

### **Basic Setup**
```
your-domain.com        A     100.115.3.36
www.your-domain.com    A     100.115.3.36
api.your-domain.com    A     100.115.3.36
```

### **Advanced Setup with Subdomains**
```
your-domain.com        A     100.115.3.36
www.your-domain.com    A     100.115.3.36
api.your-domain.com    A     100.115.3.36
app.your-domain.com    A     100.115.3.36
admin.your-domain.com  A     100.115.3.36
ws.your-domain.com     A     100.115.3.36
```

### **Email Setup (Optional)**
```
mail.your-domain.com   A     100.115.3.36
@                      MX    10 mail.your-domain.com
```

---

## **Step 6: Troubleshooting**

### **Common Issues**

#### **DNS Not Propagating**
- Wait 24-48 hours for full propagation
- Clear DNS cache: `sudo systemctl flush-dns`
- Use different DNS servers for testing

#### **SSL Certificate Issues**
```bash
# Check certificate
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt
sudo certbot renew --dry-run
```

#### **Nginx Configuration Issues**
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## **Step 7: Security Recommendations**

### **Cloudflare Security Settings**
- Enable "Under Attack Mode" if needed
- Set up Page Rules for caching
- Enable "Bot Fight Mode"
- Configure Rate Limiting

### **Server Security**
```bash
# Firewall rules
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Fail2ban for SSH protection
sudo apt install fail2ban
```

---

## **Step 8: Monitoring Setup**

### **Uptime Monitoring**
- UptimeRobot (free)
- Pingdom
- StatusCake

### **SSL Monitoring**
- SSL Labs Test
- Certificate expiry alerts

---

## **Quick Setup Checklist**

- [ ] Domain purchased
- [ ] DNS A records added
- [ ] DNS propagation verified
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] HTTPS redirect working
- [ ] Application accessible via domain
- [ ] API endpoints working
- [ ] WebSocket connections working
- [ ] Security headers configured
- [ ] Monitoring setup

---

## **Example Domain Configuration**

Replace `your-domain.com` with your actual domain:

```bash
# Example for domain: whatsappadvanced.com
your-domain.com → whatsappadvanced.com
www.your-domain.com → www.whatsappadvanced.com
api.your-domain.com → api.whatsappadvanced.com
```

**DNS Records:**
```
whatsappadvanced.com     A     100.115.3.36
www.whatsappadvanced.com A     100.115.3.36
api.whatsappadvanced.com A     100.115.3.36
```

**Access URLs:**
- Main App: https://whatsappadvanced.com
- API: https://api.whatsappadvanced.com
- Health Check: https://whatsappadvanced.com/health
