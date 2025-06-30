from http.server import BaseHTTPRequestHandler
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Extract constraint text
            constraint_text = data.get('text', '').strip()
            if not constraint_text:
                self._send_error(400, "No constraint text provided")
                return
            
            # Parse the constraint
            parsed_result = self._parse_constraint(constraint_text)
            
            # Send response
            self._send_response(200, parsed_result)
            
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except Exception as e:
            self._send_error(500, f"Internal server error: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self._send_cors_headers()
        self.end_headers()
    
    def _send_response(self, status_code: int, data: Dict[str, Any]):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status_code: int, message: str):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        error_response = {"error": message}
        self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def _parse_constraint(self, text: str) -> Dict[str, Any]:
        """
        Parse natural language constraint into structured data.
        This is a rule-based parser that will be enhanced with NLP models.
        """
        text_lower = text.lower()
        
        # Initialize result structure
        result = {
            "type": "unknown",
            "entities": [],
            "conditions": [],
            "confidence": 0.0,
            "temporal": {},
            "capacity": {},
            "location": {},
            "preference": {},
            "rest": {}
        }
        
        # Determine constraint type
        constraint_type = self._classify_constraint_type(text_lower)
        result["type"] = constraint_type
        
        # Extract entities
        entities = self._extract_entities(text)
        result["entities"] = entities
        
        # Extract conditions based on type
        if constraint_type == "temporal":
            result["temporal"] = self._parse_temporal_constraint(text_lower)
            result["conditions"] = self._extract_temporal_conditions(text_lower)
        elif constraint_type == "capacity":
            result["capacity"] = self._parse_capacity_constraint(text_lower)
            result["conditions"] = self._extract_capacity_conditions(text_lower)
        elif constraint_type == "location":
            result["location"] = self._parse_location_constraint(text_lower)
            result["conditions"] = self._extract_location_conditions(text_lower)
        elif constraint_type == "rest":
            result["rest"] = self._parse_rest_constraint(text_lower)
            result["conditions"] = self._extract_rest_conditions(text_lower)
        elif constraint_type == "preference":
            result["preference"] = self._parse_preference_constraint(text_lower)
            result["conditions"] = self._extract_preference_conditions(text_lower)
        
        # Calculate basic confidence score
        result["confidence"] = self._calculate_confidence(text, result)
        
        return result
    
    def _classify_constraint_type(self, text: str) -> str:
        """Classify the type of constraint based on keywords"""
        
        temporal_keywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                           'time', 'hour', 'am', 'pm', 'morning', 'afternoon', 'evening', 'night',
                           'before', 'after', 'during', 'date', 'week', 'month', 'day']
        
        capacity_keywords = ['maximum', 'minimum', 'limit', 'capacity', 'more than', 'less than',
                           'no more', 'at least', 'per day', 'per week', 'games', 'matches']
        
        location_keywords = ['field', 'venue', 'location', 'home', 'away', 'court', 'stadium',
                           'ground', 'facility', 'site', 'place']
        
        rest_keywords = ['rest', 'break', 'between', 'gap', 'interval', 'recovery',
                        'days between', 'hours between', 'time between']
        
        preference_keywords = ['prefer', 'like', 'want', 'wish', 'would like', 'ideally',
                             'better', 'favor', 'rather']
        
        # Count keyword matches
        scores = {
            'temporal': sum(1 for keyword in temporal_keywords if keyword in text),
            'capacity': sum(1 for keyword in capacity_keywords if keyword in text),
            'location': sum(1 for keyword in location_keywords if keyword in text),
            'rest': sum(1 for keyword in rest_keywords if keyword in text),
            'preference': sum(1 for keyword in preference_keywords if keyword in text)
        }
        
        # Return type with highest score
        if max(scores.values()) == 0:
            return "unknown"
        
        return max(scores, key=scores.get)
    
    def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract entities from text using regex patterns"""
        entities = []
        
        # Team names (capitalized words)
        team_pattern = r'\b(Team\s+[A-Z]\w*|[A-Z]\w+\s+Team|[A-Z]\w+s)\b'
        for match in re.finditer(team_pattern, text):
            entities.append({
                "type": "team",
                "value": match.group(),
                "confidence": 0.8
            })
        
        # Days of week
        days_pattern = r'\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mondays|Tuesdays|Wednesdays|Thursdays|Fridays|Saturdays|Sundays)\b'
        for match in re.finditer(days_pattern, text, re.IGNORECASE):
            entities.append({
                "type": "day_of_week",
                "value": match.group().rstrip('s').capitalize(),
                "confidence": 0.95
            })
        
        # Times
        time_pattern = r'\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b'
        for match in re.finditer(time_pattern, text):
            entities.append({
                "type": "time",
                "value": match.group(),
                "confidence": 0.9
            })
        
        # Numbers
        number_pattern = r'\b(\d+)\b'
        for match in re.finditer(number_pattern, text):
            entities.append({
                "type": "number",
                "value": int(match.group()),
                "confidence": 0.85
            })
        
        # Venues/Fields
        venue_pattern = r'\b(Field\s+\d+|Court\s+\d+|Stadium|Arena|Gym|Gymnasium)\b'
        for match in re.finditer(venue_pattern, text, re.IGNORECASE):
            entities.append({
                "type": "venue",
                "value": match.group(),
                "confidence": 0.9
            })
        
        return entities
    
    def _parse_temporal_constraint(self, text: str) -> Dict[str, Any]:
        """Parse temporal-specific information"""
        temporal = {
            "days_of_week": [],
            "excluded_dates": [],
            "time_ranges": [],
            "before_time": None,
            "after_time": None
        }
        
        # Extract days of week
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for day in days:
            if day in text or day + 's' in text:
                temporal["days_of_week"].append(day.capitalize())
        
        # Extract time restrictions
        if 'before' in text:
            time_match = re.search(r'before\s+(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))', text)
            if time_match:
                temporal["before_time"] = time_match.group(1)
        
        if 'after' in text:
            time_match = re.search(r'after\s+(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))', text)
            if time_match:
                temporal["after_time"] = time_match.group(1)
        
        return temporal
    
    def _parse_capacity_constraint(self, text: str) -> Dict[str, Any]:
        """Parse capacity-specific information"""
        capacity = {
            "max_count": None,
            "min_count": None,
            "per_period": None,
            "resource": None
        }
        
        # Extract maximum constraints
        max_patterns = [
            r'no more than (\d+)',
            r'maximum (\d+)',
            r'at most (\d+)',
            r'(\d+) or fewer'
        ]
        
        for pattern in max_patterns:
            match = re.search(pattern, text)
            if match:
                capacity["max_count"] = int(match.group(1))
                break
        
        # Extract minimum constraints
        min_patterns = [
            r'at least (\d+)',
            r'minimum (\d+)',
            r'(\d+) or more'
        ]
        
        for pattern in min_patterns:
            match = re.search(pattern, text)
            if match:
                capacity["min_count"] = int(match.group(1))
                break
        
        # Extract time period
        if 'per day' in text:
            capacity["per_period"] = "day"
        elif 'per week' in text:
            capacity["per_period"] = "week"
        elif 'per hour' in text:
            capacity["per_period"] = "hour"
        
        return capacity
    
    def _parse_location_constraint(self, text: str) -> Dict[str, Any]:
        """Parse location-specific information"""
        return {
            "required_venue": None,
            "excluded_venues": [],
            "home_away_preference": None
        }
    
    def _parse_rest_constraint(self, text: str) -> Dict[str, Any]:
        """Parse rest-specific information"""
        rest = {
            "min_hours": None,
            "min_days": None,
            "between_events": True
        }
        
        # Extract rest periods
        day_match = re.search(r'(\d+)\s+days?\s+between', text)
        if day_match:
            rest["min_days"] = int(day_match.group(1))
        
        hour_match = re.search(r'(\d+)\s+hours?\s+between', text)
        if hour_match:
            rest["min_hours"] = int(hour_match.group(1))
        
        return rest
    
    def _parse_preference_constraint(self, text: str) -> Dict[str, Any]:
        """Parse preference-specific information"""
        return {
            "preferred_times": [],
            "preferred_days": [],
            "weight": 0.5  # Default preference weight
        }
    
    def _extract_temporal_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract conditions for temporal constraints"""
        conditions = []
        
        if 'cannot' in text or 'not' in text:
            conditions.append({"operator": "not_equals", "value": "specified_time"})
        elif 'must' in text or 'only' in text:
            conditions.append({"operator": "equals", "value": "specified_time"})
        elif 'before' in text:
            conditions.append({"operator": "less_than", "value": "specified_time"})
        elif 'after' in text:
            conditions.append({"operator": "greater_than", "value": "specified_time"})
        
        return conditions
    
    def _extract_capacity_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract conditions for capacity constraints"""
        conditions = []
        
        if 'no more than' in text or 'maximum' in text:
            conditions.append({"operator": "less_than_or_equal", "value": "max_count"})
        elif 'at least' in text or 'minimum' in text:
            conditions.append({"operator": "greater_than_or_equal", "value": "min_count"})
        
        return conditions
    
    def _extract_location_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract conditions for location constraints"""
        conditions = []
        
        if 'must' in text and 'home' in text:
            conditions.append({"operator": "equals", "value": "home_venue"})
        elif 'cannot' in text:
            conditions.append({"operator": "not_equals", "value": "specified_venue"})
        
        return conditions
    
    def _extract_rest_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract conditions for rest constraints"""
        conditions = []
        
        if 'at least' in text or 'minimum' in text:
            conditions.append({"operator": "greater_than_or_equal", "value": "min_rest_period"})
        
        return conditions
    
    def _extract_preference_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract conditions for preference constraints"""
        conditions = []
        
        if 'prefer' in text or 'like' in text:
            conditions.append({"operator": "prefer", "value": "specified_option"})
        
        return conditions
    
    def _calculate_confidence(self, text: str, parsed_result: Dict[str, Any]) -> float:
        """Calculate confidence score based on parsing results"""
        score = 0.0
        
        # Base score for successful type classification
        if parsed_result["type"] != "unknown":
            score += 0.3
        
        # Score for entities found
        entity_count = len(parsed_result["entities"])
        if entity_count > 0:
            score += min(0.3, entity_count * 0.1)
        
        # Score for conditions found
        condition_count = len(parsed_result["conditions"])
        if condition_count > 0:
            score += min(0.2, condition_count * 0.1)
        
        # Score for specific constraint data
        constraint_data = parsed_result.get(parsed_result["type"], {})
        if constraint_data and any(v is not None and v != [] for v in constraint_data.values()):
            score += 0.2
        
        return min(1.0, score) 