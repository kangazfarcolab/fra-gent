"""
Real workflow processor that can execute workflows with LLM steps.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkflowStep(BaseModel):
    id: str
    name: str
    type: str
    config: Dict[str, Any]
    position: Dict[str, int]

class WorkflowConnection(BaseModel):
    from_step: str
    to_step: str
    condition: Optional[bool] = None

class WorkflowDefinition(BaseModel):
    steps: List[WorkflowStep]
    connections: List[WorkflowConnection]
    output: Dict[str, Any]

class WorkflowExecution(BaseModel):
    id: str
    workflow_id: str
    started_at: str
    completed_at: Optional[str] = None
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: float
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    steps: List[Dict[str, Any]] = []

async def execute_llm_step(step: WorkflowStep, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute an LLM step using the OpenAI API.
    """
    try:
        # Get API key from environment or step config
        api_key = os.environ.get("OPENAI_API_KEY") or step.config.get("api_key")
        if not api_key:
            # For testing, simulate LLM response
            logger.warning("No API key found, simulating LLM response")
            text = input_data.get("text", "")
            target_lang = step.config.get("target_language", "Spanish")

            # Simple simulation for translation
            if "translate" in step.config.get("prompt", "").lower():
                if target_lang == "Spanish":
                    translations = {
                        "hello": "hola",
                        "world": "mundo",
                        "how are you": "cómo estás",
                        "good morning": "buenos días",
                        "thank you": "gracias"
                    }
                    result = translations.get(text.lower(), f"[Translated to {target_lang}]: {text}")
                elif target_lang == "French":
                    translations = {
                        "hello": "bonjour",
                        "world": "monde",
                        "how are you": "comment allez-vous",
                        "good morning": "bonjour",
                        "thank you": "merci"
                    }
                    result = translations.get(text.lower(), f"[Translated to {target_lang}]: {text}")
                else:
                    result = f"[Translated to {target_lang}]: {text}"

                return {
                    "result": result,
                    "model": "simulation",
                    "usage": {"prompt_tokens": len(text), "completion_tokens": len(result)}
                }

            # Simple simulation for summarization
            if "summarize" in step.config.get("prompt", "").lower():
                return {
                    "result": f"Summary of: {text[:50]}..." if len(text) > 50 else text,
                    "model": "simulation",
                    "usage": {"prompt_tokens": len(text), "completion_tokens": 50}
                }

            # Default simulation
            return {
                "result": f"Processed with {step.name}: {text}",
                "model": "simulation",
                "usage": {"prompt_tokens": len(text), "completion_tokens": 50}
            }

        # Get model from step config or use default
        model = step.config.get("model", "gpt-3.5-turbo")

        # Get prompt from step config and replace variables
        prompt_template = step.config.get("prompt", "")
        prompt = prompt_template

        # Replace variables in the prompt
        for key, value in input_data.items():
            if isinstance(value, str):
                prompt = prompt.replace(f"{{{{input.{key}}}}}", value)
            else:
                prompt = prompt.replace(f"{{{{input.{key}}}}}", str(value))

        # Prepare the API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": step.config.get("temperature", 0.7),
            "max_tokens": step.config.get("max_tokens", 1000)
        }

        # Make the API request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )

            if response.status_code != 200:
                raise ValueError(f"OpenAI API error: {response.text}")

            result = response.json()

            # Extract the response text
            response_text = result["choices"][0]["message"]["content"]

            return {
                "result": response_text,
                "model": model,
                "usage": result.get("usage", {})
            }

    except Exception as e:
        logger.error(f"Error executing LLM step: {e}")
        return {"error": str(e)}

