"""Simulates tool execution — LLM decides which tool to call, we return mock responses."""

import re
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import AgentTool


def simulate_tool_call(tool: AgentTool, arguments: dict) -> str:
    response = tool.simulated_response
    for key, value in arguments.items():
        response = response.replace(f"{{{key}}}", str(value))
    response = re.sub(r"\{[^}]+\}", "[not provided]", response)
    return response
