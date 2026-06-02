# AniSave 2.0 - Sitemap

## Overview

AniSave is a multi-role e-commerce platform connecting buyers with farmers for animal-related products and services. The application supports web (Vite/React) and mobile (Tauri) clients.

---

## Site Structure

### 1. **Entry Point**

- **Landing Page** (`/landing`)
  - Role: Public/Unauthenticated users
  - Features: Product showcase, About/Features info
  - Routing: Auto-redirects to Homepage if authenticated, or Login on Tauri

---

## 2. **Authentication Hub** (Public Routes - No Auth Required)

### Public Routes

- **Landing Page** (`/landing`)
  - Hero section with About/Features
  - Call-to-action for signup/login
  - About/Features Modal

- **Login Page** (`/login`)
  - Email/password authentication
  - Social login options
  - Routes to Homepage on success

- **Sign Up Page** (`/signup`)
  - User registration
  - Role selection (Buyer/Farmer/Admin)
  - Account creation flow

- **Privacy Policy** (`/privacy`)
  - Static legal page
  - Accessible to all users

- **Terms of Service** (`/terms`)
  - Static legal page
  - Accessible to all users

---

## 3. **Authenticated Routes (Protected)**

### Dashboard & Profile Management

- **Homepage** (`/homepage`) ⭐
  - Primary dashboard for authenticated users
  - Displays personalized content based on role
  - Access to all major features

- **User Profile** (`/profile`)
  - View and edit user information
  - Account settings and preferences
  - Role-specific profile customization

---

## 4. **Buyer Portal**

### Product Discovery & Browsing

- **Categories** (`/categories`)
  - Browse all product categories
  - Filtered product listings

- **Category Details** (`/categories/:name`)
  - Products within specific category
  - Advanced filtering and sorting

- **Product Sellers** (`/product/:productName/sellers`)
  - List of sellers for a specific product
  - Seller ratings and reviews
  - Price comparison

- **Farmer Profile** (`/farmer/:id`)
  - Detailed farmer/seller information
  - Product offerings from specific seller
  - Seller ratings and contact options

### Shopping & Checkout

- **Shopping Cart** (`/cart`)
  - View items in cart
  - Modify quantities
  - Proceed to checkout

- **Checkout Flow** (Modal-based)
  - Order confirmation
  - Delivery details
  - Payment processing
  - Transaction confirmation

- **Order Status View**
  - Track active orders and delivery status
  - Order history
  - Order tracking and updates

### Saved Products & Favorites

- **Saved Products**
  - Bookmark favorite products for later
  - Quick access to wishlist
  - One-click re-ordering from saved items

### Communication

- **Messaging Center** (In-app)
  - Chat with farmers/sellers
  - Chat conversations list
  - Real-time messaging
  - Chat UI with conversation history

---

## 5. **Farmer Portal**

### Dashboard & Management

- **Farmer Dashboard**
  - Overview of orders and sales
  - Inventory status
  - Performance metrics

- **Farmer Order Requests** (In Dashboard)
  - Pending orders from buyers
  - Order management interface

### Product Management

- **Add New Product** (Modal)
  - Create new product listings
  - Image upload and compression
  - Pricing and details

- **Edit Product Form** (Modal)
  - Modify existing product information
  - Update inventory levels
  - Adjust pricing

- **Inventory Manager**
  - View all listed products
  - Stock management
  - Product status control

### Analytics & Business Intelligence

- **Sales Analytics**
  - Sales performance metrics
  - Revenue tracking
  - Popular products analysis

- **Request Center**
  - Buyer inquiries and requests
  - Special order management

- **Order Action View** (Order Approval/Rejection)
  - Review incoming buyer orders
  - Approve or reject orders
  - Send notifications to buyers
  - Manage order fulfillment workflow

---

## 6System settings and configuration

- **Global Tracking**
  - Monitor all platform activity
  - User activity tracking
  - Transaction monitoring
  - System health and performance metrics
  - Real-time platform statistics
- **Admin Dashboard** (`/admin`)
  - System-wide analytics
  - User management
  - Price management
  - Global tracking and monitoring
  - System settings and configuration

---System\*\*

- Rate Buyer (Post-transaction)
- Rate Farmer (Post-transaction)
- 5-star rating system

- **Reviews & Feedback**
  - Leave product/seller reviews
  - Written feedback on transactions
  - Review history and management
  - Community feedback visibility

### User Interactions & Feedback

- **Rating & Review System**
  - Rate Buyer (Post-transaction)
  - Rate Farmer (Post-transaction)
  - Review and feedback management

- **Notification Center**
  - Order notifications
  - Message alerts
  - System announcements

### Customer Support

- **Contact/Support Page** (`/contacts`)
  - Support form
  - Contact information
  - FAQs

---

## 8. **Global Features** (Available Across All Authenticated Pages)

### Navigation Components

- **Navbar**
  - User profile access
  - Search functionality
  - Cart button
  - Notification center
  - Messaging access

