# FERMs - Farm Equipment Rental Management System

## System Overview

FERMs is a comprehensive farm equipment rental platform built with Laravel (backend) and React (frontend). The system connects equipment owners with renters in Oriental Mindoro, facilitating equipment rental transactions with automated calculations, payment processing, and administrative oversight.

## Architecture

### Technology Stack
- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 with Vite
- **Database**: MySQL
- **Authentication**: Laravel Sanctum (API tokens)
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API

### Project Structure
```
capstone-main/
├── capstone_backend/          # Laravel API backend
│   ├── app/
│   │   ├── Models/           # Eloquent models
│   │   ├── Http/Controllers/Api/  # API controllers
│   │   ├── Http/Middleware/  # Custom middleware
│   │   └── Mail/             # Email templates
│   ├── database/migrations/  # Database schema
│   └── routes/api.php        # API routes
│
└── frontend_capstone/        # React SPA frontend
    └── src/
        ├── components/       # Reusable UI components
        ├── contexts/         # React contexts (Auth, Theme)
        ├── pages/           # Page components by role
        │   ├── admin/
        │   ├── owner/
        │   └── renter/
        └── lib/api.js       # Axios configuration
```

## User Roles & Permissions

### 1. Renter
**Capabilities:**
- Browse available equipment
- Submit rental requests with auto-calculated costs
- View rental history and status
- Send messages/inquiries to admin
- Manage account settings
- View personalized dashboard with spending analytics

**Key Features:**
- Farm size-based rental calculation (sqm → hours → days → cost)
- Payment proof upload (GCash)
- Real-time rental status tracking
- Equipment filtering by location and category

### 2. Owner
**Capabilities:**
- List equipment for rent (pending admin approval)
- Manage equipment inventory (CRUD operations)
- Set equipment status (available/maintenance)
- View and approve/reject rental requests
- Configure GCash payment settings
- Track revenue and rental statistics

**Key Features:**
- Equipment approval workflow (pending → approved/rejected)
- Automatic revenue calculations
- Equipment status management
- GCash QR code integration

### 3. Admin
**Capabilities:**
- Approve/reject equipment listings
- Manage user accounts (approve/reject registrations)
- View system-wide analytics and reports
- Handle message requests
- Configure SMTP settings
- Export revenue reports (CSV)
- Manage archived data

**Key Features:**
- Comprehensive dashboard with system metrics
- Equipment approval with custom fees
- User account verification workflow
- Revenue reporting and analytics
- System-wide data management

## Core Business Logic

### Equipment Rental Flow

1. **Equipment Listing** (Owner)
   - Owner submits equipment → Status: "pending"
   - Admin reviews → Approves with fee OR Rejects
   - Approved equipment → Status: "available"

2. **Rental Request** (Renter)
   - Renter browses available equipment
   - Inputs farm size (sqm) and start date
   - System auto-calculates:
     - Estimated hours (based on equipment category coverage rate)
     - Rental days (hours ÷ 8 working hours/day)
     - Base cost (daily_rate × rental_days)
     - Delivery fee (equipment.transportation_fee)
     - Service charge (5% of base cost)
     - Total cost (base + delivery + service)
   - Request created → Status: "forwarded"

3. **Request Approval** (Owner)
   - Owner reviews forwarded requests
   - Approves → Equipment status: "rented"
   - Rejects → Request status: "rejected"

4. **Completion** (Owner)
   - Owner marks equipment as "available" when rental ends

### Coverage Rates (sqm/hour)
```php
'tractor'    => 2000 sqm/hr
'harvester'  => 1500 sqm/hr
'planter'    => 1200 sqm/hr
'irrigation' => 2500 sqm/hr
'cultivator' => 1000 sqm/hr
'sprayer'    => 3000 sqm/hr
'trailer'    => 5000 sqm/hr
'other'      => 1500 sqm/hr
```

### Account Registration Flow

1. User registers → Status: "pending"
2. System sends email verification code
3. User verifies email → Status: "email_verified"
4. Admin reviews account → Approves OR Rejects
5. Approved → Status: "approved" (can login)
6. Rejected → Status: "rejected" (cannot login)

**Note**: Admin accounts bypass verification and approval.

## Database Schema

### Key Tables

**users**
- id, name, email, password, role (renter/owner/admin)
- account_status (pending/email_verified/approved/rejected)
- email_verification_code, email_code_expires_at
- points (for future points system)
- archived_at (soft delete)

**equipment**
- id, owner_id, name, category, description
- daily_rate, transportation_fee, location, image
- status (pending/available/rented/maintenance/rejected)
- approval_fee, approved_at, archived_at

**rental_requests**
- id, renter_id, equipment_id
- farm_size_sqm, estimated_hours, rental_days
- start_date, end_date, delivery_address, lat/lng
- base_cost, delivery_fee, service_charge, total_cost
- status (forwarded/approved/rejected)
- payment_method, payment_proof, archived_at

**gcash_settings**
- id, owner_id, account_name, account_number
- qr_code_image

**message_requests**
- id, renter_id, subject, message
- status (pending/in_progress/resolved)

