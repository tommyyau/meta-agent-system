# 🤖 Meta-Agent System

**Dynamic Conversation Engine for Professional Product Development**

A sophisticated AI-powered system that conducts intelligent, adaptive conversations with users to understand their product vision and generate professional wireframes. No static question banks - just pure conversation intelligence.

## 🎯 **What It Does**

The Meta-Agent System replaces traditional product discovery questionnaires with dynamic, GPT-4-powered conversations that:

- **Adapts in Real-Time** - Questions become more sophisticated as the system detects user expertise
- **Domain Intelligence** - Demonstrates expert-level knowledge in fintech, healthcare, e-commerce, and more
- **Escape Signals** - Detects when users are ready to skip ahead and generates smart assumptions
- **Professional Output** - Produces investor-ready wireframes from natural conversations

## ⚡ **Quick Start**

```bash
# 1. Clone and install
git clone https://github.com/your-org/meta-agent-system.git
cd meta-agent-system
npm install

# 2. Set up environment (interactive)
npm run setup:env

# 3. Start development
npm run dev
```

Visit `http://localhost:3000` and start a conversation!

## 🏗️ **Architecture**

### Dynamic Conversation Flow
```
User Input → GPT-4 Analysis → Dynamic Question Generation → Context Update
     ↓
Profile Detection + Sophistication Assessment + Escape Detection  
     ↓
Next Question OR Assumption Generation (seamless pivot)
     ↓
Professional Wireframe Generation
```

### Core Components
- **🧠 Dynamic Conversation Engine** - Real-time question generation using GPT-4
- **🔍 Profile Detection System** - Industry, role, and sophistication analysis
- **📊 Session Management** - In-memory conversation tracking with Redis caching
- **🎨 Wireframe Generator** - Professional wireframes from conversation insights
- **⚡ No Database** - Lightweight, conversation-driven architecture

## 💬 **Example Conversation**

**System:** "What problem are you trying to solve?"

**User:** "I want to build a fintech app"

**System:** *(detects novice level)* "What specific financial problem are you trying to solve for your users?"

**User:** "I'm building a regulatory reporting solution for mid-market banks using microservices architecture"

**System:** *(upgrades to expert level)* "Which specific compliance frameworks are you targeting - SOC2, PCI DSS, or regulatory reporting like BSA/AML? And are you planning real-time or batch processing for the reporting engine?"

**User:** "This is taking too long, just show me something"

**System:** *(detects escape signal)* "I understand! Let me generate smart assumptions based on our conversation and create your wireframes..."

## 🚀 **Key Features**

### ✨ **Dynamic Conversation Intelligence**
- Real-time sophistication assessment
- Domain-specific expertise (fintech, healthcare, e-commerce, SaaS)
- Context-aware question generation
- Natural escape hatch detection

### 🎯 **Professional Output Quality**
- Investor-presentation ready wireframes
- Multiple export formats (PDF, PNG, SVG, Figma)
- Responsive design layouts
- Interactive flow indicators

### ⚡ **Lightweight Architecture**
- No traditional database requirements
- In-memory session storage
- Redis caching (optional)
- 60-70% lower infrastructure costs

### 🔧 **Developer Experience**
- TypeScript throughout
- Comprehensive testing suite
- Interactive environment setup
- Real-time conversation debugging

## 📊 **What Makes This Different**

| Traditional Approach | Meta-Agent System |
|---------------------|-------------------|
| Static question forms | Dynamic GPT-4 conversations |
| Predetermined flows | Adaptive based on user expertise |
| Generic questions | Domain-specific intelligence |
| Separate systems | Integrated conversation engine |
| Database requirements | In-memory + caching |
| Manual content curation | AI-powered domain expertise |

## 🛠️ **Development**

### Testing the System
```bash
# Test conversation logic
npm run test:conversation

# Test profile detection
npm run test:profile

# Test OpenAI integration
npm run test:openai

# Test all services
npm run test:services
```

### Environment Management
```bash
# Interactive setup
npm run setup:env

# Validate configuration
npm run validate:env

# Debug environment
npm run debug:env
```

### Optional Redis Development
```bash
# Start Redis container
docker-compose up redis

# Redis with GUI
docker-compose --profile tools up
```

## 🌍 **Deployment**

### Vercel (Recommended)
```bash
# Setup and deploy
chmod +x infrastructure/deployment/vercel-cli.sh
./infrastructure/deployment/vercel-cli.sh full-setup
```

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...              # OpenAI GPT-4 API
NEXTAUTH_SECRET=...               # Authentication
SESSION_STORAGE=memory            # Session type

# Optional
UPSTASH_REDIS_REST_URL=...        # Redis caching
UPSTASH_REDIS_REST_TOKEN=...      # Redis auth
ANALYTICS_ENABLED=true            # Conversation analytics
```

## 📈 **Cost Optimization**

**Expected Monthly Costs:**
- **Vercel Pro:** $20/month (team features)
- **OpenAI GPT-4:** $30-100/month (usage-based)
- **Upstash Redis:** $0-15/month (optional)
- **Total:** $50-135/month

**vs Traditional Database Architecture:** $200-500+/month

## 📚 **Documentation**

- **[Development Setup](README.dev.md)** - Comprehensive development guide
- **[Repository Structure](REPOSITORY_STRUCTURE.md)** - Codebase organization
- **[Task Planning](generate-tasks.md)** - Implementation roadmap
- **[Infrastructure](infrastructure/README.md)** - Deployment and architecture

## 🎯 **Use Cases**

### **Product Managers**
- Rapid product discovery and wireframe generation
- Stakeholder presentation materials
- Feature prioritization insights

### **Founders**
- Investor pitch preparation
- Product-market fit exploration
- Technical specification development

### **Consultants**
- Client requirement gathering
- Professional deliverable generation
- Domain expertise demonstration

### **Development Teams**
- User story creation
- Technical architecture planning
- Feature specification documentation

## 🚀 **Contributing**

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm test
npm run type-check
npm run lint

# Commit and push
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 **Support**

- **Issues:** [GitHub Issues](https://github.com/your-org/meta-agent-system/issues)
- **Documentation:** [Wiki](https://github.com/your-org/meta-agent-system/wiki)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/meta-agent-system/discussions)

---

**Built with ❤️ using Next.js, TypeScript, and OpenAI GPT-4**

*Experience conversation-driven product development at its finest.* 