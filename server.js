import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());
app.use(express.static("."));

// OpenAI client (requires OPENAI_API_KEY environment variable)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Message storage
let messages = [];

// Save message to file
function saveMessage(user, text, timestamp) {
  const message = {
    user,
    text,
    timestamp: timestamp || new Date().toISOString(),
    id: Date.now() + Math.random()
  };
  messages.push(message);
  
  // Save to file
  const line = `[${message.timestamp}] ${user}: ${text}\n`;
  fs.appendFileSync("chat.txt", line);
  
  return message;
}

// Simple local LLM processing (RAG: read chat.txt and notes.txt)
async function localLLM(userMessage, _chatHistoryUnused) {
  try {
    // Read notes.txt and chat.txt as context
    const notes = fs.existsSync("notes.txt") ? fs.readFileSync("notes.txt", "utf8") : "";
    const chatFile = fs.existsSync("chat.txt") ? fs.readFileSync("chat.txt", "utf8") : "";
    const recentChat = chatFile.trim().split("\n").slice(-10).join("\n");
    
    // Build prompt
    const prompt = `Based on the following chat history and knowledge base, generate a short, useful, and direct reply in English:

【Knowledge Base】
${notes}

【Recent Chat History】
${recentChat}

【Current Message】
${userMessage}`;

    // Use OpenAI Chat Completions API
    return await runChatGPT(prompt);
  } catch (error) {
    console.error("LLM error:", error);
    return `LLM reply: I received your message "${userMessage}". Current time: ${new Date().toLocaleString()}`;
  }
}

// Use OpenAI ChatGPT
async function runChatGPT(prompt) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "OPENAI_API_KEY not detected, returning placeholder reply.";
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise and direct assistant, only return answers without extra prefixes or suffixes." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 256
    });
    const text = completion.choices?.[0]?.message?.content?.trim();
    return text || "(empty response)";
  } catch (err) {
    console.error("OpenAI API call failed:", err?.message || err);
    return "OpenAI API call failed, returning placeholder reply.";
  }
}

