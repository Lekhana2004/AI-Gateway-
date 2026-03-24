from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Dict, Tuple
import re
import logging

logger = logging.getLogger(__name__)

class RoutingModel:
    """Hybrid routing model using MiniLM embeddings + engineered features"""
    
    def __init__(self):
        self.model = None
        self.thresholds = {
            'complex_threshold': 0.40,
            'simple_threshold': 0.25,
            'confidence_threshold': 0.70
        }
        
    def load_model(self):
        """Load the sentence transformer model"""
        if self.model is None:
            logger.info("Loading MiniLM model...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Model loaded successfully")
    
    def fast_bypass_check(self, prompt: str) -> Tuple[bool, str]:
        """Rule-based fast bypass for obvious cases"""
        prompt_lower = prompt.lower().strip()
        
        # Route to Capable if contains code
        if '```' in prompt or re.search(r'\b(debug|implement|code|error|exception)\b', prompt_lower):
            return True, 'capable'
        
        # Route to Capable if starts with prove/derive
        if re.match(r'^(prove|derive|design)\b', prompt_lower):
            return True, 'capable'
        
        # Route to Fast for simple factual questions
        factual_patterns = [
            r'^what is (the|a) \w+\??$',
            r'^who (is|was|are) \w+\??$',
            r'^when (is|was|did) \w+\??$',
            r'^where (is|was|are) \w+\??$'
        ]
        
        for pattern in factual_patterns:
            if re.search(pattern, prompt_lower):
                return True, 'fast'
        
        return False, None
    
    def calculate_complexity_score(self, prompt: str, features: Dict[str, float]) -> float:
        """Calculate complexity score using heuristics and features"""
        score = 0.0
        
        # Reasoning keywords (high weight)
        score += features['reasoning_keyword_density'] * 100 * 2.0
        
        # Code markers (very high weight)
        score += features['code_technical_markers'] * 0.15
        
        # Multi-step and conditional (medium weight)
        score += features['multi_step_indicators'] * 0.08
        score += features['conditional_complexity'] * 0.06
        
        # Question depth
        score += features['question_depth'] * 0.05
        
        # Abstraction level
        score += features['abstraction_level'] * 100 * 1.5
        
        # Negation and ambiguity
        score += features['negation_count'] * 0.03
        score += features['ambiguity_markers'] * 0.04
        
        # Normalize to [0, 1]
        return min(score, 1.0)
    
    def route(self, prompt: str, features: Dict[str, float]) -> Dict:
        """Make routing decision"""
        # Step 1: Fast bypass check
        bypass, route = self.fast_bypass_check(prompt)
        if bypass:
            return {
                'model': route,
                'p_complex': 1.0 if route == 'capable' else 0.0,
                'confidence': 1.0,
                'method': 'fast_bypass'
            }
        
        # Step 2: Calculate complexity score
        p_complex = self.calculate_complexity_score(prompt, features)
        
        # Step 3: Calculate confidence
        confidence = 2.0 * abs(p_complex - 0.5)
        
        # Step 4: Apply asymmetric thresholds
        if p_complex >= self.thresholds['complex_threshold']:
            model = 'capable'
        elif p_complex < self.thresholds['simple_threshold'] and confidence > self.thresholds['confidence_threshold']:
            model = 'fast'
        else:
            # Default to capable when uncertain
            model = 'capable'
        
        return {
            'model': model,
            'p_complex': p_complex,
            'confidence': confidence,
            'method': 'ml_classification'
        }
