import asyncio
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class SystemState:
    """Central system state for live inference monitoring"""
    
    def __init__(self, max_history: int = 200):
        self.inference_history: List[Dict] = []
        self.max_history = max_history
        self.lock = asyncio.Lock()
    
    async def add_inference(self, record: Dict):
        """Thread-safe append of inference record"""
        async with self.lock:
            self.inference_history.append(record)
            
            if len(self.inference_history) > self.max_history:
                self.inference_history.pop(0)
            
            logger.debug(f"Inference record added. Total: {len(self.inference_history)}")
    
    async def get_recent(self, n: int = 50) -> List[Dict]:
        """Get n most recent inference records"""
        async with self.lock:
            return self.inference_history[-n:] if self.inference_history else []
    
    async def get_latest(self) -> Optional[Dict]:
        """Get most recent inference record"""
        async with self.lock:
            return self.inference_history[-1] if self.inference_history else None
    
    async def get_all(self) -> List[Dict]:
        """Get all inference records"""
        async with self.lock:
            return self.inference_history.copy()
    
    async def get_count(self) -> int:
        """Get total count of stored records"""
        async with self.lock:
            return len(self.inference_history)

system_state = SystemState()
