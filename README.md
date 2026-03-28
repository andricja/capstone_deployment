# FERMs - Farm Equipment Rental Management System

A comprehensive web-based platform for managing farm equipment rentals in Oriental Mindoro, Philippines.

## 🌾 Features

- **Equipment Management**: Owners can list and manage their farm equipment
- **Rental System**: Renters can browse, request, and rent equipment
- **Location-Based Pricing**: Automatic transportation fee calculation based on distance
- **Payment Integration**: GCash payment proof upload system
- **Email Notifications**: Automated email alerts for rental status updates
- **Admin Dashboard**: Complete oversight of users, equipment, and rentals
- **Advertisement System**: Promotional ads management
- **Auto-Reject System**: Automatic rejection of expired rental requests

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Laravel 11 + PHP 8.2
- **Database**: MySQL 8.0
- **Maps**: Leaflet + OpenStreetMap
- **Authentication**: Laravel Sanctum
- **Email**: SMTP (Gmail supported)

## 📦 Project Structure

```
ferms/
├── capstone_backend/          # Laravel backend API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Data/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
├── frontend_capstone/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── App.jsx
│   └── public/
│
└── .github/
    └── workflows/
        └── deploy.yml         # Auto-deployment workflow
```

## 🔧 Local Development Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+

### Backend Setup
```bash
cd capstone_backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend Setup
```bash
cd frontend_capstone
npm install
npm run dev
```

## 🌐 Deployment

This project uses GitHub Actions for automatic deployment to production.

### Initial Setup
1. Follow the complete guide in `DEPLOY_STEPS.txt`
2. Configure GitHub Secrets (SSH credentials)
3. Push to GitHub

### Auto-Deployment
Every push to `master` branch automatically:
- Pulls latest code to server
- Installs dependencies
- Runs migrations
- Builds frontend
- Clears caches
- Sets permissions

See `.github/workflows/deploy.yml` for deployment workflow.

## 📝 Environment Variables

### Backend (.env)
```env
APP_URL=https://ferms.net
DB_DATABASE=ferms_db
DB_USERNAME=ferms_user
DB_PASSWORD=your_password
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Frontend (.env.production)
```env
VITE_API_URL=https://ferms.net/api
VITE_BASE_URL=https://ferms.net
```

## 👥 User Roles

1. **Admin**: Full system access, user management, equipment approval
2. **Owner**: Equipment listing, rental request management, GCash settings
3. **Renter**: Browse equipment, submit rental requests, payment proof upload

## 🗺️ Coverage Area

Oriental Mindoro, Philippines
- All municipalities supported
- Barangay-level location selection
- Automatic distance calculation for transportation fees

## 📧 Email Configuration

Supports Gmail SMTP:
1. Enable 2-Factor Authentication
2. Generate App Password
3. Configure in Admin → Settings → SMTP Settings

## 🔐 Security Features

- Laravel Sanctum authentication
- CSRF protection
- SQL injection prevention
- XSS protection
- Password hashing (bcrypt)
- Role-based access control

## 📱 Responsive Design

Fully responsive interface supporting:
- Desktop
- Tablet
- Mobile devices

## 🛠️ Maintenance

### Database Backup
```bash
mysqldump -u ferms_user -p ferms_db > backup.sql
```

### Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Update Dependencies
```bash
composer update
npm update
```

## 📄 License

Proprietary - All rights reserved

## 👨‍💻 Development Team

Capstone Project - Farm Equipment Rental Management System

## 🌐 Live Site

https://ferms.net

## 📞 Support

For issues or questions, contact the system administrator.

---

**Last Updated**: March 2026
