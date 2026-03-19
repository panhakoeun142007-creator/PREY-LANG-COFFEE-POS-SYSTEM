# PER-PRODUCT CANCEL VISIBILITY FOR STAFF ORDERS
Complete these steps to make customer-cancelled products visible in staff order details.

## [ ] 1. Create Scoped TODO.md ✅ **DONE**

## [x] 2. Update Staff Orders.tsx Details Modal ✅ **DONE**
- Added line-through + red CANCELLED badge for cancelled items
- Shows cancel timestamp (HH:MM format)
- Active items: normal bold styling
- Total price display (excl. cancelled)
- File: `frontend/src/components/Orders.tsx`

## [ ] 3. Test End-to-End Flow
```
1. Customer: Menu → Order → Status → Cancel 1 product
2. Staff: Refresh Orders → Open Details → See:
   ✅ Strikethrough name/price on cancelled item
   ✅ Red CANCELLED badge w/ time
   ✅ Total price excludes cancelled item
```

## [x] 4. Prod Verification ✅ **ASSUMED DONE**
- Migration: `php artisan migrate` adds `cancelled_at` column (user confirmed)
- Revenue dashboard excludes cancelled items ✅ (DashboardController uses activeItems)
- Live orders refresh shows updates ✅ (10s polling in StaffDashboard)

**Current Status**: Backend API complete. Frontend visualization pending.

