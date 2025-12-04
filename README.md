# Saga Pattern Implementation - E-Commerce Order Processing

This project demonstrates the **Saga Design Pattern** using Node.js, Express.js, and MongoDB. It implements an orchestration-based approach for managing distributed transactions across multiple microservices.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Saga Pattern Explanation](#saga-pattern-explanation)
- [Setup Instructions](#setup-instructions)
- [Running the Services](#running-the-services)
- [API Endpoints](#api-endpoints)
- [Example Usage](#example-usage)
- [How the Saga Works](#how-the-saga-works)
- [Compensating Actions](#compensating-actions)

## Architecture Overview

The system follows the **Orchestration-Based Saga Pattern** with a central coordinator that manages the flow of distributed transactions. This implementation avoids the limitations of traditional 2PC (Two-Phase Commit) by:

- **No Blocking**: Services don't block each other during transaction execution
- **No Single Point of Failure**: Each step is independent with compensating actions
- **Graceful Failure Handling**: Failed steps are compensated with rollback operations
- **Resilience to Network Partitions**: Services can continue independently

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   SAGA ORCHESTRATOR                          │
│            (Central Transaction Coordinator)                 │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Order   │  │ Payment  │  │Inventory │  │ Shipping │
   │ Service  │  │ Service  │  │ Service  │  │ Service  │
   └──────────┘  └──────────┘  └──────────┘  └──────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                        │
                   ┌────▼────┐
                   │ MongoDB  │
                   └─────────┘
```

## Project Structure

```
saga/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── models/
│   │   ├── Order.js                 # Order schema
│   │   ├── Payment.js               # Payment schema
│   │   ├── Inventory.js             # Inventory schema
│   │   ├── Shipment.js              # Shipment schema
│   │   └── SagaLog.js               # Saga execution log
│   ├── services/
│   │   ├── orderService.js          # Order microservice
│   │   ├── orderServer.js           # Order server
│   │   ├── paymentService.js        # Payment microservice
│   │   ├── paymentServer.js         # Payment server
│   │   ├── inventoryService.js      # Inventory microservice
│   │   ├── inventoryServer.js       # Inventory server
│   │   ├── shippingService.js       # Shipping microservice
│   │   └── shippingServer.js        # Shipping server
│   └── orchestrator/
│       ├── sagaOrchestrator.js      # SAGA execution logic
│       └── orchestratorServer.js    # Orchestrator server
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Saga Pattern Explanation

### What is a Saga?

A Saga is a pattern for managing distributed transactions in microservices. Instead of using traditional ACID transactions across services, a Saga breaks down a complex transaction into a series of smaller, independent operations, each handled by a different service.

### Key Characteristics

1. **Distributed Steps**: Each step is an independent transaction in a separate service
2. **Compensating Actions**: Each step has a compensating action to undo it if needed
3. **Orchestration**: A central coordinator manages the flow
4. **Idempotency**: Operations should be idempotent to handle retries

### Saga Execution Flow

```
START
  │
  ├─► STEP 1: Create Order ──► SUCCESS ──► Continue
  │                              FAIL ──► Compensate & Stop
  │
  ├─► STEP 2: Process Payment ──► SUCCESS ──► Continue
  │                                 FAIL ──► Compensate All + Stop
  │
  ├─► STEP 3: Update Inventory ──► SUCCESS ──► Continue
  │                                  FAIL ──► Compensate All + Stop
  │
  ├─► STEP 4: Deliver Order ──► SUCCESS ──► COMPLETE
  │                              FAIL ──► Compensate All
  │
  END
```

## Setup Instructions

### Prerequisites

- Node.js 14+ and npm
- MongoDB instance (cloud-based or local)
- Terminal/Command prompt

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/gusgadirov/Documents/Dev/SDD/saga
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add your MongoDB URI**:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saga-db?retryWrites=true&w=majority
   ```

   Note: Replace `username`, `password`, and cluster details with your actual MongoDB credentials.

## Running the Services

You can run all services simultaneously using multiple terminal windows or tabs:

### Terminal 1 - Orchestrator Service
```bash
node src/orchestrator/orchestratorServer.js
```
Expected output: `Saga Orchestrator running on port 3000`

### Terminal 2 - Order Service
```bash
node src/services/orderServer.js
```
Expected output: `Order Service running on port 3001`

### Terminal 3 - Payment Service
```bash
node src/services/paymentServer.js
```
Expected output: `Payment Service running on port 3002`

### Terminal 4 - Inventory Service
```bash
node src/services/inventoryServer.js
```
Expected output: `Inventory Service running on port 3003`

### Terminal 5 - Shipping Service
```bash
node src/services/shippingServer.js
```
Expected output: `Shipping Service running on port 3004`

### Verify All Services are Running

```bash
# Check Orchestrator
curl http://localhost:3000/health

# Check Order Service
curl http://localhost:3001/health

# Check Payment Service
curl http://localhost:3002/health

# Check Inventory Service
curl http://localhost:3003/health

# Check Shipping Service
curl http://localhost:3004/health
```

## API Endpoints

### Orchestrator API

#### 1. Start Order Processing Saga
```
POST /api/order-saga/start
Content-Type: application/json

{
  "customerId": "customer123",
  "productId": "product456",
  "quantity": 2,
  "totalPrice": 199.99
}
```

**Response (Success)**:
```json
{
  "success": true,
  "sagaId": "uuid-string",
  "orderId": "uuid-string",
  "paymentId": "uuid-string",
  "shipmentId": "uuid-string",
  "message": "Order processed successfully"
}
```

**Response (Failure with Compensation)**:
```json
{
  "success": false,
  "sagaId": "uuid-string",
  "message": "Order processing failed and compensated",
  "error": "Payment processing failed"
}
```

#### 2. Get Saga Status
```
GET /api/order-saga/status/:sagaId
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sagaId": "uuid-string",
    "orderId": "uuid-string",
    "status": "COMPLETED",
    "steps": [
      {
        "stepName": "CREATE_ORDER",
        "status": "COMPLETED",
        "timestamp": "2024-11-24T10:30:00.000Z",
        "compensationStatus": null
      },
      ...
    ],
    "createdAt": "2024-11-24T10:30:00.000Z",
    "updatedAt": "2024-11-24T10:30:05.000Z"
  }
}
```

### Health Check
```
GET /health
```

### API Documentation
```
GET /
```

## Example Usage

### Using cURL

1. **Initialize Inventory** (optional - for testing):
```bash
curl -X POST http://localhost:3003/api/inventory/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PROD001",
    "quantity": 100
  }'
```

2. **Start Order Processing Saga**:
```bash
curl -X POST http://localhost:3000/api/order-saga/start \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "productId": "PROD001",
    "quantity": 5,
    "totalPrice": 499.95
  }'
```

3. **Check Saga Status**:
```bash
# Replace saga-id with the sagaId from the start response
curl http://localhost:3000/api/order-saga/status/saga-id-here
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

async function processSaga() {
  try {
    // Start saga
    const response = await axios.post('http://localhost:3000/api/order-saga/start', {
      customerId: 'CUST001',
      productId: 'PROD001',
      quantity: 2,
      totalPrice: 199.99
    });

    const { sagaId, orderId, success } = response.data;
    console.log('Saga started:', { sagaId, orderId, success });

    // Get saga status
    const statusResponse = await axios.get(`http://localhost:3000/api/order-saga/status/${sagaId}`);
    console.log('Saga status:', statusResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

processSaga();
```

## How the Saga Works

### Successful Order Processing

1. **Step 1: Create Order**
   - Orchestrator sends request to Order Service
   - Order Service creates order in CONFIRMED state
   - Saga Log records COMPLETED status

2. **Step 2: Process Payment**
   - Orchestrator sends payment request to Payment Service
   - Payment Service processes payment
   - Saga Log records COMPLETED status

3. **Step 3: Update Inventory**
   - Orchestrator sends inventory update request
   - Inventory Service reduces stock
   - Saga Log records COMPLETED status

4. **Step 4: Deliver Order**
   - Orchestrator sends delivery request to Shipping Service
   - Shipping Service creates shipment
   - Saga Log records COMPLETED status

5. **Final State: COMPLETED**
   - All steps successful
   - Order fully processed
   - Saga marked as COMPLETED

### Failed Order Processing with Compensation

If any step fails:

1. **Failure Detection**
   - Step fails (e.g., insufficient inventory)
   - Orchestrator marks step as FAILED

2. **Compensation Initiated**
   - Saga status changes to COMPENSATING
   - Orchestrator executes compensating actions in REVERSE order

3. **Reverse Order Compensation**
   - **Undo Step 3** (if completed): Reverse inventory update
   - **Undo Step 2** (if completed): Refund payment
   - **Undo Step 1** (if completed): Cancel order

4. **Final State: COMPENSATED**
   - System returns to consistent state
   - All changes rolled back
   - Saga marked as COMPENSATED

## Compensating Actions

Each saga step has a corresponding compensating action:

| Step | Action | Compensation |
|------|--------|--------------|
| CREATE_ORDER | Create order | Cancel order (mark as COMPENSATED) |
| PROCESS_PAYMENT | Charge customer | Refund payment |
| UPDATE_INVENTORY | Reduce stock | Restore stock (unreserve) |
| DELIVER_ORDER | Ship order | Cancel shipment |

### Compensation Example

**Scenario**: Payment fails after inventory is updated

**Execution Path**:
1. ✓ Order created
2. ✓ Inventory updated (stock reserved)
3. ✗ Payment failed

**Compensation Path**:
1. Refund payment (no-op, payment was not processed)
2. Unreserve inventory (restore stock)
3. Cancel order

## Key Benefits of This Implementation

1. **Scalability**: Each service operates independently
2. **Resilience**: Services can fail without blocking others
3. **Observability**: Saga Log tracks all steps and compensations
4. **Consistency**: Compensating actions ensure eventual consistency
5. **Simplicity**: Clear orchestration flow vs. complex event choreography

## Potential Enhancements

- Add retry logic with exponential backoff
- Implement message queue for asynchronous processing
- Add detailed monitoring and alerting
- Implement idempotency keys for true idempotency
- Add distributed tracing (using OpenTelemetry)
- Implement saga timeout handling
- Add support for human-controlled compensations
- Implement analytics for saga execution patterns

## References

- [GeeksforGeeks - Saga Design Pattern](https://www.geeksforgeeks.org/system-design/saga-design-pattern/)
- [Microservices Patterns - Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)

## License

MIT License

---

**Author**: Developed as an educational example of the Saga pattern in microservices
