import numpy as np
from typing import List

def calculate_mean(values: List[float]) -> float:
    """Calculate mean of values"""
    return float(np.mean(values))

def calculate_std(values: List[float]) -> float:
    """Calculate standard deviation of values"""
    return float(np.std(values))

def calculate_drift_score(reference: List[float], current: List[float]) -> float:
    """Calculate drift score between reference and current distributions"""
    ref_mean = calculate_mean(reference)
    ref_std = calculate_std(reference)
    curr_mean = calculate_mean(current)
    
    if ref_std == 0:
        return 0.0
    
    drift = abs(curr_mean - ref_mean) / ref_std
    return min(drift, 1.0)