// Send message
app.post("/send", async (req, res) => {
  try {
    const { user, message } = req.body;
    // Fix encoding issue: decode Base64 first, then decode URI component
    const decoded = decodeURIComponent(Buffer.from(message, "base64").toString("utf8"));
    
    // Save user message
    const userMsg = saveMessage(user, decoded);
    
    // Generate LLM reply
    const llmReply = await localLLM(decoded, messages);
    const llmMsg = saveMessage("LLM", llmReply);
    
    // Return encoded reply
    const encoded = Buffer.from(encodeURIComponent(llmReply)).toString("base64");
    res.json({ 
      success: true, 
      reply: encoded,
      userMessage: userMsg,
      llmMessage: llmMsg
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Web page directly calls LLM (RAG: chat.txt + notes.txt), Base64 input/output
app.post("/llm", async (req, res) => {
  try {
    const { prompt } = req.body;
    // Fix encoding issue: decode Base64 first, then decode URI component
    const decoded = decodeURIComponent(Buffer.from(prompt || "", "base64").toString("utf8"));
    const reply = await localLLM(decoded, []);
    // Fix encoding issue: encode URI component first, then encode Base64
    const encoded = Buffer.from(encodeURIComponent(reply)).toString("base64");
    res.json({ success: true, output: encoded });
  } catch (error) {
    console.error("LLM interface error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Direct LLM interface - bypass filter, send directly to GPT, and log to chat.txt
app.post("/direct-llm", async (req, res) => {
  try {
    const { prompt, user } = req.body;
    // Decode user input
    const decoded = decodeURIComponent(Buffer.from(prompt || "", "base64").toString("utf8"));
    
    // Call OpenAI directly, not using RAG
    const reply = await runDirectChatGPT(decoded);
    
    // Log user question and LLM answer to chat.txt
    const timestamp = new Date().toISOString();
    const userLine = `[${timestamp}] ${user || 'User'}: ${decoded}\n`;
    const llmLine = `[${timestamp}] LLM: ${reply}\n`;
    fs.appendFileSync("chat.txt", userLine + llmLine);
    
    // Encode reply
    const encoded = Buffer.from(encodeURIComponent(reply)).toString("base64");
    res.json({ success: true, output: encoded });
  } catch (error) {
    console.error("Direct LLM interface error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Call OpenAI ChatGPT directly, not using RAG
async function runDirectChatGPT(prompt) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "OPENAI_API_KEY not detected, returning placeholder reply.";
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise and direct assistant, only return answers without extra prefixes or suffixes." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 256
    });
    const text = completion.choices?.[0]?.message?.content?.trim();
    return text || "(empty response)";
  } catch (err) {
    console.error("OpenAI API call failed:", err?.message || err);
    return "OpenAI API call failed, returning placeholder reply.";
  }
}

// Get all messages
app.get("/messages", (req, res) => {
  try {
    res.json({ 
      success: true, 
      messages: messages,
      chat: messages.map(m => `[${m.timestamp}] ${m.user}: ${m.text}`).join('\n')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear chat records
app.post("/clear", (req, res) => {
  messages = [];
  fs.writeFileSync("chat.txt", "");
  res.json({ success: true, message: "Chat records cleared" });
});

// Attacker monitoring interface - get all messages (for security testing)
app.get("/attacker", (req, res) => {
  res.sendFile(__dirname + "/attacker.html");
});

// Attacker monitoring interface - get all messages (including encrypted)
app.get("/attacker/messages", (req, res) => {
  try {
    res.json({ 
      success: true, 
      messages: messages,
      totalCount: messages.length,
      userACount: messages.filter(m => m.user === 'UserA').length,
      userBCount: messages.filter(m => m.user === 'UserB').length,
      llmCount: messages.filter(m => m.user === 'LLM').length,
      chat: messages.map(m => `[${m.timestamp}] ${m.user}: ${m.text}`).join('\n')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attacker monitoring interface - get raw encrypted messages
app.get("/attacker/raw", (req, res) => {
  try {
    const rawMessages = messages.map(msg => ({
      user: msg.user,
      timestamp: msg.timestamp,
      encrypted: Buffer.from(encodeURIComponent(msg.text)).toString("base64"),
      decrypted: msg.text
    }));
    
    res.json({ 
      success: true, 
      rawMessages: rawMessages,
      note: "These are intercepted raw messages, showing the vulnerability of Base64 encoding"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Content filtering function - use ChatGPT to filter harmful content
app.post("/filter-content", async (req, res) => {
  try {
    const { content, type } = req.body; // type: 'chat' or 'notes'
    
    if (!content) {
      return res.json({ success: false, error: "No content provided" });
    }
    
    // Use ChatGPT for content filtering
    const filteredContent = await filterHarmfulContent(content, type);
    
    res.json({ 
      success: true, 
      originalContent: content,
      filteredContent: filteredContent,
      type: type
    });
  } catch (error) {
    console.error("Content filtering error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ChatGPT content filtering function
async function filterHarmfulContent(content, type) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "OpenAI API key not configured. Cannot filter content.";
    }
    
    const prompt = `Please filter and clean the following ${type} content, removing any harmful, inappropriate, or offensive material while preserving the original meaning and context. Return only the cleaned content without any explanations:

Content to filter:
${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a content filter. Remove harmful, inappropriate, or offensive content while preserving the original meaning. Return only the cleaned content." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });
    
    const filtered = completion.choices?.[0]?.message?.content?.trim();
    return filtered || content; // Return original if filtering fails
  } catch (err) {
    console.error("Content filtering failed:", err?.message || err);
    return content; // Return original content if filtering fails
  }
}

// Start server
app.listen(3000, () => {
  console.log("🚀 End-to-end encrypted chat server started");
  console.log("📱 UserA: http://localhost:3000/userA.html");
  console.log("📱 UserB: http://localhost:3000/userB.html");
  console.log("🚨 Attacker: http://localhost:3000/attacker");
  console.log("💾 Messages will be saved to chat.txt");
  console.log("📝 LLM context from notes.txt + chat.txt (RAG)");
  console.log("🤖 Model: OpenAI ChatGPT (set OPENAI_API_KEY environment variable)");
});