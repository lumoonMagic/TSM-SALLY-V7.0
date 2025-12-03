"""
Configuration Management for SALLY TSM
Handles LLM settings, database connections, and application settings
"""
import os
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    """LLM Configuration Settings"""
    provider: str = Field(default="gemini", description="LLM provider: gemini, openai, anthropic")
    model: str = Field(default="gemini-2.0-flash-exp", description="Model name")
    api_key: Optional[str] = Field(default=None, description="API key for the LLM provider")
    temperature: float = Field(default=0.1, description="Temperature for generation (0.0-1.0)")
    max_tokens: int = Field(default=4096, description="Maximum tokens for response")
    enabled: bool = Field(default=True, description="Enable/disable LLM features")
    
    @classmethod
    def from_env(cls) -> "LLMConfig":
        """Load LLM config from environment variables"""
        return cls(
            provider=os.getenv("LLM_PROVIDER", "gemini"),
            model=os.getenv("LLM_MODEL", "gemini-2.0-flash-exp"),
            api_key=os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4096")),
            enabled=os.getenv("LLM_ENABLED", "true").lower() == "true"
        )


class DatabaseConfig(BaseModel):
    """Database Configuration Settings"""
    type: str = Field(default="postgres", description="Database type")
    url: str = Field(..., description="Database connection URL")
    pool_size: int = Field(default=10, description="Connection pool size")
    max_overflow: int = Field(default=20, description="Max overflow connections")
    echo: bool = Field(default=False, description="Echo SQL queries")
    
    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Load database config from environment variables"""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        return cls(
            type=os.getenv("DATABASE_TYPE", "postgres"),
            url=database_url,
            pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
            echo=os.getenv("DB_ECHO", "false").lower() == "true"
        )


class RAGConfig(BaseModel):
    """RAG System Configuration"""
    enable_embeddings: bool = Field(default=True, description="Enable vector embeddings")
    embedding_model: str = Field(default="text-embedding-004", description="Embedding model name")
    enable_response_formatting: bool = Field(default=True, description="Enable LLM response formatting")
    enable_insights: bool = Field(default=True, description="Generate insights from results")
    enable_visualizations: bool = Field(default=True, description="Recommend visualizations")
    max_results: int = Field(default=100, description="Maximum query results")
    
    @classmethod
    def from_env(cls) -> "RAGConfig":
        """Load RAG config from environment variables"""
        return cls(
            enable_embeddings=os.getenv("RAG_ENABLE_EMBEDDINGS", "true").lower() == "true",
            embedding_model=os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-004"),
            enable_response_formatting=os.getenv("RAG_ENABLE_FORMATTING", "true").lower() == "true",
            enable_insights=os.getenv("RAG_ENABLE_INSIGHTS", "true").lower() == "true",
            enable_visualizations=os.getenv("RAG_ENABLE_VISUALIZATIONS", "true").lower() == "true",
            max_results=int(os.getenv("RAG_MAX_RESULTS", "100"))
        )


class AppConfig(BaseModel):
    """Application Configuration"""
    environment: str = Field(default="production", description="Environment: development, staging, production")
    debug: bool = Field(default=False, description="Debug mode")
    port: int = Field(default=8000, description="Server port")
    host: str = Field(default="0.0.0.0", description="Server host")
    cors_origins: list = Field(default=["*"], description="CORS allowed origins")
    
    # Sub-configurations
    llm: LLMConfig
    database: DatabaseConfig
    rag: RAGConfig
    
    @classmethod
    def from_env(cls) -> "AppConfig":
        """Load complete app config from environment variables"""
        return cls(
            environment=os.getenv("ENVIRONMENT", "production"),
            debug=os.getenv("DEBUG", "false").lower() == "true",
            port=int(os.getenv("PORT", "8000")),
            host=os.getenv("HOST", "0.0.0.0"),
            cors_origins=os.getenv("CORS_ORIGINS", "*").split(","),
            llm=LLMConfig.from_env(),
            database=DatabaseConfig.from_env(),
            rag=RAGConfig.from_env()
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary (safe for logging)"""
        config_dict = self.dict()
        # Mask sensitive data
        if config_dict.get("llm", {}).get("api_key"):
            config_dict["llm"]["api_key"] = "***MASKED***"
        if config_dict.get("database", {}).get("url"):
            # Show only the database type
            config_dict["database"]["url"] = config_dict["database"]["url"].split("@")[0] + "@***MASKED***"
        return config_dict


# Global config instance
_config_instance: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """Get or create global config instance"""
    global _config_instance
    if _config_instance is None:
        _config_instance = AppConfig.from_env()
    return _config_instance


def reload_config() -> AppConfig:
    """Reload configuration from environment variables"""
    global _config_instance
    _config_instance = AppConfig.from_env()
    return _config_instance
