# 🛍️ AI-Powered Price Comparison System

> An intelligent price comparison platform that defaults to local country shopping, with smart recommendations for international deals and a dedicated global shopping mode for cross-border purchases.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![PNPM Version](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange)](https://pnpm.io/)
[![Python Version](https://img.shields.io/badge/python-3.11-blue)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Docker Setup](#-docker-setup)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This is a next-generation price comparison platform that intelligently helps users find the best deals across local and international retailers. The system features:

- **🏠 Local First**: Shows prices from your country by default
- **💡 Smart Savings Alert**: Automatically detects significant international savings
- **🌍 Global Mode**: One-click access to international marketplaces
- **🤖 AI-Powered Search**: Advanced search using keyword and vector search
- **📊 Real-time Updates**: Continuous price monitoring and alerts

---

## ✨ Core Features

### Three Shopping Modes

1. **LOCAL MODE (Default)**
   - Shows only shops from user's country
   - Fast delivery (1-3 days)
   - No import fees
   - Local currency only

2. **SMART SUGGESTIONS (Automatic)**
   - Monitors price differences
   - Shows popup when savings > 15%
   - Calculates total cost with shipping + import
   - Only suggests if truly worthwhile

3. **GLOBAL MODE (Toggle)**
   - Shows only international retailers
   - Amazon (all regions), AliExpress, eBay, Banggood
   - Includes shipping + import calculations
   - Best for wholesale, rare items, max savings

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Search  │  │  Product │  │  Compare │  │  Profile │       │
│  │   Page   │  │  Details │  │  Prices  │  │   Page   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API GATEWAY (Node.js + Fastify)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Search Routes│  │Product Routes│  │  User Routes │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──┬────────────┬────────────┬────────────┬────────────┬─────────┘
   │            │            │            │            │
   ▼            ▼            ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Scraper  │ │Normalizer│ │  Search  │ │Recommend │ │ Shipping │
│ Service  │ │ Service  │ │ Service  │ │  Engine  │ │Calculator│
│(Python)  │ │(Python)  │ │(Python)  │ │(Python)  │ │(Python)  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
     │            │            │            │            │
     └────────────┴────────────┴────────────┴────────────┘
                              │
     ┌────────────────────────┴────────────────────────┐
     │                                                  │
     ▼                                                  ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ MongoDB  │ │  Redis   │ │Meilisearch│ │  Qdrant  │ │RabbitMQ  │
│(Database)│ │ (Cache)  │ │(Keyword)  │ │ (Vector) │ │ (Queue)  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3 + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6

### Backend
- **API Gateway**: Node.js 20 + Fastify
- **Microservices**: Python 3.11 + FastAPI
- **Validation**: Zod (TS) + Pydantic (Python)
- **Task Queue**: Celery + RabbitMQ

### Databases & Search
- **Database**: MongoDB 7.0
- **Cache**: Redis 7.2
- **Keyword Search**: Meilisearch 1.5
- **Vector Search**: Qdrant 1.7
- **Message Queue**: RabbitMQ 3.12

### Scraping Stack
- **Browser Automation**: Playwright
- **HTML Parsing**: BeautifulSoup4
- **Framework**: Scrapy
- **Anti-Detection**: playwright-stealth

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monorepo**: PNPM Workspaces
- **Version Control**: Git

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.0.0 ([Download](https://nodejs.org/))
- **PNPM**: >= 8.0.0 (`npm install -g pnpm`)
- **Python**: 3.11 ([Download](https://www.python.org/))
- **Docker**: Latest version ([Download](https://www.docker.com/))
- **Docker Compose**: v2+ (usually bundled with Docker)
- **Git**: Latest version

**Check your versions:**
```bash
node --version    # Should be v20.x.x or higher
pnpm --version    # Should be 8.x.x or higher
python --version  # Should be 3.11.x
docker --version  # Any recent version
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd price-comparison-app
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

### 4. Start Infrastructure Services

```bash
# Start MongoDB, Redis, Meilisearch, Qdrant, RabbitMQ
pnpm docker:up

# Wait for services to be ready (check logs)
pnpm docker:logs
```

### 5. Run the Application

```bash
# Development mode (all services)
pnpm dev

# Or run specific services
pnpm dev:web    # Frontend only
pnpm dev:api    # API Gateway only
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/documentation
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **Meilisearch**: http://localhost:7700

---

## 📁 Project Structure

```
price-comparison-system/
├── apps/                          # Applications
│   ├── web/                       # React frontend
│   └── api/                       # Node.js API Gateway
│
├── services/                      # Python microservices
│   ├── scraper/                   # Web scraping service
│   ├── normalizer/                # Data normalization
│   ├── search/                    # Search service
│   └── recommendation-engine/     # Smart recommendations
│
├── packages/                      # Shared packages
│   ├── types/                     # TypeScript type definitions
│   ├── config/                    # Shared configuration
│   └── utils/                     # Common utilities
│
├── configs/                       # Configuration files
│   ├── shops/                     # Shop configurations
│   │   ├── local/                 # Local shop configs
│   │   └── global/                # Global retailer configs
│   └── regions/                   # Regional settings
│
├── infrastructure/                # Infrastructure as Code
│   └── docker/                    # Docker configurations
│
├── docs/                          # Documentation
│
├── docker-compose.yml             # Docker services
├── package.json                   # Root package file
├── pnpm-workspace.yaml           # PNPM workspace config
├── .env.example                   # Environment template
└── README.md                      # This file
```

---

## 💻 Development

### Running Services Individually

```bash
# Frontend development
cd apps/web
pnpm dev

# API Gateway
cd apps/api
pnpm dev

# Python services (example: scraper)
cd services/scraper
python -m uvicorn src.main:app --reload --port 5000
```

### Building for Production

```bash
# Build all applications
pnpm build

# Build specific app
pnpm build:web
pnpm build:api
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Linting and Formatting

```bash
# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

---

## 🐳 Docker Setup

### Starting Services

```bash
# Start all infrastructure services
pnpm docker:up

# Start in foreground (see logs)
docker-compose up

# Start specific service
docker-compose up mongodb redis
```

### Stopping Services

```bash
# Stop all services
pnpm docker:down

# Stop and remove volumes (CAUTION: deletes data)
pnpm docker:clean
```

### Viewing Logs

```bash
# All services
pnpm docker:logs

# Specific service
docker-compose logs -f mongodb
```

### Rebuilding Containers

```bash
# Rebuild everything
pnpm docker:rebuild

# Rebuild specific service
docker-compose build scraper
```

---

## 🔐 Environment Variables

The system uses environment variables for configuration. See [`.env.example`](.env.example) for all available options.

### Critical Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/price-comparison` |
| `REDIS_URL` | Redis connection URL | `redis://:password@localhost:6379/0` |
| `MEILISEARCH_HOST` | Meilisearch server URL | `http://localhost:7700` |
| `MEILISEARCH_MASTER_KEY` | Meilisearch master key | `your_master_key_here` |
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://admin:password@localhost:5672` |

### Feature Flags

Enable/disable features during development:

```bash
FEATURE_LOCAL_SHOPPING=true
FEATURE_GLOBAL_SHOPPING=false      # Coming soon
FEATURE_SMART_RECOMMENDATIONS=false # Coming soon
FEATURE_VECTOR_SEARCH=false        # Coming soon
```

---

## 📜 Scripts

### Root Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all services in development mode |
| `pnpm build` | Build all applications |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all code |
| `pnpm format` | Format all code with Prettier |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |
| `pnpm docker:logs` | View Docker logs |
| `pnpm clean` | Clean all build artifacts and dependencies |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Lint your code: `pnpm lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)**: Detailed setup instructions
- **[API Documentation](docs/API.md)**: API endpoints and usage
- **[Architecture](docs/ARCHITECTURE.md)**: System architecture details
- **[CLAUDE.md](2.md)**: Complete technical specification

---

## 🗺️ Roadmap

### Phase 1: Local Shopping Core ✅ (In Progress)
- [x] Project setup
- [ ] Basic local price comparison
- [ ] 5 shops per country (IL, US)
- [ ] Simple search
- [ ] Basic UI

### Phase 2: Smart Recommendations (Weeks 4-6)
- [ ] International price checking
- [ ] Smart deal detection
- [ ] Shipping/duty calculations
- [ ] Alert system

### Phase 3: Global Mode (Weeks 7-9)
- [ ] Global retailer integration
- [ ] Mode switching UI
- [ ] Advanced search
- [ ] Currency handling

### Phase 4: Intelligence & Scale (Weeks 10-12)
- [ ] AI-powered search
- [ ] Price predictions
- [ ] User accounts
- [ ] Performance optimization

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Development Team**: [Your Team]
- **Maintainer**: [Your Name]

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by AI and machine learning
- Designed for global price transparency

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

<div align="center">
  <strong>Happy Shopping! 🛍️</strong>
  <br>
  <sub>Built with ❤️ for smart shoppers worldwide</sub>
</div>
