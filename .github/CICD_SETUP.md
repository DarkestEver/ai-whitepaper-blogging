# CI/CD Setup Guide

This document explains how to set up GitHub Actions CI/CD with SSH deployment.

## 1. GitHub Repository Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets:

#### `SESSION_SECRET`
JWT session secret (random 32+ character string)
```bash
openssl rand -base64 32
```

#### `ADMIN_PASSWORD_HASH`
Scrypt hash of admin password
```bash
npm run admin:hash
```

#### `DEPLOY_HOST`
Your server IP or domain
```
example.com
or
192.168.1.100
```

#### `DEPLOY_USER`
SSH user on deployment server
```
deploy
or
ubuntu
```

#### `DEPLOY_PATH`
Path where the app is deployed on the server
```
/var/www/wpblog
or
/home/deploy/wpblog
```

#### `DEPLOY_SSH_KEY`
Private SSH key for deployment (DO NOT use your personal key)

### Step 1: Generate Deployment SSH Key

On your local machine:
```bash
ssh-keygen -t ed25519 -f deploy_key -C "github-actions" -N ""
```

This creates:
- `deploy_key` (private key)
- `deploy_key.pub` (public key)

### Step 2: Add Public Key to Server

Copy the public key to your server:
```bash
# From your local machine
cat deploy_key.pub | ssh deploy@example.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# OR manually:
# 1. SSH into your server
# 2. Add contents of deploy_key.pub to ~/.ssh/authorized_keys
# 3. chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Private Key to GitHub

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `DEPLOY_SSH_KEY`
4. Paste contents of `deploy_key` (the private key)
5. Save

### Step 4: Set Other Secrets

Add these in the same way:
- `SESSION_SECRET` - random 32 character string
- `ADMIN_PASSWORD_HASH` - from `npm run admin:hash`
- `DEPLOY_HOST` - your server IP/domain
- `DEPLOY_USER` - SSH user (usually `deploy` or `ubuntu`)
- `DEPLOY_PATH` - deployment directory on server

## 2. Server Setup

### Prerequisites on Server:
```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally (for process management)
npm install -g pm2

# Create deployment directory
sudo mkdir -p /var/www/wpblog
sudo chown deploy:deploy /var/www/wpblog

# Clone repository (first time only)
cd /var/www/wpblog
git clone https://github.com/your-username/ai-whitepaper-blogging.git .
```

### Environment File

Create `.env` on the server:
```bash
ssh deploy@example.com

cat > /var/www/wpblog/.env << 'EOF'
SESSION_SECRET=your-secret-here
ADMIN_PASSWORD_HASH=your-hash-here
DATABASE_PATH=/var/www/wpblog/data/app.db
NODE_ENV=production
EOF

chmod 600 /var/www/wpblog/.env
```

### PM2 Configuration (optional)

Create `/var/www/wpblog/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'wpblog',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    restart_delay: 4000,
    max_memory_restart: '1G'
  }]
};
```

Then start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 3. Workflow Behavior

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. **On every push to `main`:**
   - ✅ Checkout code
   - ✅ Install dependencies
   - ✅ Run TypeScript type check
   - ✅ Run tests
   - ✅ Build Next.js app
   - ✅ Deploy to server via SSH
   - ✅ Restart application

2. **On pull requests to `main`:**
   - ✅ Run tests and build (no deploy)
   - Allows review before merging to main

## 4. Merging Master → Main

To push code from `master` to `main`:

```bash
# Update master with latest changes
git checkout master
git pull origin master

# Create PR: master → main
# OR push directly (if main doesn't have branch protection):
git push origin master:main
```

Or set up a separate GitHub Actions workflow to auto-push master → main.

## 5. Troubleshooting

### SSH Connection Failed
- Verify `DEPLOY_HOST`, `DEPLOY_USER` are correct
- Check SSH key is added to `~/.ssh/authorized_keys` on server
- Test locally: `ssh -i deploy_key deploy@example.com`

### Build Fails
- Check logs in GitHub Actions
- Verify `SESSION_SECRET` and `ADMIN_PASSWORD_HASH` are set
- Run `npm install` and `npm run build` locally to test

### Deployment Directory Not Found
- SSH into server and create: `mkdir -p /var/www/wpblog`
- Verify permissions: `ls -la /var/www/wpblog`

### PM2 Not Found
- Install on server: `npm install -g pm2`
- Or adjust restart command in deploy.yml

## 6. Next Steps

1. ✅ Generate SSH key pair
2. ✅ Add secrets to GitHub
3. ✅ Prepare server environment
4. ✅ Test SSH connection
5. ✅ Merge to `main` branch
6. ✅ Monitor first deployment in Actions tab
