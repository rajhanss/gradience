import os
import logging
from typing import Optional, Any
from datetime import UTC, datetime

logger = logging.getLogger(__name__)

CITY_INTELLIGENCE_REPORTS = {
    "new york": {
        "name": "New York City (NY)",
        "avg_temp": 33.8,
        "max_temp": 39.5,
        "hotspots": "South Bronx (Mott Haven), Midtown East unshaded avenues, East Harlem, and industrial Bushwick / East New York.",
        "cooling_zones": "Central Park (-4.2°C microclimate buffer), Prospect Park, and Hudson River greenway.",
        "telemetry": "New York City exhibits severe urban canyon heat retention where high-rise masonry, dense vehicular congestion, and dark asphalt trap daytime solar radiation. Thermal anomalies in the South Bronx reach +3.8°C above regional baseline due to low canopy cover (<8%).",
        "gradience_plan": "Accelerate cool roof retrofits under NYC Local Law 92/94, deploy contiguous street tree corridors in heat-vulnerable environmental justice zones, and establish heat-resilient cooling hubs near transit hubs."
    },
    "phoenix": {
        "name": "Phoenix (AZ)",
        "avg_temp": 35.2,
        "max_temp": 44.1,
        "hotspots": "Maryvale, South Mountain industrial corridor, Downtown urban core, and Sky Harbor airport perimeter.",
        "cooling_zones": "Desert Botanical Garden buffer, Encanto Park, and irrigated residential pockets.",
        "telemetry": "Phoenix exhibits extreme desert Urban Heat Island (UHI) with nocturnal surface temperatures remaining above 32°C. Expansive asphalt parking lots and dark roofing absorb over 1000 W/m² of peak solar irradiance.",
        "gradience_plan": "Mandate high-albedo cool pavements (SRI > 40), expand native shade canopy to 25% across transit corridors, and integrate cool transit shelters with photovoltaic shading."
    },
    "vegas": {
        "name": "Las Vegas (NV)",
        "avg_temp": 37.8,
        "max_temp": 44.8,
        "hotspots": "The Las Vegas Strip corridor, North Las Vegas warehousing district, and East Las Vegas residential core.",
        "cooling_zones": "Sunset Park, Floyd Lamb Park, and shaded resort internal courtyards.",
        "telemetry": "Las Vegas experiences intense thermal mass retention from mega-resort asphalt parking decks and multi-lane roadways, generating a persistent +4.5°C localized heat island anomaly.",
        "gradience_plan": "Scale cool roof retrofits across commercial flat-roof footprints and implement solar shade canopies over expansive parking facilities."
    },
    "houston": {
        "name": "Houston (TX)",
        "avg_temp": 33.1,
        "max_temp": 39.8,
        "hotspots": "Ship Channel industrial zone, Gulfton dense residential, Downtown freeway interchanges, and Greenspoint.",
        "cooling_zones": "Memorial Park, Buffalo Bayou greenway, and Hermann Park.",
        "telemetry": "Houston faces dangerous compound heat and humidity stress (Wet-Bulb Globe Temperature exceeding 31°C). High concrete freeway density amplifies daytime thermal radiation.",
        "gradience_plan": "Leverage bayou green-blue corridors for natural airflow dissipation and install permeable vegetative surfaces to combat compound heat and stormwater."
    }
}

