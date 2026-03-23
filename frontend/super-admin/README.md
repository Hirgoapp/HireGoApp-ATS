# ATS Super Admin UI

A dedicated administrative interface for managing the ATS SaaS platform at the super-admin level.

## 🎯 Purpose

This UI is **isolated from the backend** to protect sensitive operations and provide a dedicated interface for:
- Managing tenant companies
- Monitoring system health
- Configuring platform settings
- Viewing system-wide analytics
- Managing super-admin users

## 🏗️ Architecture

```
/frontend/super-admin/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── stores/         # Zustand state management
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
└── vite.config.ts      # Vite configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

```bash
cd frontend/super-admin
npm install
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:5174

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## 🔐 Security Features

### Isolation
- **Separate codebase** from main tenant UI
- **Separate port** (5174) for development
- **Separate build** for production deployment
- **No shared state** with tenant applications

### Authentication
- JWT-based authentication
- Token stored in localStorage with persistence
- Automatic token refresh
- 401 handling with auto-logout

### Authorization
- Super-admin role required
- Protected routes
- API request interception

## 📦 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🎨 Features

### Dashboard
- System overview metrics
- Recent activity feed
- Key performance indicators
- Health status monitoring

### Company Management
- List all tenant companies
- View company details
- Add/edit/deactivate companies
- Monitor company usage

### User Management
- View platform users
- Manage super-admin users
- Role assignments
- Activity logs

### System Settings
- Platform configuration
- Feature flags
- Email templates
- System maintenance

## 🔌 API Integration

### Base URL
```typescript
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Authentication
All API requests include the JWT token in the Authorization header:
```typescript
Authorization: Bearer <token>
```

### Error Handling
- 401 → Auto-logout and redirect to login
- 403 → Permission denied message
- 500 → System error notification

## 🧪 Development

### Environment Variables
Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=ATS Super Admin
VITE_APP_VERSION=1.0.0
```

### Code Structure

**Components**: Reusable UI elements
```typescript
src/components/Layout.tsx
src/components/Header.tsx
```

**Pages**: Route-level components
```typescript
src/pages/Dashboard.tsx
src/pages/Companies.tsx
```

**Stores**: State management with Zustand
```typescript
src/stores/authStore.ts
src/stores/companyStore.ts
```

**Services**: API client and helpers
```typescript
src/services/apiClient.ts
src/services/companyService.ts
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler checks

## 🚢 Deployment

### Option 1: Static Hosting (Recommended)
1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Azure Static Web Apps
   - Google Cloud Storage

### Option 2: Docker
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables for Production
Set these in your hosting platform:
```
VITE_API_BASE_URL=https://api.yourplatform.com/api/v1
VITE_APP_NAME=ATS Super Admin
VITE_APP_VERSION=1.0.0
```

## 🔒 Security Considerations

### Backend Protection
1. **Separate deployment** - Deploy super-admin UI to different subdomain
2. **IP whitelisting** - Restrict access to super-admin endpoints
3. **Rate limiting** - Protect against brute force attacks
4. **Audit logging** - Track all super-admin actions

### Frontend Security
1. **No sensitive data** - Don't store secrets in frontend code
2. **HTTPS only** - Enforce secure connections
3. **CSP headers** - Configure Content Security Policy
4. **CORS policies** - Strict CORS configuration

### Recommended Backend Endpoints
```
/api/v1/super-admin/companies
/api/v1/super-admin/users
/api/v1/super-admin/system
/api/v1/super-admin/analytics
```

All super-admin endpoints should:
- Require super-admin role
- Log all actions
- Rate limit aggressively
- Validate all inputs

## 📊 Monitoring

### Metrics to Track
- Login attempts
- API response times
- Error rates
- User activity
- System health

### Logging
```typescript
// Example: Log super-admin actions
console.log('[SUPER-ADMIN]', {
  action: 'company.create',
  user: user.email,
  timestamp: new Date(),
  metadata: { companyName }
});
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

Proprietary - Internal use only

---

## 🆘 Troubleshooting

### Port already in use
```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 5175
```

### API connection issues
```bash
# Check backend is running:
curl http://localhost:3000/api/v1/health

# Check CORS settings in backend
```

### Build errors
```bash
# Clear cache and reinstall:
rm -rf node_modules dist
npm install
npm run build
```

---

**For support**: Contact platform administrators
**Version**: 1.0.0
**Last Updated**: January 2026
