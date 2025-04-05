"""
Working memory utilities for temporary execution context.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class WorkingMemory:
    """
    Working memory for temporary execution context.
    
    This class provides a way to store temporary data during task execution
    without persisting it to the database. It's useful for storing intermediate
    results, processing steps, and other data that doesn't need to be remembered
    long-term.
    """
    
    def __init__(self):
        """Initialize working memory."""
        self.data: Dict[str, Any] = {}
        self.steps: List[Dict[str, Any]] = []
        self.documents: List[Dict[str, Any]] = []
        self.results: List[Dict[str, Any]] = []
    
    def add_data(self, key: str, value: Any) -> None:
        """
        Add data to working memory.
        
        Args:
            key: Key to store the data under
            value: Value to store
        """
        self.data[key] = value
    
    def get_data(self, key: str, default: Any = None) -> Any:
        """
        Get data from working memory.
        
        Args:
            key: Key to retrieve
            default: Default value to return if key doesn't exist
            
        Returns:
            Value stored under key, or default if key doesn't exist
        """
        return self.data.get(key, default)
    
    def add_step(self, step: str, result: Any = None, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Add a processing step to working memory.
        
        Args:
            step: Description of the step
            result: Result of the step
            metadata: Additional metadata about the step
        """
        self.steps.append({
            "step": step,
            "result": result,
            "metadata": metadata or {},
        })
    
    def add_document(self, content: str, source: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Add a document to working memory.
        
        Args:
            content: Content of the document
            source: Source of the document
            metadata: Additional metadata about the document
        """
        self.documents.append({
            "content": content,
            "source": source,
            "metadata": metadata or {},
        })
    
    def add_result(self, result: Any, description: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Add a result to working memory.
        
        Args:
            result: Result to store
            description: Description of the result
            metadata: Additional metadata about the result
        """
        self.results.append({
            "result": result,
            "description": description,
            "metadata": metadata or {},
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of working memory.
        
        Returns:
            Summary of working memory
        """
        return {
            "data": self.data,
            "steps": self.steps,
            "documents": [
                {
                    "source": doc.get("source"),
                    "content_preview": doc.get("content")[:100] + "..." if len(doc.get("content", "")) > 100 else doc.get("content"),
                    "metadata": doc.get("metadata"),
                }
                for doc in self.documents
            ],
            "results": self.results,
        }
    
    def clear(self) -> None:
        """Clear working memory."""
        self.data = {}
        self.steps = []
        self.documents = []
        self.results = []
    
    def to_permanent_memories(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Convert important working memory items to permanent memories.
        
        This method extracts the important information from working memory
        and formats it as permanent memories that can be stored in the database.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            List of memory objects ready to be stored in the database
        """
        memories = []
        
        # Add a summary of the task as a permanent memory
        if self.steps:
            summary = f"Task summary: Completed {len(self.steps)} steps.\n"
            
            # Add first and last steps
            if len(self.steps) > 0:
                summary += f"Started with: {self.steps[0]['step']}\n"
            if len(self.steps) > 1:
                summary += f"Ended with: {self.steps[-1]['step']}\n"
            
            # Add results
            if self.results:
                summary += "\nResults:\n"
                for result in self.results:
                    description = result.get("description", "Result")
                    result_value = str(result.get("result", ""))
                    if len(result_value) > 100:
                        result_value = result_value[:100] + "..."
                    summary += f"- {description}: {result_value}\n"
            
            memories.append({
                "agent_id": agent_id,
                "role": "system",
                "content": summary,
                "memory_type": "permanent",
                "meta_data": {
                    "type": "task_summary",
                    "steps_count": len(self.steps),
                    "documents_count": len(self.documents),
                    "results_count": len(self.results),
                },
            })
        
        # Add important results as permanent memories
        for result in self.results:
            if result.get("metadata", {}).get("important", False):
                memories.append({
                    "agent_id": agent_id,
                    "role": "system",
                    "content": f"Result: {result.get('description', 'Important result')}\n{result.get('result', '')}",
                    "memory_type": "permanent",
                    "meta_data": {
                        "type": "task_result",
                        **result.get("metadata", {}),
                    },
                })
        
        return memories
