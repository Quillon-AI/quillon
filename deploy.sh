#!/bin/bash
# ============================================
# Quillon Deploy — pulls repo and serves /quiz
# Run on server: cd /var/www/quillon.ru && bash deploy.sh
# ============================================
set -e

DOMAIN="quillon.ru"
WEB_ROOT="/var/www/${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"

echo "🚀 Deploying Quillon..."

# 1. Pull latest
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes..."
  git pull origin main 2>/dev/null || git pull origin master
else
  echo "❌ Not a git repo. Clone first:"
  echo "   cd /var/www && git clone <repo_url> ${DOMAIN}"
  exit 1
fi

# 2. Ensure quiz dir exists with production build
echo "📄 Updating quiz landing..."
mkdir -p quiz
cp dist/index.html quiz/index.html
chown -R www-data:www-data quiz/

# 3. Check if /quiz is in nginx config
if [ -f "${NGINX_CONF}" ]; then
  if ! grep -q "location /quiz" "${NGINX_CONF}"; then
    echo "⚙️  Adding /quiz to nginx..."
    cp "${NGINX_CONF}" "${NGINX_CONF}.bak"
    
    # Insert before the last closing brace
    python3 -c "
import re
with open('${NGINX_CONF}', 'r') as f:
    content = f.read()

quiz_block = '''
    # Quiz Landing Page
    location /quiz {
        alias ${WEB_ROOT}/quiz;
        index index.html;
        try_files \\\$uri \\\$uri/ /quiz/index.html;
    }
'''

# Find the last server block's closing brace and insert before it
parts = content.rsplit('}', 1)
if len(parts) == 2:
    content = parts[0] + quiz_block + '\n}' + parts[1]

with open('${NGINX_CONF}', 'w') as f:
    f.write(content)
"
    echo "   ✅ Added /quiz location"
  else
    echo "   ℹ️  /quiz already configured"
  fi
fi

# 4. Test & reload nginx
echo "🔍 Testing nginx..."
nginx -t && systemctl reload nginx
echo "   ✅ Nginx reloaded"

echo ""
echo "════════════════════════════════════"
echo "✅ Live at: https://${DOMAIN}/quiz"
echo ""
echo "📝 Next deploy: git pull && bash deploy.sh"
echo "════════════════════════════════════"
