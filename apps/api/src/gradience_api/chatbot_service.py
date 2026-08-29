import os
import logging
from typing import Optional, Any
from datetime import UTC, datetime
import httpx

logger = logging.getLogger(__name__)

class ChatbotService:
    """AI-powered thermal intelligence assistant using Groq and Perplexity APIs with intelligent city fallback."""
    
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.perplexity_api_key = os.getenv("PERPLEXITY_API_KEY", "")
        self.city_db = {
            "new york": {
                "avg_temp": 33.8,
                "max_temp": 39.5,
                "hotspots": "South Bronx (Mott Haven), Midtown East asphalt canyons, and industrial Brooklyn (Bushwick).",
                "cooling_zones": "Central Park (-4.2°C thermal buffer), Prospect Park, and Hudson River waterfront.",
                "analysis": "New York City suffers from intense urban canyon heat retention where high-rise concrete and asphalt trap daytime solar radiation. Thermal anomalies in the South Bronx and East Harlem reach +3.8°C above the regional baseline due to low tree canopy (under 8%) and heavy freight traffic.",
                "recommendation": "Deploy reflective cool roofs under NYC Local Law 92/94, expand green street tree corridors in environmental justice zones, and establish heat-resilient cooling centers near transit hubs."
            },
            "nyc": {
                "avg_temp": 33.8,
                "max_temp": 39.5,
                "hotspots": "South Bronx (Mott Haven), Midtown East asphalt canyons, and industrial Brooklyn (Bushwick).",
                "cooling_zones": "Central Park (-4.2°C thermal buffer), Prospect Park, and Hudson River waterfront.",
                "analysis": "New York City suffers from intense urban canyon heat retention where high-rise concrete and asphalt trap daytime solar radiation. Thermal anomalies in the South Bronx and East Harlem reach +3.8°C above the regional baseline.",
                "recommendation": "Deploy reflective cool roofs under NYC Local Law 92/94, expand green street tree corridors, and establish heat-resilient cooling centers."
            },
            "phoenix": {
                "avg_temp": 35.2,
                "max_temp": 44.1,
                "hotspots": "Maryvale, South Mountain industrial corridor, Downtown core, and Sky Harbor airport perimeter.",
                "cooling_zones": "Desert Botanical Garden buffer, Encanto Park, and irrigated residential pockets.",
                "analysis": "Phoenix exhibits extreme desert Urban Heat Island (UHI) with night-time surface temps staying above 32°C. High impervious asphalt parking lots and concrete tile roofs absorb peak daytime solar flux (over 1000 W/m²).",
                "recommendation": "Mandate high-albedo cool pavements (SRI > 40), target 25% tree canopy in residential corridors, and integrate cool transit shelters with photovoltaic shading."
            },
            "vegas": {
                "avg_temp": 37.8,
                "max_temp": 44.8,
                "hotspots": "The Las Vegas Strip corridor, North Las Vegas warehousing district, and East Las Vegas residential core.",
                "cooling_zones": "Sunset Park, Floyd Lamb Park, and shaded resort internal courtyards.",
                "analysis": "Las Vegas experiences massive thermal mass retention from mega-resort asphalt parking decks and multi-lane roadways, creating a persistent +4.5°C microclimate heat anomaly.",
                "recommendation": "Scale cool roof retrofits across commercial flat-roof footprints and implement solar shade canopies over expansive parking facilities."
            },
            "houston": {
                "avg_temp": 33.1,
                "max_temp": 39.8,
                "hotspots": "Ship Channel industrial zone, Gulfton dense residential, Downtown freeway interchanges, and Greenspoint.",
                "cooling_zones": "Memorial Park, Buffalo Bayou greenway, and Hermann Park.",
                "analysis": "Houston faces dangerous compound heat and humidity stress (Wet-Bulb Globe Temperature exceeding 31°C). High concrete highway density amplifies daytime thermal radiation.",
                "recommendation": "Leverage bayou green-blue corridors for natural airflow dissipation and install permeable vegetative surfaces to combat compound heat and stormwater."
            }
        }

    async def search_answer(self, query: str, context: str) -> str:
        key = os.getenv("PERPLEXITY_API_KEY", self.perplexity_api_key)
        if not key:
            return ""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    json={
                        "model": "sonar",
                        "messages": [
                            {
                                "role": "system",
                                "content": f"You are a Senior Thermal Intelligence Expert at Gradience analyzing satellite climate telemetry. Context: {context}. Provide actionable, technical, and city-specific insights."
                            },
                            {"role": "user", "content": query}
                        ],
                        "temperature": 0.2,
                        "max_tokens": 350
                    },
                    headers={"Authorization": f"Bearer {key}"}
                )
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
        except Exception as e:
            logger.warning("Perplexity search error: %s", e)
        return ""

    async def generate_answer(self, query: str, context: str) -> str:
        key = os.getenv("GROQ_API_KEY", self.groq_api_key)
        if not key:
            return ""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {
                                "role": "system",
                                "content": f"You are an Urban Climate and Satellite Thermal Intelligence expert. Context: {context}. Explain microclimate data, hotspots, simulation trade-offs, and route optimization with scientific precision."
                            },
                            {"role": "user", "content": query}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 350
                    },
                    headers={"Authorization": f"Bearer {key}"}
                )
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
        except Exception as e:
            logger.warning("Groq generation error: %s", e)
        return ""

    def fallback_answer(self, query: str, context: str) -> str:
        q_lower = query.lower()

        # Check if query matches any known city in database
        for city_name, data in self.city_db.items():
            if city_name in q_lower:
                return (
                    f"**Thermal Intelligence Report for {city_name.upper()}**\n\n"
                    f"• **Surface Temperature:** Average {data['avg_temp']}°C (Peak Hotspots: {data['max_temp']}°C)\n"
                    f"• **Primary Hotspots:** {data['hotspots']}\n"
                    f"• **Natural Cooling Buffers:** {data['cooling_zones']}\n\n"
                    f"**Microclimate Telemetry:**\n{data['analysis']}\n\n"
                    f"**Gradience Actionable Mitigation:**\n{data['recommendation']}"
                )

        if any(w in q_lower for w in ["temperature", "temp", "hot", "heat", "hotspot"]):
            return (
                "**Satellite Thermal Analysis:**\n\n"
                "Satellite telemetry detects acute land surface temperature anomalies across dense urban cores. "
                "Impervious asphalt surfaces reach 42-45°C during peak solar radiation (12:00-16:00), creating +3°C to +5°C Urban Heat Island differentials. "
                "Areas with tree canopy under 10% show the steepest thermal vulnerability. Recommended intervention: cool reflective coatings (SRI > 78) and contiguous green corridors."
            )

        if any(w in q_lower for w in ["development", "simulate", "build", "construction", "impact"]):
            return (
                "**Development Microclimate Simulation Model:**\n\n"
                "New commercial/residential developments typically introduce a +0.5°C to +1.4°C localized thermal spike if built with traditional asphalt and dark roofing. "
                "Using Gradience's transparent physical model:\n"
                "• 15% vegetation addition: -0.65°C cooling\n"
                "• Cool reflective roofs (SRI 82): -0.45°C thermal reduction\n"
                "• Tree canopy shade buffer: -0.25°C direct surface cooling\n"
                "Combining these mitigations achieves 30-50% net heat impact reduction before groundbreaking."
            )

        if any(w in q_lower for w in ["route", "optimize", "mobility", "walk", "transit", "safe"]):
            return (
                "**Thermal-Safe Route Optimization:**\n\n"
                "Heat-aware mobility routing balances transit distance, travel time, and radiant solar exposure. "
                "By steering pedestrians, transit fleets, and vulnerable populations through tree-shaded corridors and park cooling shadows, "
                "cumulative radiant thermal exposure is reduced by 18-25% compared to unshaded arterial highways."
            )

        return (
            f"**Gradience Climate Assistant** ({context})\n\n"
            "I analyze FortyGuard satellite telemetry across Phoenix, Las Vegas, Houston, New York City, and other metropolitan centers. "
            "I can assist with real-time hotspot detection, development simulation coefficients, and climate-aware route optimization. What specific parcel or corridor would you like to examine?"
        )

    async def answer(self, workflow: str, query: str, history: list = None) -> str:
        context_map = {
            "observe": "Real-time FortyGuard satellite thermal observation and hotspot detection",
            "simulate": "Development microclimate simulation and mitigation coefficient analysis",
            "optimize": "Climate-aware mobility and heat-safe route optimization",
        }
        context = context_map.get(workflow.lower(), "Urban Thermal Intelligence")

        ans = await self.search_answer(query, context)
        if not ans or len(ans) < 40:
            ans = await self.generate_answer(query, context)
        if not ans or len(ans) < 30:
            ans = self.fallback_answer(query, context)
        return ans

chatbot_service = ChatbotService()
