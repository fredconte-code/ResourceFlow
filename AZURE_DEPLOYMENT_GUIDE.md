# ResourceFlow Azure Production Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the ResourceFlow application to Microsoft Azure for production use. The application consists of a React frontend and Node.js backend with SQLite database.

---

## 📋 Prerequisites

### Azure Account Requirements
- **Azure Subscription**: Active subscription with billing enabled
- **Azure CLI**: Latest version installed locally
- **Git**: For source code management
- **Node.js**: Version 18+ for local development

### Required Azure Services
- **Azure App Service** (or Azure Container Instances)
- **Azure Database for PostgreSQL** (recommended for production)
- **Azure Key Vault** (for secrets management)
- **Azure Application Insights** (for monitoring)
- **Azure CDN** (optional, for performance)

---

## 🏗 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Azure CDN     │    │  Azure App      │    │  Azure Database │
│   (Optional)    │◄──►│  Service        │◄──►│  PostgreSQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Azure Key Vault │
                       │ (Secrets)       │
                       └─────────────────┘
```

---

## 📦 Step 1: Application Preparation

### 1.1 Database Migration (SQLite to PostgreSQL)

**Current State**: SQLite database (development)
**Target State**: PostgreSQL database (production)

#### Create Database Migration Script

```bash
# Create migration directory
mkdir -p backend/migrations
```

Create `backend/migrations/001_initial_schema.sql`:

```sql
-- Create tables for PostgreSQL
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    country VARCHAR(50) NOT NULL CHECK (country IN ('Canada', 'Brazil')),
    allocated_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    color VARCHAR(7) DEFAULT '#3b82f6',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    country VARCHAR(50) NOT NULL CHECK (country IN ('Canada', 'Brazil', 'Both')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'other')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hours_per_day DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
    ('buffer', '0'),
    ('canadaHours', '37.5'),
    ('brazilHours', '44')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_team_members_country ON team_members(country);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_vacations_employee_date ON vacations(employee_id, start_date, end_date);
CREATE INDEX idx_allocations_employee_date ON project_allocations(employee_id, start_date, end_date);
```

#### Update Backend for PostgreSQL

Create `backend/config/database.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

Update `backend/package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "express": "^5.1.0",
    "cors": "^2.8.5"
  }
}
```

### 1.2 Environment Configuration

Create `backend/.env.example`:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-app.azurewebsites.net

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Azure
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
```

Create `frontend/.env.example`:

```env
# API Configuration
VITE_API_BASE_URL=https://your-api.azurewebsites.net
VITE_APP_ENV=production

# Azure AD (if using)
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
```

### 1.3 Production Build Configuration

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  server: {
    port: 8080
  }
})
```

---

## ☁️ Step 2: Azure Resource Setup

### 2.1 Azure CLI Login and Resource Group

```bash
# Login to Azure
az login

# Set subscription (if multiple)
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name "resourceflow-rg" --location "East US"

# Set default resource group
az configure --defaults group=resourceflow-rg
```

### 2.2 Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name "resourceflow-db" \
  --resource-group "resourceflow-rg" \
  --location "East US" \
  --admin-user "resourceflowadmin" \
  --admin-password "YourSecurePassword123!" \
  --sku-name "Standard_B1ms" \
  --version "14" \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --server-name "resourceflow-db" \
  --resource-group "resourceflow-rg" \
  --database-name "resourceflow"

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --name "AllowAzureServices" \
  --resource-group "resourceflow-rg" \
  --server-name "resourceflow-db" \
  --start-ip-address "0.0.0.0" \
  --end-ip-address "0.0.0.0"

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name "resourceflow-db" \
  --database-name "resourceflow" \
  --admin-user "resourceflowadmin" \
  --admin-password "YourSecurePassword123!"
```

### 2.3 Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name "resourceflow-kv" \
  --resource-group "resourceflow-rg" \
  --location "East US" \
  --sku "standard"

# Store database connection string
az keyvault secret set \
  --vault-name "resourceflow-kv" \
  --name "DatabaseConnectionString" \
  --value "postgresql://resourceflowadmin:YourSecurePassword123!@resourceflow-db.postgres.database.azure.com:5432/resourceflow?sslmode=require"

# Store JWT secret
az keyvault secret set \
  --vault-name "resourceflow-kv" \
  --name "JwtSecret" \
  --value "your-super-secret-jwt-key-change-this-in-production"

# Store session secret
az keyvault secret set \
  --vault-name "resourceflow-kv" \
  --name "SessionSecret" \
  --value "your-session-secret-change-this-in-production"
```

