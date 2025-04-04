# Incidents Management System

A Next.js application for tracking and managing shipping incidents across different courier companies.

## Project Overview

- **Purpose**: Track and manage shipping incidents for courier companies
- **Features**: Dashboard, incident management, user management
- **Tech Stack**: Next.js, React, TypeScript, TailwindCSS

## Requirements

- Node.js 18.x or higher
- npm 9.x or higher

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd incidents

# Install dependencies
npm install
```

## Configuration

### API Configuration

The application uses a proxy to communicate with the backend API. Configure the API endpoint in:
`src/app/api/proxy/[...path]/route.ts`

```typescript
// Update this URL to point to your backend API
// Development environment
const API_BASE_URL = 'https://apiv2.dev.t1envios.com';

// Production environment
// const API_BASE_URL = 'https://apiv2.t1envios.com';
```

## Development

```bash
# Run development server
npm run dev
```

The application will be available at http://localhost:3000

## Production Deployment

### Build the Application

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Server Setup (Nginx Example)

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create Nginx configuration:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

3. Process Management (PM2):
   ```bash
   # Install PM2
   npm install -g pm2

   # Start the application
   pm2 start npm --name "incidents" -- start

   # Ensure PM2 starts on boot
   pm2 startup
   pm2 save
   ```

## Authentication

The application uses JWT for authentication. Users need to log in to access the system.

## Project Structure

- `/src/app` - Next.js pages and API routes
- `/src/components` - React components
- `/src/lib` - Utility functions and API clients
- `/src/types` - TypeScript type definitions
- `/src/styles` - CSS and styling files

## Troubleshooting

- **API Connection Issues**: Verify the API_BASE_URL in the proxy configuration
- **Authentication Errors**: Check that the JWT token is being properly passed in requests
- **Build Errors**: Ensure Node.js and npm versions meet requirements