**smtp_settings**
- id, mail_host, mail_port, mail_username, mail_password
- mail_encryption, mail_from_address, mail_from_name

## API Endpoints

### Public Routes
- POST /api/register
- POST /api/login
- POST /api/verify-email
- POST /api/resend-verification

### Authenticated Routes
- POST /api/logout
- GET /api/user
- PUT /api/profile
- PUT /api/password
- GET /api/dashboard (role-aware)

### Renter Routes (/api/renter/*)
- GET /rental-requests (my requests)
- POST /rental-requests (create)
- GET /messages (my messages)
- POST /messages (send inquiry)
- GET /archived/* (archived data)

### Owner Routes (/api/owner/*)
- GET /equipment (my equipment)
- POST /equipment (create)
- PUT /equipment/{id} (update)
- DELETE /equipment/{id} (delete)
- PATCH /equipment/{id}/set-maintenance
- PATCH /equipment/{id}/set-available
- GET /rental-requests (for my equipment)
- PATCH /rental-requests/{id}/approve
- PATCH /rental-requests/{id}/reject
- GET|POST /gcash-settings

### Admin Routes (/api/admin/*)
- GET /equipment/pending (pending approvals)
- GET /equipment/all (all equipment)
- PATCH /equipment/{id}/approve
- PATCH /equipment/{id}/reject
- GET /rental-requests (all)
- GET /messages (all)
- PATCH /messages/{id}/status
- GET /owners (all owners)
- GET /owners/{id} (owner details)
- PATCH /owners/{id}/archive
- GET /accounts (pending accounts)
- PATCH /accounts/{id}/approve
- PATCH /accounts/{id}/reject
- GET /reports/revenue
- GET /reports/revenue/csv
- GET|POST /smtp-settings

## Frontend Features

### Dashboard Analytics
Each role has a customized dashboard with:
- **Period filters**: Today, Weekly, Monthly, Yearly
- **Charts**: Rental trends, revenue/spending, category distribution
- **Metrics**: Role-specific KPIs
- **Recent activity**: Latest transactions

### UI Components
- DataTable with pagination and sorting
- StatusBadge for visual status indicators
- Toast notifications for user feedback
- Modal dialogs for forms and confirmations
- Skeleton loaders for better UX
- Responsive navigation with role-based menu

### State Management
- AuthContext: User authentication and session
- ThemeContext: Dark/light mode toggle
- API interceptors: Auto-attach tokens, handle 401 errors

## Payment Integration

### GCash Payment Flow
1. Owner configures GCash settings (account name, number, QR code)
2. Renter views owner's GCash info when making rental request
3. Renter uploads payment proof (screenshot)
4. Owner reviews proof and approves/rejects request

## Email System

### Dynamic Mailer
- Configurable SMTP settings (admin panel)
- Email templates:
  - Email verification code
  - Account approved notification
  - Account rejected notification
- Test email functionality

## Security Features

- **Authentication**: Laravel Sanctum API tokens
- **Authorization**: Role-based middleware
- **CORS**: Configured for localhost:5173 (Vite dev server)
- **Password**: Bcrypt hashing
- **2FA**: Two-factor authentication support (Laravel Fortify)
- **CSRF**: Protection for stateful requests
- **Input Validation**: Form request classes

## Development Setup

### Backend
```bash
cd capstone_backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh
php artisan db:seed --class=TestUserSeeder
php artisan serve
```

### Frontend
```bash
cd frontend_capstone
npm install
npm run dev
```

### Test Accounts
- Admin: admin@test.com / password
- Owner: owner@test.com / password
- Renter: renter@test.com / password

## Key Business Rules

1. **Equipment Availability**: Only "available" equipment can be rented
2. **Rental Calculation**: Automatic based on farm size and equipment category
3. **Service Charge**: 5% of base rental cost
4. **Minimum Rental**: 1 day (8 working hours)
5. **Equipment Status**: Cannot be deleted if rented
6. **Account Approval**: Required for renters and owners (not admin)
7. **Email Verification**: Required before admin approval
8. **Archived Data**: Soft deletes with restore capability

## Future Enhancements

- Points system for renters (loyalty rewards)
- Real-time notifications (WebSockets)
- Mobile app (React Native)
- Advanced analytics and reporting
- Equipment maintenance scheduling
- Multi-language support
- Payment gateway integration (beyond GCash)
- Equipment availability calendar
- Automated reminders and notifications

## System Status

✅ Database migrations complete
✅ Authentication system functional
✅ Role-based access control implemented
✅ Equipment management operational
✅ Rental request workflow active
✅ Dashboard analytics working
✅ Email system configured
✅ Payment proof upload functional
✅ Archive system implemented

## Known Issues

- Login endpoint returning 500 error (needs investigation)
- SMTP settings may need configuration for production
- Image uploads require storage link configuration
- CSV export needs testing with large datasets

## Maintenance Notes

- Regular database backups recommended
- Monitor storage for uploaded images
- Review and archive old rental requests periodically
- Update coverage rates based on real-world data
- Test email delivery in production environment
