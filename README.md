# AskBase

**Turn your documents into a smart AI chatbot. Embed it on your website in minutes.**

AskBase is a platform where businesses upload their knowledge base — PDFs, docs, text — and get an AI-powered chatbot that answers customer questions using their own data. No AI expertise needed.

---

## What It Does

- **Upload your docs** — PDFs, Word files, plain text. We handle the rest.
- **AI trains on your data** — Documents are parsed, chunked, and embedded automatically.
- **Embed chatbot on your site** — One script tag. That's it.
- **Forward-based learning** — The chatbot gets smarter over time from real user interactions.

## How It Works

```
Your Documents → AskBase processes & understands them
                        ↓
User asks a question on your website
                        ↓
AskBase retrieves the most relevant info from YOUR data
                        ↓
AI generates an accurate answer (no hallucination)
                        ↓
User feedback loop → chatbot improves over time
```

## Key Features

**For Businesses**
- Upload and manage your knowledge base from a dashboard
- Embed a chat widget on any website with one line of code
- Track what customers are asking — identify gaps in your docs
- Chatbot learns and improves from every conversation

**Under the Hood**
- Retrieval-Augmented Generation (RAG) architecture
- Structure-aware document parsing — tables, headings, sections stay intact
- Hybrid search — combines semantic understanding with keyword matching
- Hallucination prevention — every answer is validated against source documents
- Forward learning — feedback loop that continuously improves retrieval quality

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Database | MongoDB |
| Embeddings | Voyage AI |
| LLM | Groq (Llama 3) |
| Frontend | React (coming soon) |
| Hosting | Koyeb, MongoDB Atlas, Vercel |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/askbase.git

# Install dependencies
cd askbase/server
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Start the server
npm run dev
```

## Project Status

Currently in active development. See [RAGPlan](./RAGPlan) for the full architecture roadmap.

## License

MIT