class ChatbotService:
    """AI-powered thermal intelligence assistant using Groq API with intelligent city fallback."""

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")

    def get_city_report(self, query: str) -> Optional[str]:
        q = query.lower()
        key = None
        if any(w in q for w in ["york", "yourk", "nyc", "manhattan", "bronx", "brooklyn", "queens"]):
            key = "new york"
        elif any(w in q for w in ["phoenix", "arizona", "maricopa", "phx"]):
            key = "phoenix"
        elif any(w in q for w in ["vegas", "las vegas", "nevada", "strip"]):
            key = "vegas"
        elif any(w in q for w in ["houston", "harris", "texas", "bayou"]):
            key = "houston"

        if key and key in CITY_INTELLIGENCE_REPORTS:
            d = CITY_INTELLIGENCE_REPORTS[key]
            return (
                f"**Reference Briefing — {d['name']} (compiled estimate, not live telemetry)**\n\n"
                f"• **Surface Temperature:** Average {d['avg_temp']}°C (Peak Hotspots: {d['max_temp']}°C)\n"
                f"• **Primary Heat Island Hotspots:** {d['hotspots']}\n"
                f"• **Natural Cooling Buffers:** {d['cooling_zones']}\n\n"
                f"**Microclimate Context:**\n{d['telemetry']}\n\n"
                f"**Gradience Actionable Mitigation:**\n{d['gradience_plan']}\n\n"
                f"*Note: City reference data is a compiled static estimate — not a live FortyGuard satellite read. "
                f"Click ‘Request Live FortyGuard Heatmap’ for real satellite telemetry.*"
            )
        return None

    def fallback_answer(self, query: str, context: str) -> str:
        q_lower = query.lower()
        if any(w in q_lower for w in ["temperature", "temp", "hot", "heat", "hotspot", "island", "iland", "spot"]):
            return (
                "**General Reference — Urban Heat Island Patterns (compiled model, not live telemetry)**\n\n"
                "Urban land surface temperatures vary significantly by land cover. Unshaded asphalt roadways and "
                "commercial flat roofs typically reach 42–45°C during peak daytime solar radiation (12:00–16:30), "
                "creating a +3.5°C to +5.2°C Urban Heat Island differential over rural baselines. "
                "Areas with canopy cover below 10% show maximum vulnerability. "
                "Priority mitigations: cool reflective pavements (SRI > 40) and continuous green vegetative corridors.\n\n"
                "*Note: These are general reference values from published urban climate research, not a live FortyGuard "
                "satellite read. For pilot-city live data (Phoenix, Las Vegas, Houston), click "
                "'Request Live FortyGuard Heatmap'.*"
            )

        if any(w in q_lower for w in ["development", "simulate", "build", "construction", "impact"]):
            return (
                "**General Reference — Development Microclimate Model (documented coefficients, not live telemetry)**\n\n"
                "Standard commercial/residential developments increase localized surface temperature by +0.5°C to "
                "+1.4°C baseline without mitigations. Based on Gradience's documented physical model coefficients:\n"
                "• 15% vegetation increase: −0.65°C surface cooling\n"
                "• Cool reflective roof installation (SRI 82): −0.45°C thermal reduction\n"
                "• Tree canopy shade buffer: −0.25°C direct interception\n"
                "Combining these mitigations achieves 30–50% net heat impact reduction before groundbreaking.\n\n"
                "*Note: Values are deterministic model coefficients, not results of a live simulation run. "
                "Use the Simulate workflow for a location-specific assessment.*"
            )

        if any(w in q_lower for w in ["route", "optimize", "mobility", "walk", "transit", "safe", "ambulance"]):
            return (
                "**General Reference — Thermal-Safe Route Optimization (model estimate, not live telemetry)**\n\n"
                "Heat-aware mobility routing balances transit distance, travel time, and radiant solar exposure. "
                "By steering pedestrians, transit fleets, and vulnerable populations through tree-shaded corridors "
                "and park cooling shadows, cumulative radiant thermal exposure is reduced by 18–25% compared to "
                "unshaded arterial highways.\n\n"
                "*Note: These are general model estimates. Use the Optimize workflow for a location-specific route.*"
            )

        return (
            f"**Gradience Climate Assistant** ({context})\n\n"
            "I can provide compiled reference briefings for Phoenix (AZ), Las Vegas (NV), Houston (TX), and "
            "New York City (NY) — plus general heat-island and mitigation guidance. "
            "For live FortyGuard satellite thermal data, use the pilot-city heatmap workflow (Phoenix, Las Vegas, Houston). "
            "What specific location or scenario would you like to explore?"
        )

    async def answer(self, workflow: str, query: str, history: list = None) -> tuple[str, str]:
        city_rep = self.get_city_report(query)
        if city_rep:
            return (city_rep, "reference_briefing")

        context_map = {
            "observe": "Real-time FortyGuard satellite thermal observation and hotspot detection",
            "simulate": "Development microclimate simulation and mitigation coefficient analysis",
            "optimize": "Climate-aware mobility and heat-safe route optimization",
        }
        context = context_map.get(workflow.lower(), "Urban Thermal Intelligence")

        key_groq = os.getenv("GROQ_API_KEY", self.groq_api_key)
        if key_groq:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=8.0) as client:
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
                        headers={"Authorization": f"Bearer {key_groq}"}
                    )
                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            text = choices[0]["message"].get("content", "")
                            if text:
                                return (text, "ai_groq")
            except Exception as e:
                logger.warning("Groq inference error: %s", e)

        return (self.fallback_answer(query, context), "general_reference")

chatbot_service = ChatbotService()
