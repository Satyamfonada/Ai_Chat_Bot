# Chatbot with Session Management

A React-based chatbot application with session management, chat history, and intelligent session naming.

## Features

### 1. Session Management
- Each chat conversation is saved as a separate session
- Sessions are automatically created when you start a new conversation
- Switch between different chat sessions seamlessly

### 2. Intelligent Session Naming
- Session names are automatically generated based on the first message content
- Keywords are extracted from your first message to create meaningful session names
- Example: "How do I learn Python programming?" → "Learn Python Programming"

### 3. Chat History
- View all your previous chat sessions in the sidebar
- Click on any session to load its complete conversation history
- Sessions are sorted by most recent activity

### 4. Session Management
- Create new chat sessions with the "+ New Chat" button
- Delete unwanted sessions with the "×" button (appears on hover)
- Session timestamps show when each conversation was last updated

## Database Setup

### 1. Supabase Setup
1. Create a new Supabase project
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL commands from `database_schema.sql`

### 2. Environment Configuration
Update your `src/supabaseClient.ts` with your Supabase credentials:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

## Database Schema

### Tables

#### `chat_sessions`
- `id`: Unique session identifier (UUID)
- `name`: Session name (auto-generated from first message)
- `created_at`: When the session was created
- `updated_at`: When the session was last updated

#### `messages`
- `id`: Unique message identifier (UUID)
- `session_id`: Reference to chat_sessions table
- `message`: The actual message content
- `sender`: Either 'user' or 'bot'
- `created_at`: When the message was sent

## How It Works

### Session Creation
1. Click "+ New Chat" to create a new session
2. Type your first message
3. The system automatically generates a session name based on your message
4. All subsequent messages in that conversation are saved to the same session

### Session Naming Algorithm
The system extracts meaningful keywords from your first message:
- Filters out common words (the, and, or, but, etc.)
- Takes the first 2-3 meaningful keywords
- Capitalizes each word for better readability

### Message Flow
1. User sends a message
2. Message is saved to the current session
3. AI generates a response
4. Bot response is saved to the same session
5. Session's `updated_at` timestamp is refreshed

## Usage Examples

### Example 1: Python Programming Help
- First message: "How do I learn Python programming?"
- Session name: "Learn Python Programming"
- All Python-related questions and answers saved in this session

### Example 2: Math Problem
- First message: "Can you help me solve this calculus problem?"
- Session name: "Solve Calculus Problem"
- All math-related conversation saved in this session

### Example 3: General Question
- First message: "What's the weather like today?"
- Session name: "Weather Today"
- Weather-related conversation saved in this session

## Technical Implementation

### Key Components

#### API Functions (`src/api.ts`)
- `fetchChatSessions()`: Get all chat sessions
- `createChatSession()`: Create a new session
- `fetchMessages(sessionId)`: Get messages for a specific session
- `sendMessage(sessionId, message)`: Save user message
- `sendBotReply(sessionId, reply)`: Save bot reply
- `generateSessionName(message)`: Generate session name from message
- `deleteChatSession(sessionId)`: Delete session and all its messages

#### React Component (`src/ChatBot.tsx`)
- Session state management
- Message handling with session context
- UI for session list and chat interface
- Loading states and error handling

#### Styling (`src/chatbot.css`)
- Modern, responsive design
- Session list with hover effects
- Typing indicators
- Empty state handling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your Supabase database using the schema provided

3. Update your Supabase credentials in `src/supabaseClient.ts`

4. Start the development server:
```bash
npm start
```

## Future Enhancements

- Session search functionality
- Session categories/tags
- Export chat sessions
- Session sharing
- Message editing
- Rich text support
- File attachments