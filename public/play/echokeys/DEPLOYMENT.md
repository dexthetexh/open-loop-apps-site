# EchoKeys - Deployment Guide

Complete guide for deploying EchoKeys v1.3 to production.

---

## Pre-Deployment Checklist

### Files Verification
- [ ] `index.html` present and valid
- [ ] `app.js` present and valid (v1.3 with both replay fixes)
- [ ] `style.css` present and valid
- [ ] All files use UTF-8 encoding
- [ ] No console errors when opening locally

### Testing Verification
- [ ] Audio plays on user interaction
- [ ] Keys respond to touch/click
- [ ] Correct input advances level
- [ ] Incorrect input shows error
- [ ] Replay button works correctly
- [ ] Next button works correctly
- [ ] Try Again button works correctly
- [ ] Settings panel opens/closes
- [ ] Vibration toggle persists
- [ ] Best score persists across refreshes

### Browser Testing
- [ ] Chrome mobile (Android)
- [ ] Safari mobile (iOS)
- [ ] Chrome desktop
- [ ] Safari desktop
- [ ] Firefox (optional)

---

## Deployment Method 1: Multi-File Static Hosting

**Best for:** Traditional web servers, full control over files

### Directory Structure
```
/your-domain/play/echokeys/
├── index.html
├── app.js
├── style.css
└── (documentation files optional)
```

### Steps

1. **Prepare files:**
```bash
cd /path/to/echokeys
ls -la
# Verify: index.html, app.js, style.css are present
```

2. **Upload via SFTP/SCP:**
```bash
scp -r echokeys/ user@yourserver.com:/var/www/html/play/
```

3. **Or upload via FTP client:**
   - FileZilla, Cyberduck, etc.
   - Drag the `echokeys/` folder to `/public_html/play/`

4. **Set permissions (if needed):**
```bash
ssh user@yourserver.com
cd /var/www/html/play/echokeys
chmod 644 *.html *.js *.css
```

5. **Test deployment:**
   - Visit: `https://yourdomain.com/play/echokeys/`
   - Click through all game flows
   - Test on mobile device

### Nginx Configuration (Optional)
```nginx
location /play/echokeys/ {
    root /var/www/html;
    index index.html;
    
    # Enable CORS if needed
    add_header Access-Control-Allow-Origin *;
    
    # Cache static files
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

### Apache Configuration (Optional)
```apache
<Directory "/var/www/html/play/echokeys">
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
    
    # Cache control
    <FilesMatch "\.(js|css)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
    
    <FilesMatch "\.html$">
        Header set Cache-Control "no-store, no-cache, must-revalidate"
    </FilesMatch>
</Directory>
```

---

## Deployment Method 2: Single-File Deployment

**Best for:** Quick sharing, simple hosting, GitHub Pages

### File to Use
- `echokeys-mobile-test.html` (all-in-one, 28KB)

### Steps

1. **Rename (optional):**
```bash
cp echokeys-mobile-test.html echokeys.html
```

2. **Upload single file:**
```bash
scp echokeys.html user@yourserver.com:/var/www/html/play/
```

3. **Test:**
   - Visit: `https://yourdomain.com/play/echokeys.html`

### GitHub Pages
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Add file
cp echokeys-mobile-test.html index.html
git add index.html
git commit -m "Deploy EchoKeys v1.3"
git push origin gh-pages

# Access at: https://username.github.io/repo-name/
```

---

## Deployment Method 3: Netlify

**Best for:** Instant deployment, automatic HTTPS, CDN

### Via Drag & Drop

1. Go to https://app.netlify.com/drop
2. Drag the `echokeys/` folder
3. Done! Get instant URL like `random-name-123.netlify.app`

### Via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd echokeys/
netlify deploy --prod

# Follow prompts, get URL
```

### Custom Domain (Optional)
1. Go to Netlify dashboard
2. Domain settings → Add custom domain
3. Point DNS to Netlify
4. Automatic HTTPS via Let's Encrypt

---

## Deployment Method 4: Vercel

**Best for:** Git integration, automatic deployments

### Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd echokeys/
vercel

# Follow prompts
# Production URL: echokeys.vercel.app
```

### Via GitHub Integration

1. Push to GitHub repository
2. Connect to Vercel
3. Auto-deploys on every push
4. Get URL: `projectname.vercel.app`

---

## Deployment Method 5: AWS S3 + CloudFront

**Best for:** Scalable, enterprise hosting

### Steps

1. **Create S3 Bucket:**
```bash
aws s3 mb s3://echokeys-game
```

2. **Upload files:**
```bash
cd echokeys/
aws s3 sync . s3://echokeys-game --acl public-read
```

3. **Enable static website hosting:**
```bash
aws s3 website s3://echokeys-game \
  --index-document index.html \
  --error-document index.html
```

4. **Create CloudFront distribution (optional):**
   - Origin: S3 bucket URL
   - Default root object: `index.html`
   - SSL certificate: Use AWS Certificate Manager

5. **Access:**
   - S3: `http://echokeys-game.s3-website-us-east-1.amazonaws.com`
   - CloudFront: `https://d1234567890.cloudfront.net`

---

## Deployment Method 6: Cloudflare Pages

**Best for:** Free hosting, global CDN, automatic deployments

### Via GitHub

1. Push code to GitHub
2. Go to Cloudflare Pages dashboard
3. Connect repository
4. Build settings:
   - Build command: (none)
   - Build output: `/`
5. Deploy!

### Via Direct Upload

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
cd echokeys/
wrangler pages publish . --project-name=echokeys
```

---

## Adding Monetization (Ad Integration)

### Google AdSense

1. **Get AdSense code**
2. **Add to index.html:**

```html
<!-- In <head> section -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>

