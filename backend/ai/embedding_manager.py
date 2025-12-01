"""
Multi-Provider Embedding Manager
Supports OpenAI, Google (Gemini), Anthropic, and HuggingFace embeddings
No hard dependency on any single provider
"""
from typing import List, Optional
import logging
import os

# LangChain embedding imports
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.embeddings.base import Embeddings

logger = logging.getLogger(__name__)

# ==================== EMBEDDING CONFIGURATIONS ====================

EMBEDDING_CONFIGS = {
    "openai": {
        "models": {
            "text-embedding-3-small": {"dimensions": 1536, "cost_per_1m": 0.02},
            "text-embedding-3-large": {"dimensions": 3072, "cost_per_1m": 0.13},
            "text-embedding-ada-002": {"dimensions": 1536, "cost_per_1m": 0.10}
        },
        "default_model": "text-embedding-3-small"
    },
    "google": {
        "models": {
            "models/embedding-001": {"dimensions": 768, "cost_per_1m": 0.00},  # FREE
            "models/text-embedding-004": {"dimensions": 768, "cost_per_1m": 0.00}  # FREE
        },
        "default_model": "models/embedding-001"
    },
    "huggingface": {
        "models": {
            "all-MiniLM-L6-v2": {"dimensions": 384, "cost_per_1m": 0.00},  # FREE
            "all-mpnet-base-v2": {"dimensions": 768, "cost_per_1m": 0.00},  # FREE
            "sentence-transformers/all-MiniLM-L6-v2": {"dimensions": 384, "cost_per_1m": 0.00}
        },
        "default_model": "all-MiniLM-L6-v2"
    },
    "anthropic": {
        # Note: Anthropic doesn't have dedicated embedding models yet
        # Falls back to Voyage AI embeddings (Anthropic's recommended partner)
        "models": {
            "voyage-02": {"dimensions": 1024, "cost_per_1m": 0.10}
        },
        "default_model": "voyage-02"
    }
}

# ==================== EMBEDDING MANAGER ====================

