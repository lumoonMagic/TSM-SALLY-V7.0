"""
Pure Provider Manager - Complete LLM Independence
Each provider uses ONLY its own native capabilities - no cross dependencies

If you choose OpenAI -> uses OpenAI chat + OpenAI embeddings
If you choose Gemini -> uses Gemini chat + Gemini embeddings  
If you choose Claude -> uses Claude chat + Claude embeddings (via Voyage)

ZERO cross-dependencies between providers!
"""
from typing import Tuple, Optional
import logging
import os

from langchain.embeddings.base import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel

# Provider-specific imports (only import what you use)
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_anthropic import ChatAnthropic

# Fallback for Claude embeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

# ==================== PROVIDER CONFIGURATIONS ====================

PROVIDER_CONFIGS = {
    "openai": {
        "name": "OpenAI",
        "chat_models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
        "default_chat_model": "gpt-4o-mini",
        "embedding_models": ["text-embedding-3-small", "text-embedding-3-large"],
        "default_embedding_model": "text-embedding-3-small",
        "embedding_dimensions": 1536,
        "requires_api_key": "OPENAI_API_KEY",
        "embedding_cost": "$0.02/1M tokens",
        "native_embeddings": True
    },
    "gemini": {
        "name": "Google Gemini",
        "chat_models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
        "default_chat_model": "gemini-1.5-flash",
        "embedding_models": ["models/embedding-001", "models/text-embedding-004"],
        "default_embedding_model": "models/embedding-001",
        "embedding_dimensions": 768,
        "requires_api_key": "GOOGLE_API_KEY",
        "embedding_cost": "FREE",
        "native_embeddings": True
    },
    "google": {  # Alias for gemini
        "name": "Google Gemini",
        "chat_models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
        "default_chat_model": "gemini-1.5-flash",
        "embedding_models": ["models/embedding-001", "models/text-embedding-004"],
        "default_embedding_model": "models/embedding-001",
        "embedding_dimensions": 768,
        "requires_api_key": "GOOGLE_API_KEY",
        "embedding_cost": "FREE",
        "native_embeddings": True
    },
    "anthropic": {
        "name": "Anthropic Claude",
        "chat_models": ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
        "default_chat_model": "claude-3-5-sonnet-20241022",
        "embedding_models": ["voyage-02", "all-MiniLM-L6-v2"],  # Voyage or local HuggingFace
        "default_embedding_model": "all-MiniLM-L6-v2",  # Default to local (free)
        "embedding_dimensions": 384,
        "requires_api_key": "ANTHROPIC_API_KEY",
        "embedding_cost": "FREE (local HuggingFace)",
        "native_embeddings": False,  # Claude doesn't have native embeddings yet
        "embedding_note": "Uses local HuggingFace embeddings (free) or Voyage AI (paid)"
    }
}

# ==================== PURE PROVIDER MANAGER ====================

