# Prey Lang Coffee — POS System Documentation
**Version:** 1.0  
**Date:** February 2026  
**Stack:** React JS · Laravel REST API · MySQL · Redis · Laravel Sanctum

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Objectives](#3-system-objectives)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Sidebar Navigation by Role](#5-sidebar-navigation-by-role)
6. [Database Design](#6-database-design)
7. [API Routes](#7-api-routes)
8. [Module Breakdown](#8-module-breakdown)
   - 8.1 [Authentication Module](#81-authentication-module)
   - 8.2 [Table & QR Code Module](#82-table--qr-code-module)
   - 8.3 [Product & Category Module](#83-product--category-module)
   - 8.4 [Customer Ordering Module (Public)](#84-customer-ordering-module-public)
   - 8.5 [Real-Time Cashier Dashboard](#85-real-time-cashier-dashboard)
   - 8.6 [Recipe & Inventory Module](#86-recipe--inventory-module)
   - 8.7 [Finance & Budget Module](#87-finance--budget-module)
   - 8.8 [Analytics & Reports Module](#88-analytics--reports-module)
   - 8.9 [Network Restriction Module](#89-network-restriction-module)
9. [Order Status Flow](#9-order-status-flow)
10. [Payment Flow](#10-payment-flow)
11. [QR Code Flow](#11-qr-code-flow)
12. [Real-Time Flow (Redis)](#12-real-time-flow-redis)
13. [Frontend Route Structure](#13-frontend-route-structure)
14. [Development Priority Order](#14-development-priority-order)
15. [Security Requirements](#15-security-requirements)
16. [Non-Functional Requirements](#16-non-functional-requirements)

---

## 1. Project Overview

**Prey Lang Coffee POS System** is a web-based Point-of-Sale platform designed specifically for coffee shops. It allows customers to scan a QR code at their table to instantly access the menu and place orders — without any login or app download required.

Orders are sent directly to the cashier/barista dashboard in real time. The system also provides the owner with full control over products, recipes, stock, expenses, and business analytics.

The system operates **only inside the café's local WiFi network**, preventing anyone from accessing or ordering from outside the shop.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React JS | Customer menu, staff dashboard, admin panel |
| Backend | Laravel REST API | Business logic, data processing, broadcasting |
| Database | MySQL | Permanent data storage |
| Real-Time / Cache | Redis | Live order updates, pub/sub events |
| Authentication | Laravel Sanctum | Staff & admin login with token-based auth |
| Network Restriction | Local WiFi Filtering | Block outside access, IP range validation |
| Payment QR | KHQR / Static | Cambodia QR payment standard |
| QR Generation | qrcode.react (npm) | Generate table QR codes in browser |

---

## 3. System Objectives

- Speed up the customer ordering process
- Reduce cashier workload through automation
- Provide real-time order monitoring for staff
- Track shop income and expenses for the owner
- Manage drink recipes and ingredient stock automatically
- Provide business analytics and sales insights
- Restrict system access to inside the café only

---

## 4. User Roles & Permissions

The system has three distinct roles. Each role has a separate login (except Customer who has no login at all).

### Role 1 — Customer (No Login Required)

The customer never creates an account. Their identity within the system is tied entirely to the table token in the QR URL. Once they close the browser, the session is gone.

| Action | Allowed |
|---|---|
| Scan QR code to access menu | ✅ |
| Browse products by category | ✅ |
| Add items to cart | ✅ |
| Choose item size | ✅ |
| Place order | ✅ |
| Choose payment method (Cash or KHQR) | ✅ |
| View live order status | ✅ |
| Access admin or staff pages | ❌ |
| See other tables' orders | ❌ |

### Role 2 — Staff (Cashier / Barista)

Staff logs in with an account created by admin. They only see what they need to operate the daily orders. They cannot access any financial, inventory, or analytics data.

| Action | Allowed |
|---|---|
| View live incoming orders | ✅ |
| Update order status (Pending → Preparing → Ready) | ✅ |
| Confirm payment received | ✅ |
| View order history | ✅ |
| Manage products or menu | ❌ |
| View stock or recipes | ❌ |
| View financial reports | ❌ |
| View analytics | ❌ |
| Manage tables or QR codes | ❌ |
| Create other staff accounts | ❌ |

### Role 3 — Admin (Owner / Manager)

Admin has full access to everything in the system. They set up and maintain the entire operation.

| Action | Allowed |
|---|---|
| All staff actions | ✅ |
| Create / edit / delete products | ✅ |
| Manage categories | ✅ |
| Create tables and generate QR codes | ✅ |
| Define drink recipes | ✅ |
| Manage ingredient stock | ✅ |
| Record stock purchases | ✅ |
| Record expenses | ✅ |
| View financial reports | ✅ |
| View analytics and insights | ✅ |
| Create and manage staff accounts | ✅ |
| Change system settings | ✅ |

---

## 5. Sidebar Navigation by Role

### Admin Sidebar (Full Access)

```
PREY LANG COFFEE
👤 Admin Name
─────────────────────
📊  Dashboard

── ORDERS ───────────
📋  Live Orders
📜  Order History

── MENU MANAGEMENT ──
🍹  Products
📁  Categories

── TABLES ───────────
🪑  Table Management     ← create tables + view/print QR codes

── STOCK & RECIPE ───
🧪  Recipes
📦  Ingredients / Stock
🛒  Purchase Stock

── FINANCE ──────────
💰  Income & Expenses
📈  Profit Report

── ANALYTICS ────────
📉  Sales Analytics
🏆  Top Products
⏰  Peak Hours

── SYSTEM ───────────
👥  Staff Accounts
⚙️   Settings
─────────────────────
🚪  Logout
```

### Staff Sidebar (Operational Only)

```
PREY LANG COFFEE
👤 Staff Name
─────────────────────
📊  Dashboard

── ORDERS ───────────
📋  Live Orders  🔴
📜  Order History
─────────────────────
🚪  Logout
```

### Sidebar Permission Table

| Sidebar Item | Admin | Staff | Reason Hidden from Staff |
|---|---|---|---|
| Dashboard | ✅ | ✅ | — |
| Live Orders | ✅ | ✅ | — |
| Order History | ✅ | ✅ | — |
| Products | ✅ | ❌ | Menu management is admin only |
| Categories | ✅ | ❌ | Menu management is admin only |
| Table Management | ✅ | ❌ | Table setup is admin only |
| Recipes | ✅ | ❌ | Recipe data is sensitive |
| Ingredients / Stock | ✅ | ❌ | Stock is financial data |
| Purchase Stock | ✅ | ❌ | Purchasing is admin only |
| Income & Expenses | ✅ | ❌ | Financial data is admin only |
| Profit Report | ✅ | ❌ | Financial data is admin only |
| Sales Analytics | ✅ | ❌ | Business data is admin only |
| Top Products | ✅ | ❌ | Business data is admin only |
| Peak Hours | ✅ | ❌ | Business data is admin only |
| Staff Accounts | ✅ | ❌ | User management is admin only |
| Settings | ✅ | ❌ | System config is admin only |
| Logout | ✅ | ✅ | — |

---

## 6. Database Design

### tables

Stores each physical table in the restaurant. The `token` is the unique key used in the QR code URL.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| name | VARCHAR(50) | Display name e.g. "Table 1", "VIP Room" |
| token | VARCHAR(100), UNIQUE | Auto-generated random string for QR URL |
| capacity | INT | How many seats at this table |
| status | ENUM | available / occupied / reserved |
| is_active | BOOLEAN | If false, QR returns error |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

### categories

Simple list of drink categories for grouping the menu.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| name | VARCHAR(100) | e.g. Coffee, Milk Tea, Smoothie |
| is_active | BOOLEAN | Show or hide category on menu |

### products

All menu items. Prices are split by size. `is_available` controls visibility on the customer menu without deleting the product.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| category_id | INT, FK | Links to categories |
| name | VARCHAR(100) | Product name e.g. "Latte" |
| price_small | DECIMAL(10,2) | Price for small size |
| price_medium | DECIMAL(10,2) | Price for medium size |
| price_large | DECIMAL(10,2) | Price for large size |
| image | VARCHAR(255) | Image file path |
| is_available | BOOLEAN | If false, hidden from customer menu |
| created_at | TIMESTAMP | — |

### orders

Each order belongs to a table. Stores the total, status, and payment method chosen by the customer.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| table_id | INT, FK | Which table placed this order |
| status | ENUM | pending / preparing / ready / completed / cancelled |
| total_price | DECIMAL(10,2) | Total amount |
| payment_type | ENUM | cash / khqr |
| queue_number | INT | Display number for cashier queue |
| created_at | TIMESTAMP | Used for analytics and reporting |
| updated_at | TIMESTAMP | Tracks when status changed |

### order_items

The individual line items inside each order.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| order_id | INT, FK | Links to orders |
| product_id | INT, FK | Links to products |
| size | ENUM | small / medium / large |
| qty | INT | Quantity ordered |
| price | DECIMAL(10,2) | Price at time of order (snapshot) |

### ingredients

Raw ingredients tracked in stock. `stock_qty` is automatically reduced when orders are completed.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| name | VARCHAR(100) | e.g. "Coffee Beans", "Whole Milk" |
| unit | VARCHAR(20) | g / ml / pcs |
| stock_qty | DECIMAL(10,2) | Current stock level |
| min_stock | DECIMAL(10,2) | Threshold for low stock alert |

### recipes

Links a product to its required ingredients with amounts. Each row is one ingredient in one product's recipe.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| product_id | INT, FK | Links to products |
| ingredient_id | INT, FK | Links to ingredients |
| amount_small | DECIMAL(10,2) | Amount needed for small size |
| amount_medium | DECIMAL(10,2) | Amount needed for medium size |
| amount_large | DECIMAL(10,2) | Amount needed for large size |

### expenses

Records all shop expenses for finance tracking.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| title | VARCHAR(100) | e.g. "Milk Restock", "Electricity Bill" |
| amount | DECIMAL(10,2) | Expense amount |
| category | VARCHAR(50) | ingredients / utilities / salary / rent / other |
| date | DATE | When expense occurred |
| note | TEXT | Optional description |

### purchases

Records when admin buys more stock (restocking ingredients).

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| ingredient_id | INT, FK | Which ingredient was purchased |
| qty | DECIMAL(10,2) | Amount purchased |
| cost | DECIMAL(10,2) | Total cost of purchase |
| date | DATE | Purchase date |
| note | TEXT | Supplier or other notes |

### users

Admin and staff accounts for system login.

| Column | Type | Description |
|---|---|---|
| id | INT, PK, AUTO | Primary key |
| name | VARCHAR(100) | Display name |
| email | VARCHAR(150), UNIQUE | Login email |
| password | VARCHAR(255) | Hashed password |
| role | ENUM | admin / staff |
| is_active | BOOLEAN | Enable or disable account |
| created_at | TIMESTAMP | — |

---

## 7. API Routes

### Public Routes (No Authentication — Customer Access)

```
GET    /api/menu/table/{token}        Verify QR token, return table info
GET    /api/menu/products             Return all available products grouped by category
POST   /api/orders                    Customer places an order
GET    /api/orders/{id}/status        Customer checks their order status (polling or websocket)
```

### Protected Routes — Staff (auth:sanctum + role:staff)

```
GET    /api/cashier/orders            Get all active orders for cashier dashboard
PATCH  /api/orders/{id}/status        Update order status (preparing, ready)
PATCH  /api/orders/{id}/payment       Confirm payment received → mark completed
GET    /api/orders/history            View completed orders
```

### Protected Routes — Admin (auth:sanctum + role:admin)

```
-- Products --
GET    /api/products                  List all products
POST   /api/products                  Create product
PUT    /api/products/{id}             Update product
DELETE /api/products/{id}             Delete product
PATCH  /api/products/{id}/toggle      Toggle is_available

-- Categories --
GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

-- Tables --
GET    /api/tables                    List all tables with tokens
POST   /api/tables                    Create table (auto-generates token)
DELETE /api/tables/{id}
POST   /api/tables/{id}/regenerate    Generate new token (old QR stops working)
PATCH  /api/tables/{id}/toggle        Enable or disable table

-- Recipes --
GET    /api/recipes
POST   /api/recipes
PUT    /api/recipes/{id}
DELETE /api/recipes/{id}

-- Ingredients / Stock --
GET    /api/ingredients
POST   /api/ingredients
PUT    /api/ingredients/{id}
DELETE /api/ingredients/{id}

-- Purchases --
GET    /api/purchases
POST   /api/purchases

-- Finance --
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}
GET    /api/finance/summary           Daily / monthly income, expense, profit

-- Analytics --
GET    /api/analytics/sales           Revenue over time
GET    /api/analytics/top-products    Best selling items
GET    /api/analytics/peak-hours      Busiest time analysis
GET    /api/analytics/staff           Staff order processing stats

-- Staff Accounts --
GET    /api/staff
POST   /api/staff
PUT    /api/staff/{id}
DELETE /api/staff/{id}
```

### Authentication Routes (Public)

```
POST   /api/login                     Staff or admin login → returns Sanctum token
POST   /api/logout                    Invalidate token
GET    /api/me                        Return logged-in user info
```

---

## 8. Module Breakdown

### 8.1 Authentication Module

**Who uses it:** Staff and Admin only. Customers never authenticate.

**How it works:** Laravel Sanctum is used for token-based authentication. When staff or admin logs in with email and password, Sanctum returns a personal access token. This token is stored in the browser (localStorage or React state) and sent with every protected API request in the Authorization header.

**Role enforcement:** Every protected API route checks two things — first that the user has a valid token (is logged in), and second that their role matches what the route requires. A staff token trying to access an admin route gets a 403 Forbidden response.

**Login Page behavior:**
- Single login page for both staff and admin
- After login, system reads the role from the response
- Admin is redirected to `/admin/dashboard`
- Staff is redirected to `/cashier/orders`

---

### 8.2 Table & QR Code Module

**Who uses it:** Admin creates tables. Customers scan the QR output.

**Key concept:** The QR code is not a separate thing admin manually draws. It is automatically generated the moment admin saves a table. The QR contains nothing but a URL. That URL contains a unique token. The token is stored in the database. When the customer scans, the system looks up the token and knows which table is ordering.

**Admin workflow:**
1. Admin opens Table Management page
2. Types table name and clicks Save
3. Laravel creates the table record and auto-generates a 60-character random token
4. React reads the token from the API response and renders it as a QR image using `qrcode.react`
5. Admin clicks Download or Print to get the QR image
6. Admin places the printed QR on the physical table
7. This is done once and never needs to be repeated unless the QR is lost or regenerated

**QR URL format:**
```
http://192.168.1.100:3000/menu?token=xK9mP2qL7nRtYvBwA4cEjF8sUiDhGpNoQ3Ze
```

**Token security logic:**

| Situation | System Response |
|---|---|
| Valid token, active table | Menu loads normally |
| Invalid / fake token | 404 — QR Invalid error page |
| Valid token, table disabled | Error — Table not available |
| Token regenerated by admin | Old QR returns 404, new QR works |

**QR Regeneration:** If a QR code is damaged or lost, admin clicks Regenerate on that table. A new token is created. The old QR permanently stops working. Admin prints the new QR.

---

### 8.3 Product & Category Module

**Who uses it:** Admin manages it. Customer menu is built from it.

**Key concept:** There is no separate "menu creation" step. The products admin adds to the database ARE the menu. The moment admin saves a product with `is_available = true`, it appears on the customer menu instantly. No republishing, no extra steps.

**Category management:**
- Admin creates categories (Coffee, Milk Tea, Smoothie, Soda, Dessert)
- Categories are used to group products on the customer menu
- Disabling a category hides all its products from the menu without deleting them

**Product management:**
- Admin sets name, photo, category, and three prices (small, medium, large)
- If a drink only comes in one size, only that price is filled in
- `is_available` toggle lets admin mark an item as sold out instantly — it disappears from the menu without being deleted
- Changing a price takes effect immediately for the next customer who scans

**Image upload:** Admin uploads a drink photo. Laravel stores it on the server and saves the path in the database. React fetches and displays it on the menu.

---

### 8.4 Customer Ordering Module (Public)

**Who uses it:** Customers — no login required.

**This module has 4 pages:**

**Page 1 — Menu Page** (`/menu?token=xxx`)
- Reads token from URL
- Calls public API to verify table
- Fetches all available products grouped by category
- Customer browses, selects size, adds to cart
- Cart is stored in React state (browser memory only, not database)

**Page 2 — Cart Page** (`/menu/cart`)
- Shows all selected items with sizes and quantities
- Customer can adjust quantities or remove items
- Shows subtotal
- Customer selects payment method: Cash or KHQR
- Customer clicks Place Order

**Page 3 — Order Confirmation** (shown after placing order)
- Shows order summary
- Displays order number and table name
- Payment instructions shown (if KHQR, shows the payment QR code)
- Links to Order Status page

**Page 4 — Order Status Page** (`/order-status/{id}`)
- Customer sees live status of their order
- Updates in real time via WebSocket (no refresh needed)
- Status display:

```
🟡 Order Received — We got your order!
🔵 Preparing — Your drinks are being made...
🟢 Ready — Please collect your order at the counter!
✅ Completed — Thank you! Enjoy your drinks 😊
```

---

### 8.5 Real-Time Cashier Dashboard

**Who uses it:** Staff (and admin can also view it).

**Location:** Sidebar → 📋 Live Orders. This is the default homepage for staff after login.

**How real-time works:**
1. Customer places order → Laravel saves order to MySQL → Laravel fires broadcast event to Redis
2. Redis publishes event to the `cashier-orders` channel
3. Laravel Reverb (WebSocket server) pushes the event to all connected cashier browsers
4. React on the cashier screen receives the event and adds the new order card to the top of the list
5. A sound notification plays automatically

**Order card display:**

Each order appears as a card on the cashier screen showing: order number, table name, time placed, list of items with sizes and quantities, total price, payment method, current status, and one action button.

**The one-button status progression:**

| Current Status | Button Shown | What It Does |
|---|---|---|
| 🟡 Pending | ✅ Confirm & Start Preparing | Moves to Preparing, notifies customer |
| 🔵 Preparing | ✅ Mark as Ready | Moves to Ready, notifies customer |
| 🟢 Ready | 💰 Confirm Payment Received | Moves to Completed, triggers stock deduction |

**Additional controls on each card:**
- ❌ Cancel button is available on Pending orders only
- Staff can expand card to see full item details

**Sound notification:** A sound plays every time a new order arrives. This ensures staff does not miss orders even if they are not looking at the screen.

**Order queue management:** Orders are sorted by time placed (oldest at top). Once marked Completed, the order card disappears from the Live Orders view and moves to Order History.

---

### 8.6 Recipe & Inventory Module

**Who uses it:** Admin only.

**Recipe management:**

Admin defines the recipe for each product. A recipe is a list of ingredients and how much of each is needed per size. For example, a Latte recipe might be:

- Coffee shot: 18g (small) / 20g (medium) / 22g (large)
- Whole milk: 120ml (small) / 150ml (medium) / 200ml (large)
- Vanilla syrup: 8ml (small) / 10ml (medium) / 12ml (large)

**Automatic stock deduction:**

When an order status changes to Completed, the system automatically:
1. Reads each item in the order and its size
2. Looks up the recipe for that product
3. Calculates the total ingredient amounts based on quantity ordered
4. Subtracts those amounts from the ingredients stock table

This happens without any manual action from staff or admin. The stock is always accurate after every completed order.

**Low stock alert:**

Every ingredient has a `min_stock` threshold. After each deduction, the system checks if any ingredient has fallen below its minimum. If yes, a red alert badge appears in the admin sidebar and a warning is shown on the admin dashboard.

**Stock purchase recording:**

When admin buys more stock (goes to the market to buy milk, coffee beans, etc.), they record the purchase in the system. This increases the `stock_qty` for that ingredient and also records the cost as an expense for the finance module.

---

### 8.7 Finance & Budget Module

**Who uses it:** Admin only.

**Income tracking:** Income is automatically recorded from every completed order. No manual entry needed for sales income — it comes directly from the orders table.

**Expense tracking:** Admin manually records expenses such as ingredient purchases, electricity bills, staff salaries, shop rent, and other operational costs. Each expense has a category, amount, date, and optional note.

**Profit calculation:**

```
Net Profit = Total Income (from completed orders) - Total Expenses
```

This is calculated and displayed for daily view and monthly view.

**Reports available:**
- Daily revenue total
- Monthly revenue chart
- Expense summary by category
- Net profit per day and per month
- Comparison between months

---

### 8.8 Analytics & Reports Module

**Who uses it:** Admin only.

All analytics data is calculated from the existing `orders` and `order_items` tables using date-based queries. No separate analytics database is needed.

**Available analytics:**

| Report | What It Shows |
|---|---|
| Sales Overview | Revenue chart by day, week, month |
| Top Products | Most ordered drinks by quantity and revenue |
| Category Performance | Which category generates most sales |
| Peak Hours | Which hours of the day have most orders |
| Average Order Value | Mean spend per order over time |
| Table Performance | Which tables generate most orders |
| Daily Order Count | Number of orders per day |

---

### 8.9 Network Restriction Module

**Who uses it:** Applied automatically to all requests.

**Purpose:** The system should only work inside the café's WiFi network. Anyone trying to access the system from outside (home, mobile data, other networks) gets blocked.

**How it works:**

The café's WiFi router assigns IP addresses in a known range, for example `192.168.1.x`. The Laravel middleware reads the incoming request IP and checks if it falls within the allowed range. If it does not match, the request is rejected with a 403 error before any data is returned.

**Implementation approach:**

A custom Laravel middleware checks every incoming request. The allowed IP range is configured in the `.env` file so admin can change it without editing code if the router configuration changes.

**What is blocked from outside:**
- Customer menu page
- Placing orders
- All admin and staff APIs
- The entire system

**Exception:** The system can have a whitelist for the admin's home IP if the owner needs to check reports remotely. This is optional and configurable.

---

## 9. Order Status Flow

```
Customer places order
        ↓
   ┌─────────────┐
   │   PENDING   │  ← new order arrives on cashier screen with sound alert
   └─────────────┘
        ↓ Staff clicks "Confirm & Start Preparing"
   ┌─────────────┐
   │  PREPARING  │  ← customer sees "Your drinks are being made"
   └─────────────┘
        ↓ Staff clicks "Mark as Ready"
   ┌─────────────┐
   │    READY    │  ← customer sees "Please collect your order"
   └─────────────┘
        ↓ Staff clicks "Confirm Payment Received"
   ┌─────────────┐
   │  COMPLETED  │  ← stock auto-deducted, order moves to history
   └─────────────┘

  OR at any point before Ready:

        ↓ Staff clicks "Cancel"
   ┌─────────────┐
   │  CANCELLED  │  ← customer notified, no stock deducted
   └─────────────┘
```

---

## 10. Payment Flow

### Cash Payment

```
Customer selects Cash at checkout
        ↓
Order placed → cashier sees "Payment: Cash"
        ↓
Cashier prepares order → marks Ready
        ↓
Customer comes to counter with cash
        ↓
Cashier receives cash → clicks "Confirm Payment Received"
        ↓
Order marked Completed → receipt generated
```

### KHQR Payment

```
Customer selects KHQR at checkout
        ↓
Order placed → customer sees KHQR QR code on their screen
        ↓
Customer opens banking app → scans the KHQR → pays
        ↓
Cashier sees "Payment: KHQR" on order card
        ↓
Cashier visually confirms customer paid on their phone
        ↓
Cashier clicks "Confirm Payment Received" manually
        ↓
Order marked Completed → receipt generated
```

> **Note:** KHQR payment confirmation is always manual by the cashier. There is no automatic payment detection in v1.0. The cashier visually confirms that the customer has completed the payment on their banking app before clicking confirm.

---

## 11. QR Code Flow

### One-Time Setup (Admin)

```
1. Admin opens Table Management
2. Types table name → clicks Save
3. Laravel creates table record in DB
4. Laravel generates 60-character random token
5. Token stored in tables.token column
6. React receives token → generates QR image using qrcode.react
7. Admin clicks Download PNG or Print
8. Admin places printed QR on physical table
9. Never needs to be done again unless QR is lost
```

### Every Time Customer Scans

```
1. Customer scans QR with phone camera
2. Phone opens URL: http://192.168.1.100:3000/menu?token=xK9mP2...
3. React MenuPage reads token from URL query string
4. React calls: GET /api/menu/table/{token}
5. Laravel checks: does token exist in tables table?
      YES → return { table_id, table_name }
      NO  → return 404 error
6. If valid: React calls GET /api/menu/products
7. Laravel returns all products where is_available = true
8. React renders the menu grouped by category
9. Customer sees the full menu — no login, no app, no account
```

---

## 12. Real-Time Flow (Redis)

### Technology Used

Laravel Reverb is used as the WebSocket server. It is Laravel's official first-party solution for real-time broadcasting. Redis is used as the pub/sub message broker between Laravel and Reverb.

### Flow Diagram

```
Customer places order
        ↓
Laravel saves order to MySQL
        ↓
Laravel fires: event(new NewOrderPlaced($order))
        ↓
Laravel Broadcasting sends event to Redis channel: cashier-orders
        ↓
Laravel Reverb (WebSocket server) receives from Redis
        ↓
Reverb pushes event to all browsers subscribed to cashier-orders
        ↓
Cashier browser receives the event instantly
        ↓
React adds new order card to top of list
        ↓
Sound notification plays
```

### Customer Real-Time Updates

The customer's order status page also receives real-time updates. When staff updates the order status, an event is broadcast to a table-specific channel. The customer's browser receives the update and changes the status display without any page refresh.

---

## 13. Frontend Route Structure

### Public Routes (No Login Required)

```
/menu                     → MenuPage (customer scans QR, lands here)
/menu/cart                → CartPage (review order before placing)
/order-status/:id         → OrderStatusPage (track order in real time)
/login                    → LoginPage (staff and admin login)
```

### Staff Protected Routes

```
/cashier/dashboard        → Staff dashboard (order summary)
/cashier/orders           → Live Orders page (main workspace)
/cashier/orders/history   → Completed orders history
```

### Admin Protected Routes

```
/admin/dashboard          → Admin overview (revenue, alerts, stats)
/admin/orders             → Live orders (admin view)
/admin/orders/history     → Full order history

/admin/products           → Product list and management
/admin/products/create    → Add new product
/admin/products/:id/edit  → Edit existing product

/admin/categories         → Category management

/admin/tables             → Table list
/admin/tables/:id/qr      → View and print QR for specific table

/admin/recipes            → Recipe list per product
/admin/recipes/:id/edit   → Edit recipe ingredients

/admin/stock              → Ingredient stock levels
/admin/stock/purchases    → Stock purchase history and new purchase

/admin/finance            → Income, expenses, profit summary
/admin/finance/expenses   → Expense records

/admin/analytics/sales    → Sales charts
/admin/analytics/products → Top products report
/admin/analytics/hours    → Peak hours report

/admin/staff              → Staff account management
/admin/settings           → System settings
```

---

## 14. Development Priority Order

Build the system in this exact sequence. Each phase must be fully working before moving to the next.

**Phase 1 — Foundation**
Set up Laravel project, MySQL database, all migrations, and React project structure. Configure Laravel Sanctum. Build the login page and role-based route protection in React.

**Phase 2 — Core Menu**
Build category and product management in admin. Build the public product API. Confirm that products added by admin appear correctly via the API.

**Phase 3 — Tables & QR**
Build table management in admin. Generate tokens on create. Build the QR code display and print feature using qrcode.react. Build the public token verification API.

**Phase 4 — Customer Ordering**
Build the full customer flow: menu page → cart → place order → order confirmation → order status page. Test the complete path from scanning QR to seeing order confirmation.

**Phase 5 — Real-Time Cashier**
Set up Laravel Reverb and Redis. Build the cashier Live Orders page with real-time order arrival. Build the status update buttons. Test the full loop: customer orders → cashier sees it live → cashier updates status → customer sees status update.

**Phase 6 — Recipe & Stock**
Build recipe management. Build ingredient stock management. Implement automatic stock deduction when orders are completed. Implement low stock alerts.

**Phase 7 — Finance**
Build expense recording. Build the finance summary page with income, expense, and profit calculation.

**Phase 8 — Analytics**
Build the analytics pages using aggregated queries from the orders data.

**Phase 9 — Network Restriction**
Add the WiFi IP restriction middleware last. Adding it earlier would block your own development access.

**Phase 10 — Polish & Testing**
Sound notifications, KHQR display, receipt generation, low stock alerts, mobile responsiveness, and final testing across all user roles.

---

## 15. Security Requirements

| Requirement | Implementation |
|---|---|
| Admin authentication | Laravel Sanctum token-based login |
| Staff permission roles | Role column in users table, checked in middleware |
| Prevent outside ordering | IP range middleware checks every request |
| Protect payment confirmation | Payment confirm endpoint requires staff/admin role |
| CSRF protection | Laravel built-in CSRF protection on all state-changing requests |
| QR token validation | Token checked against DB on every menu load |
| Double protection | Both React routes and Laravel middleware enforce role restrictions |
| Password security | Passwords hashed using bcrypt via Laravel Hash facade |

---

## 16. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Order receive speed | Less than 1 second from customer submit to cashier screen |
| Mobile responsive | Customer menu must work on all phone screen sizes |
| Concurrent tables | System must handle 100+ tables ordering simultaneously |
| Network fallback | System works on local LAN even without internet access |
| Offline resilience | Server runs locally so internet outages do not affect operation |
| Real-time latency | WebSocket updates under 500ms |
| Image loading | Product images optimized and served quickly on local network |

---

*End of Document — Prey Lang Coffee POS System v1.0*
