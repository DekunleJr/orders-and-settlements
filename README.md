# Orders and Settlements API

A REST API for managing orders with line items and recording payments. Built with Express, TypeScript, Prisma, and PostgreSQL.

## Features

- User authentication (signup/login) with JWT
- Order management with line items
- Automatic order total calculation
- Payment recording with validation
- Order status tracking (pending, partially_paid, paid, overdue)
- Dashboard with filtering
- Swagger API documentation

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd orders-and-settlements
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=orders_and_settlements
PORT=5000
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=frontend_url
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Start the Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:5000`

### 6. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
```

### 7. Frontend Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=backend_url
```

### 8. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Documentation

Interactive Swagger documentation available at: `http://localhost:5000/api-docs`

### Authentication Endpoints

#### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login
Login and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

### Order Endpoints

All order endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

#### GET /api/orders
Get all orders for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (pending, partially_paid, paid, overdue)

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "customerName": "Acme Corp",
    "dueDate": "2024-12-31T23:59:59Z",
    "status": "pending",
    "lineItems": [...],
    "payments": [],
    "orderTotal": 1000.00,
    "amountPaid": 0.00,
    "amountDue": 1000.00,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/orders
Create a new order with line items.

**Request:**
```json
{
  "customerName": "Acme Corp",
  "dueDate": "2024-12-31T23:59:59Z",
  "lineItems": [
    {
      "description": "Widget A",
      "quantity": 2,
      "unitPrice": 500.00
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "customerName": "Acme Corp",
  "dueDate": "2024-12-31T23:59:59Z",
  "status": "pending",
  "lineItems": [...],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### GET /api/orders/:id
Get order details with line items and payment history.

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "customerName": "Acme Corp",
  "dueDate": "2024-12-31T23:59:59Z",
  "status": "partially_paid",
  "lineItems": [...],
  "payments": [...],
  "orderTotal": 1000.00,
  "amountPaid": 400.00,
  "amountDue": 600.00
}
```

#### PUT /api/orders/:id
Update an order (only allowed before any payments are recorded).

**Request:**
```json
{
  "customerName": "Acme Corp Updated",
  "dueDate": "2024-12-31T23:59:59Z",
  "lineItems": [...]
}
```

#### DELETE /api/orders/:id
Delete an order (only allowed before any payments are recorded).

#### POST /api/orders/:id/payments
Record a payment against an order.

**Request:**
```json
{
  "amount": 400.00,
  "date": "2024-01-15T10:30:00Z",
  "note": "Initial payment"
}
```

**Response:**
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "amount": 400.00,
  "date": "2024-01-15T10:30:00Z",
  "note": "Initial payment",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Response (over-payment):**
```json
{
  "error": "Validation Error",
  "message": "Payment amount (1000) exceeds amount due (600)",
  "details": {
    "orderTotal": 1000.00,
    "amountPaid": 400.00,
    "amountDue": 600.00,
    "maxAllowed": 600.00
  }
}
```

## Order Status Derivation Rules

### Status Values:
- **pending**: No payments recorded
- **partially_paid**: Some payments recorded, but less than order total
- **paid**: Total payments equal or exceed order total
- **overdue**: Past due date and not fully paid

### Edge Cases:
1. **Overdue → Paid**: If an order becomes overdue but is then fully paid, the status becomes "paid" (not "overdue")
2. **Partial payments**: Status updates after each payment
3. **Date handling**: Status is calculated based on the current date vs. due date

## Business Rules

### Orders:
- Orders become read-only after the first payment is recorded
- Cannot update or delete orders with existing payments
- Line items are required (minimum 1)
- Quantity must be ≥ 1
- Unit price must be ≥ 0

### Payments:
- Payment amount must be > 0
- Total payments cannot exceed order total
- Clear error message shown if over-payment is attempted
- Multiple payments are allowed
- Optional note field for payment context

### Calculations:
- **Order Total**: Sum of (quantity × unitPrice) for all line items
- **Amount Paid**: Sum of all payment amounts
- **Amount Due**: Order Total - Amount Paid

## Assumptions & Tradeoffs

### Assumptions:
1. Users can only access their own orders (enforced at database query level)
2. Orders are immutable after payments (simplifies accounting)
3. No tax or discount calculations (per requirements)
4. Single currency (no multi-currency support)

### Tradeoffs:
1. **Optimistic locking**: Order version field prevents concurrent payment conflicts. If two payments are submitted simultaneously, one will receive a 409 Conflict error and the user must retry.
2. **Synchronous status updates**: Status is updated immediately after each payment
3. **Simple auth**: Email/password only, no OAuth or 2FA

## What You Would Improve Before Production

1. **Testing**: Add unit tests, integration tests, and end-to-end (E2E) tests for all API endpoints and frontend flows. Currently there are no automated tests.
2. **Security**:
   - Add rate limiting on authentication endpoints to prevent brute-force attacks
   - Implement account lockout after failed login attempts
   - Use refresh tokens with short-lived access tokens instead of long-lived JWTs
   - Enforce HTTPS/TLS for all traffic in production
   - Store secrets in a secrets manager (e.g., AWS Secrets Manager) rather than `.env` files
   - Add CSRF protection if using cookie-based session auth
3. **Observability**:
   - Add structured logging (e.g., Winston or Pino) with log rotation
   - Integrate error tracking (e.g., Sentry) for real-time error monitoring
   - Add performance monitoring / health check endpoints
