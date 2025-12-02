"""
Embedding Generator for RAG
Generate vector embeddings using Gemini Embedding API
"""
from typing import List, Optional
import os
import google.generativeai as genai


class EmbeddingGenerator:
    """Generate embeddings using Gemini Embedding API"""
    
    def __init__(self):
        """Initialize Gemini API"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        self.model_name = "models/embedding-001"
    
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text
        
        Returns:
            Embedding vector (768 dimensions)
        """
        try:
            # Generate embedding using Gemini
            result = genai.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_document"
            )
            
            return result['embedding']
            
        except Exception as e:
            print(f"Embedding generation error: {str(e)}")
            # Return zero vector on error
            return [0.0] * 768
    
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a query (uses different task type)
        
        Args:
            query: Query text
        
        Returns:
            Query embedding vector
        """
        try:
            result = genai.embed_content(
                model=self.model_name,
                content=query,
                task_type="retrieval_query"
            )
            
            return result['embedding']
            
        except Exception as e:
            print(f"Query embedding generation error: {str(e)}")
            return [0.0] * 768
    
    
    async def generate_batch_embeddings(
        self, 
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches
        
        Args:
            texts: List of texts
            batch_size: Number of texts per batch
        
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            for text in batch:
                embedding = await self.generate_embedding(text)
                embeddings.append(embedding)
        
        return embeddings


# ============================================================================
# EMBEDDING STORAGE
# ============================================================================

class EmbeddingStorage:
    """Store embeddings in PostgreSQL with pgvector"""
    
    def __init__(self, db_pool):
        """Initialize embedding storage"""
        self.db_pool = db_pool
    
    
    async def store_embedding(
        self,
        doc_id: str,
        document_text: str,
        embedding: List[float],
        collection_name: str = "knowledge_base",
        metadata: Optional[dict] = None
    ) -> bool:
        """
        Store document embedding in database
        
        Args:
            doc_id: Unique document identifier
            document_text: Original document text
            embedding: Vector embedding
            collection_name: Collection to store in
            metadata: Additional metadata
        
        Returns:
            Success status
        """
        try:
            async with self.db_pool.acquire() as conn:
                # Convert embedding to vector format
                embedding_str = f"[{','.join(map(str, embedding))}]"
                
                query = """
                INSERT INTO vector_embeddings (
                    doc_id, 
                    document_text, 
                    embedding, 
                    collection_name,
                    metadata
                )
                VALUES ($1, $2, $3::vector, $4, $5)
                ON CONFLICT (doc_id, collection_name) 
                DO UPDATE SET
                    document_text = EXCLUDED.document_text,
                    embedding = EXCLUDED.embedding,
                    metadata = EXCLUDED.metadata,
                    updated_at = CURRENT_TIMESTAMP;
                """
                
                await conn.execute(
                    query,
                    doc_id,
                    document_text,
                    embedding_str,
                    collection_name,
                    metadata or {}
                )
                
                return True
                
        except Exception as e:
            print(f"Embedding storage error: {str(e)}")
            return False
    
    
    async def store_qa_embedding(
        self,
        question_id: str,
        question: str,
        embedding: List[float]
    ) -> bool:
        """
        Store Q&A question embedding
        
        Args:
            question_id: Unique question identifier
            question: Question text
            embedding: Vector embedding
        
        Returns:
            Success status
        """
        return await self.store_embedding(
            doc_id=question_id,
            document_text=question,
            embedding=embedding,
            collection_name="qa_history",
            metadata={"type": "question"}
        )
    
    
    async def delete_embedding(
        self, 
        doc_id: str, 
        collection_name: str = "knowledge_base"
    ) -> bool:
        """Delete embedding from database"""
        try:
            async with self.db_pool.acquire() as conn:
                query = """
                DELETE FROM vector_embeddings
                WHERE doc_id = $1 AND collection_name = $2;
                """
                
                await conn.execute(query, doc_id, collection_name)
                return True
                
        except Exception as e:
            print(f"Embedding deletion error: {str(e)}")
            return False
    
    
    async def get_collection_count(self, collection_name: str) -> int:
        """Get number of embeddings in a collection"""
        try:
            async with self.db_pool.acquire() as conn:
                query = """
                SELECT COUNT(*) as count
                FROM vector_embeddings
                WHERE collection_name = $1;
                """
                
                result = await conn.fetchrow(query, collection_name)
                return result['count']
                
        except Exception as e:
            print(f"Collection count error: {str(e)}")
            return 0
