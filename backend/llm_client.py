from emergentintegrations.llm.chat import LlmChat, UserMessage
from typing import Dict
import os
import time
import logging

logger = logging.getLogger(__name__)

class LLMClient:
    """Client for interacting with Fast and Capable LLM models"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.fast_model = "gpt-5-mini"
        self.capable_model = "gpt-5.1"
    
    async def generate(self, prompt: str, model_type: str) -> Dict:
        """Generate response using specified model type"""
        start_time = time.time()
        
        try:
            # Select model based on type
            model = self.capable_model if model_type == 'capable' else self.fast_model
            
            # Initialize chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"route-{int(time.time())}",
                system_message="You are a helpful AI assistant."
            ).with_model("openai", model)
            
            # Send message
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            latency = (time.time() - start_time) * 1000
            
            return {
                'response': response,
                'latency': latency,
                'model': model,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            latency = (time.time() - start_time) * 1000
            return {
                'response': f"Error: {str(e)}",
                'latency': latency,
                'model': model_type,
                'success': False,
                'error': str(e)
            }