- **Search & Filters**
  - Global product search
  - Category filters
  - Price range filters
  - Availability filters

### Modals & Overlays

- **About Modal**
  - Company information
  - Features overview

- **Announcement Modal**
  - System announcements
  - Important updates

- **Tutorials & Onboarding**
  - Tutorial overlay for new users
  - Feature walkthroughs
  - UI guidance

### Real-Time Features

- **User Presence**
  - Online status indicators
  - Last seen information

- **Notifications**
  - Real-time order updates
  - Message notifications
  - System alerts

---

## Route Hierarchy Tree

```
/
├── / (Redirect to appropriate page)
├── /landing (Landing Page + About/Features)
│
├── 🔑 Authentication Hub
│   ├── /login (Login Page)
│   ├── /signup (Sign Up Page)
│   ├── /privacy (Privacy Policy)
│   └── /terms (Terms of Service)
│
└── 🔐 Protected Routes (Authentication Required)
    ├── /homepage (Authenticated Dashboard)
    ├── /profile (Profile Settings)
    ├── /admin (Admin Dashboard + Global Tracking)
    │
    ├── Buyer Portal
    │   ├── Product Discovery
    │   │   ├── /categories (Product Directory)
    │   │   ├── /categories/:name (Category Details)
    │   │   ├── /product/:productName/sellers (Product Sellers)
    │   │   └── Search & Filters (Global Feature)
    │   │
    │   ├── Shopping Flow
    │   │   ├── /cart (Shopping Cart)
    │   │   ├── Checkout Flow (Modal)
    │   │   │   ├── Order Confirmation
    │   │   │   ├── Delivery Details
    │   │   │   └── Confirmation
    │   │   │
    │   │   ├── /farmer/:id (Farmer Profile)
    │   │   └── Order Status View
    │   │
    │   ├── Saved Products (Wishlist)
    │   │
    │   └── Messaging Center
    │       └── Chat UI (Real-time messaging)
    │
    ├── Farmer Portal
    │   ├── Farmer Dashboard
    │   │   └── Sales Analytics
    │   │
    │   ├── Inventory Management
    │   │   ├── Add New Resource (Product)
    │   │   ├── Edit Product Form
    │   │   └── Inventory Manager
    │   │
    │   ├── Order Management
    │   │   ├── Request Center
    │   │   └── Order Action View (Approved/Reject)
    │   │
    │   └── Messaging Center
    │       └── Chat UI (Customer communication)
    │
    └── Support & Feedback
        ├── /contacts (Contact/Support)
        ├── Rating System (Post-transaction)
        └── Reviews & Feedback

* (404 - Page Not Found)
```

---

## User Roles & Access Control

### 1. **Unauthenticated Users**

- Access: Landing, Login, Sign Up, Privacy, Terms
- Restriction: Cannot access authenticated routes

### 2. **Authenticated Buyers**

- Access: Homepage, Profile, Categories, Products, Sellers, Cart, Messaging
- Restriction: Cannot access Farmer Dashboard, Admin Dashboard

### 3. **Authenticated Farmers**

- Access: Homepage, Profile, Farmer Dashboard, Inventory, Analytics, Messaging
- Restriction: Cannot access Admin Dashboard

### 4. **Administrators**

- Access: All routes including Admin Dashboard
- Capabilities: System monitoring, user management, price management, global tracking

---

## Context & Data Management

### Global Contexts

- **AuthContext** - User authentication state
- **CartContext** - Shopping cart management
- **NotificationContext** - System notifications
- **MarketPricesContext** - Product price information
- **TutorialContext** - Tutorial state management
- **SupabaseContext** - Database connectivity

### Key Features

- Lazy loading of page components
- Suspense fallback with Loader component
- Protected route wrapper for authentication checks
- Automatic redirects based on user state and role

---

## Deployment Platforms

- **Web**: Vite/React deployed on Vercel
- **Mobile**: Tauri application for iOS/Android
- **Backend**: Supabase with serverless functions

---

## Next Steps & Enhancements

### ✅ Currently Implemented

- [x] Authentication Hub (Login, Sign Up, Landing)
- [x] Product Directory & Categories
- [x] Shopping Cart
- [x] Messaging Center
- [x] Farmer Dashboard
- [x] Inventory Manager
- [x] Admin Dashboard
- [x] Rating System (Post-transaction)

### 🚧 In Progress

- [ ] Global Tracking enhancements for admin
- [ ] Order Status View for buyers

### 📋 To Be Implemented

- [ ] **Saved Products/Wishlist** - Allow buyers to bookmark products
- [ ] **Reviews & Feedback** - Separate detailed review system from ratings
- [ ] **Order Action View** - Farmer interface to approve/reject orders
- [ ] **Order Tracking** - Real-time delivery and order status updates
- [ ] **Enhanced Global Tracking** - Admin analytics for platform activity
- [ ] Breadcrumb navigation
- [ ] 404 error page customization
- [ ] Product review/rating system refinements
- [ ] Order fulfillment workflow optimization
