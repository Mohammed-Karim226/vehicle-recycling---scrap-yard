# Vehicle Recycling & Scrap Yard Platform

## 1. Product overview

This project is a full-stack vehicle recycling and scrap yard platform built with Next.js and PostgreSQL via Prisma. It helps a scrap yard business manage the lifecycle of incoming vehicles, estimate scrap values, accept customer quotes, handle part requests, manage live scrap metal prices, and give admins a secure control panel for operational tasks.

The core business intent is to combine:

- vehicle intake and yard tracking
- business pricing for scrap metal, converters, and vehicle quotations
- customer submissions for scrap valuation and parts requests
- secure admin operations for queue management and pricing updates
- public-facing presentation for sales and lead generation

---

## 2. Stack and architecture

### Frontend
- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix + custom UI primitives

### Backend and data
- Prisma ORM
- PostgreSQL database
- Server actions for business logic
- Zod schema validation
- Cookie-based admin session security

### External integrations
- DVLA vehicle lookup integration for registration-based vehicle data
- PostgreSQL-backed app data layer
- Supabase interaction layer prepared in the project utilities

### Main project flow
The frontend is composed of tab-based views in the main app shell, while the business logic is separated into server actions, services, and repository classes. This keeps the UI focused on display and user interaction while the database layer is centrally managed through Prisma-backed repositories.

---

## 3. Project structure and responsibilities

### App entry and page shell
- `app/page.tsx`  
  Root page entry, renders the main application shell.

- `app/layout.tsx`  
  Global app layout and base metadata/theme configuration.

- `app/globals.css`  
  Global styling and theme setup.

### Main customer-facing UI
- `components/mainApp/HomePage.tsx`  
  Main app router that switches between Home, Parts, Prices, About, Requests, and Admin views.

- `components/mainApp/Header.tsx`  
  Top navigation and tab switching toolbar.

- `components/mainApp/Footer.tsx`  
  Footer navigation and support links.

- `components/mainApp/ScrapQuoteSection.tsx`  
  Public scrap quote form for vehicle submissions and valuation requests.

- `components/mainApp/FindPartsView.tsx`  
  Customer interface to search and request vehicle parts.

- `components/mainApp/ScrapPricesView.tsx`  
  Displays current metal pricing information.

- `components/mainApp/RecentArrivals.tsx`  
  Shows yard vehicles that are recently available.

- `components/mainApp/AboutContactView.tsx`  
  Business information and contact-related public content.

- `components/mainApp/MyRequestsView.tsx`  
  Customer view for reviewing their quote and request history.

### Admin dashboard
- `components/mainApp/admin/AdminDashboardView.tsx`  
  Primary secured dashboard for operations and data management.

- `components/mainApp/admin/AdminLoginGate.tsx`  
  Login gate before entering the admin panel.

- `components/mainApp/admin/useAdminAuth.ts`  
  Logic for admin authentication and lockout/cooldown handling.

- `components/mainApp/admin/useAdminData.ts`  
  Aggregates fetching, state management, and actions for dashboard data.

- `components/mainApp/admin/AdminOverviewPanel.tsx`  
  Summary metrics and operational overview.

- `components/mainApp/admin/AdminScrapPanel.tsx`  
  Manage scrap quotes and statuses.

- `components/mainApp/admin/AdminPartsPanel.tsx`  
  Manage spare-part requests.

- `components/mainApp/admin/AdminYardPanel.tsx`  
  Add, update, delete, or change yard vehicle status.

- `components/mainApp/admin/AdminPricesPanel.tsx`  
  Update scrap metal pricing entries.

### Shared UI primitives
- `components/ui/*`  
  Reusable form, dialog, button, input, card, calendar, select, and popover components built to support the application UI system.

### Business logic and data access layers
- `lib/actions/*.ts`  
  Server actions for reading and modifying system data. This is the public server-side API for the application.

- `lib/services/*.ts`  
  Domain service classes that orchestrate application operations and coordinate repositories.

- `lib/repositories/*.ts`  
  Prisma-backed repository layer for each domain entity.

