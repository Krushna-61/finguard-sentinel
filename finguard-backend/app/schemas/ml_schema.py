from pydantic import BaseModel
from typing import List, Optional

class MLMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float

class DriftDataPoint(BaseModel):
    timestamp: str
    drift_score: float

class BiasMetric(BaseModel):
    category: str
    bias_score: float

class MLRequest(BaseModel):
    model_id: Optional[str] = None
    reference_data: Optional[List[float]] = None
    current_data: Optional[List[float]] = None

class MLResponse(BaseModel):
    metrics: MLMetrics
    drift: List[DriftDataPoint]
    bias: List[BiasMetric]
