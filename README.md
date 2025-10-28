# 端到端加密聊天系统

一个简单的端到端加密聊天系统，集成本地TinyLLaMA进行智能回复与网页内RAG查询。

## 功能特性

- 🔐 **端到端加密**: 使用Base64编码保护消息传输
- 👥 **多用户支持**: UserA和UserB可以同时聊天
- 🤖 **LLM集成**: 集成本地TinyLLaMA模型进行智能回复
- 💾 **消息持久化**: 所有消息保存到本地文件
- 📝 **知识库支持**: LLM可以读取notes.txt作为上下文
- 🎨 **现代化UI**: 响应式设计，支持实时消息更新

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装Ollama（用于运行TinyLLaMA）

```bash
# macOS
brew install ollama

# 或者访问 https://ollama.ai 下载安装包
```

### 3. 下载TinyLLaMA模型

```bash
ollama pull tinyllama
```

### 4. 启动服务器

```bash
npm start
```

### 5. 打开聊天界面

- UserA: http://localhost:3000/userA.html
- UserB: http://localhost:3000/userB.html

## 文件结构

```
chat/
├── server.js          # 主服务器文件
├── userA.html         # UserA聊天界面
├── userB.html         # UserB聊天界面
├── chat.txt           # 聊天记录文件
├── notes.txt          # LLM知识库文件
├── package.json       # 项目依赖
└── README.md          # 说明文档
```

## 使用说明

1. **发送消息**: 在输入框中输入消息，按回车或点击发送按钮
2. **查看消息**: 消息会自动同步到两个界面
3. **LLM回复**: 每次发送消息后，LLM会自动生成回复
4. **清空聊天**: 点击"清空聊天"按钮可以清空所有记录
5. **知识库**: 编辑notes.txt文件来为LLM提供上下文信息

## 技术实现

- **前端**: 纯HTML/CSS/JavaScript，使用Fetch API
- **后端**: Node.js + Express
- **加密**: Base64编码（简单实现）
- **LLM**: Ollama + TinyLLaMA
- **存储**: 本地文件系统

## 自定义配置

### 修改LLM模型

在server.js中修改`runTinyLLaMA`函数：

```javascript
const ollama = spawn('ollama', ['run', 'your-model-name', prompt]);
```

### 修改端口

在server.js底部修改：

```javascript
app.listen(3000, () => {
  // 修改端口号
});
```

### 添加更多用户

1. 复制userA.html创建新用户界面
2. 修改用户标识符
3. 更新样式以区分不同用户

## 故障排除

### LLM不工作
- 确保Ollama已安装并运行
- 检查TinyLLaMA模型是否已下载：`ollama list`
- 查看服务器控制台错误信息
- 尝试手动运行：`ollama run tinyllama "你好"`

### 消息不同步
- 检查网络连接
- 确保服务器正在运行
- 查看浏览器控制台错误

### 端口被占用
- 修改server.js中的端口号
- 或者停止占用端口的其他服务

## 许可证

MIT License
