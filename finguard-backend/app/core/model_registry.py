import torch
import logging
from typing import Optional
from transformers import pipeline
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class ModelRegistry:
    """Singleton registry for preloaded ML models"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.ner_pipeline = None
        self.toxicity_pipeline = None
        self.embedding_model = None
        self.nli_pipeline = None
        self.device = None
        self.use_fp16 = False
        
        try:
            self._initialize()
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize ModelRegistry: {e}")
            self._initialized = False
            raise
    
    def _initialize(self):
        """Initialize all models with GPU optimization"""
        
        # Device detection
        if torch.cuda.is_available():
            self.device = 0
            self.use_fp16 = True
            logger.info("Using CUDA for inference")
            logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        else:
            self.device = -1
            self.use_fp16 = False
            logger.info("Using CPU for inference")
        
        device_str = "cuda" if self.device == 0 else "cpu"
        
        # Load NER model
        logger.info("Loading PII detection model (dslim/bert-base-NER)...")
        self.ner_pipeline = pipeline(
            "ner",
            model="dslim/bert-base-NER",
            device=self.device,
            aggregation_strategy="simple"
        )
        
        # Apply FP16 optimization for NER
        if self.use_fp16 and hasattr(self.ner_pipeline, 'model'):
            try:
                self.ner_pipeline.model.half()
                logger.info("NER model converted to FP16")
            except Exception as e:
                logger.warning(f"Could not convert NER to FP16: {e}")
        
        # Load toxicity model
        logger.info("Loading toxicity detection model (unitary/toxic-bert)...")
        self.toxicity_pipeline = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            device=self.device
        )
        
        # Apply FP16 optimization for toxicity
        if self.use_fp16 and hasattr(self.toxicity_pipeline, 'model'):
            try:
                self.toxicity_pipeline.model.half()
                logger.info("Toxicity model converted to FP16")
            except Exception as e:
                logger.warning(f"Could not convert toxicity to FP16: {e}")
        
        # Load embedding model
        logger.info("Loading embedding model (sentence-transformers/all-MiniLM-L6-v2)...")
        self.embedding_model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
            device=device_str
        )
        
        # Apply FP16 optimization for embeddings
        if self.use_fp16:
            try:
                self.embedding_model.half()
                logger.info("Embedding model converted to FP16")
            except Exception as e:
                logger.warning(f"Could not convert embeddings to FP16: {e}")
        
        # Load NLI model for hallucination detection
        logger.info("Loading hallucination detection model (facebook/bart-large-mnli)...")
        self.nli_pipeline = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=self.device
        )
        
        # Apply FP16 optimization for NLI
        if self.use_fp16 and hasattr(self.nli_pipeline, 'model'):
            try:
                self.nli_pipeline.model.half()
                logger.info("NLI model converted to FP16")
            except Exception as e:
                logger.warning(f"Could not convert NLI to FP16: {e}")
        
        logger.info("All models loaded successfully")
        
        # Warmup routine
        self._warmup()
    
    def _warmup(self):
        """Run warmup inference to compile CUDA kernels and move weights to GPU"""
        logger.info("Starting model warmup...")
        
        try:
            # Warmup NER
            with torch.no_grad():
                _ = self.ner_pipeline("John Doe lives in New York")
            logger.info("NER warmup complete")
            
            # Warmup toxicity
            with torch.no_grad():
                _ = self.toxicity_pipeline("This is a harmless sentence")
            logger.info("Toxicity warmup complete")
            
            # Warmup embeddings
            with torch.no_grad():
                _ = self.embedding_model.encode("Warmup embedding", convert_to_numpy=True)
            logger.info("Embeddings warmup complete")
            
            # Warmup NLI
            with torch.no_grad():
                _ = self.nli_pipeline(
                    "The sky is green",
                    candidate_labels=["entailment", "contradiction", "neutral"],
                    hypothesis_template="This text: {}"
                )
            logger.info("NLI warmup complete")
            
            # Clear cache after warmup
            if self.device == 0:
                torch.cuda.empty_cache()
                logger.info("CUDA cache cleared after warmup")
            
            logger.info("Model warmup completed successfully")
            
        except Exception as e:
            logger.error(f"Warmup failed: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if all models are loaded and ready"""
        return (
            self._initialized and
            self.ner_pipeline is not None and
            self.toxicity_pipeline is not None and
            self.embedding_model is not None and
            self.nli_pipeline is not None
        )
