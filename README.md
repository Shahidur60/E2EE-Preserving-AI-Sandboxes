# End-to-End Encrypted Chat System

A simple end-to-end encrypted chat system integrating a local TinyLLaMA model for intelligent replies and web-based Retrieval-Augmented Generation (RAG).

## Features

- 🔐 **End-to-End Encryption**: Messages are encoded using Base64 for protected transmission
- 👥 **Multi-User Support**: UserA and UserB can chat simultaneously
- 🤖 **LLM Integration**: Local TinyLLaMA model provides intelligent auto-replies
- 💾 **Message Persistence**: All messages are stored locally on disk
- 📝 **Knowledge Base Support**: LLM can read `notes.txt` as contextual knowledge
- 🎨 **Modern UI**: Responsive design with real-time updates

## Quick Start

### 1. Install Dependencies
```bash
npm install



```

### 2. Install Ollama (for running TinyLLaMA)

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### 3. Download TinyLLaMA Model

```bash
ollama pull tinyllama
```

### 4. Start the Server

```bash
npm start
```

### 5. Open the Chat Interface

- UserA: http://localhost:3000/userA.html
- UserB: http://localhost:3000/userB.html

## Project Structure

```
chat/
├── server.js          # Main server logic
├── userA.html         # Chat UI for UserA
├── userB.html         # Chat UI for UserB
├── chat.txt           # Message log file
├── notes.txt          # Knowledge base for LLM
├── package.json       # Project dependencies
└── README.md          # Documentation
```

## Usage

1. Send messages: Type into the input box and press Enter or click Send
2. View messages: Messages sync automatically between both users
3. LLM replies: AI generates a response after each user message
4. Clear chat: Click the Clear Chat button to reset logs
5. Knowledge base: Edit notes.txt to provide context for the LLM

## Technical Stack

- Frontend: HTML, CSS, JavaScript with Fetch API
- Backend: Node.js and Express
- Encryption: Base64 encoding (basic implementation)
- LLM: Ollama with TinyLLaMA
- Storage: Local file system

## Custom Configuration

### Change LLM Model

In 'server.js', modify the 'runTinyLLaMA' function:

```javascript
const ollama = spawn('ollama', ['run', 'your-model-name', prompt]);
```

### Change Port

At the bottom of server.js:

```javascript
app.listen(3000, () => {
  // Change port here
});
```

### Add More Users

1. Duplicate userA.html to create new user pages
2. Update the user identifier in each page
3. Adjust styles to differentiate users

## Troubleshooting

### LLM Not Working
- Ensure Ollama is installed and running
- Confirm TinyLLaMA is downloaded:`ollama list`
- Check server console logs for errors
- Test manually：`ollama run tinyllama

### Messages Not Syncing

- Verify network connectivity
- Ensure the server is running
- Check browser developer console for errors

### Port Already in Use

- Change the port in server.js
- Or terminate the process occupying the port

## License

MIT License
