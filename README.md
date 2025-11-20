<p align="left">
  <img src="assets/logodark.svg" alt="Vexa Logo" width="40"/>
</p>

# Vexa — Real-Time Meeting Transcription API

<p align="left">
  <img height="24" src="assets/google-meet.svg" alt="Google Meet" style="margin-right: 8px; vertical-align: middle;"/>
  <strong>Google Meet</strong>
    
  <img height="24" src="assets/microsoft-teams.svg" alt="Microsoft Teams" style="margin-right: 8px; vertical-align: middle;"/>
  <strong>Microsoft Teams</strong>
</p>

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-join-5865F2.svg)](https://discord.gg/Ga9duGkVz9)

## 🎉  What's new in v0.6 (4 Oct 2025)

- **Microsoft Teams support** (alongside Google Meet)
- **WebSocket transcripts streaming** for efficient sub-second delivery
- Numerous reliability and joining improvements from real-world usage of our hosted service

**Vexa** drops a bot into your online meeting and streams transcripts to your apps in real time.

- **Platforms:** Google Meet **and Microsoft Teams**
- **Transport:** REST **or WebSocket (sub-second)**
- **Run it your way:** Open source & self-hostable, or use the hosted API.

👉 **Hosted (start in 5 minutes):** https://vexa.ai

👉 **Self-host guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

> See full release notes: https://github.com/Vexa-ai/vexa/releases

---

## Quickstart

- Hosted (fastest): Get your API key at [https://vexa.ai/dashboard/api-keys](https://vexa.ai/dashboard/api-keys)

Or self-host the entire stack:

Self-host with Docker Compose:

```bash
git clone https://github.com/Vexa-ai/vexa.git
cd vexa
make all            # CPU by default (Whisper tiny) — good for development
# For GPU:
# make all TARGET=gpu    # (Whisper medium) — recommended for production quality
```

* Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
* For self-hosted API key: follow `vexa/nbs/0_basic_test.ipynb`

## 1. Send bot to meeting:

`API_HOST` for hosted version is `https://api.cloud.vexa.ai `
`API_HOST` for self-hosted version (default) is `http://localhost:18056`

### Request a bot for Microsoft Teams

```bash
curl -X POST https://<API_HOST>/bots \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <API_KEY>" \
  -d '{
    "platform": "teams",
    "native_meeting_id": "<NUMERIC_MEETING_ID>",
    "passcode": "<MEETING_PASSCODE>"
  }'
```

### Or request a bot for Google Meet

```bash
curl -X POST https://<API_HOST>/bots \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <API_KEY>" \
  -d '{
    "platform": "google_meet",
    "native_meeting_id": "<MEET_CODE_XXX-XXXX-XXX>"
  }'
```

## 2. Get transcripts:

### Get transcripts over REST

```bash
curl -H "X-API-Key: <API_KEY>" \
  "https://<API_HOST>/transcripts/<platform>/<native_meeting_id>"
```

For real-time streaming (sub‑second), see the [WebSocket guide](docs/websocket.md).
For full REST details, see the [User API Guide](docs/user_api_guide.md).

Note: Meeting IDs are user-provided (Google Meet code like `xxx-xxxx-xxx` or Teams numeric ID and passcode). Vexa does not generate meeting IDs.

---

## Who Vexa is for

* **Enterprises (self-host):** Data sovereignty and control on your infra
* **Teams using hosted API:** Fastest path from meeting to transcript
* **n8n/indie builders:** Low-code automations powered by real-time transcripts
  - Tutorial: https://vexa.ai/blog/google-meet-transcription-n8n-workflow

---

## Roadmap

* Zoom support (public preview next)

> For issues and progress, join our [Discord](https://discord.gg/Ga9duGkVz9).

## Build on Top. In Hours, Not Months

**Build powerful meeting assistants (like Otter.ai, Fireflies.ai, Fathom) for your startup, internal use, or custom integrations.**

The Vexa API provides powerful abstractions and a clear separation of concerns, enabling you to build sophisticated applications on top with a safe and enjoyable coding experience.

<p align="center">
  <img src="assets/simplified_flow.png" alt="Vexa Architecture Flow" width="100%"/>
</p>

- [api-gateway](./services/api-gateway): Routes API requests to appropriate services
- [mcp](./services/mcp): Provides MCP-capable agents with Vexa as a toolkit
- [bot-manager](./services/bot-manager): Handles bot lifecycle management
- [vexa-bot](./services/vexa-bot): The bot that joins meetings and captures audio
- [WhisperLive](./services/WhisperLive): Real-time audio transcription service
- [transcription-collector](./services/transcription-collector): Processes and stores transcription segments
- [Database models](./libs/shared-models/shared_models/models.py): Data structures for storing meeting information

> 💫 If you're building with Vexa, we'd love your support! [Star our repo](https://github.com/Vexa-ai/vexa/stargazers) to help us reach 1500 stars.

### Features:

- **Real-time multilingual transcription** supporting **100 languages** with **Whisper**
- **Real-time translation** across all 100 supported languages

## Current Status

- **Public API**: Fully available with self-service API keys at [www.vexa.ai](https://www.vexa.ai/?utm_source=github&utm_medium=readme&utm_campaign=vexa_repo)
- **Google Meet Bot:** Fully operational bot for joining Google Meet calls
- **Teams Bot:** Supported in v0.6
- **Real-time Transcription:** Low-latency, multilingual transcription service is live
- **Real-time Translation:** Instant translation between 100 supported languages
- **WebSocket Streaming:** Sub-second transcript delivery via WebSocket API
- **Pending:** Speaker identification is under development

## Coming Next

- **Zoom Bot:** Integration for automated meeting attendance (July 2025)
- **Direct Streaming:** Ability to stream audio directly from web/mobile apps

## Self-Deployment

For **security-minded companies**, Vexa offers complete **self-deployment** options.

To run Vexa locally on your own infrastructure, the primary command you'll use after cloning the repository is `make all`. This command sets up the environment (CPU by default, or GPU if specified), builds all necessary Docker images, and starts the services.

### Quick Start with Docker Compose

Follow these steps to deploy Vexa on your own infrastructure:

#### Prerequisites

- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- **Git** for cloning the repository
- At least **4GB RAM** for CPU version (8GB+ recommended for GPU)
- **50GB disk space** for models and logs

#### Step-by-Step Deployment

**1. Clone the repository:**

```bash
git clone https://github.com/Vexa-ai/vexa.git
cd vexa
```

**2. Choose your deployment mode:**

**Option A: Quick Start with Make (Recommended)**

**CPU Mode (Development/Testing):**

```bash
# Set up environment and download models
make all TARGET=cpu

# This will automatically:
# - Copy environment configuration from env-example.cpu
# - Download Whisper models (tiny by default for CPU)
# - Build vexa-bot image
# - Build all Docker images
# - Start all services
```

**GPU Mode (Production - requires NVIDIA GPU):**

```bash
# Set up environment and download models
make all TARGET=gpu

# This will automatically:
# - Copy environment configuration from env-example.gpu
# - Download Whisper models (medium by default for GPU)
# - Build vexa-bot image with GPU support
# - Build all Docker images with GPU support
# - Start all services
```

**Option B: Manual Step-by-Step with Docker Compose**

If you prefer manual control or need to customize the build process:

**CPU Mode:**

```bash
# 1. Copy environment configuration
cp env-example.cpu .env

# 2. Download Whisper models (optional, will download on first use)
python download_model.py

# 3. Build the vexa-bot image (REQUIRED before docker-compose)
make build-bot-image

# 4. Build and start all services with docker-compose
docker-compose --profile cpu build
docker network create vexa_shared_network
docker-compose --profile cpu up -d

# 5. Initialize database
make migrate-or-init
```

**GPU Mode:**

```bash
# 1. Copy environment configuration
cp env-example.gpu .env

# 2. Download Whisper models
python download_model.py

# 3. Build the vexa-bot image (REQUIRED before docker-compose)
make build-bot-image

# 4. Build and start all services with docker-compose
docker-compose --profile gpu build
docker-compose --profile gpu up -d

# 5. Initialize database
make migrate-or-init
```

> **Important:** The `vexa-bot` image must be built separately using `make build-bot-image` before running `docker-compose up`, as bot-manager dynamically creates bot containers from this pre-built image.

**3. Verify services are running:**

```bash
docker-compose ps

# You should see these services running:
# - api-gateway (port 8056)
# - admin-api (port 8057)
# - bot-manager
# - transcription-collector (port 8123)
# - whisperlive-cpu (CPU mode) or whisperlive (GPU mode)
# - redis
# - postgres
# - mcp (port 18888)
```

**4. Check service health:**

```bash
# Check API Gateway
curl http://localhost:18056/health

# Check Admin API
curl http://localhost:18057/health

# Check Transcription Collector
curl http://localhost:18123/health
```

**5. Create your first API key:**

Follow the notebook at `nbs/0_basic_test.ipynb` or use the Admin API directly:

```bash
# Create a user and get API key
# See nbs/0_basic_test.ipynb for detailed examples
```

**6. Test the deployment:**

```bash
# Send a bot to a Google Meet
curl -X POST http://localhost:18056/bots \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "platform": "google_meet",
    "native_meeting_id": "xxx-xxxx-xxx"
  }'

# Get transcripts
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:18056/transcripts/google_meet/xxx-xxxx-xxx"
```

#### Important Configuration Notes

**For Production Deployment:**

1. **Update `docker-compose.yml` for production:**

   - Set appropriate `WHISPER_MODEL_SIZE` (small, medium, large)
   - Configure proper logging levels (`LOG_LEVEL=INFO` or `WARNING`)
2. **Security considerations:**

   - Change default database passwords
   - Use secure API tokens
   - Configure firewall rules
   - Set up HTTPS/TLS for external access
3. **Resource allocation:**

   - CPU: 4+ cores recommended
   - RAM: 8GB minimum, 16GB+ for production
   - GPU: NVIDIA GPU with 8GB+ VRAM for optimal performance

#### Troubleshooting

**Services not starting:**

```bash
# Check logs
docker-compose logs -f <service-name>

# Common issues:
# - Port conflicts: Change ports in docker-compose.yml
# - Insufficient resources: Check Docker resource limits
# - Missing models: Run `python download_model.py`
```

**Transcription not working through bot:**

```bash
# Verify WhisperLive is accessible
docker-compose exec bot-manager curl -I http://whisperlive-cpu:9091

# Check bot logs
docker-compose logs -f | grep -i whisper

# Ensure WHISPER_LIVE_URL includes port :9090
```

**Database connection issues:**

```bash
# Wait for database to be ready
docker-compose logs postgres | grep "ready to accept connections"

# Run migrations if needed
make migrate-or-init
```

For comprehensive deployment instructions, monitoring setup, and advanced configuration, see the [Local Deployment and Testing Guide](DEPLOYMENT.md).

## Updating Your Build After Code Changes

When you make changes to any service, you need to rebuild and restart the affected containers:

### Quick Reference

```bash
# Rebuild and restart a single service
docker-compose up --build -d <service-name>

# Rebuild all services
make build TARGET=cpu  # or TARGET=gpu

# Rebuild the bot image specifically
make build-bot-image
```

### Service-Specific Updates

| Changed Service                   | Command                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| **vexa-bot** (bot code)     | `make build-bot-image`                                       |
| **transcription-collector** | `docker-compose up --build -d transcription-collector`       |
| **bot-manager**             | `docker-compose up --build -d bot-manager`                   |
| **WhisperLive** (CPU)       | `docker-compose --profile cpu up --build -d whisperlive-cpu` |
| **WhisperLive** (GPU)       | `docker-compose --profile gpu up --build -d whisperlive`     |
| **api-gateway**             | `docker-compose up --build -d api-gateway`                   |
| **admin-api**               | `docker-compose up --build -d admin-api`                     |

### Common Workflows

**Quick iteration during development:**

```bash
# After making changes
docker-compose up --build -d <service-name>

# View logs
docker-compose logs -f <service-name>
```

**Full rebuild (when dependencies change):**

```bash
# Stop everything
make down

# Rebuild all services
make build TARGET=cpu

# Start services
make up TARGET=cpu

# Run migrations if needed
make migrate-or-init
```

**Force rebuild without cache:**

```bash
# Use when Docker cache causes issues
docker-compose build --no-cache <service-name>
docker-compose up -d <service-name>
```

### Important Notes

- **vexa-bot** containers are created dynamically for each meeting and auto-remove when done
- After rebuilding `vexa-bot` image, new bot containers will automatically use the updated image
- Changes to Python code (without dependency updates) can sometimes use `docker-compose restart <service>` instead of rebuild
- Always rebuild when you modify `requirements.txt`, `package.json`, or Dockerfile

## Contributing

Contributors are welcome! Join our community and help shape Vexa's future. Here's how to get involved:

1. **Understand Our Direction**:
2. **Engage on Discord** ([Discord Community](https://discord.gg/Ga9duGkVz9)):

   * **Introduce Yourself**: Start by saying hello in the introductions channel.
   * **Stay Informed**: Check the Discord channel for known issues, feature requests, and ongoing discussions. Issues actively being discussed often have dedicated channels.
   * **Discuss Ideas**: Share your feature requests, report bugs, and participate in conversations about a specific issue you're interested in delivering.
   * **Get Assigned**: If you feel ready to contribute, discuss the issue you'd like to work on and ask to get assigned on Discord.
3. **Development Process**:

   * Browse available **tasks** (often linked from Discord discussions or the roadmap).
   * Request task assignment through Discord if not already assigned.
   * Submit **pull requests** for review.

- **Critical Tasks & Bounties**:
  - Selected **high-priority tasks** may be marked with **bounties**.
  - Bounties are sponsored by the **Vexa core team**.
  - Check task descriptions (often on the roadmap or Discord) for bounty details and requirements.

We look forward to your contributions!

## Contributing & License

We ❤️ contributions. Join our Discord and open issues/PRs.
Licensed under **Apache-2.0** — see [LICENSE](LICENSE).

## Project Links

- 🌐 [Vexa Website](https://vexa.ai)
- 💼 [LinkedIn](https://www.linkedin.com/company/vexa-ai/)
- 🐦 [X (@grankin_d)](https://x.com/grankin_d)
- 💬 [Discord Community](https://discord.gg/Ga9duGkVz9)

[![Meet Founder](https://img.shields.io/badge/LinkedIn-Dmitry_Grankin-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dmitry-grankin/)

[![Join Discord](https://img.shields.io/badge/Discord-Community-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/Ga9duGkVz9)

The Vexa name and logo are trademarks of **Vexa.ai Inc**.
