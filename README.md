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

### Environment Variables

The application uses environment variables for configuration. These are set up in the following files:

- `.env.development` - Development environment settings
- `.env.production` - Production environment settings
- `.env.local` - Local overrides (not committed to git)

To configure your local environment:

1. Copy the template file to create your local configuration:
   ```bash
   cp .env.local.template .env.local
   ```

2. Edit `.env.local` to set your own configuration values.

Available environment variables:

```
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=https://carriers-id.t1.com
NEXT_PUBLIC_KEYCLOAK_REALM=incidencias
NEXT_PUBLIC_KEYCLOAK_ADMIN_REALM=master
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=back-service-incidents
NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET=your-client-secret

# API URL
NEXT_PUBLIC_API_URL=https://apiv2.t1envios.com
```

For development environments, the default values are:
- Keycloak URL: https://incidencias-kc.dev.t1envios.com
- API URL: https://apiv2.dev.t1envios.com

For production environments, the default values are:
- Keycloak URL: https://carriers-id.t1.com
- API URL: https://apiv2.t1envios.com

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
