import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    # FortyGuard API
    FORTYGUARD_API_KEY = os.getenv("FORTYGUARD_API_KEY")
    FORTYGUARD_BASE_URL = "https://api.fortyguard.com/v1"

    # Anthropic
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

    # Embeddings / Vector Store
    EMBEDDINGS_MODEL = "all-MiniLM-L6-v2"
    VECTOR_DB_PATH = "./data/qdrant"

    # Anomaly Detection
    ANOMALY_THRESHOLD = 0.7
    MODELS_PATH = "./models"

    # Logging
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL = "DEBUG" if DEBUG else "INFO"


config = Config()