"""
RAG Search Service
Vector similarity search using pgvector
"""
from typing import List, Dict, Any, Optional
import os
import asyncpg
import numpy as np


class RAGSearchService:
    """RAG Search using pgvector"""
    
    def __init__(self, db_pool):
        """Initialize RAG search service"""
        self.db_pool = db_pool
    
    
    async def search_similar_documents(
        self,
        query_embedding: List[float],
        collection_name: str = "knowledge_base",
        top_k: int = 5,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using vector similarity
        
        Args:
            query_embedding: Query vector embedding
            collection_name: Vector collection to search
            top_k: Number of results to return
            threshold: Minimum similarity threshold
        
        Returns:
            List of similar documents with metadata
        """
        try:
            async with self.db_pool.acquire() as conn:
                # Vector similarity search using pgvector
                query = """
                SELECT 
                    doc_id,
                    document_text,
                    metadata,
                    1 - (embedding <=> $1::vector) as similarity_score
                FROM vector_embeddings
                WHERE collection_name = $2
                    AND 1 - (embedding <=> $1::vector) >= $3
                ORDER BY embedding <=> $1::vector
                LIMIT $4;
                """
                
                # Convert embedding to vector format
                embedding_str = f"[{','.join(map(str, query_embedding))}]"
                
                results = await conn.fetch(
                    query,
                    embedding_str,
                    collection_name,
                    threshold,
                    top_k
                )
                
                # Format results
                documents = []
                for row in results:
                    documents.append({
                        "doc_id": row['doc_id'],
                        "text": row['document_text'],
                        "metadata": row['metadata'],
                        "similarity_score": float(row['similarity_score'])
                    })
                
                return documents
                
        except Exception as e:
            print(f"RAG search error: {str(e)}")
            return []
    
    
    async def search_similar_qa_history(
        self,
        query_embedding: List[float],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Search for similar past Q&A interactions
        
        Args:
            query_embedding: Query vector embedding
            top_k: Number of results to return
        
        Returns:
            List of similar past Q&A pairs
        """
        try:
            async with self.db_pool.acquire() as conn:
                query = """
                SELECT 
                    qh.question,
                    qh.answer,
                    qh.sql_query,
                    qh.created_at,
                    1 - (ve.embedding <=> $1::vector) as similarity_score
                FROM qa_history qh
                JOIN vector_embeddings ve ON ve.doc_id = qh.question_id::text
                WHERE ve.collection_name = 'qa_history'
                ORDER BY ve.embedding <=> $1::vector
                LIMIT $2;
                """
                
                embedding_str = f"[{','.join(map(str, query_embedding))}]"
                
                results = await conn.fetch(query, embedding_str, top_k)
                
                # Format results
                qa_pairs = []
                for row in results:
                    qa_pairs.append({
                        "question": row['question'],
                        "answer": row['answer'],
                        "sql_query": row['sql_query'],
                        "similarity_score": float(row['similarity_score']),
                        "created_at": row['created_at'].isoformat()
                    })
                
                return qa_pairs
                
        except Exception as e:
            print(f"QA history search error: {str(e)}")
            return []
    
    
    async def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics for a vector collection"""
        try:
            async with self.db_pool.acquire() as conn:
                query = """
                SELECT 
                    COUNT(*) as total_documents,
                    AVG(array_length(embedding, 1)) as avg_dimension
                FROM vector_embeddings
                WHERE collection_name = $1;
                """
                
                result = await conn.fetchrow(query, collection_name)
                
                return {
                    "collection_name": collection_name,
                    "total_documents": result['total_documents'],
                    "embedding_dimension": result['avg_dimension']
                }
                
        except Exception as e:
            return {
                "collection_name": collection_name,
                "error": str(e)
            }


# ============================================================================
# RAG CONTEXT BUILDER
# ============================================================================

class RAGContextBuilder:
    """Build RAG context from vector search results"""
    
    @staticmethod
    def build_context(
        documents: List[Dict[str, Any]],
        qa_history: List[Dict[str, Any]],
        max_tokens: int = 2000
    ) -> str:
        """
        Build RAG context string from search results
        
        Args:
            documents: Similar documents from knowledge base
            qa_history: Similar past Q&A pairs
            max_tokens: Maximum context length
        
        Returns:
            Formatted context string
        """
        context_parts = []
        
        # Add knowledge base documents
        if documents:
            context_parts.append("**RELEVANT KNOWLEDGE BASE DOCUMENTS:**\n")
            for idx, doc in enumerate(documents[:3], 1):
                context_parts.append(
                    f"{idx}. {doc['text'][:300]}... "
                    f"(Similarity: {doc['similarity_score']:.2f})\n"
                )
            context_parts.append("\n")
        
        # Add past Q&A history
        if qa_history:
            context_parts.append("**SIMILAR PAST QUESTIONS:**\n")
            for idx, qa in enumerate(qa_history[:2], 1):
                context_parts.append(
                    f"{idx}. Q: {qa['question']}\n"
                    f"   A: {qa['answer'][:200]}...\n"
                )
            context_parts.append("\n")
        
        # Join and truncate
        full_context = "".join(context_parts)
        
        # Simple token approximation (4 chars ≈ 1 token)
        if len(full_context) > max_tokens * 4:
            full_context = full_context[:max_tokens * 4] + "..."
        
        return full_context
