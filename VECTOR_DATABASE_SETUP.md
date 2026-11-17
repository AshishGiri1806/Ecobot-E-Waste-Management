# ChromaDB Vector Database Setup

This document explains how to set up and use the ChromaDB vector database integration for the E-waste EcoBot application.

## Overview

The application now includes a ChromaDB vector database that:
- Stores past chat interactions for context-aware responses
- Provides access to a knowledge base of e-waste management information
- Enables semantic search across conversation history
- Improves response quality through relevant context retrieval

## Features

### Chat History Storage
- Automatically stores user messages and bot responses
- Extracts topics and metadata from conversations
- Enables context-aware responses based on previous interactions

### Contextual Documents
- Pre-loaded knowledge base with e-waste management information
- Categories include: general, recycling, DIY, environment
- Documents are automatically retrieved based on query relevance

### Semantic Search
- Uses vector embeddings for intelligent document retrieval
- Finds relevant information even with different wording
- Combines chat history and knowledge base for comprehensive responses

## Installation

### Option 1: Python Installation (Recommended)

1. Install ChromaDB:
```bash
npm run chromadb:install
# or manually: pip install chromadb
```

2. Start ChromaDB server:
```bash
npm run chromadb
# or manually: chroma run --host 0.0.0.0 --port 8000
```

### Option 2: Docker Installation

1. Run ChromaDB with Docker:
```bash
docker run -p 8000:8000 chromadb/chroma
```

## PDF Document Integration

The application includes powerful PDF document processing capabilities that automatically extract and integrate content from PDF files into the knowledge base.

### Adding Your Own PDFs

1. **Place PDF files** in your project root directory

2. **Extract text from PDFs**:
   ```bash
   npm run extract-pdfs
   ```

3. **Convert to TypeScript format** (for direct integration):
   ```bash
   npm run convert-pdf-to-ts
   ```

4. **Load into ChromaDB** (optional, for enhanced search):
   ```bash
   npm run load-pdf-docs
   ```

### Current PDF Documents

The system currently includes **173 document chunks** extracted from 3 PDF files:

- **E-waste Management Guidelines** (32 chunks, 8,790 words)
- **E-waste Status in India** (53 chunks, 14,961 words) 
- **Government E-waste Rules** (88 chunks, 24,432 words)

**Total**: 173 chunks with 48,183 words of contextual information

### PDF Processing Features

- **Automatic text extraction** from PDF files
- **Smart chunking** to break large documents into manageable pieces
- **Category classification** for organized retrieval
- **Fallback search** when ChromaDB is unavailable
- **Batch loading** for efficient vector database operations

## Usage

### Starting the Application

1. Start ChromaDB server (in one terminal):
```bash
npm run chromadb
```

2. Start the React application (in another terminal):
```bash
npm run dev
```

### How It Works

1. **Initialization**: When a user logs in, the vector service automatically initializes and loads contextual documents.

2. **Chat Storage**: Every conversation is stored with:
   - User message and bot response
   - Session ID and user ID
   - Extracted topics (computers, phones, recycling, etc.)
   - Location data (if provided)
   - Image presence flag

3. **Context Retrieval**: For each new message, the system:
   - Searches for relevant previous conversations
   - Retrieves pertinent knowledge base documents
   - Enhances the AI prompt with this context

4. **Response Generation**: The enhanced prompt provides the AI with:
   - Previous relevant conversations
   - Knowledge base information
   - Current user context

## Configuration

### Vector Service Settings

The vector service can be configured in `services/vectorService.ts`:

- **Chat History Limit**: Number of previous conversations to retrieve (default: 5)
- **Document Limit**: Number of knowledge base documents to include (default: 3)
- **Collection Names**: Customize collection names for chat and documents

### Knowledge Base

Contextual documents are stored in the `contextual_documents` collection and include:

- **E-waste Management Basics**: General information about e-waste
- **Finding Recycling Centers**: How to locate proper disposal facilities
- **DIY Repair and Upcycling**: Creative reuse and repair ideas
- **Environmental Impact**: Understanding the importance of proper disposal

### Adding New Documents

You can add new contextual documents programmatically:

```typescript
import { vectorService } from './services/vectorService';

await vectorService.addContextualDocument({
  id: "custom-doc",
  title: "Custom Title",
  content: "Document content...",
  source: "Source name",
  category: "category"
});
```

## API Reference

### VectorService Methods

#### `initialize(): Promise<void>`
Initializes the ChromaDB client and collections.

#### `storeChatInteraction(userId, sessionId, userMessage, botResponse, metadata): Promise<void>`
Stores a chat interaction in the vector database.

#### `getRelevantChatHistory(userId, query, limit): Promise<ChatInteraction[]>`
Retrieves relevant chat history for a user.

#### `getRelevantDocuments(query, category, limit): Promise<ContextualDocument[]>`
Retrieves relevant contextual documents.

#### `addContextualDocument(doc): Promise<void>`
Adds a new contextual document to the knowledge base.

#### `deleteUserData(userId): Promise<void>`
Deletes all data for a specific user (GDPR compliance).

## Troubleshooting

### ChromaDB Server Issues

1. **Port Already in Use**:
   ```bash
   # Find process using port 8000
   lsof -i :8000
   # Kill the process
   kill -9 <PID>
   ```

2. **ChromaDB Not Found**:
   ```bash
   # Install ChromaDB
   pip install chromadb
   # Or use Docker
   docker run -p 8000:8000 chromadb/chroma
   ```

3. **Connection Refused**:
   - Ensure ChromaDB server is running on port 8000
   - Check firewall settings
   - Verify the server URL in vectorService.ts

### Application Issues

1. **Vector Service Not Initializing**:
   - Check browser console for errors
   - Verify ChromaDB server is accessible
   - Check network connectivity

2. **No Contextual Information**:
   - Verify documents are loaded in the database
   - Check query similarity thresholds
   - Ensure proper topic extraction

## Performance Considerations

- **Memory Usage**: ChromaDB stores embeddings in memory for fast retrieval
- **Storage**: Vector embeddings require additional storage space
- **Query Performance**: Semantic search is optimized but may be slower than keyword search
- **Scalability**: ChromaDB handles moderate loads well; consider alternatives for high-scale deployments

## Security and Privacy

- **Data Isolation**: Each user's chat history is isolated by user ID
- **Data Retention**: Implement data retention policies as needed
- **Privacy**: User data is stored locally in ChromaDB; ensure compliance with privacy regulations
- **Deletion**: Use `deleteUserData()` for GDPR compliance

## Future Enhancements

- **Advanced Topic Classification**: Improve topic extraction with ML models
- **Document Versioning**: Support for updating knowledge base documents
- **Analytics**: Track usage patterns and popular queries
- **Multi-language Support**: Extend to support multiple languages
- **Custom Embeddings**: Use domain-specific embedding models for better relevance

## Support

For issues related to the vector database integration:
1. Check the browser console for error messages
2. Verify ChromaDB server status
3. Review the troubleshooting section above
4. Check the application logs for detailed error information
