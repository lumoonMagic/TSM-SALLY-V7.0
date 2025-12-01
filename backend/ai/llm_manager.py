"""
Multi-LLM Provider Manager
Supports OpenAI, Anthropic (Claude), and Google Gemini

Usage:
    from backend.ai.llm_manager import llm_manager
    
    # Get LLM instance
    llm = llm_manager.get_llm(provider="openai", model="gpt-4o-mini")
    response = llm.invoke("What is 2+2?")
    
    # Get embeddings
    embeddings = llm_manager.get_embeddings(provider="openai")
    vector = embeddings.embed_query("test query")
"""

from typing import Literal, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.schema import BaseLanguageModel
from pydantic import BaseModel
import os

LLMProvider = Literal["openai", "anthropic", "gemini"]

class LLMConfig(BaseModel):
    provider: LLMProvider
    model: str
    temperature: float = 0.0
    max_tokens: int = 4096

class LLMManager:
    """Unified manager for multiple LLM providers"""
    
    def __init__(self, default_provider: LLMProvider = "openai"):
        self.default_provider = default_provider
        self._validate_api_keys()
    
    def _validate_api_keys(self):
        """Ensure required API keys are present"""
        required_keys = {
            "openai": "OPEN AI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "gemini": "GOOGLE_API_KEY"
        }
        
        for provider, key in required_keys.items():
            if not os.getenv(key):
                print(f"Warning: {key} not set. {provider} will not be available.")
    
    def get_llm(
        self,
        provider: Optional[LLMProvider] = None,
        model: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 4096
    ) -> BaseLanguageModel:
        """
        Get LLM instance for specified provider
        
        Args:
            provider: LLM provider (openai, anthropic, gemini)
            model: Specific model name (provider-specific)
            temperature: Sampling temperature (0.0 = deterministic)
            max_tokens: Maximum tokens in response
        
        Returns:
            LangChain LLM instance
        """
        provider = provider or self.default_provider
        
        if provider == "openai":
            return self._get_openai_llm(model, temperature, max_tokens)
        elif provider == "anthropic":
            return self._get_anthropic_llm(model, temperature, max_tokens)
        elif provider == "gemini":
            return self._get_gemini_llm(model, temperature, max_tokens)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _get_openai_llm(
        self,
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> ChatOpenAI:
        """Get OpenAI ChatGPT instance"""
        model = model or "gpt-4o-mini"
        
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    def _get_anthropic_llm(
        self,
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> ChatAnthropic:
        """Get Anthropic Claude instance"""
        model = model or "claude-3-5-sonnet-20240620"
        
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
    
    def _get_gemini_llm(
        self,
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> ChatGoogleGenerativeAI:
        """Get Google Gemini instance"""
        model = model or "gemini-1.5-flash-latest"
        
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
    
    def get_embeddings(self, provider: Optional[LLMProvider] = None):
        """
        Get embeddings model for specified provider
        
        Args:
            provider: LLM provider (openai, anthropic, gemini)
        
        Returns:
            LangChain Embeddings instance
        """
        provider = provider or self.default_provider
        
        if provider == "openai":
            return OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=os.getenv("OPENAI_API_KEY")
            )
        elif provider == "anthropic":
            # Anthropic doesn't have native embeddings, use OpenAI
            print("Warning: Using OpenAI embeddings (Anthropic has no embedding model)")
            return OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=os.getenv("OPENAI_API_KEY")
            )
        elif provider == "gemini":
            return GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def list_available_providers(self) -> list[str]:
        """List providers with valid API keys"""
        available = []
        
        if os.getenv("OPENAI_API_KEY"):
            available.append("openai")
        if os.getenv("ANTHROPIC_API_KEY"):
            available.append("anthropic")
        if os.getenv("GOOGLE_API_KEY"):
            available.append("gemini")
        
        return available
    
    def get_model_info(self, provider: LLMProvider) -> dict:
        """Get available models and pricing for provider"""
        models = {
            "openai": {
                "models": [
                    {
                        "name": "gpt-4o",
                        "context_window": 128000,
                        "cost_per_1m_tokens": {"input": 5.00, "output": 15.00}
                    },
                    {
                        "name": "gpt-4o-mini",
                        "context_window": 128000,
                        "cost_per_1m_tokens": {"input": 0.15, "output": 0.60}
                    },
                    {
                        "name": "gpt-4-turbo",
                        "context_window": 128000,
                        "cost_per_1m_tokens": {"input": 10.00, "output": 30.00}
                    }
                ]
            },
            "anthropic": {
                "models": [
                    {
                        "name": "claude-3-5-sonnet-20240620",
                        "context_window": 200000,
                        "cost_per_1m_tokens": {"input": 3.00, "output": 15.00}
                    },
                    {
                        "name": "claude-3-opus-20240229",
                        "context_window": 200000,
                        "cost_per_1m_tokens": {"input": 15.00, "output": 75.00}
                    },
                    {
                        "name": "claude-3-haiku-20240307",
                        "context_window": 200000,
                        "cost_per_1m_tokens": {"input": 0.25, "output": 1.25}
                    }
                ]
            },
            "gemini": {
                "models": [
                    {
                        "name": "gemini-1.5-pro-latest",
                        "context_window": 2000000,
                        "cost_per_1m_tokens": {"input": 1.25, "output": 5.00}
                    },
                    {
                        "name": "gemini-1.5-flash-latest",
                        "context_window": 1000000,
                        "cost_per_1m_tokens": {"input": 0.075, "output": 0.30}
                    },
                    {
                        "name": "gemini-pro",
                        "context_window": 32000,
                        "cost_per_1m_tokens": {"input": 0.50, "output": 1.50}
                    }
                ]
            }
        }
        
        return models.get(provider, {})

# Global instance
llm_manager = LLMManager()