<!-- In #ad-slot div (replace existing) -->
<div id="ad-slot" class="ad-slot">
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXX"
         data-ad-slot="1234567890"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
</div>
```

### Other Ad Networks

The `#ad-slot` div is already positioned and styled. Simply insert your ad network's code inside it.

---

## Domain Setup

### Option 1: Subdomain
- `play.yourdomain.com/echokeys`
- Easy to set up
- Can have multiple games

### Option 2: Subdirectory
- `yourdomain.com/play/echokeys`
- Simple routing
- Shared domain authority

### Option 3: Dedicated Domain
- `echokeys.com`
- Best for branding
- Requires separate domain

### DNS Configuration (Example)

```
# For subdomain (play.yourdomain.com)
Type: A
Name: play
Value: YOUR_SERVER_IP
TTL: 3600

# Or CNAME for hosting services
Type: CNAME
Name: play
Value: your-app.netlify.app
TTL: 3600
```

---

## SSL/HTTPS Setup

### Automatic (Recommended)
- Netlify: Automatic via Let's Encrypt
- Vercel: Automatic
- Cloudflare Pages: Automatic
- GitHub Pages: Automatic for github.io domains

### Manual (Self-Hosted)

```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d play.yourdomain.com

# Or with Apache
sudo certbot --apache -d play.yourdomain.com
```

---

## Performance Optimization

### 1. Enable Compression

**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/javascript;
gzip_min_length 1000;
```

**Apache:**
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

### 2. Set Cache Headers

See Nginx/Apache configs above in Method 1.

### 3. Use CDN

- Cloudflare (free plan available)
- AWS CloudFront
- Fastly
- KeyCDN

### 4. Minify Files (Optional)

```bash
# Install minifiers
npm install -g html-minifier clean-css-cli uglify-js

# Minify
html-minifier --collapse-whitespace index.html -o index.min.html
cleancss -o style.min.css style.css
uglifyjs app.js -o app.min.js

# Update index.html to reference minified files
```

**Note:** Current file size (28KB total) is already very small, so minification is optional.

---

## Monitoring & Analytics

### Google Analytics

Add to `<head>` in index.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Simple Analytics (Privacy-Friendly)

```html
<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
<noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerpolicy="no-referrer-when-downgrade" /></noscript>
```

### Plausible (Privacy-Friendly)

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] No sensitive data in JavaScript
- [ ] CORS properly configured (if needed)
- [ ] CSP header set (optional but recommended)
- [ ] Regular backups enabled

### Recommended Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## Backup Strategy

### Method 1: Git Repository
```bash
git init
git add .
git commit -m "EchoKeys v1.3 production files"
git remote add origin https://github.com/username/echokeys.git
git push -u origin main
```

### Method 2: Automated Backup
```bash
# Cron job to backup daily
0 2 * * * tar -czf ~/backups/echokeys-$(date +\%Y\%m\%d).tar.gz /var/www/html/play/echokeys/
```

### Method 3: Cloud Sync
```bash
# Sync to Dropbox/Google Drive/OneDrive
rclone sync /var/www/html/play/echokeys/ remote:echokeys-backup/
```

---

## Troubleshooting

### Audio Not Playing
- Check console for AudioContext errors
- Ensure user has interacted with page (browser requirement)
- Verify no browser extensions blocking audio
- Test in incognito mode

### Keys Not Responding
- Check console for JavaScript errors
- Verify game state (should be "input")
- Check if keys are disabled (CSS opacity issue)
- Clear localStorage and try again

### Haptics Not Working
- Normal on desktop (not supported)
- Check if vibration is enabled in settings
- Verify browser supports Vibration API
- Test on different device

### LocalStorage Issues
- Check browser privacy settings
- Verify not in private/incognito mode
- Check localStorage quota
- Clear and retry

---

## Post-Deployment Testing

### Functionality Test
1. Open game on mobile
2. Complete one full level
3. Test Replay button
4. Test Try Again button
5. Test Next button
6. Verify score persists after refresh
7. Toggle vibration setting
8. Verify setting persists after refresh

### Performance Test
```bash
# Check load time
curl -o /dev/null -s -w 'Total: %{time_total}s\n' https://yourdomain.com/play/echokeys/

# Run Lighthouse
lighthouse https://yourdomain.com/play/echokeys/ --view
```

### Cross-Browser Test
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Chrome Desktop
- [ ] Safari Desktop
- [ ] Firefox Desktop (optional)

---

## Rollback Procedure

If issues occur after deployment:

1. **Keep previous version:**
```bash
cp -r echokeys echokeys-v1.2-backup
```

2. **Quick rollback:**
```bash
rm -rf echokeys
mv echokeys-v1.2-backup echokeys
```

3. **Git rollback:**
```bash
git log  # Find previous commit
git checkout <commit-hash> .
git commit -m "Rollback to v1.2"
git push
```

---

## Support & Maintenance

### Update Process
1. Test locally
2. Deploy to staging (if available)
3. Test on staging
4. Deploy to production
5. Monitor for issues
6. Update VERSION.md and CHANGELOG.md

### Long-Term Maintenance
- Monitor browser compatibility
- Update dependencies (none currently)
- Check for security advisories
- Respond to user feedback
- Plan feature updates

---

## Success Metrics

Track these KPIs:
- Daily active users
- Average session duration
- Completion rate (Level 1 → Level 5+)
- Replay button usage
- Settings interaction
- Best scores distribution
- Browser/device breakdown
- Bounce rate

---

**Deployment Status:** Ready for Production ✅  
**Version:** 1.3  
**Last Updated:** January 27, 2026