async def execute_transform_step(step: WorkflowStep, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a transform step using the provided code.
    """
    try:
        # Get the code from the step config
        code = step.config.get("code", "")

        # Create a function from the code
        transform_fn = compile(code, "<string>", "exec")

        # Create a namespace for the function
        namespace = {"input": input_data, "result": {}}

        # Execute the function
        exec(transform_fn, namespace)

        # Return the result
        return namespace.get("result", {})

    except Exception as e:
        logger.error(f"Error executing transform step: {e}")
        return {"error": str(e)}

async def execute_condition_step(step: WorkflowStep, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a condition step using the provided condition.
    """
    try:
        # Get the condition from the step config
        condition = step.config.get("condition", "")

        # Create a function from the condition
        condition_fn = compile(f"result = {condition}", "<string>", "exec")

        # Create a namespace for the function
        namespace = {"input": input_data, "result": False}

        # Execute the function
        exec(condition_fn, namespace)

        # Return the result
        return {"result": namespace["result"]}

    except Exception as e:
        logger.error(f"Error executing condition step: {e}")
        return {"error": str(e)}

async def execute_workflow(workflow_id: str, workflow_def: Dict[str, Any], input_data: Dict[str, Any]) -> WorkflowExecution:
    """
    Execute a workflow with the given input data.
    """
    # Parse the workflow definition
    try:
        # Convert the steps to WorkflowStep objects
        steps = []
        for step_data in workflow_def.get("steps", []):
            steps.append(WorkflowStep(
                id=step_data["id"],
                name=step_data["name"],
                type=step_data["type"],
                config=step_data["config"],
                position=step_data["position"]
            ))

        # Convert the connections to WorkflowConnection objects
        connections = []
        for conn_data in workflow_def.get("connections", []):
            connections.append(WorkflowConnection(
                from_step=conn_data.get("from", ""),
                to_step=conn_data.get("to", ""),
                condition=conn_data.get("condition")
            ))

        # Create the workflow definition
        workflow = WorkflowDefinition(
            steps=steps,
            connections=connections,
            output=workflow_def.get("output", {})
        )
    except Exception as e:
        logger.error(f"Error parsing workflow definition: {e}")
        return WorkflowExecution(
            id=f"exec_{int(time.time())}",
            workflow_id=workflow_id,
            started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            completed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            status="failed",
            error=f"Error parsing workflow definition: {str(e)}",
            execution_time=0.0,
            input_data=input_data
        )

    # Start the execution
    execution_id = f"exec_{int(time.time())}"
    start_time = time.time()

    execution = WorkflowExecution(
        id=execution_id,
        workflow_id=workflow_id,
        started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        status="running",
        execution_time=0.0,
        input_data=input_data,
        steps=[]
    )

    try:
        # Execute the workflow
        step_results = {}
        step_executions = []

        # Execute each step
        for step in workflow.steps:
            step_start_time = time.time()
            step_execution = {
                "id": f"step_exec_{int(time.time())}",
                "step_id": step.id,
                "step_name": step.name,
                "status": "running",
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "input_data": input_data
            }

            try:
                # Execute the step based on its type
                if step.type == "llm":
                    result = await execute_llm_step(step, input_data)
                elif step.type == "transform":
                    result = await execute_transform_step(step, input_data)
                elif step.type == "condition":
                    result = await execute_condition_step(step, input_data)
                else:
                    result = {"error": f"Unknown step type: {step.type}"}

                # Store the result
                step_results[step.id] = result

                # Update the step execution
                step_execution["status"] = "completed" if "error" not in result else "failed"
                step_execution["completed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                step_execution["execution_time"] = time.time() - step_start_time
                step_execution["output_data"] = result

                if "error" in result:
                    step_execution["error"] = result["error"]

            except Exception as e:
                logger.error(f"Error executing step {step.id}: {e}")
                step_execution["status"] = "failed"
                step_execution["completed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                step_execution["execution_time"] = time.time() - step_start_time
                step_execution["error"] = str(e)

            # Add the step execution to the list
            step_executions.append(step_execution)

        # Determine the output
        output_data = {}
        for key, value in workflow.output.items():
            if isinstance(value, dict) and "source" in value and "path" in value:
                if value["source"] == "variables":
                    path = value["path"].split(".")
                    if len(path) == 2:
                        step_id, result_key = path
                        if step_id in step_results and result_key in step_results[step_id]:
                            output_data[key] = step_results[step_id][result_key]

        # Update the execution
        execution.completed_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        execution.status = "completed"
        execution.execution_time = time.time() - start_time
        execution.output_data = output_data
        execution.steps = step_executions

        return execution

    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        execution.completed_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        execution.status = "failed"
        execution.error = str(e)
        execution.execution_time = time.time() - start_time

        return execution
