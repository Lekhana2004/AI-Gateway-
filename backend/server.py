from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import time

from feature_extractor import FeatureExtractor
from routing_model import RoutingModel
from llm_client import LLMClient
from test_prompts import TEST_PROMPTS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize routing components
feature_extractor = FeatureExtractor()
routing_model = RoutingModel()
routing_model.load_model()

# Initialize LLM client
llm_client = LLMClient(api_key=os.environ.get('EMERGENT_LLM_KEY', ''))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class PromptRequest(BaseModel):
    prompt: str

class RouteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    prompt: str
    routed_model: str
    p_complex: float
    confidence: float
    method: str
    features: Dict[str, float]
    latency_ms: float
    timestamp: str

class AnalyzeResponse(BaseModel):
    prompt: str
    features: Dict[str, float]
    routing_decision: Dict[str, Any]
    complexity_score: float
    routed_model: str

class GenerateRequest(BaseModel):
    prompt: str
    model_type: Optional[str] = None

class GenerateResponse(BaseModel):
    prompt: str
    response: str
    model: str
    routed_model: str
    generation_latency_ms: float
    routing_latency_ms: float
    total_latency_ms: float
    p_complex: float
    confidence: float

class EvaluationResult(BaseModel):
    test_id: int
    prompt: str
    true_label: str
    predicted_model: str
    predicted_label: str
    correct: bool
    p_complex: float
    confidence: float
    category: str

class EvaluationSummary(BaseModel):
    total_prompts: int
    accuracy: float
    critical_error_rate: float
    waste_rate: float
    correct: int
    incorrect: int
    results: List[EvaluationResult]

class StatsResponse(BaseModel):
    total_requests: int
    routed_to_fast: int
    routed_to_capable: int
    fast_percentage: float
    capable_percentage: float
    avg_confidence: float
    avg_latency_ms: float
    estimated_cost_savings_percent: float

@api_router.get("/")
async def root():
    return {"message": "AI Gateway Routing Model API", "status": "running"}

