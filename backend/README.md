# Veronica AI

_An intelligent, interactive AI companion that brings conversations to life_

# [Example Video](https://www.linkedin.com/posts/adarsh-upadhyay-8b8a55232_just-trying-out-some-tests-for-an-interrupt-activity-7357392954577080321-SFyl?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAADotE8wBGedysvqK5BSTRYSkvULS14SZtVE)

## 🌟 Introduction

Veronica AI is a next-generation AI assistant platform that bridges the gap between conversational AI and immersive user experiences. Built with a sophisticated microservices architecture, Veronica combines advanced natural language processing with real-time 3D character interaction, creating a truly engaging AI companion.

### What Makes Veronica Special?

**🎭 Living AI Companion**: Unlike traditional text-based chatbots, Veronica features a fully animated 3D character built in Unity that reacts and responds with lifelike animations, expressions, and gestures that match the conversation context.

**⚡ Real-Time Interaction**: Powered by WebSocket technology, every interaction is instantaneous. Veronica can be interrupted mid-sentence, respond to real-time events, and maintain continuous conversation flow without delays. The interrupt system also enables Veronica to proactively initiate conversations, making her feel like a true companion rather than a passive assistant.

**🧠 Context-Aware Intelligence**: With vector embeddings and conversation summarization, Veronica remembers and learns from every interaction, building a rich understanding of user preferences and conversation history.

**🎵 Lifestyle Integration**: Deep Spotify integration allows Veronica to control your music, understand your taste, and even recommend songs based on your mood and conversation context.

**🔌 Extensible Platform**: Built on the Model Context Protocol (MCP), Veronica can be extended with new capabilities, integrations, and tools without changing the core architecture.

![Architecture Diagram](./assets/architecture.png)

_Veronica's distributed architecture enables seamless real-time interaction between the Unity client and multiple specialized backend services._

## 🏗️ Architecture Overview

Veronica AI implements a distributed, event-driven microservices architecture designed for real-time interaction and scalability:

### Core Components

- **Unity Client**: Interactive 3D character with real-time animations, facial expressions, and gesture responses
- **Main Server**: Express.js API server handling authentication, message processing, and AI orchestration
- **WebSocket Server**: Dedicated real-time communication hub for instant bidirectional messaging
- **Embed Worker**: Background service for intelligent conversation summarization and vector embeddings
- **Shared Database**: PostgreSQL with Drizzle ORM providing unified data persistence across services
- **Redis Cache**: High-performance session storage, message queuing, and pub/sub communication backbone

### WebSocket-Driven Communication Model

The platform's real-time capabilities are built on a sophisticated WebSocket architecture:

```
Unity Client ↔ WebSocket Gateway ↔ Message Router ↔ AI Services
     ↕                ↕                  ↕           ↕
 Animations      Session Mgmt      Queue System   Function Calls
```

**Key Features:**

- **Interrupt-Driven Responses**: Conversations can be interrupted and resumed seamlessly
- **Proactive Initiation**: Veronica can start conversations based on user context, schedule, or environmental triggers
- **Live Animation Sync**: Character animations triggered by real-time AI response events
- **Parallel Processing**: Multiple AI functions can execute simultaneously without blocking
- **Graceful Degradation**: System continues operating even if individual services are unavailable

### Event-Driven Processing

Veronica's interrupt-driven architecture enables:

- **Immediate Response**: User inputs are processed instantly without waiting for previous operations
- **Proactive Engagement**: Veronica can initiate conversations based on time, context, or user behavior patterns
- **Context Switching**: Smooth transitions between different conversation topics or tasks
- **Multi-Modal Interaction**: Simultaneous handling of text, voice commands, and gesture inputs
- **Background Intelligence**: Continuous learning and embedding generation without user awareness

## 🚀 Features

### 🎭 Interactive 3D Character

- **Unity-Powered Avatar**: Photorealistic 3D character with advanced rigging and animation systems
- **Emotion Engine**: Dynamic facial expressions that match conversation tone and content
- **Gesture Recognition**: Natural hand movements and body language synchronized with speech
- **Lip Synchronization**: Real-time lip-sync generation for natural speech animation
- **Customizable Appearance**: User-configurable character models, outfits, and environments

### 🧠 Core AI Capabilities