- `lib/validation/schemas.ts`  
  Zod validation schemas for vehicle intake, pricing, scrap quotes, part requests, and admin updates.

- `lib/auth/adminSession.ts`  
  Cookie-based admin session creation, validation, and enforcement.

### Core integrations and utilities
- `lib/dvla.ts`  
  DVLA vehicle lookup client for registration-based vehicle information.

- `lib/env.ts`  
  Environment variable access and validation.

- `lib/errors.ts`  
  Typed application errors.

- `lib/prisma.ts`  
  Prisma client singleton configuration.

- `lib/storage.ts`  
  Storage abstraction for files/media if needed.

- `lib/supabase.ts`  
  Service initialization for Supabase access.

- `lib/whatsapp.ts`  
  WhatsApp notification helper integration layer.

- `lib/mockData.ts`  
  Seed/mock data support for development or prototype states.

- `lib/utils.ts`  
  Small general-purpose utility functions.

### Database schema
- `prisma/schema.prisma`  
  Main database schema with all entities and enums. This is the canonical model of the business domain.

- `prisma/seed.ts`  
  Seed script used to preload the database with default pricing or sample data.

- `prisma/migrations/*`  
  Versioned database migrations.

---

## 4. Data model summary

The database models reflect the main business workflow.

### VehicleYard
Represents vehicles stored in the yard.

Fields include:
- id
- make
- model
- year
- trim
- arrivedDate
- status
- image
- color

Status values:
- In_Yard
- Dismantled
- Scrapped

This is the inventory view for stock management and operator workflow.

### ScrapMetalPrice
Represents live scrap metal category prices.

Fields include:
- category
- pricePerKgMin
- pricePerKgMax
- trend

This supports the public “scrap prices” view and admin pricing updates.

### CatalyticConverterPrice
Represents premium catalytic converter valuation pricing.

Fields include:
- category
- make, model, yearFrom, yearTo (optional mapping)
- price
- trend
- active

This is especially important because converter values can depend on category and sometimes vehicle-specific data.

### ScrapValuation
Customer quote submissions that estimate the value of a scrap vehicle.

Fields include:
- registration
- postcode
- vehicleName
- estimatedValue
- weightKg
- engineSize
- fuelType
- status
- notes

Status values:
- Pending
- Approved
- Rejected
- Completed

This is the main lead and quote workflow.

### PartRequest
Represents requests from customers looking for vehicle parts.

Fields include:
- vehicleId
- vehicleName
- partsNeeded
- name
- phone
- status
- notes

Status values:
- Pending_Search
- Part_Located
- Shipped
- No_Stock
- Cancelled

This drives the customer support and parts fulfillment workflow.

---

## 5. Core business processes

### A. Scrap valuation flow
1. Customer enters vehicle registration and postcode.
2. The system validates the input using Zod.
3. DVLA lookup retrieves the vehicle details if configured.
4. A valuation estimate is created, stored as a `ScrapValuation` record.
5. Admin reviews the request in the dashboard and updates its status.
6. Customer can track updates in the public request view.

This flow connects the public form, business logic, and admin review channel.

### B. Part request flow
1. Customer selects a vehicle or enters a make/model/year.
2. They describe parts needed and provide contact details.
3. A `PartRequest` is created.
4. Admin searches the stock/yard and updates status as the item is located or shipped.
5. The request is resolved by moving through statuses like `Part_Located`, `Shipped`, or `No_Stock`.

This is the parts resale and retrieval workflow for the business.

### C. Yard inventory flow
1. Vehicles arrive and are entered into the system.
2. Their condition and status are tracked in the yard inventory.
3. The admin updates status from `In_Yard` to `Dismantled` or `Scrapped` as operations progress.
4. The public “Recent Arrivals” section can showcase live stock and encourage buyers.

This supports operational visibility and vehicle tracking.

### D. Price management flow
1. Admin manages scrap metal pricing categories.
2. Pricing can include minimum and maximum values plus trend signal.
3. The public price view reflects the live configured values.
4. This helps customers estimate current market value and supports purchasing decisions.

