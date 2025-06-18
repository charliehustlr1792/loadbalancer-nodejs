# 🚀 Load Balancer - Core Features & Architecture

A fully functional, feature-rich load balancer built with Node.js. Supports SSL termination, health checks, multiple balancing strategies, and more!

---

## ⚙️ Core Features Implemented

### 🔐 1. SSL Termination

* **What:** Handles HTTPS encryption/decryption
* **Why:** Offloads SSL processing from backend servers
* **How:** Uses self-signed certificates for development

---

### ❤️ 2. Health Checks

* **What:** Monitors backend server health
* **Why:** Only routes traffic to healthy servers
* **How:** Periodic HTTP requests to `/healthcheck` endpoint

---

### ⚖️ 3. Weighted Round Robin

* **What:** Distributes requests based on server capacity
* **Why:** More powerful servers can handle more requests
* **How:** Assigns weights (1-5) to servers for request distribution

---

### 🔁 4. Session Affinity (Sticky Sessions)

* **What:** Routes same client to the same server
* **Why:** Maintains user session state
* **How:** Uses cookies to remember client-server mapping

---

### 🧘 5. Graceful Server Management

* **What:** Safely add/remove servers without dropping connections
* **Why:** Enables zero-downtime deployments
* **How:** Draining mechanism for existing connections

---

### 🧠 6. Multiple Balancing Strategies

* `🎲 Random:` Randomly selects servers
* `🔁 Round Robin:` Cycles through servers sequentially
* `📊 Weighted:` Considers server capacity

---

### 📈 7. Metrics & Logging

* **What:** Tracks performance and request patterns
* **Why:** For monitoring and debugging
* **How:** Logs requests, responses, and timing data

---

## 🗂️ Project Structure

```
load-balancer/
├── index.js                  # Main application entry
├── routes/
│   ├── proxy.js              # Core load balancing logic
│   ├── health.js             # Health check endpoints
│   └── metrics.js            # Performance metrics
├── strategies/
│   ├── Strategy.js           # Base strategy interface
│   ├── RandomStrategy.js     # Random selection
│   ├── RoundRobinStrategy.js # Sequential selection
│   └── WeightedStrategy.js   # Capacity-based selection
├── ssl/
│   ├── key.pem               # SSL private key
│   └── cert.pem              # SSL certificate
├── backend-servers/
│   └── server.js             # Sample backend server
└── config.js                 # Configuration settings
```

---

## 📚 Key Learning Concepts

### 🧮 Load Balancing Algorithms

* **Round Robin:** Fair distribution, simple to implement
* **Weighted Round Robin:** Capacity-aware distribution
* **Random:** Simple but unpredictable
* **Least Connections (future scope):** Routes to server with fewest active connections

### 🏗️ System Design Patterns

* **Proxy Pattern:** Load balancer acts as intermediary
* **Strategy Pattern:** Swappable balancing algorithms
* **Circuit Breaker:** Health checks prevent cascading failures
* **Graceful Degradation:** Continues operating with fewer servers

### 🚨 Production Considerations

* SSL Termination → 🔐 Security & performance
* Health Monitoring → ❤️ Reliability
* Session Management → 🔁 Stateful app support
* Metrics Collection → 📊 Observability

---

## 🧪 Usage

### ▶️ Start Backend Servers

```bash
# Terminal 1
node backend-servers/server.js 3000

# Terminal 2
node backend-servers/server.js 3001

# Terminal 3
node backend-servers/server.js 3002
```

### ▶️ Start Load Balancer

```bash
node index.js
```

---

## 🔍 Test Load Balancing

```bash
# Test basic load balancing
curl -k https://localhost/api/test

# Check health status
curl -k https://localhost/health

# View metrics
curl -k https://localhost/metrics
```

---

## 🛠️ Configuration

Edit the `config.js` file to modify:

* ✅ Backend server list & weights
* ⏱️ Health check intervals
* ⚖️ Load balancing strategy
* 🔐 SSL certificate paths

---
