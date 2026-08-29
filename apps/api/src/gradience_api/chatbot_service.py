import os
import logging
from typing import Optional, Any
from datetime import UTC, datetime
import httpx

logger = logging.getLogger(__name__)

class ChatbotService:
    """AI-powered thermal intelligence assistant using Groq and Perplexity APIs with fallback."""
    
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.perplexity_api_key = os.getenv("PERPLEXITY_API_KEY", "")
        self.base_knowledge = {
            "observe": {
                "phoenix": {
                    "avg_temp": 35.2,
                    "max_temp": 42.1,
                    "hotspots": 7,
                    "trend": "increasing +0.3°C/week",
                    "recommendation": "Increase green cover in downtown zones"
                },
                "vegas": {
                    "avg_temp": 37.8,
                    "max_temp": 44.3,
                    "hotspots": 5,
                    "trend": "stable",
                    "recommendation": "Focus on cool surfaces in Strip area"
                },
                "houston": {
                    "avg_temp": 33.1,
                    "max_temp": 38.9,
                    "hotspots": 4,
                    "trend": "increasing +0.2°C/week",
                    "recommendation": "Blue infrastructure + vegetation corridors"
                }
            },
            "simulate": {
                "coefficients": {
                    "vegetation_cooling": 0.15,
                    "builtup_heating": 0.20,
                    "tree_canopy": 0.25,
                    "cool_surfaces": 0.18
                },
                "scenarios": {
                    "current": "Baseline thermal conditions",
                    "proposed": "New development impact (typically +0.5-1.2°C)",
                    "optimized": "With mitigations (reduced by 30-50%)"
                }
            },
            "optimize": {
                "factors": [
                    "Thermal exposure",
                    "Distance to destination",
                    "Travel time",
                    "Safe zones (cooler routes)",
                    "Vulnerable population zones"
                ],
                "benefits": [
                    "18-25% reduction in heat exposure",
                    "5-10% reduction in travel time",
                    "Lower cooling costs en-route"
                ]
            }
        }

    async def search_answer(self, query: str, context: str) -> str:
        """Search web for answer using Perplexity AI (faster, cheaper than Groq for search)."""
        key = os.getenv("PERPLEXITY_API_KEY", self.perplexity_api_key)
        if not key:
            return await self.fallback_answer(query, context)
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    json={
                        "model": "sonar",
                        "messages": [
                            {
                                "role": "system",
                                "content": f"You are a thermal intelligence expert helping with urban climate questions. Context: {context}"
                            },
                            {
                                "role": "user",
                                "content": query
                            }
                        ],
                        "temperature": 0.2,
                        "max_tokens": 300
                    },
                    headers={"Authorization": f"Bearer {key}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
        except Exception as e:
            logger.warning("Perplexity error: %s", e)
        
        # Fallback to Groq if Perplexity fails
        return await self.generate_answer(query, context)

    async def generate_answer(self, query: str, context: str) -> str:
        """Generate answer using Groq API (fast inference)."""
        key = os.getenv("GROQ_API_KEY", self.groq_api_key)
        if not key:
            return await self.fallback_answer(query, context)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {
                                "role": "system",
                                "content": f"You are a thermal intelligence assistant. {context}. Be concise, technical, actionable."
                            },
                            {
                                "role": "user",
                                "content": query
                            }
                        ],
                        "temperature": 0.3,
                        "max_tokens": 300
                    },
                    headers={"Authorization": f"Bearer {key}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
        except Exception as e:
            logger.warning("Groq error: %s", e)
        
        return await self.fallback_answer(query, context)

    async def fallback_answer(self, query: str, context: str) -> str:
        """Hardcoded knowledge base when APIs unavailable."""
        q_lower = query.lower()
        
        # Temperature questions
        if any(word in q_lower for word in ["temperature", "temp", "hot", "heat", "phoenix", "vegas", "houston"]):
            return "Current thermal patterns show peak temperatures in downtown zones. Phoenix averages 35.2°C, Las Vegas 37.8°C, Houston 33.1°C. Heat islands are typically 2-5°C hotter than surrounding areas."
        
        # Development impact
        elif any(word in q_lower for word in ["development", "building", "construction", "impact"]):
            return "New development typically increases local temperature by 0.5-1.2°C depending on materials and layout. Green infrastructure (vegetation +10%) can reduce this by ~0.15°C. Optimized scenarios achieve 30-50% reduction in thermal impact."
        
        # Mitigation strategies
        elif any(word in q_lower for word in ["mitigation", "cool", "strategy", "reduce"]):
            return "Effective strategies: green corridors (-0.35°C), tree canopy (-0.25°C), cool surfaces (-0.18°C), blue infrastructure (-0.20°C). Combining 2-3 strategies achieves best results with synergistic effects."
        
        # Routing/operations
        elif any(word in q_lower for word in ["route", "optimize", "path", "operation"]):
            return "Route optimization reduces thermal exposure by 18-25%. Recommended approach: avoid downtown hotspots during peak hours (12-18:00), use cooler residential routes, leverage parks and water features."
        
        # General
        else:
            return f"I can help with thermal data analysis, development impact simulation, and climate-aware routing. For {context} workflow, I'm ready to assist. What specific aspect interests you?"

    async def answer(self, workflow: str, query: str, history: list = None) -> str:
        """Main entry point for chatbot responses."""
        context_map = {
            "observe": "You're analyzing real-time thermal data from FortyGuard satellites for Phoenix, Las Vegas, or Houston.",
            "simulate": "You're modeling development impacts on local thermal conditions using documented coefficients.",
            "optimize": "You're helping optimize routes and operations to reduce thermal exposure and climate risk.",
            "city": "You're analyzing real-time thermal data from FortyGuard satellites for urban heat management.",
            "development": "You're modeling development impacts on local thermal conditions using transparent coefficients.",
            "mobility": "You're helping optimize routes and operations to reduce thermal exposure and climate risk."
        }
        
        context = context_map.get(workflow.lower(), "You're a thermal intelligence assistant.")
        
        # Try search-based answer first (better for current info)
        ans = await self.search_answer(query, context)
        
        # If search returns minimal response, try generation
        if not ans or len(ans) < 30:
            ans = await self.generate_answer(query, context)
        
        # Final fallback
        if not ans or len(ans) < 20:
            ans = await self.fallback_answer(query, context)
        
        return ans

# Initialize service
chatbot_service = ChatbotService()
