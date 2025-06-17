# AI Chat Application

A modern AI-powered chat application built with Next.js, featuring user authentication, conversation management, and multi-modal file support.

## Features

### 🤖 AI Integration
- **OpenAI Integration**: Seamless integration with OpenAI's GPT models
- **Multiple Model Support**: Support for various GPT models (GPT-3.5-turbo, GPT-4, etc.)
- **Token Management**: Intelligent token counting and conversation trimming using tiktoken
- **Streaming Responses**: Real-time streaming of AI responses for better user experience

### 💬 Chat Management
- **Conversation History**: Persistent conversation storage with PostgreSQL
- **System Prompts**: Customizable system prompts for each conversation
- **Message Threading**: Organized message history with context awareness
- **Conversation Renaming**: Ability to rename conversations for better organization

### 📁 File Upload Support
- **Multi-modal Support**: Handle images, text files, and documents
- **Image Processing**: Support for JPG, PNG, GIF, WebP images
- **Text File Processing**: Handle TXT, MD, CSV, JSON, JS, HTML, CSS, XML, YAML files
- **Document Processing**: Support for PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF files
- **Automatic File Type Detection**: Smart file type detection based on extension and MIME type

### 🔐 Authentication & Security
- **User Registration**: Secure user registration with password hashing
- **JWT Authentication**: Token-based authentication system
- **Password Recovery**: Forgot password functionality with email verification
- **Session Management**: Secure session handling and auto-logout

### 🎨 User Interface
- **Modern Design**: Clean and intuitive user interface
- **Theme Support**: Light/dark theme toggle
- **Responsive Design**: Mobile-friendly responsive layout
- **Material-UI Integration**: Consistent design system with MUI components
- **Custom Fonts**: Support for custom fonts including Chinese characters

### 🛠️ Technical Features
- **TypeScript**: Full TypeScript support for type safety
- **Prisma ORM**: Database management with Prisma
- **PostgreSQL**: Robust database backend
- **Middleware**: Route protection and authentication middleware
- **API Routes**: RESTful API design with Next.js API routes

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: Latest React features
- **TypeScript**: Type-safe development
- **Material-UI (MUI)**: Component library
- **Emotion**: CSS-in-JS styling
- **Tailwind CSS**: Utility-first CSS framework

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

### AI & External Services
- **OpenAI API**: AI chat completions
- **tiktoken**: Token counting for AI models
- **Resend**: Email service for notifications

## Getting Started

### Prerequisites
- Node.js 18 or later
- PostgreSQL database
- OpenAI API key

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/aigleam_db"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# Email (optional)
RESEND_API_KEY="your-resend-api-key"
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aigleam_next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate deploy
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Getting Started
1. **Register**: Create a new account at `/register`
2. **Login**: Sign in at `/login`
3. **Chat**: Start chatting at `/hello`

### Chat Features
- **New Conversation**: Click "New Chat" to start a fresh conversation
- **Upload Files**: Drag and drop or click to upload images, documents, or text files
- **Model Selection**: Choose from available GPT models
- **System Prompts**: Set custom system prompts for specialized conversations
- **Conversation Management**: Rename, delete, or organize your conversations

### File Upload Guidelines
- **Images**: Supported formats - JPG, PNG, GIF, WebP
- **Text Files**: TXT, MD, CSV, JSON, JS, HTML, CSS, XML, YAML
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF
- **Size Limits**: Check your deployment platform's file size limits

## Database Schema

### Core Models
- **User**: User accounts and authentication
- **Conversation**: Chat conversations with metadata
- **Message**: Individual messages with file attachments
- **Prompt**: Custom system prompts

### Key Features
- **Cascade Deletion**: Messages are automatically deleted when conversations are removed
- **File Metadata**: Store file information with messages
- **System Prompts**: Conversation-level system prompt configuration

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check-auth` - Authentication verification
- `POST /api/forgotpassword` - Password recovery

### Chat
- `POST /api/chat` - Send chat message (with file upload support)
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/rename` - Rename conversation
- `DELETE /api/conversations/[id]` - Delete conversation

### Messages
- `GET /api/messages` - Get conversation messages

## Development

### Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev    # Create and apply new migration
npx prisma generate  # Generate Prisma client
```

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── hello/          # Chat interface
│   ├── login/          # Authentication pages
│   └── register/
├── lib/                # Utility libraries
│   ├── auth.ts         # Authentication utilities
│   ├── prisma.ts       # Database connection
│   └── services/       # Business logic services
└── types/              # TypeScript type definitions
```

## Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Railway, etc.)

### Recommended Platforms
- **Vercel**: Optimal for Next.js applications
- **Railway**: Good for full-stack apps with PostgreSQL
- **Render**: Alternative with database support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is private and proprietary. All rights reserved.

## Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Note**: This application requires valid API keys and proper environment configuration to function correctly. Please ensure all environment variables are properly set before deployment.