- **Conversational AI**: Advanced chat interface with deep context awareness and memory
- **Function Calling**: Extensible tool system for seamless external service integration
- **Vector Embeddings**: Semantic search capabilities and intelligent conversation summarization
- **MCP Support**: Model Context Protocol for unlimited extensibility and plugin architecture
- **Multi-Modal Processing**: Text, voice, and visual input understanding

### 🔌 Integrations & Services

- **Spotify Integration**: Complete music ecosystem control including playback, discovery, and mood-based recommendations
- **Weather Services**: Real-time weather data and forecasting with location awareness
- **User Preferences**: Persistent, intelligent preference learning and application
- **Calendar & Scheduling**: Smart calendar integration with natural language planning
- **Smart Home Control**: IoT device integration for ambient environment control

### ⚡ Real-time Features

- **WebSocket Communication**: Sub-100ms response times for natural conversation flow
- **Interrupt Handling**: Graceful conversation interruption and context switching
- **Proactive Conversation**: Veronica can initiate conversations based on context, time, or user patterns
- **Background Processing**: Invisible intelligence enhancement without user disruption
- **Live Notifications**: Real-time alerts and proactive assistance
- **Concurrent Operations**: Multiple simultaneous AI tasks without blocking user interaction

### 🛡️ Advanced Capabilities

- **Memory Management**: Long-term conversation memory with automatic relevance scoring
- **Predictive Intelligence**: Anticipatory responses based on user patterns and context
- **Cross-Session Continuity**: Seamless experience across multiple interaction sessions
- **Adaptive Learning**: Continuous improvement through user interaction analysis
- **Privacy-First Design**: Local processing options and granular data control

## 📁 Project Structure

```
veronica-ai/
├── packages/
│   ├── server/                    # Main API server (Express.js)
│   │   ├── routes/               # RESTful API endpoints
│   │   │   ├── auth.ts          # Authentication & user management
│   │   │   ├── message.ts       # Core conversation handling
│   │   │   ├── spotify.ts       # Music service integration
│   │   │   ├── interrupt.ts     # Real-time interruption control
│   │   │   └── user-prefs.ts    # User preference management
│   │   ├── functions/           # AI function tools & capabilities
│   │   │   ├── spotify.ts       # Music control functions
│   │   │   ├── preferences.ts   # User setting functions
│   │   │   └── misc.ts          # Utility functions (weather, etc.)
│   │   ├── constants/           # System configuration
│   │   │   ├── function.ts      # AI tool definitions
│   │   │   ├── genre.ts         # Music genre constants
│   │   │   ├── routines.ts      # Daily routine templates
│   │   │   └── day.ts           # Time/date utilities
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Core utilities & helpers
│   │
│   ├── ws-server/               # WebSocket server for real-time communication
│   │   ├── index.ts            # WebSocket connection management
│   │   └── types/              # WebSocket message schemas
│   │
│   ├── embed-worker/           # Background AI processing service
│   │   ├── index.ts           # Main worker process
│   │   └── utils/             # Embedding & summarization tools
│   │       ├── embeder.ts     # Vector embedding generation
│   │       ├── summarizer.ts  # Conversation summarization
│   │       ├── storeMessage.ts # Database persistence
│   │       └── redis-client.ts # Queue management
│   │
│   └── shared-db/             # Unified database layer
│       ├── schema.ts          # Complete database schema
│       ├── drizzle.config.ts  # ORM configuration
│       ├── types/             # Database type definitions
│       └── drizzle/           # Migration files
│
├── assets/                    # Documentation & static resources
│   └── architecture.png      # System architecture diagram
│
├── docker-compose.yml         # Multi-service orchestration
├── package.json              # Workspace configuration
└── README.md                 # This documentation
```

### Unity Client (Separate Repository)

```
veronica-unity-client/
├── Assets/
│   ├── Characters/           # 3D character models & animations
│   ├── Animations/          # Facial expressions & gestures
│   ├── Scripts/             # C# networking & AI integration
│   ├── UI/                  # User interface components
│   └── Environments/        # 3D scene environments
├── Packages/                # Unity package dependencies
└── ProjectSettings/         # Unity project configuration
```

## 🛠️ Tech Stack

### Backend Services

- **Runtime**: Bun (High-performance JavaScript/TypeScript runtime)
- **API Server**: Express.js with TypeScript
- **WebSocket**: Native WebSocket implementation for real-time communication
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Cache/Queue**: Redis for session management, message queuing, and pub/sub
- **Authentication**: JWT tokens with secure refresh mechanism

### AI & Machine Learning

