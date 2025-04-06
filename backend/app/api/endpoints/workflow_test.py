"""
Test API endpoints for workflow system.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Sample data for testing
# This will be modified at runtime to store created workflows
SAMPLE_WORKFLOWS = [
    {
        "id": "1",
        "name": "Sample Workflow 1",
        "description": "A sample workflow for testing",
        "version": 1,
        "avg_execution_time": 2.5,
        "success_rate": 0.95,
        "improvement_suggestions": [],
        "definition": {
            "steps": [
                {
                    "id": "step1",
                    "name": "First Step",
                    "type": "transform",
                    "position": {"x": 100, "y": 100},
                    "config": {
                        "code": "return { result: input.value * 2 };"
                    }
                }
            ],
            "output": {
                "result": {"source": "variables", "path": "step1.result"}
            }
        },
        "is_public": True,
        "tags": ["test", "sample"]
    },
    {
        "id": "2",
        "name": "Sample Workflow 2",
        "description": "Another sample workflow for testing",
        "version": 2,
        "avg_execution_time": 3.7,
        "success_rate": 0.85,
        "improvement_suggestions": [
            {
                "type": "performance",
                "description": "Optimize step 2 to reduce execution time",
                "expected_improvement": 0.2
            }
        ],
        "definition": {
            "steps": [
                {
                    "id": "step1",
                    "name": "First Step",
                    "type": "transform",
                    "position": {"x": 100, "y": 100},
                    "config": {
                        "code": "return { value: input.value * 2 };"
                    }
                },
                {
                    "id": "step2",
                    "name": "Second Step",
                    "type": "transform",
                    "position": {"x": 300, "y": 100},
                    "config": {
                        "code": "return { result: input.value + 10 };"
                    }
                }
            ],
            "output": {
                "result": {"source": "variables", "path": "step2.result"}
            }
        },
        "is_public": False,
        "tags": ["test", "complex"]
    }
]

SAMPLE_EXECUTIONS = [
    {
        "id": "exec1",
        "workflow_id": "1",
        "started_at": "2023-01-01T12:00:00Z",
        "completed_at": "2023-01-01T12:00:02Z",
        "status": "completed",
        "result": {"result": 10},
        "error": None,
        "execution_time": 2.0,
        "input_data": {"value": 5},
        "output_data": {"result": 10},
        "steps": [
            {
                "id": "step_exec1",
                "step_id": "step1",
                "step_name": "First Step",
                "status": "completed",
                "started_at": "2023-01-01T12:00:00Z",
                "completed_at": "2023-01-01T12:00:02Z",
                "execution_time": 2.0,
                "error": None,
                "input_data": {"value": 5},
                "output_data": {"result": 10}
            }
        ]
    }
]

SAMPLE_OPTIMIZATIONS = [
    {
        "id": "opt1",
        "workflow_id": "2",
        "created_at": "2023-01-02T12:00:00Z",
        "applied_at": None,
        "status": "pending",
        "original_version": 1,
        "optimized_version": None,
        "optimization_type": "performance",
        "description": "Optimize step 2 to reduce execution time",
        "expected_improvement": 0.2,
        "actual_improvement": None,
        "changes": {
            "steps": [
                {
                    "type": "modify",
                    "step_id": "step2",
                    "step_name": "Second Step",
                    "modifications": {
                        "config": {
                            "code": "return { result: input.value + 10 }; // Optimized"
                        }
                    }
                }
            ]
        }
    }
]

@router.get("/test")
async def list_workflows():
    """
    List all test workflows.
    """
    return SAMPLE_WORKFLOWS

@router.get("/test/{workflow_id}")
async def get_workflow(workflow_id: str):
    """
    Get a test workflow by ID.
    """
    for workflow in SAMPLE_WORKFLOWS:
        if workflow["id"] == workflow_id:
            return workflow

    raise HTTPException(status_code=404, detail="Workflow not found")

@router.post("/test")
async def create_workflow(workflow: Dict[str, Any]):
    """
    Create a test workflow.
    """
    # Add an ID and default values if not provided
    workflow["id"] = str(len(SAMPLE_WORKFLOWS) + 1)
    if "version" not in workflow:
        workflow["version"] = 1
    if "avg_execution_time" not in workflow:
        workflow["avg_execution_time"] = 0.0
    if "success_rate" not in workflow:
        workflow["success_rate"] = 1.0
    if "improvement_suggestions" not in workflow:
        workflow["improvement_suggestions"] = []
    if "tags" not in workflow:
        workflow["tags"] = []

    # Add the workflow to our in-memory list
    SAMPLE_WORKFLOWS.append(workflow)

    return workflow

@router.get("/test/{workflow_id}/executions")
async def get_workflow_executions(workflow_id: str):
    """
    Get all executions for a test workflow.
    """
    return [e for e in SAMPLE_EXECUTIONS if e["workflow_id"] == workflow_id]

@router.get("/test/{workflow_id}/executions/{execution_id}")
async def get_workflow_execution(workflow_id: str, execution_id: str):
    """
    Get a specific execution for a test workflow.
    """
    for execution in SAMPLE_EXECUTIONS:
        if execution["workflow_id"] == workflow_id and execution["id"] == execution_id:
            return execution

    raise HTTPException(status_code=404, detail="Execution not found")

@router.get("/test/{workflow_id}/optimizations")
async def get_workflow_optimizations(workflow_id: str):
    """
    Get all optimizations for a test workflow.
    """
    return [o for o in SAMPLE_OPTIMIZATIONS if o["workflow_id"] == workflow_id]

@router.get("/test/{workflow_id}/optimizations/{optimization_id}")
async def get_workflow_optimization(workflow_id: str, optimization_id: str):
    """
    Get a specific optimization for a test workflow.
    """
    for optimization in SAMPLE_OPTIMIZATIONS:
        if optimization["workflow_id"] == workflow_id and optimization["id"] == optimization_id:
            return optimization

    raise HTTPException(status_code=404, detail="Optimization not found")

@router.delete("/test/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """
    Delete a test workflow by ID.
    """
    global SAMPLE_WORKFLOWS

    # Find the workflow to delete
    for i, workflow in enumerate(SAMPLE_WORKFLOWS):
        if workflow["id"] == workflow_id:
            # Remove the workflow from the list
            SAMPLE_WORKFLOWS.pop(i)
            return {"success": True, "message": f"Workflow {workflow_id} deleted"}

    raise HTTPException(status_code=404, detail="Workflow not found")

@router.put("/test/{workflow_id}")
async def update_workflow(workflow_id: str, workflow_data: Dict[str, Any]):
    """
    Update a test workflow by ID.
    """
    global SAMPLE_WORKFLOWS

    # Find the workflow to update
    for i, workflow in enumerate(SAMPLE_WORKFLOWS):
        if workflow["id"] == workflow_id:
            # Update the workflow
            workflow_data["id"] = workflow_id  # Ensure ID remains the same
            SAMPLE_WORKFLOWS[i] = workflow_data
            return workflow_data

    raise HTTPException(status_code=404, detail="Workflow not found")
