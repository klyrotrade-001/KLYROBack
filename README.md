# KLYRO Ecommerce Backend

Standalone Node.js backend API server for the KLYRO Smart Living ecommerce storefront.

## Quick Start

### Start Server
```bash
cd backend
npm start
```
Or with auto-restart on file changes (Node 18+):
```bash
npm run dev
```

The server runs by default on port `5000` (configurable via `PORT` environment variable):
```
http://localhost:5000
```

---

## Directory Structure

```
backend/
├── config/
│   └── siteConfig.js        # Brand configuration & WhatsApp settings
├── controllers/
│   ├── ordersController.js  # Order creation, status updates, tracking logic
│   ├── productsController.js# Product listing, filtering, search, categories
│   ├── newsletterController.js # Email subscriber management
│   └── inquiriesController.js  # Warranty & support inquiry handler
├── data/
│   ├── products.json        # 17 authentic KLYRO products & 5 categories
│   ├── orders.json          # Persistent order records with tracking history
│   ├── subscribers.json     # Newsletter subscriptions
│   └── inquiries.json       # Customer service inquiries
├── package.json
├── server.js                # HTTP Server with routing, CORS & JSON parsing
└── README.md
```

---

## API Endpoints Reference

### 1. Health Check
* `GET /api/health`
* Response: `{ status: "online", name: "KLYRO", port: 5000, timestamp: "..." }`

### 2. Products
* `GET /api/products`
  * Query parameters:
    * `category`: filter by category slug (`kitchen-items`, `mini-electronics`, etc.)
    * `search`: keyword search across title, description, and category
    * `sort`: `price-asc`, `price-desc`, `discount`, `bestseller`, `rating`
    * `limit`: integer limit
* `GET /api/products/:slug`
  * Returns product details for the given slug (e.g. `/api/products/portable-blender`)

### 3. Categories
* `GET /api/categories`
  * Returns the 5 core categories with descriptions, images, and live item counts.

### 4. Orders
* `POST /api/orders`
  * Creates and logs an order with unique ID (`KLY-XXXXX`), calculates totals, and generates WhatsApp message link.
  * Request Body:
    ```json
    {
      "customer": {
        "fullName": "Sneha Nair",
        "mobileNumber": "9876543210",
        "email": "sneha@example.com",
        "houseBuilding": "Flat 304, Palm Grove",
        "streetLocality": "Kadavanthra",
        "city": "Kochi",
        "state": "Kerala",
        "pinCode": "682020"
      },
      "items": [
        {
          "productId": "prod-1",
          "quantity": 1,
          "selectedVariant": "Sage Green"
        }
      ]
    }
    ```
  * Response: `{ success: true, orderId: "KLY-84920", whatsappUrl: "https://wa.me/..." }`
* `GET /api/orders`
  * Lists all registered orders.
* `GET /api/orders/:id`
  * Returns specific order details and tracking status timeline.
* `PATCH /api/orders/:id`
  * Updates order fulfillment status (`confirmed`, `processing`, `shipped`, `delivered`).

### 5. Order Tracking
* `GET /api/track?query=KLY-78241` or `GET /api/track?query=9876543210`
  * Returns matching order records with timeline progress.

### 6. Newsletter & Inquiries
* `POST /api/newsletter`: `{ "email": "user@example.com" }`
* `POST /api/inquiries`: `{ "name": "...", "phone": "...", "message": "...", "type": "warranty" }`