4. **CI/CD**: Set up automated pipelines for testing, linting, and deployment on every push to main.
5. **Database**:
   - Use a proper migration tool (e.g., Prisma Migrate) instead of `db push`
   - Set up connection pooling (e.g., PgBouncer) for production workloads
   - Add database backups and a recovery plan
6. **Frontend**:
   - Add client-side form validation with a library (e.g., Zod + React Hook Form) for better UX
   - Add a password strength indicator on signup
   - Improve accessibility (ARIA labels, keyboard navigation)
   - Add offline support / error boundaries for resilience
   - Restrict CORS_ORIGIN to specific allowlisted domains instead of a wildcard or broad origin
7. **API**: Add API versioning, pagination on list endpoints, and request validation schemas (e.g., Zod) for consistent input handling.

## Implemented Stretch Goals

### Refunds
- Record refunds as negative payments via `POST /api/orders/:id/payments` with `isRefund: true`
- Refunds cannot exceed the net paid amount (payments minus previous refunds)
- Refunds are displayed with red indicators in the payment history
- Refunds increment the order version for optimistic locking

### Audit Log
- All status changes are automatically logged with `GET /api/orders/:id/audit-log`
- Each log entry contains: old status, new status, timestamp, and user ID
- Viewable from the order detail page via "Show Audit Log" button
- Provides complete history of order status transitions

### CSV Export
- Export all orders from the dashboard via the "Export CSV" button
- CSV is generated client-side (PapaParse) with order details, line items, and payment history
- No backend endpoint required; exports the current filtered view

## Production Deployment

### Backend Deployment

1. **Build the backend:**
   ```bash
   cd backend
   npm run build
   ```

2. **Set production environment variables:**
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database?schema=orders_and_settlements
   PORT=5000
   JWT_SECRET=your-production-secret-key
   CORS_ORIGIN=https://your-frontend-domain.com
   NODE_ENV=production
   ```

3. **Run database migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Recommended:** Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name orders-api
   pm2 save
   pm2 startup
   ```

### Frontend Deployment

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Set production environment variables:**
   ```env
NEXT_PUBLIC_API_URL=https://orders-and-settlements-production.up.railway.app/
   ```

3. **Start the production server:**
   ```bash
   npm start
   ```

4. **Alternative:** Deploy to Vercel/Netlify:
   - Connect your Git repository
   - Set environment variables in the platform dashboard
   - Deploy automatically on push to main branch

### Full Stack Deployment Options

**Option 1: Separate Hosting (Recommended)**
- Backend: Deploy to Railway, Render, or DigitalOcean
- Frontend: Deploy to Vercel or Netlify
- Database: Use Supabase, Neon, or managed PostgreSQL

**Option 2: Docker**
- Build a Docker image for the backend
- Build a Docker image for the frontend
- Use docker-compose to orchestrate

**Option 3: Monolithic**
- Serve the Next.js frontend from the Express backend
- Add a catch-all route in Express to serve Next.js pages



## Deployed URLs

| Component | URL |
|---------|-----|
| Frontend (Netlify) | https://orders-and-settlements.netlify.app/ |
| Backend (Railway) | https://orders-and-settlements-production.up.railway.app/ |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| PORT | Server port (default: 5000) | No |
| JWT_SECRET | Secret key for JWT signing | Yes |

## Optimistic Locking

The system uses optimistic locking to handle concurrent payment submissions:

1. Each order has a `version` field that increments on every modification
2. When recording a payment, the client sends the current version in the `X-Order-Version` header
3. If the version doesn't match the database, a `409 Conflict` error is returned
4. The client should refresh the order data and retry with the new version

**Example Conflict Response:**
```json
{
  "error": "Conflict",
  "message": "Order was modified by another request. Please refresh and try again.",
  "details": {
    "currentVersion": 3
  }
}
```

## Order Status Derivation Rules

### Status Values:
- **pending**: No payments recorded
- **partially_paid**: Some payments recorded, but less than order total
- **paid**: Total payments equal or exceed order total
- **overdue**: Past due date and not fully paid

### Edge Cases:
1. **Overdue → Paid**: If an order becomes overdue but is then fully paid, the status becomes "paid" (not "overdue")
2. **Partial payments**: Status updates after each payment
3. **Date handling**: Status is calculated based on the current date vs. due date
4. **Refunds**: Refunds (negative payments) reduce the amount paid, potentially changing status from paid to partially_paid or overdue

## Sample Workflow

```bash
# 1. Sign up a new user
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123"
}

# 2. Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Copy the token from response

# 3. Create an order (use token in Authorization header)
POST /api/orders
Headers: Authorization: Bearer <token>
{
  "customerName": "Acme Corp",
  "dueDate": "2024-12-31T23:59:59Z",
  "lineItems": [
    {
      "description": "Widget A",
      "quantity": 2,
      "unitPrice": 500.00
    }
  ]
}

# 4. Record a payment
POST /api/orders/:orderId/payments
Headers: Authorization: Bearer <token>
{
  "amount": 400.00,
  "date": "2024-01-15T10:30:00Z",
  "note": "Initial payment"
}

# 5. Check order status
GET /api/orders/:orderId
Headers: Authorization: Bearer <token>

# 6. Try over-payment (will fail)
POST /api/orders/:orderId/payments
{
  "amount": 1000.00
}
# Error: Payment amount exceeds amount due
```

## License

ISC

## Questions?

Refer to the Swagger documentation at `/api-docs` for interactive API exploration.