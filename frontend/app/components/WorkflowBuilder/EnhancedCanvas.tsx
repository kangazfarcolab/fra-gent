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
  Fab,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  SmartToy as AgentIcon,
  Code as CodeIcon,
  Api as ApiIcon,
  CallSplit as ConditionIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

interface EnhancedCanvasProps {
  steps: any[];
  connections: any[];
  onStepSelect: (step: any) => void;
  onConnectionSelect: (connection: any) => void;
  onStepAdd: (step: any) => void;
  onStepMove: (stepId: string, position: { x: number, y: number }) => void;
  onConnectionAdd: (connection: any) => void;
}

const EnhancedCanvas: React.FC<EnhancedCanvasProps> = ({
  steps,
  connections,
  onStepSelect,
  onConnectionSelect,
  onStepAdd,
  onStepMove,
  onConnectionAdd,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedStep, setDraggedStep] = useState<any | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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

  const handleAddButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddStep = (type: string) => {
    const newStep = {
      id: uuidv4(),
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      position: {
        x: menuPosition.x,
        y: menuPosition.y,
      },
      config: {},
    };

    onStepAdd(newStep);
    handleMenuClose();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      setMenuPosition({ x, y });
      
      // Only open menu on right-click
      if (e.button === 2) {
        e.preventDefault();
        setAnchorEl(e.currentTarget as HTMLElement);
      } else {
        // Deselect on left-click
        onStepSelect(null);
        onConnectionSelect(null);
      }
    }
  };

  const handleStepMouseDown = (e: React.MouseEvent, step: any) => {
    e.stopPropagation();
    onStepSelect(step);
    
    setDraggedStep(step);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) / zoom - step.position.x,
        y: (e.clientY - rect.top) / zoom - step.position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedStep && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - dragOffset.x;
      const y = (e.clientY - rect.top) / zoom - dragOffset.y;
      
      onStepMove(draggedStep.id, { x, y });
    } else if (isDragging && canvasRef.current) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPan({
        x: pan.x + dx,
        y: pan.y + dy,
      });
      
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedStep(null);
    setIsDragging(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button (wheel) for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const renderSteps = () => {
    return steps.map((step) => {
      const StepIcon = getStepIcon(step.type);
      
      return (
        <div
          key={step.id}
          style={{
            position: 'absolute',
            left: `${step.position.x}px`,
            top: `${step.position.y}px`,
            transform: 'translate(-50%, -50%)',
            cursor: 'move',
          }}
          onMouseDown={(e) => handleStepMouseDown(e, step)}
        >
          <Paper
            elevation={3}
            sx={{
              width: 150,
              padding: 2,
              borderRadius: 2,
              backgroundColor: (theme) => 
                step.type === 'agent' ? theme.palette.primary.light :
                step.type === 'code' ? theme.palette.secondary.light :
                step.type === 'api' ? theme.palette.info.light :
                theme.palette.warning.light,
              color: '#fff',
              '&:hover': {
                boxShadow: 6,
              },
            }}
          >
            <Box display="flex" alignItems="center" mb={1}>
              <StepIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle2" noWrap>
                {step.name}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
            </Typography>
          </Paper>
        </div>
      );
    });
  };

  const renderConnections = () => {
    return connections.map((connection) => {
      const fromStep = steps.find((s) => s.id === connection.from);
      const toStep = steps.find((s) => s.id === connection.to);
      
      if (!fromStep || !toStep) return null;
      
      const fromX = fromStep.position.x;
      const fromY = fromStep.position.y;
      const toX = toStep.position.x;
      const toY = toStep.position.y;
      
      // Calculate the path
      const path = `M ${fromX} ${fromY} C ${fromX + 50} ${fromY}, ${toX - 50} ${toY}, ${toX} ${toY}`;
      
      return (
        <svg
          key={`${connection.from}-${connection.to}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <path
            d={path}
            stroke="#666"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
        </svg>
      );
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return AgentIcon;
      case 'code':
        return CodeIcon;
      case 'api':
        return ApiIcon;
      case 'condition':
        return ConditionIcon;
      default:
        return AddIcon;
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
        >
          {renderConnections()}
          {renderSteps()}
        </div>
      </div>
      
      {/* Zoom controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Zoom in={true}>
          <Fab size="small" color="primary" onClick={handleZoomIn}>
            <ZoomInIcon />
          </Fab>
        </Zoom>
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <Fab size="small" color="primary" onClick={handleZoomOut}>
            <ZoomOutIcon />
          </Fab>
        </Zoom>
        <Zoom in={true} style={{ transitionDelay: '200ms' }}>
          <Fab size="small" color="primary" onClick={handleResetView}>
            <CenterIcon />
          </Fab>
        </Zoom>
      </Box>
      
      {/* Add step button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
        }}
      >
        <Zoom in={true}>
          <Fab color="primary" onClick={handleAddButtonClick}>
            <AddIcon />
          </Fab>
        </Zoom>
      </Box>
      
      {/* Add step menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAddStep('agent')}>
          <AgentIcon sx={{ mr: 1 }} />
          Agent
        </MenuItem>
        <MenuItem onClick={() => handleAddStep('code')}>
          <CodeIcon sx={{ mr: 1 }} />
          Code
        </MenuItem>
        <MenuItem onClick={() => handleAddStep('api')}>
          <ApiIcon sx={{ mr: 1 }} />
          API
        </MenuItem>
        <MenuItem onClick={() => handleAddStep('condition')}>
          <ConditionIcon sx={{ mr: 1 }} />
          Condition
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnhancedCanvas;
