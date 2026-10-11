# Dispatch Genie (dispatchgeeni.com)

Modern AI-powered Field Service & Cleaning Service Territory Dispatch Board.

## 🌐 Production Domains & Jobber Integration
- **Primary Domain**: [https://dispatchgeeni.com](https://dispatchgeeni.com)
- **Jobber Developer Redirect URI**: `https://dispatchgeeni.com/api/jobber/oauth/callback`
- **Project Store**: `data/dispatch_geeni_store.json`
- **Registrar / DNS**: Hostinger (Pointing to Google Cloud Run / Container)

## 🚀 Getting Started
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Production build
npm run build
npm start
```

## 📦 Features
- 2 Mobile Cleaning Vans (Van 01 Blue, Van 02 Purple)
- Jobber GraphQL incremental delta sync (Quotes, Invoices, Calendar Visits, Clients)
- Google Maps Platform route optimization & depot home hubs
- Quo / OpenPhone VoIP call transcription & dispatch intelligence
- Instant multi-format checkpoints & offline SQLite/JSON caching