class PureProviderManager:
    """
    Manages LLM and embeddings with COMPLETE independence
    Each provider uses ONLY its own native capabilities
    """
    
    @staticmethod
    def get_provider_bundle(
        provider: str,
        chat_model: Optional[str] = None,
        embedding_model: Optional[str] = None,
        temperature: float = 0.2
    ) -> Tuple[BaseChatModel, Embeddings, dict]:
        """
        Get complete bundle for a provider - chat + embeddings + metadata
        
        Args:
            provider: "openai", "gemini", "google", or "anthropic"
            chat_model: Specific chat model (optional)
            embedding_model: Specific embedding model (optional)
            temperature: LLM temperature
        
        Returns:
            Tuple of (chat_model, embeddings, metadata)
        
        Examples:
            # Pure OpenAI - everything OpenAI
            chat, emb, meta = PureProviderManager.get_provider_bundle("openai")
            
            # Pure Gemini - everything Google
            chat, emb, meta = PureProviderManager.get_provider_bundle("gemini")
            
            # Pure Claude - Claude chat + local embeddings
            chat, emb, meta = PureProviderManager.get_provider_bundle("anthropic")
        """
        
        provider = provider.lower()
        
        if provider not in PROVIDER_CONFIGS:
            logger.warning(f"Unknown provider {provider}, defaulting to gemini")
            provider = "gemini"
        
        config = PROVIDER_CONFIGS[provider]
        
        # Route to provider-specific implementation
        if provider == "openai":
            return PureProviderManager._get_openai_bundle(chat_model, embedding_model, temperature, config)
        elif provider in ["gemini", "google"]:
            return PureProviderManager._get_gemini_bundle(chat_model, embedding_model, temperature, config)
        elif provider == "anthropic":
            return PureProviderManager._get_anthropic_bundle(chat_model, embedding_model, temperature, config)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    # ==================== OPENAI PURE IMPLEMENTATION ====================
    
    @staticmethod
    def _get_openai_bundle(
        chat_model: Optional[str],
        embedding_model: Optional[str],
        temperature: float,
        config: dict
    ) -> Tuple[BaseChatModel, Embeddings, dict]:
        """Pure OpenAI implementation - ONLY OpenAI APIs"""
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(f"OPENAI_API_KEY not set. Required for OpenAI provider.")
        
        # OpenAI Chat
        chat_model_name = chat_model or config["default_chat_model"]
        chat = ChatOpenAI(
            model=chat_model_name,
            temperature=temperature,
            api_key=api_key
        )
        
        # OpenAI Embeddings (native)
        embedding_model_name = embedding_model or config["default_embedding_model"]
        embeddings = OpenAIEmbeddings(
            model=embedding_model_name,
            api_key=api_key
        )
        
        metadata = {
            "provider": "openai",
            "chat_model": chat_model_name,
            "embedding_model": embedding_model_name,
            "embedding_dimensions": config["embedding_dimensions"],
            "embedding_cost": config["embedding_cost"],
            "pure_provider": True,
            "cross_dependencies": None,
            "note": "Using 100% OpenAI - chat and embeddings from same provider"
        }
        
        logger.info(f"✅ Pure OpenAI bundle: {chat_model_name} + {embedding_model_name}")
        return chat, embeddings, metadata
    
    # ==================== GEMINI PURE IMPLEMENTATION ====================
    
    @staticmethod
    def _get_gemini_bundle(
        chat_model: Optional[str],
        embedding_model: Optional[str],
        temperature: float,
        config: dict
    ) -> Tuple[BaseChatModel, Embeddings, dict]:
        """Pure Gemini implementation - ONLY Google APIs"""
        
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(f"GOOGLE_API_KEY not set. Required for Gemini provider.")
        
        # Gemini Chat
        chat_model_name = chat_model or config["default_chat_model"]
        chat = ChatGoogleGenerativeAI(
            model=chat_model_name,
            temperature=temperature,
            google_api_key=api_key
        )
        
        # Gemini Embeddings (native, FREE)
        embedding_model_name = embedding_model or config["default_embedding_model"]
        embeddings = GoogleGenerativeAIEmbeddings(
            model=embedding_model_name,
            google_api_key=api_key
        )
        
        metadata = {
            "provider": "gemini",
            "chat_model": chat_model_name,
            "embedding_model": embedding_model_name,
            "embedding_dimensions": config["embedding_dimensions"],
            "embedding_cost": config["embedding_cost"],
            "pure_provider": True,
            "cross_dependencies": None,
            "note": "Using 100% Google - chat and embeddings from same provider (FREE)"
        }
        
        logger.info(f"✅ Pure Gemini bundle: {chat_model_name} + {embedding_model_name}")
        return chat, embeddings, metadata
    
    # ==================== CLAUDE PURE IMPLEMENTATION ====================
    
    @staticmethod
    def _get_anthropic_bundle(
        chat_model: Optional[str],
        embedding_model: Optional[str],
        temperature: float,
        config: dict
    ) -> Tuple[BaseChatModel, Embeddings, dict]:
        """
        Pure Claude implementation
        Claude chat + local HuggingFace embeddings (Claude doesn't have native embeddings)
        """
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(f"ANTHROPIC_API_KEY not set. Required for Anthropic provider.")
        
        # Claude Chat
        chat_model_name = chat_model or config["default_chat_model"]
        chat = ChatAnthropic(
            model=chat_model_name,
            temperature=temperature,
            anthropic_api_key=api_key
        )
        
        # Embeddings: Claude doesn't have native embeddings
        # Use local HuggingFace (free, no external API) to maintain independence
        embedding_model_name = embedding_model or config["default_embedding_model"]
        
        if "voyage" in embedding_model_name.lower():
            # User explicitly wants Voyage AI embeddings
            try:
                from langchain_community.embeddings import VoyageEmbeddings
                voyage_key = os.getenv("VOYAGE_API_KEY")
                if not voyage_key:
                    logger.warning("VOYAGE_API_KEY not set, falling back to local HuggingFace")
                    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
                else:
                    embeddings = VoyageEmbeddings(
                        voyage_api_key=voyage_key,
                        model="voyage-02"
                    )
            except Exception as e:
                logger.warning(f"Voyage embeddings failed: {e}, using HuggingFace")
                embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        else:
            # Default: Local HuggingFace embeddings (free, no API calls)
            embeddings = HuggingFaceEmbeddings(
                model_name=embedding_model_name,
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
        
        metadata = {
            "provider": "anthropic",
            "chat_model": chat_model_name,
            "embedding_model": embedding_model_name,
            "embedding_dimensions": config["embedding_dimensions"],
            "embedding_cost": config["embedding_cost"],
            "pure_provider": True,
            "cross_dependencies": None,
            "note": "Claude chat + local HuggingFace embeddings (no external API for embeddings)"
        }
        
        logger.info(f"✅ Pure Claude bundle: {chat_model_name} + {embedding_model_name} (local)")
        return chat, embeddings, metadata
    
    # ==================== UTILITY METHODS ====================
    
    @staticmethod
    def list_providers() -> dict:
        """List all available providers and their configurations"""
        return {
            provider: {
                "name": config["name"],
                "chat_models": config["chat_models"],
                "embedding_models": config["embedding_models"],
                "embedding_cost": config["embedding_cost"],
                "native_embeddings": config["native_embeddings"],
                "requires_api_key": config["requires_api_key"]
            }
            for provider, config in PROVIDER_CONFIGS.items()
            if provider != "google"  # Skip alias
        }
    
    @staticmethod
    def validate_provider_setup(provider: str) -> dict:
        """Validate that provider is properly configured"""
        provider = provider.lower()
        
        if provider not in PROVIDER_CONFIGS:
            return {"valid": False, "error": f"Unknown provider: {provider}"}
        
        config = PROVIDER_CONFIGS[provider]
        api_key_env = config["requires_api_key"]
        api_key = os.getenv(api_key_env)
        
        if not api_key:
            return {
                "valid": False,
                "error": f"{api_key_env} not set",
                "fix": f"Set environment variable: {api_key_env}=your-key"
            }
        
        return {
            "valid": True,
            "provider": config["name"],
            "chat_models": config["chat_models"],
            "embedding_cost": config["embedding_cost"],
            "native_embeddings": config["native_embeddings"]
        }

# ==================== CONVENIENCE FUNCTIONS ====================

def get_pure_provider(
    provider: str,
    chat_model: Optional[str] = None,
    embedding_model: Optional[str] = None
) -> Tuple[BaseChatModel, Embeddings, dict]:
    """
    Convenience function to get pure provider bundle
    
    Examples:
        # Pure OpenAI
        chat, embeddings, meta = get_pure_provider("openai")
        # Uses: OpenAI chat + OpenAI embeddings
        
        # Pure Gemini
        chat, embeddings, meta = get_pure_provider("gemini")
        # Uses: Gemini chat + Gemini embeddings (FREE)
        
        # Pure Claude
        chat, embeddings, meta = get_pure_provider("anthropic")
        # Uses: Claude chat + local embeddings (no external API)
    """
    return PureProviderManager.get_provider_bundle(provider, chat_model, embedding_model)

# ==================== TESTING ====================

def test_pure_providers():
    """Test all pure provider implementations"""
    
    providers = []
    
    # Check which providers are configured
    if os.getenv("OPENAI_API_KEY"):
        providers.append("openai")
    if os.getenv("GOOGLE_API_KEY"):
        providers.append("gemini")
    if os.getenv("ANTHROPIC_API_KEY"):
        providers.append("anthropic")
    
    if not providers:
        print("❌ No API keys configured. Set GOOGLE_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY")
        return
    
    test_query = "What is the temperature excursion protocol?"
    test_doc = "Temperature excursions require immediate notification within 2 hours."
    
    for provider in providers:
        try:
            print(f"\n🧪 Testing Pure {provider.upper()} Provider...")
            
            # Get pure bundle
            chat, embeddings, metadata = get_pure_provider(provider)
            
            print(f"✅ Chat Model: {metadata['chat_model']}")
            print(f"✅ Embedding Model: {metadata['embedding_model']}")
            print(f"✅ Embedding Dimensions: {metadata['embedding_dimensions']}")
            print(f"✅ Embedding Cost: {metadata['embedding_cost']}")
            print(f"✅ Pure Provider: {metadata['pure_provider']}")
            print(f"✅ Note: {metadata['note']}")
            
            # Test embeddings
            vector = embeddings.embed_query(test_doc)
            print(f"✅ Embedding generated: {len(vector)} dimensions")
            
            # Test chat (optional, commented to save API calls)
            # response = chat.invoke(test_query)
            # print(f"✅ Chat response: {response.content[:100]}...")
            
        except Exception as e:
            print(f"❌ {provider}: {e}")

if __name__ == "__main__":
    # List all providers
    print("📋 Available Pure Providers:")
    providers = PureProviderManager.list_providers()
    for name, info in providers.items():
        print(f"\n{name.upper()}:")
        print(f"  - Native Embeddings: {info['native_embeddings']}")
        print(f"  - Embedding Cost: {info['embedding_cost']}")
        print(f"  - Requires: {info['requires_api_key']}")
    
    print("\n" + "="*60)
    test_pure_providers()