@api_router.post("/route", response_model=RouteResponse)
async def route_prompt(request: PromptRequest):
    """Route a prompt and return routing decision with analysis"""
    start_time = time.time()
    
    try:
        # Extract features
        features = feature_extractor.extract_features(request.prompt)
        
        # Make routing decision
        routing_decision = routing_model.route(request.prompt, features)
        
        latency = (time.time() - start_time) * 1000
        
        # Store in database
        doc = {
            'id': str(uuid.uuid4()),
            'prompt': request.prompt,
            'routed_model': routing_decision['model'],
            'p_complex': routing_decision['p_complex'],
            'confidence': routing_decision['confidence'],
            'method': routing_decision['method'],
            'features': features,
            'latency_ms': latency,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        await db.routing_decisions.insert_one(doc)
        
        return RouteResponse(**doc)
        
    except Exception as e:
        logging.error(f"Error routing prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_prompt(request: PromptRequest):
    """Deep analysis of prompt complexity"""
    try:
        # Extract features
        features = feature_extractor.extract_features(request.prompt)
        
        # Make routing decision
        routing_decision = routing_model.route(request.prompt, features)
        
        return AnalyzeResponse(
            prompt=request.prompt,
            features=features,
            routing_decision=routing_decision,
            complexity_score=routing_decision['p_complex'],
            routed_model=routing_decision['model']
        )
        
    except Exception as e:
        logging.error(f"Error analyzing prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """Route prompt and generate response using appropriate model"""
    routing_start = time.time()
    
    try:
        # Extract features and route
        features = feature_extractor.extract_features(request.prompt)
        routing_decision = routing_model.route(request.prompt, features)
        
        routing_latency = (time.time() - routing_start) * 1000
        
        # Use specified model or routed model
        model_type = request.model_type if request.model_type else routing_decision['model']
        
        # Generate response
        generation_result = await llm_client.generate(request.prompt, model_type)
        
        total_latency = routing_latency + generation_result['latency']
        
        # Store in database
        doc = {
            'id': str(uuid.uuid4()),
            'prompt': request.prompt,
            'response': generation_result['response'],
            'routed_model': routing_decision['model'],
            'used_model': model_type,
            'p_complex': routing_decision['p_complex'],
            'confidence': routing_decision['confidence'],
            'routing_latency_ms': routing_latency,
            'generation_latency_ms': generation_result['latency'],
            'total_latency_ms': total_latency,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        await db.generations.insert_one(doc)
        
        return GenerateResponse(
            prompt=request.prompt,
            response=generation_result['response'],
            model=generation_result['model'],
            routed_model=routing_decision['model'],
            generation_latency_ms=generation_result['latency'],
            routing_latency_ms=routing_latency,
            total_latency_ms=total_latency,
            p_complex=routing_decision['p_complex'],
            confidence=routing_decision['confidence']
        )
        
    except Exception as e:
        logging.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get routing statistics"""
    try:
        # Get all routing decisions
        decisions = await db.routing_decisions.find({}, {"_id": 0}).to_list(10000)
        
        if not decisions:
            return StatsResponse(
                total_requests=0,
                routed_to_fast=0,
                routed_to_capable=0,
                fast_percentage=0.0,
                capable_percentage=0.0,
                avg_confidence=0.0,
                avg_latency_ms=0.0,
                estimated_cost_savings_percent=0.0
            )
        
        total = len(decisions)
        fast_count = sum(1 for d in decisions if d['routed_model'] == 'fast')
        capable_count = total - fast_count
        
        avg_confidence = sum(d['confidence'] for d in decisions) / total
        avg_latency = sum(d['latency_ms'] for d in decisions) / total
        
        # Calculate estimated cost savings
        # Assume: Fast model costs 0.05x, Capable model costs 1.0x
        # Without routing: all would go to capable = total * 1.0
        # With routing: fast * 0.05 + capable * 1.0
        cost_without_routing = total * 1.0
        cost_with_routing = (fast_count * 0.05) + (capable_count * 1.0)
        cost_savings_percent = ((cost_without_routing - cost_with_routing) / cost_without_routing) * 100 if cost_without_routing > 0 else 0
        
        return StatsResponse(
            total_requests=total,
            routed_to_fast=fast_count,
            routed_to_capable=capable_count,
            fast_percentage=(fast_count / total) * 100,
            capable_percentage=(capable_count / total) * 100,
            avg_confidence=avg_confidence,
            avg_latency_ms=avg_latency,
            estimated_cost_savings_percent=cost_savings_percent
        )
        
    except Exception as e:
        logging.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/evaluate", response_model=EvaluationSummary)
async def evaluate_test_set():
    """Evaluate routing model on test set"""
    try:
        results = []
        
        for test_case in TEST_PROMPTS:
            # Extract features and route
            features = feature_extractor.extract_features(test_case['prompt'])
            routing_decision = routing_model.route(test_case['prompt'], features)
            
            # Determine predicted label
            predicted_label = 'simple' if routing_decision['model'] == 'fast' else 'complex'
            
            # Check if correct
            correct = predicted_label == test_case['label']
            
            results.append(EvaluationResult(
                test_id=test_case['id'],
                prompt=test_case['prompt'],
                true_label=test_case['label'],
                predicted_model=routing_decision['model'],
                predicted_label=predicted_label,
                correct=correct,
                p_complex=routing_decision['p_complex'],
                confidence=routing_decision['confidence'],
                category=test_case['category']
            ))
        
        # Calculate metrics
        total = len(results)
        correct_count = sum(1 for r in results if r.correct)
        accuracy = (correct_count / total) * 100
        
        # Calculate critical error rate (complex routed to fast)
        complex_prompts = [r for r in results if r.true_label == 'complex']
        critical_errors = sum(1 for r in complex_prompts if r.predicted_model == 'fast')
        critical_error_rate = (critical_errors / len(complex_prompts)) * 100 if complex_prompts else 0
        
        # Calculate waste rate (simple routed to capable)
        simple_prompts = [r for r in results if r.true_label == 'simple']
        waste_errors = sum(1 for r in simple_prompts if r.predicted_model == 'capable')
        waste_rate = (waste_errors / len(simple_prompts)) * 100 if simple_prompts else 0
        
        return EvaluationSummary(
            total_prompts=total,
            accuracy=accuracy,
            critical_error_rate=critical_error_rate,
            waste_rate=waste_rate,
            correct=correct_count,
            incorrect=total - correct_count,
            results=results
        )
        
    except Exception as e:
        logging.error(f"Error evaluating test set: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/test-prompts")
async def get_test_prompts():
    """Get all test prompts"""
    return {"prompts": TEST_PROMPTS}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
