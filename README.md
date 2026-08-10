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
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Start the server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:5000`

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
4. No refunds implemented (stretch goal, not required)
5. Single currency (no multi-currency support)

### Tradeoffs:
1. **No optimistic locking**: Concurrent payment submissions could theoretically cause issues, but the validation logic prevents over-payment
2. **Synchronous status updates**: Status is updated immediately after each payment
3. **No audit log**: Status changes are not tracked with timestamps (stretch goal)
4. **Simple auth**: Email/password only, no OAuth or 2FA

## What Would Be Improved Before Production

1. **Testing**: Add comprehensive test suite with Jest
   - Payment allocation logic
   - Status transitions
   - Over-payment rejection
   - Edge cases (concurrent payments, timezone handling)

2. **Security**:
   - Rate limiting on auth endpoints
   - Input sanitization
   - CORS configuration for specific domains
   - HTTPS enforcement
   - Refresh tokens (currently only access tokens)

3. **Performance**:
   - Database indexing on userId, status, dueDate
   - Caching for dashboard queries
   - Pagination for large order lists

4. **Monitoring**:
   - Error logging (Winston, Datadog)
   - Performance monitoring
   - Database query logging

5. **Features**:
   - Export to CSV
   - Email notifications
   - Audit log for status changes
   - Refunds support
   - Invoice generation

6. **Deployment**:
   - Docker containerization
   - CI/CD pipeline
   - Database backups
   - Health checks
   - Graceful shutdown

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| PORT | Server port (default: 5000) | No |
| JWT_SECRET | Secret key for JWT signing | Yes |

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