- **Language Models**: OpenAI GPT-4, Google Gemini, Cerebras for diverse AI capabilities
- **Vector Database**: PostgreSQL with pgvector extension for semantic search
- **Embeddings**: OpenAI text-embedding-ada-002 for conversation understanding
- **Function Calling**: Custom tool system with dynamic function registration

### Unity Client

- **Engine**: Unity 2023.3 LTS
- **Rendering**: Universal Render Pipeline (URP) for optimized performance
- **Animation**: Timeline and Cinemachine for cinematic character control
- **Networking**: Native WebSocket with custom protocol implementation
- **Audio**: Unity Audio System with real-time lip-sync generation

### DevOps & Infrastructure

- **Containerization**: Docker & Docker Compose for service orchestration
- **Reverse Proxy**: Traefik for load balancing and SSL termination
- **Process Management**: PM2 for production process supervision
- **Monitoring**: Custom health checks and Redis-based metrics
- **CI/CD**: GitHub Actions for automated testing and deployment

## 🔧 Installation & Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2.4+
- Docker and Docker Compose
- PostgreSQL database
- Redis instance

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/veronica-ai.git
cd veronica-ai
bun install
```

### 2. Environment Configuration

Create `.env` files in the following locations with required variables:

**Root `.env`:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/veronica_ai
REDIS_URL=redis://localhost:6379

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# AI APIs
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key

# Spotify
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

### 3. Database Setup

```bash
# Generate database schema
bun run db:generate

# Push schema to database
bun run db:push
```

### 4. Start Services

#### Development (Individual Services)

```bash
# Terminal 1: Start main server
bun run server

# Terminal 2: Start WebSocket server
bun run ws-server