### E. Catalytic converter pricing flow
1. Converter value rules are defined by category and optional vehicle mapping.
2. System checks if there is a specific make/model/year match.
3. If no exact match is found, category-based pricing is used.
4. This supports higher-value converter recovery and more precise payouts.

---

## 6. Use cases by user type

### Use case 1: Customer wants a scrap vehicle quote
A customer visits the landing page, enters registration and postcode, and submits a quote request.

Expected result:
- Quote form validates input.
- A valuation record is created.
- Admin can later approve or reject the valuation.
- The customer can see progress and status updates.

### Use case 2: Customer needs a replacement part
A customer enters the vehicle or part type they need and submits a request with contact information.

Expected result:
- Part request record is created.
- Admin sees the request queued in the dashboard.
- The request can move to `Part_Located`, `Shipped`, or `No_Stock`.
- The customer receives a response or sees changes through the status flow.

### Use case 3: Yard operator registers incoming vehicles
An admin enters make, model, year, trim, and stock image for a vehicle arriving at the yard.

Expected result:
- A `VehicleYard` row is created.
- The vehicle appears in the yard and recent arrivals list.
- Operators can update status as inventory moves through dismantling or scrapping stages.

### Use case 4: Business manager updates scrap prices
The manager updates category prices and trend information in the admin panel.

Expected result:
- Price records are updated in PostgreSQL.
- The front-end pricing view reflects new numbers.
- Service logic remains consistent with validation and repository access patterns.

### Use case 5: Admin reviews and manages customer flows
The admin logs in through the secure gate, sees overview metrics, and processes quotes and requests.

Expected result:
- The dashboard loads all operational data.
- Admin can approve quotes, change request statuses, add or delete inventory items, and adjust prices.
- Lockout and session logic protect management access.

### Use case 6: Business wants precise catalytic converter payouts
The admin configures category pricing and optional make/model/year rules for converters.

Expected result:
- Exact match lookups return specific values for known vehicle classes.
- Fallback category-based pricing is used when no exact match exists.
- This improves pricing accuracy and reduces manual calculations.

---

## 7. Architectural patterns in use

### Server actions pattern
The app uses server actions in `lib/actions` to provide a clean boundary between UI and data access. This is a good pattern for Next.js apps that want secure server-side logic without creating a separate API server.

### Repository pattern
Each domain entity has a repository class. This isolates Prisma operations and keeps business logic from being directly coupled to database implementation details.

### Service layer
Services coordinate repository logic and encapsulate domain rules. This makes the platform easier to extend as the number of features grows.

### Validation pattern
Zod schemas ensure that customer-submitted data and admin-modified data conform to strict rules before reaching the database.

### Session security pattern
Admin access uses a hashed PIN + signed cookie session pattern. This adds a lightweight but meaningful security layer for operational users.

---

## 8. Why this architecture works well for this business

This project is designed around a scrap yard business workflow, not a generic content app. The architecture supports several important characteristics:

- quick lead capture from public forms
- operational management in one admin console
- low-friction data updates for pricing and yard inventory
- separation of data access from UI rendering
- extensibility for adding more vehicle categories, scrap materials, or payment flows

The layered design also reduces the risk of mixing UI concerns with database logic or security rules.

---

## 9. Recommended next improvements

To evolve the platform further, the following would be valuable:

- add authentication for staff users beyond the PIN-based admin gate
- integrate a real customer notification system for status changes
- add a dedicated search and filter layer for yard inventory
- add analytics dashboards for quote conversion and pricing trends
- add audit tracking for admin changes to pricing, quotes, and requests
- add image upload storage and retrieval for yard vehicles

---

## 10. Final summary

This project is a practical business application for a vehicle recycling operation. It blends a public-facing website, quoting workflow, inventory management, part request queue, and secure admin operations into one application built around Next.js, Prisma, and PostgreSQL.

The strongest design choice is the separation between:
- presentation in the app and component layers
- business operations in services and server actions
- persistence in Prisma repositories and models
- validation and security in Zod and admin session controls

That structure makes the application maintainable, scalable, and aligned with real-world scrap yard operations.
