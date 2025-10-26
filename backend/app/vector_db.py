# app/vector_db.py
"""
Redis Vector Database Integration
Stores and searches embeddings for LLM context retrieval
"""

import redis
import openai
import numpy as np
import json
import os
from typing import List, Dict, Optional
from datetime import datetime

# Redis client
redis_client = redis.Redis(
    host=os.environ.get("REDIS_HOST", "localhost"),
    port=int(os.environ.get("REDIS_PORT", 6379)),
    password=os.environ.get("REDIS_PASSWORD"),
    decode_responses=True
)

# OpenAI for embeddings
openai.api_key = os.environ.get("OPENAI_API_KEY")


class VectorDB:
    """Redis-based vector database for storing and searching embeddings"""
    
    def __init__(self):
        self.index_name = "financial_context"
        self.embedding_dim = 1536  # OpenAI ada-002 dimension
        self._ensure_index()
    
    def _ensure_index(self):
        """Create Redis search index if it doesn't exist"""
        try:
            # Check if index exists
            redis_client.execute_command("FT.INFO", self.index_name)
        except redis.ResponseError:
            # Create index with vector field
            redis_client.execute_command(
                "FT.CREATE", self.index_name,
                "ON", "HASH",
                "PREFIX", "1", "vec:",
                "SCHEMA",
                "content", "TEXT",
                "metadata", "JSON",
                "workspace_id", "TAG",
                "embedding", "VECTOR", "HNSW", "6",
                "DIM", str(self.embedding_dim),
                "DISTANCE_METRIC", "COSINE"
            )
    
    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        response = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response['data'][0]['embedding']
    
    def add_document(
        self,
        workspace_id: str,
        content: str,
        metadata: Dict,
        doc_id: Optional[str] = None
    ) -> str:
        """
        Add a document to the vector database
        
        Args:
            workspace_id: Workspace identifier
            content: Text content to embed
            metadata: Additional metadata (category, source, etc.)
            doc_id: Optional custom document ID
        
        Returns:
            Document ID
        """
        # Generate embedding
        embedding = self._get_embedding(content)
        
        # Generate document ID
        if not doc_id:
            doc_id = f"{workspace_id}:{datetime.now().timestamp()}"
        
        # Store in Redis
        redis_client.hset(
            f"vec:{doc_id}",
            mapping={
                "content": content,
                "metadata": json.dumps(metadata),
                "workspace_id": workspace_id,
                "embedding": np.array(embedding, dtype=np.float32).tobytes()
            }
        )
        
        return doc_id
    
    def search(
        self,
        query: str,
        workspace_id: str,
        top_k: int = 5,
        score_threshold: float = 0.7
    ) -> List[Dict]:
        """
        Search for similar documents using vector similarity
        
        Args:
            query: Search query text
            workspace_id: Workspace to search within
            top_k: Number of results to return
            score_threshold: Minimum similarity score
        
        Returns:
            List of matching documents with similarity scores
        """
        # Generate query embedding
        query_embedding = self._get_embedding(query)
        
        # Redis vector search
        results = redis_client.execute_command(
            "FT.SEARCH", self.index_name,
            f"@workspace_id:{{{workspace_id}}}",
            "PARAMS", "2", "query_embedding", np.array(query_embedding, dtype=np.float32).tobytes(),
            "DIALECT", "2",
            "SORTBY", "__query_score", "DESC",
            "LIMIT", "0", str(top_k)
        )
        
        # Parse results
        documents = []
        for i in range(1, len(results), 2):
            doc_id = results[i]
            fields = results[i + 1]
            
            doc_dict = {"id": doc_id}
            for j in range(0, len(fields), 2):
                key = fields[j]
                value = fields[j + 1]
                
                if key == "content":
                    doc_dict["content"] = value
                elif key == "metadata":
                    doc_dict["metadata"] = json.loads(value)
                elif key == "__query_score":
                    doc_dict["score"] = float(value)
            
            # Only include results above threshold
            if doc_dict.get("score", 0) >= score_threshold:
                documents.append(doc_dict)
        
        return documents
    
    def add_financial_context(
        self,
        workspace_id: str,
        context_type: str,  # "transaction", "metric", "insight", etc.
        content: str,
        **metadata
    ):
        """Helper to add financial context with standard metadata"""
        return self.add_document(
            workspace_id=workspace_id,
            content=content,
            metadata={
                "type": context_type,
                "timestamp": datetime.now().isoformat(),
                **metadata
            }
        )
    
    def get_context_for_query(
        self,
        workspace_id: str,
        query: str,
        top_k: int = 3
    ) -> str:
        """Get formatted context string for LLM from similar documents"""
        results = self.search(query, workspace_id, top_k)
        
        if not results:
            return "No relevant context found."
        
        context_parts = []
        for doc in results:
            context_parts.append(f"[{doc['metadata'].get('type', 'unknown')}] {doc['content']}")
        
        return "\n\n".join(context_parts)


# Global instance
vector_db = VectorDB()
