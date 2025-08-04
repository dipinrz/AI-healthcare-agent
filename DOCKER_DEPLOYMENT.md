# Docker Deployment Guide

## 🐳 Quick Start

### Prerequisites
- Docker installed on your system
- Docker Compose installed

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your actual values
nano .env
```

### 2. Build and Run
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Docker Files Created

### Backend Files
- `backend/Dockerfile` - Backend container configuration
- `backend/.dockerignore` - Files to exclude from Docker build

### Frontend Files  
- `frontend/Dockerfile` - Frontend container configuration
- `frontend/.dockerignore` - Files to exclude from Docker build
- `frontend/nginx.conf` - Nginx configuration for serving frontend

### Root Files
- `docker-compose.yml` - Multi-service orchestration
- `.env.example` - Environment variables template

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database (use your Neon database URL)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Security
JWT_SECRET=your-super-secret-jwt-key

# Application
NODE_ENV=production
PORT=3001
```

### Database Options
1. **Use your existing Neon database** (recommended)
   - Set `DATABASE_URL` to your Neon connection string
   - Remove or comment out the `db` service in docker-compose.yml

2. **Use containerized PostgreSQL**
   - Keep the `db` service in docker-compose.yml
   - Set `POSTGRES_*` environment variables

## 🚀 Deployment Options

### Option 1: Backend Only
```bash
# Build and run just the backend
cd backend
docker build -t ai-healthcare-backend .
docker run -p 3001:3001 --env-file ../.env ai-healthcare-backend
```

### Option 2: Full Stack with Docker Compose
```bash
# Run everything (backend + frontend + optional database)
docker-compose up --build -d
```

### Option 3: Production Deployment
```bash
# For production, use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🌐 Access Points

After running `docker-compose up`:
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432 (if using containerized PostgreSQL)

## 🔍 Monitoring

### Check Status
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Execute commands in container
docker-compose exec backend npm run build
```

### Health Checks
- Backend includes health check endpoint
- Containers will restart automatically if unhealthy

## 🛠 Development vs Production

### Development
- Uses `docker-compose up` with development settings
- Enables database synchronization
- Includes logging and debugging

### Production
- Set `NODE_ENV=production`
- Disable database synchronization
- Use SSL for database connections
- Optimize container sizes

## 📦 Container Details

### Backend Container
- **Base**: Node.js 18 Alpine
- **Port**: 3001
- **Features**: TypeScript build, security user, health checks

### Frontend Container
- **Base**: Nginx Alpine (multi-stage build)
- **Port**: 80
- **Features**: Optimized static serving, gzip compression

### Database Container (optional)
- **Base**: PostgreSQL 15 Alpine
- **Port**: 5432
- **Features**: Persistent volume, initialization scripts

## 🔒 Security Features

- Non-root users in containers
- Security headers in Nginx
- SSL database connections
- Environment variable isolation

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in docker-compose.yml
2. **Database connection**: Verify DATABASE_URL format
3. **Build failures**: Check .dockerignore files
4. **Permission issues**: Ensure Docker daemon is running

### Debug Commands
```bash
# Rebuild without cache
docker-compose build --no-cache

# View container logs
docker-compose logs -f backend

# Shell into container
docker-compose exec backend sh
```

## 📋 Deployment Checklist

- [ ] Copy and configure `.env` file
- [ ] Update database URL
- [ ] Set strong JWT secret
- [ ] Build and test locally
- [ ] Push to production registry
- [ ] Deploy to production environment
- [ ] Verify health checks pass
- [ ] Test API endpoints
- [ ] Test frontend functionality

## 🌟 Next Steps

1. **Container Registry**: Push images to Docker Hub/AWS ECR
2. **Orchestration**: Deploy to Kubernetes/AWS ECS
3. **CI/CD**: Set up automated deployments
4. **Monitoring**: Add logging and metrics
5. **Scaling**: Configure load balancing

Your Docker setup is now ready for deployment! 🎉