# Terminal 3: Start embed worker
bun run embeder
```

#### Production (Docker Compose)

```bash
docker-compose up -d
```

## 📡 API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Messages

- `POST /` - Send message and get AI response
- `GET /messages` - Retrieve conversation history

### Spotify Integration

- `GET /spotify/auth` - Spotify OAuth flow
- `POST /spotify/callback` - OAuth callback
- Various Spotify control endpoints

### User Preferences

- `GET /user/preferences` - Get user settings
- `PUT /user/preferences` - Update user settings

### System

- `GET /ping` - Health check
- `POST /interrupt` - Interrupt ongoing operations

## 🔌 WebSocket Events & Real-Time Communication

Veronica's real-time capabilities are built on a sophisticated WebSocket protocol that enables seamless interaction between the Unity client and backend services.

### Connection Flow

1. **Authentication**: Client establishes WebSocket connection with JWT token
2. **Session Binding**: Server associates connection with user session and preferences
3. **Event Registration**: Client subscribes to relevant event channels
4. **Bidirectional Communication**: Instant message exchange begins

### Client → Server Messages

```typescript
interface WebSocketRequest {
  type: "AUTH" | "ACTION" | "INTERRUPT" | "HEARTBEAT";
  id: string; // Unique request identifier
  token: string; // JWT authentication token
  payload: {
    action?: string; // Specific action to perform
    message?: string; // User message content
    context?: object; // Additional context data
    timestamp?: number; // Client timestamp
  };
}
```

### Server → Client Messages

```typescript
interface WebSocketResponse {
  type: "RESULT" | "NOTIFICATION" | "ANIMATION" | "ERROR";
  id: string; // Response correlation ID
  payload: {
    success: boolean;
    message: string;
    data?: {
      response?: string; // AI response text
      animation?: string; // Animation trigger name
      emotion?: string; // Facial expression type
      gesture?: string; // Body gesture identifier
      audio?: string; // Audio file reference
      metadata?: object; // Additional response data
    };
    error?: string; // Error details if applicable
  };
}
```

### Interrupt-Driven Architecture

**Seamless Conversation Control:**

- **Real-Time Interruption**: Users can interrupt Veronica mid-response
- **Proactive Conversation Initiation**: Veronica can start conversations based on user context, schedule, mood, or environmental factors
- **Context Preservation**: Interrupted context is saved and can be resumed
- **Graceful Transitions**: Smooth switching between conversation topics
- **Queue Management**: Message priority handling for optimal user experience

**Implementation Details:**

```typescript
// Interrupt handling example
{
  type: "INTERRUPT",
  id: "interrupt-123",
  token: "jwt-token",
  payload: {
    action: "stop_current_response",
    new_message: "Actually, let's talk about something else",
    preserve_context: true
  }
}
```

### Animation Synchronization

The WebSocket protocol includes specialized events for Unity character animation:

```typescript
// Animation trigger events
{
  type: "ANIMATION",
  payload: {
    animation: "thinking",        // Base animation state
    emotion: "curious",          // Facial expression overlay
    gesture: "hand_gesture_1",   // Hand/arm movement
    intensity: 0.8,             // Animation intensity (0-1)
    duration: 2500              // Animation duration in ms
  }
}
```

**Supported Animation Types:**

- **Emotions**: Happy, sad, curious, surprised, thoughtful, excited
- **Gestures**: Hand waves, pointing, shrugging, applause
- **States**: Idle, thinking, speaking, listening, laughing
- **Transitions**: Smooth blending between animation states

## 🤖 AI Functions

The system includes several built-in AI functions:

### Spotify Controls

- `nextSong()` - Skip to next track
- `currentTrack()` - Get currently playing
- `playTrack(query)` - Search and play specific track
- `randomTrack(genre?)` - Play random song

### Utilities

- `getCurrentWeather(location)` - Weather information
- `getForecastWeather(location)` - Weather forecast
- `findRelevantConversation(query)` - Search conversation history

### Preferences

- `updatePreference(key, value)` - Update user setting
- `deletePreference(key)` - Remove user setting

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and authentication
- **messages**: Conversation history
- **messages_summary**: Vector embeddings for semantic search
- **tokens**: OAuth and session tokens
- **user_preferences**: User settings and preferences

## 🔄 Background Processing & Intelligence

The embed worker represents Veronica's "subconscious" - continuously processing and learning from conversations to enhance future interactions:

### Intelligent Processing Pipeline

1. **Message Ingestion**: Real-time capture of all conversation data
2. **Batch Aggregation**: Intelligent grouping of related messages for context
3. **AI Summarization**: GPT-powered conversation summary generation
4. **Vector Embedding**: Creation of semantic representations for similarity search
5. **Knowledge Storage**: Persistent storage of processed intelligence data
6. **Context Retrieval**: Smart retrieval of relevant past conversations

### Advanced Capabilities

**Semantic Memory:**

- **Conversation Clustering**: Automatic grouping of related discussion topics
- **Preference Inference**: Learning user preferences from conversation patterns
- **Mood Detection**: Tracking emotional context across conversation sessions
- **Interest Mapping**: Building comprehensive user interest profiles

**Proactive Intelligence:**

- **Predictive Responses**: Anticipating user needs based on conversation patterns
- **Contextual Recommendations**: Suggesting relevant actions or content
- **Proactive Conversation Starters**: Initiating conversations about user interests, upcoming events, or mood changes
- **Automatic Task Detection**: Identifying actionable items from conversations
- **Smart Reminders**: Context-aware notification generation
- **Environmental Awareness**: Starting conversations based on time of day, weather, or calendar events

### Performance Characteristics

```typescript
// Processing metrics
{
  message_processing_time: "< 100ms",
  embedding_generation: "< 500ms",
  batch_processing_size: "10-50 messages",
  memory_retention: "Indefinite with smart pruning",
  search_response_time: "< 50ms"
}
```

## 🚦 Available Scripts

```bash
# Database operations
bun run db:generate    # Generate Drizzle schema
bun run db:push       # Push schema to database

# Service startup
bun run server        # Start main API server
bun run ws-server     # Start WebSocket server
bun run embeder       # Start embedding worker
```

## 🐳 Docker Services

The `docker-compose.yml` includes:

- **Redis**: Cache and message queue
- **Traefik**: Reverse proxy and load balancer
- **WebSocket Server**: Real-time communication
- **Main Server**: API endpoints
- **Embed Worker**: Background processing

## 🔐 Security Features

- JWT-based authentication with access/refresh tokens
- Secure password hashing with bcrypt
- Token-based API access control
- WebSocket connection authentication
- Environment-based configuration

## 🎵 Spotify Integration

Full Spotify Web API integration including:

- OAuth 2.0 authentication flow
- Playback control (play, pause, skip, shuffle)
- Track search and recommendations
- Current playing status
- Genre-based random playback

## 📊 Monitoring & Health

- Health check endpoints (`/ping`)
- Redis connection monitoring
- Database connection pooling
- Error logging and handling
- WebSocket connection management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the architecture diagram

---

Built with ❤️ using Bun, TypeScript, and modern web technologies.
