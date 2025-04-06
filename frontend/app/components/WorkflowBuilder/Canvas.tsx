"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  SmartToy as AgentIcon,
  Code as CodeIcon,
  Api as ApiIcon,
  CallSplit as ConditionIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

interface CanvasProps {
  steps: any[];
  onStepSelect: (step: any) => void;
  onConnectionSelect: (connection: any) => void;
  onStepAdd: (step: any) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  steps,
  onStepSelect,
  onConnectionSelect,
  onStepAdd,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedStep, setDraggedStep] = useState<any | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddStep = (type: string) => {
    const newStep = {
      id: uuidv4(),
      name: `New ${type} Step`,
      type,
      position: {
        x: canvasSize.width / 2 - 75,
        y: canvasSize.height / 2 - 50,
      },
      config: {},
    };

    onStepAdd(newStep);
    handleMenuClose();
  };

  const handleStepMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    step: any
  ) => {
    e.stopPropagation();

    // Calculate the offset from the mouse position to the step's top-left corner
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedStep(step);
    setDragOffset({ x: offsetX, y: offsetY });

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedStep) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const x = e.clientX - canvasRect.left - dragOffset.x;
        const y = e.clientY - canvasRect.top - dragOffset.y;

        // Update the step's position
        const updatedStep = {
          ...draggedStep,
          position: { x, y },
        };

        // Update the step in the parent component
        onStepSelect(updatedStep);

        // Update the local dragged step
        setDraggedStep(updatedStep);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedStep(null);
  };

  const handleCanvasMouseLeave = () => {
    setDraggedStep(null);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <AgentIcon />;
      case 'transform':
        return <CodeIcon />;
      case 'api':
        return <ApiIcon />;
      case 'condition':
        return <ConditionIcon />;
      default:
        return <CodeIcon />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'agent':
        return '#e3f2fd'; // Light blue
      case 'transform':
        return '#e8f5e9'; // Light green
      case 'api':
        return '#fff3e0'; // Light orange
      case 'condition':
        return '#f3e5f5'; // Light purple
      default:
        return '#f5f5f5'; // Light grey
    }
  };

  return (
    <Box
      ref={canvasRef}
      sx={{
        width: '100%',
        height: 400,
        backgroundColor: '#fafafa',
        border: '1px dashed #ccc',
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseLeave}
    >
      {steps.map((step) => (
        <Paper
          key={step.id}
          sx={{
            position: 'absolute',
            left: step.position?.x || 0,
            top: step.position?.y || 0,
            width: 150,
            padding: 1,
            cursor: 'move',
            backgroundColor: getStepColor(step.type),
            boxShadow: 2,
            zIndex: draggedStep?.id === step.id ? 10 : 1,
          }}
          onMouseDown={(e) => handleStepMouseDown(e, step)}
          onClick={() => onStepSelect(step)}
        >
          <Box display="flex" alignItems="center" mb={1}>
            {getStepIcon(step.type)}
            <Typography variant="subtitle2" ml={1} noWrap>
              {step.name}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" display="block">
            {step.type}
          </Typography>
        </Paper>
      ))}

      <Tooltip title="Add Step">
        <IconButton
          color="primary"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'white',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
          onClick={handleAddClick}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAddStep('agent')}>
          <AgentIcon sx={{ mr: 1 }} />
          Agent Step
        </MenuItem>
        <MenuItem onClick={() => handleAddStep('transform')}>
          <CodeIcon sx={{ mr: 1 }} />
          Transform Step
        </MenuItem>
        <MenuItem onClick={() => handleAddStep('api')}>
          <ApiIcon sx={{ mr: 1 }} />
          API Step
        </MenuItem>
        <MenuItem onClick={() => handleAddStep('condition')}>
          <ConditionIcon sx={{ mr: 1 }} />
          Condition Step
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Canvas;