class EmbeddingManager:
    """
    Manages embeddings across multiple providers
    Automatically selects embedding provider based on LLM provider
    """
    
    @staticmethod
    def get_embeddings(
        provider: str = "google",
        model: Optional[str] = None,
        **kwargs
    ) -> Embeddings:
        """
        Get embeddings instance for specified provider
        
        Args:
            provider: "openai", "google", "anthropic", or "huggingface"
            model: Specific model name (optional, uses default if not specified)
            **kwargs: Additional provider-specific arguments
        
        Returns:
            Embeddings instance
        
        Examples:
            # Use Google (Gemini) embeddings - FREE
            embeddings = EmbeddingManager.get_embeddings("google")
            
            # Use OpenAI embeddings
            embeddings = EmbeddingManager.get_embeddings("openai")
            
            # Use local HuggingFace embeddings - FREE, no API calls
            embeddings = EmbeddingManager.get_embeddings("huggingface")
        """
        
        provider = provider.lower()
        
        if provider == "openai":
            return EmbeddingManager._get_openai_embeddings(model, **kwargs)
        elif provider == "google" or provider == "gemini":
            return EmbeddingManager._get_google_embeddings(model, **kwargs)
        elif provider == "anthropic":
            return EmbeddingManager._get_anthropic_embeddings(model, **kwargs)
        elif provider == "huggingface" or provider == "local":
            return EmbeddingManager._get_huggingface_embeddings(model, **kwargs)
        else:
            logger.warning(f"Unknown provider {provider}, falling back to Google (free)")
            return EmbeddingManager._get_google_embeddings()
    
    @staticmethod
    def _get_openai_embeddings(model: Optional[str] = None, **kwargs) -> Embeddings:
        """Get OpenAI embeddings"""
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set")
            
            model = model or EMBEDDING_CONFIGS["openai"]["default_model"]
            
            return OpenAIEmbeddings(
                model=model,
                api_key=api_key,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI embeddings: {e}")
            raise
    
    @staticmethod
    def _get_google_embeddings(model: Optional[str] = None, **kwargs) -> Embeddings:
        """Get Google (Gemini) embeddings - FREE"""
        try:
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not set")
            
            model = model or EMBEDDING_CONFIGS["google"]["default_model"]
            
            return GoogleGenerativeAIEmbeddings(
                model=model,
                google_api_key=api_key,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Failed to initialize Google embeddings: {e}")
            raise
    
    @staticmethod
    def _get_anthropic_embeddings(model: Optional[str] = None, **kwargs) -> Embeddings:
        """
        Get embeddings for Anthropic users
        Uses Voyage AI (Anthropic's recommended embedding partner)
        """
        try:
            # Anthropic recommends Voyage AI for embeddings
            from langchain_community.embeddings import VoyageEmbeddings
            
            api_key = os.getenv("VOYAGE_API_KEY")
            if not api_key:
                logger.warning("VOYAGE_API_KEY not set, falling back to HuggingFace (free)")
                return EmbeddingManager._get_huggingface_embeddings()
            
            model = model or "voyage-02"
            
            return VoyageEmbeddings(
                voyage_api_key=api_key,
                model=model,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Failed to initialize Voyage embeddings: {e}")
            logger.info("Falling back to HuggingFace (free)")
            return EmbeddingManager._get_huggingface_embeddings()
    
    @staticmethod
    def _get_huggingface_embeddings(model: Optional[str] = None, **kwargs) -> Embeddings:
        """
        Get HuggingFace embeddings - FREE, runs locally
        No API calls, no costs, works offline
        """
        try:
            model = model or EMBEDDING_CONFIGS["huggingface"]["default_model"]
            
            return HuggingFaceEmbeddings(
                model_name=model,
                model_kwargs={'device': 'cpu'},  # Use 'cuda' if GPU available
                encode_kwargs={'normalize_embeddings': True},
                **kwargs
            )
        except Exception as e:
            logger.error(f"Failed to initialize HuggingFace embeddings: {e}")
            raise
    
    @staticmethod
    def get_embedding_info(provider: str) -> dict:
        """Get embedding configuration info for a provider"""
        provider = provider.lower()
        if provider in EMBEDDING_CONFIGS:
            return EMBEDDING_CONFIGS[provider]
        else:
            return {"error": f"Unknown provider: {provider}"}
    
    @staticmethod
    def estimate_cost(provider: str, num_tokens: int, model: Optional[str] = None) -> float:
        """
        Estimate embedding cost
        
        Args:
            provider: Embedding provider
            num_tokens: Number of tokens to embed
            model: Specific model (optional)
        
        Returns:
            Estimated cost in USD
        """
        provider = provider.lower()
        
        if provider not in EMBEDDING_CONFIGS:
            return 0.0
        
        config = EMBEDDING_CONFIGS[provider]
        model = model or config["default_model"]
        
        if model not in config["models"]:
            return 0.0
        
        cost_per_1m = config["models"][model]["cost_per_1m"]
        return (num_tokens / 1_000_000) * cost_per_1m

# ==================== PROVIDER MATCHING ====================

class ProviderMatcher:
    """
    Automatically matches embedding provider to LLM provider
    Ensures consistency and optimal cost
    """
    
    PROVIDER_MAPPING = {
        "openai": "openai",
        "anthropic": "huggingface",  # Anthropic doesn't have embeddings, use free local
        "google": "google",
        "gemini": "google"
    }
    
    @staticmethod
    def get_matching_embedding_provider(llm_provider: str) -> str:
        """
        Get recommended embedding provider for LLM provider
        
        Args:
            llm_provider: "openai", "anthropic", "google", or "gemini"
        
        Returns:
            Recommended embedding provider
        
        Examples:
            >>> ProviderMatcher.get_matching_embedding_provider("gemini")
            "google"
            
            >>> ProviderMatcher.get_matching_embedding_provider("anthropic")
            "huggingface"  # Free local embeddings
        """
        llm_provider = llm_provider.lower()
        return ProviderMatcher.PROVIDER_MAPPING.get(llm_provider, "google")

# ==================== CONVENIENCE FUNCTIONS ====================

def get_embeddings_for_llm(llm_provider: str, model: Optional[str] = None) -> Embeddings:
    """
    Convenience function: Get embeddings matching LLM provider
    
    Args:
        llm_provider: "openai", "anthropic", "google", or "gemini"
        model: Optional specific embedding model
    
    Returns:
        Embeddings instance
    
    Examples:
        # If using Gemini for chat, use Google embeddings (free)
        embeddings = get_embeddings_for_llm("gemini")
        
        # If using Claude, use HuggingFace embeddings (free local)
        embeddings = get_embeddings_for_llm("anthropic")
        
        # If using GPT, use OpenAI embeddings
        embeddings = get_embeddings_for_llm("openai")
    """
    embedding_provider = ProviderMatcher.get_matching_embedding_provider(llm_provider)
    return EmbeddingManager.get_embeddings(embedding_provider, model)

# ==================== TESTING ====================

def test_embeddings():
    """Test all embedding providers"""
    test_text = "Temperature excursions require immediate notification."
    
    providers = ["google", "huggingface"]
    
    for provider in providers:
        try:
            print(f"\n🧪 Testing {provider} embeddings...")
            embeddings = EmbeddingManager.get_embeddings(provider)
            
            # Test single query
            vector = embeddings.embed_query(test_text)
            print(f"✅ {provider}: Generated {len(vector)}-dimensional vector")
            
            # Test batch
            vectors = embeddings.embed_documents([test_text, "Another test"])
            print(f"✅ {provider}: Generated {len(vectors)} vectors")
            
        except Exception as e:
            print(f"❌ {provider}: {e}")

if __name__ == "__main__":
    test_embeddings()
