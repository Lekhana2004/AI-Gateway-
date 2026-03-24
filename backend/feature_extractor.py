import re
from typing import Dict, List

class FeatureExtractor:
    """Extract engineered features from prompts for complexity classification"""
    
    REASONING_KEYWORDS = {
        'explain', 'why', 'analyze', 'compare', 'derive', 'prove', 'evaluate',
        'critique', 'design', 'optimize', 'trade-off', 'implications', 'how does',
        'what causes', 'demonstrate', 'justify', 'reason'
    }
    
    MULTI_STEP_INDICATORS = {
        'then', 'after that', 'next', 'finally', 'step-by-step', 'first', 'second',
        'third', 'subsequently', 'following', 'proceeding'
    }
    
    CONDITIONAL_KEYWORDS = {
        'if', 'unless', 'except', 'depending on', 'when', 'assuming', 'given that',
        'provided', 'in case', 'suppose', 'whether'
    }
    
    CODE_MARKERS = {
        'debug', 'implement', 'refactor', 'optimize', 'algorithm', 'function',
        'code', 'error', 'exception', 'bug', 'fix', 'compile', 'syntax'
    }
    
    ABSTRACT_NOUNS = {
        'concept', 'principle', 'theory', 'framework', 'pattern', 'paradigm',
        'methodology', 'approach', 'strategy', 'philosophy', 'ideology'
    }
    
    NEGATION_WORDS = {
        'not', 'never', "don't", "won't", "can't", 'without', 'except', 'neither',
        'nor', 'nobody', 'nothing', 'nowhere'
    }
    
    AMBIGUITY_MARKERS = {
        'best', 'should', 'recommend', 'opinion', 'better', 'worse', 'prefer',
        'ideal', 'optimal', 'suggest'
    }
    
    def extract_features(self, prompt: str) -> Dict[str, float]:
        """Extract all 12 engineered features from a prompt"""
        prompt_lower = prompt.lower()
        words = re.findall(r'\b\w+\b', prompt_lower)
        total_words = len(words) if words else 1
        
        features = {
            'reasoning_keyword_density': self._count_keywords(words, self.REASONING_KEYWORDS) / total_words,
            'multi_step_indicators': self._count_keywords(words, self.MULTI_STEP_INDICATORS),
            'conditional_complexity': self._count_keywords(words, self.CONDITIONAL_KEYWORDS),
            'code_technical_markers': self._has_code_markers(prompt, prompt_lower),
            'question_depth': self._calculate_question_depth(prompt),
            'abstraction_level': self._count_keywords(words, self.ABSTRACT_NOUNS) / total_words,
            'token_count': total_words,
            'sentence_count': len(re.split(r'[.!?]+', prompt.strip())),
            'negation_count': self._count_keywords(words, self.NEGATION_WORDS),
            'ambiguity_markers': self._count_keywords(words, self.AMBIGUITY_MARKERS),
            'avg_word_length': sum(len(w) for w in words) / total_words if words else 0,
            'unique_word_ratio': len(set(words)) / total_words if words else 0
        }
        
        return features
    
    def _count_keywords(self, words: List[str], keyword_set: set) -> float:
        """Count occurrences of keywords in word list"""
        count = 0
        for word in words:
            if word in keyword_set:
                count += 1
        return float(count)
    
    def _has_code_markers(self, prompt: str, prompt_lower: str) -> float:
        """Detect code-related content"""
        score = 0.0
        
        # Check for code fences
        if '```' in prompt or '`' in prompt:
            score += 3.0
        
        # Check for code keywords
        words = re.findall(r'\b\w+\b', prompt_lower)
        score += self._count_keywords(words, self.CODE_MARKERS)
        
        # Check for common programming patterns
        if re.search(r'\b(def|function|class|import|return)\b', prompt_lower):
            score += 2.0
        
        # Check for error messages or stack traces
        if 'error:' in prompt_lower or 'exception:' in prompt_lower:
            score += 2.0
            
        return score
    
    def _calculate_question_depth(self, prompt: str) -> float:
        """Calculate question complexity based on question marks and nested questions"""
        question_marks = prompt.count('?')
        
        # Check for nested/complex questions
        complexity_patterns = [
            r'why.*when',
            r'how.*if',
            r'what.*because',
            r'explain.*why'
        ]
        
        nested_questions = sum(1 for pattern in complexity_patterns if re.search(pattern, prompt.lower()))
        
        return float(question_marks + nested_questions * 2)
    
    def get_feature_vector(self, prompt: str) -> List[float]:
        """Get features as a list for model input"""
        features = self.extract_features(prompt)
        return [
            features['reasoning_keyword_density'],
            features['multi_step_indicators'],
            features['conditional_complexity'],
            features['code_technical_markers'],
            features['question_depth'],
            features['abstraction_level'],
            features['token_count'] / 100.0,
            features['sentence_count'] / 10.0,
            features['negation_count'],
            features['ambiguity_markers'],
            features['avg_word_length'] / 10.0,
            features['unique_word_ratio']
        ]