### 2.4 Azure Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app "resourceflow-insights" \
  --location "East US" \
  --resource-group "resourceflow-rg" \
  --application-type "web"

# Get instrumentation key
az monitor app-insights component show \
  --app "resourceflow-insights" \
  --resource-group "resourceflow-rg" \
  --query "instrumentationKey" \
  --output tsv
```

---

## 🚀 Step 3: Backend Deployment

### 3.1 Prepare Backend for Azure

Create `backend/azure-deploy.js`:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-frontend.azurewebsites.net',
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'connected', 
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Your existing API routes here...
// (Copy all your existing routes from index.js)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Update `backend/package.json`:

```json
{
  "name": "resourceflow-backend",
  "version": "1.0.0",
  "main": "azure-deploy.js",
  "scripts": {
    "start": "node azure-deploy.js",
    "dev": "nodemon azure-deploy.js",
    "migrate": "node migrations/run-migrations.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3.2 Deploy Backend to Azure App Service

```bash
# Create App Service plan
az appservice plan create \
  --name "resourceflow-backend-plan" \
  --resource-group "resourceflow-rg" \
  --sku "B1" \
  --is-linux

# Create web app for backend
az webapp create \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg" \
  --plan "resourceflow-backend-plan" \
  --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg" \
  --settings \
    NODE_ENV=production \
    PORT=3001 \
    CORS_ORIGIN=https://resourceflow-frontend.azurewebsites.net

# Configure Key Vault integration
az webapp config appsettings set \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg" \
  --settings \
    @Microsoft.KeyVault(SecretUri=https://resourceflow-kv.vault.azure.net/secrets/DatabaseConnectionString/) \
    @Microsoft.KeyVault(SecretUri=https://resourceflow-kv.vault.azure.net/secrets/JwtSecret/) \
    @Microsoft.KeyVault(SecretUri=https://resourceflow-kv.vault.azure.net/secrets/SessionSecret/)

# Deploy backend code
cd backend
az webapp deployment source config-local-git \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg"

git init
git add .
git commit -m "Initial backend deployment"
git remote add azure <git-url-from-previous-command>
git push azure main
```

---

## 🌐 Step 4: Frontend Deployment

### 4.1 Prepare Frontend for Production

Update `frontend/src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
```

### 4.2 Deploy Frontend to Azure App Service

```bash
# Create App Service plan for frontend
az appservice plan create \
  --name "resourceflow-frontend-plan" \
  --resource-group "resourceflow-rg" \
  --sku "B1" \
  --is-linux

# Create web app for frontend
az webapp create \
  --name "resourceflow-frontend" \
  --resource-group "resourceflow-rg" \
  --plan "resourceflow-frontend-plan" \
  --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set \
  --name "resourceflow-frontend" \
  --resource-group "resourceflow-rg" \
  --settings \
    NODE_ENV=production \
    VITE_API_BASE_URL=https://resourceflow-api.azurewebsites.net

# Configure static site hosting
az webapp config set \
  --name "resourceflow-frontend" \
  --resource-group "resourceflow-rg" \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"

# Build and deploy frontend
cd frontend
npm run build

# Create deployment package
zip -r ../frontend-deploy.zip dist/

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group "resourceflow-rg" \
  --name "resourceflow-frontend" \
  --src ../frontend-deploy.zip
```

---

## 🔧 Step 5: Database Migration

### 5.1 Run Database Migrations

Create `backend/migrations/run-migrations.js`:

```javascript
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✓ Completed: ${file}`);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

Run migrations:

```bash
# Connect to Azure PostgreSQL and run migrations
cd backend
npm run migrate
```

---

## 🔒 Step 6: Security Configuration

### 6.1 SSL/TLS Configuration

```bash
# Enable HTTPS for both apps
az webapp update \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg" \
  --https-only true

az webapp update \
  --name "resourceflow-frontend" \
  --resource-group "resourceflow-rg" \
  --https-only true
```

### 6.2 Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name "resourceflow-frontend" \
  --resource-group "resourceflow-rg" \
  --hostname "resourceflow.yourcompany.com"

# Configure SSL binding
az webapp config ssl bind \
  --certificate-thumbprint "your-cert-thumbprint" \
  --ssl-type "SNI" \
  --name "resourceflow-frontend" \
  --resource-group "resourceflow-rg"
```

### 6.3 Network Security

```bash
# Create Virtual Network (if needed)
az network vnet create \
  --name "resourceflow-vnet" \
  --resource-group "resourceflow-rg" \
  --subnet-name "default"

# Configure App Service VNet integration
az webapp vnet-integration add \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg" \
  --vnet "resourceflow-vnet" \
  --subnet "default"
```

---

## 📊 Step 7: Monitoring and Logging

### 7.1 Application Insights Integration

Update `backend/azure-deploy.js`:

```javascript
const appInsights = require('applicationinsights');

// Initialize Application Insights
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .start();

const client = appInsights.defaultClient;

// Add telemetry to your routes
app.get('/api/team-members', async (req, res) => {
  const startTime = Date.now();
  try {
    // Your existing code...
    client.trackMetric({ name: 'api-response-time', value: Date.now() - startTime });
  } catch (error) {
    client.trackException({ exception: error });
    res.status(500).json({ error: error.message });
  }
});
```

### 7.2 Log Analytics

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group "resourceflow-rg" \
  --workspace-name "resourceflow-logs"

# Enable diagnostic settings
az monitor diagnostic-settings create \
  --resource-group "resourceflow-rg" \
  --resource-name "resourceflow-api" \
  --resource-type "Microsoft.Web/sites" \
  --workspace "resourceflow-logs" \
  --logs '[{"category": "AppServiceHTTPLogs", "enabled": true}, {"category": "AppServiceConsoleLogs", "enabled": true}]'
```

---

## 🚀 Step 8: Performance Optimization

### 8.1 Azure CDN Configuration

```bash
# Create CDN profile
az cdn profile create \
  --name "resourceflow-cdn" \
  --resource-group "resourceflow-rg" \
  --sku "Standard_Microsoft"

# Create CDN endpoint
az cdn endpoint create \
  --name "resourceflow-cdn-endpoint" \
  --profile-name "resourceflow-cdn" \
  --resource-group "resourceflow-rg" \
  --origin "resourceflow-frontend.azurewebsites.net" \
  --origin-host-header "resourceflow-frontend.azurewebsites.net" \
  --enable-compression
```

### 8.2 Frontend Optimization

Update `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          charts: ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

---

## 🔄 Step 9: CI/CD Pipeline

### 9.1 Azure DevOps Pipeline

Create `.azure-pipelines.yml`:

```yaml
trigger:
  - main

variables:
  nodeVersion: '18.x'
  backendAppName: 'resourceflow-api'
  frontendAppName: 'resourceflow-frontend'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: Build
    pool:
      vmImage: 'ubuntu-latest'
    
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
    
    - script: |
        npm install
      displayName: 'Install dependencies'
      workingDirectory: 'frontend'
    
    - script: |
        npm run build
      displayName: 'Build frontend'
      workingDirectory: 'frontend'
    
    - script: |
        npm install
      displayName: 'Install backend dependencies'
      workingDirectory: 'backend'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: 'frontend/dist'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/frontend.zip'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: 'backend'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/backend.zip'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '$(Build.ArtifactStagingDirectory)'
        artifactName: 'drop'

- stage: Deploy
  displayName: 'Deploy to Azure'
  dependsOn: Build
  jobs:
  - deployment: DeployBackend
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Your-Azure-Subscription'
              appName: $(backendAppName)
              package: '$(Pipeline.Workspace)/drop/backend.zip'
  
  - deployment: DeployFrontend
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Your-Azure-Subscription'
              appName: $(frontendAppName)
              package: '$(Pipeline.Workspace)/drop/frontend.zip'
```

---

## 📋 Step 10: Post-Deployment Verification

### 10.1 Health Checks

```bash
# Test backend health
curl https://resourceflow-api.azurewebsites.net/health

# Test database connection
curl https://resourceflow-api.azurewebsites.net/api/db-test

# Test frontend
curl -I https://resourceflow-frontend.azurewebsites.net
```

### 10.2 Performance Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://resourceflow-api.azurewebsites.net/health

# Test frontend performance
ab -n 1000 -c 10 https://resourceflow-frontend.azurewebsites.net/
```

### 10.3 Security Testing

```bash
# Test CORS configuration
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://resourceflow-api.azurewebsites.net/api/team-members

# Test HTTPS enforcement
curl -I http://resourceflow-frontend.azurewebsites.net
```

---

## 💰 Cost Optimization

### 11.1 Resource Scaling

```bash
# Scale down during off-hours (optional)
az monitor autoscale create \
  --resource-group "resourceflow-rg" \
  --resource "resourceflow-api" \
  --resource-type "Microsoft.Web/sites" \
  --name "resourceflow-autoscale" \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Configure scaling rules
az monitor autoscale rule create \
  --resource-group "resourceflow-rg" \
  --autoscale-name "resourceflow-autoscale" \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

### 11.2 Reserved Instances

```bash
# Purchase reserved instances for cost savings
az vm reservation create \
  --resource-group "resourceflow-rg" \
  --reserved-resource-type "VirtualMachines" \
  --billing-scope "/subscriptions/your-subscription-id" \
  --term "P1Y" \
  --quantity 1 \
  --sku "Standard_B1s"
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database connectivity
az postgres flexible-server show \
  --name "resourceflow-db" \
  --resource-group "resourceflow-rg"

# Test connection from App Service
az webapp log tail \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg"
```

#### Application Errors
```bash
# View application logs
az webapp log tail \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg"

# Download logs
az webapp log download \
  --name "resourceflow-api" \
  --resource-group "resourceflow-rg"
```

#### Performance Issues
```bash
# Check Application Insights
az monitor app-insights component show \
  --app "resourceflow-insights" \
  --resource-group "resourceflow-rg"

# Monitor metrics
az monitor metrics list \
  --resource "resourceflow-api" \
  --metric "Requests" \
  --interval "PT1H"
```

---

## 📞 Support and Maintenance

### 12.1 Monitoring Setup

- **Application Insights**: Real-time monitoring and alerting
- **Azure Monitor**: Infrastructure monitoring
- **Log Analytics**: Centralized logging
- **Azure Advisor**: Cost and performance recommendations

### 12.2 Backup Strategy

```bash
# Configure automated backups
az postgres flexible-server backup create \
  --server-name "resourceflow-db" \
  --resource-group "resourceflow-rg" \
  --backup-name "daily-backup"

# Set up backup retention
az postgres flexible-server update \
  --name "resourceflow-db" \
  --resource-group "resourceflow-rg" \
  --backup-retention-days 30
```

### 12.3 Update Strategy

- **Monthly security updates**
- **Quarterly feature updates**
- **Automated dependency updates via Dependabot**
- **Blue-green deployment for zero-downtime updates**

---

## 🎯 Summary

This deployment guide provides a comprehensive approach to deploying ResourceFlow to Azure production. The key benefits include:

✅ **Scalability**: Auto-scaling based on demand
✅ **Security**: Azure Key Vault, SSL/TLS, network security
✅ **Monitoring**: Application Insights and Log Analytics
✅ **Cost Optimization**: Reserved instances and scaling policies
✅ **High Availability**: Multi-region deployment options
✅ **Compliance**: Azure compliance certifications

### Estimated Monthly Costs (US East):
- **App Service Plans**: ~$30-60/month
- **PostgreSQL Database**: ~$25-50/month
- **Application Insights**: ~$5-15/month
- **Key Vault**: ~$1-3/month
- **CDN**: ~$5-20/month
- **Total**: ~$66-148/month

### Next Steps:
1. Review and customize the configuration
2. Set up Azure DevOps pipeline
3. Configure monitoring and alerting
4. Implement backup and disaster recovery
5. Plan for scaling and optimization

For additional support, refer to:
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/) 