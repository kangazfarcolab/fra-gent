import React from 'react';
import OptimizationDetails from '../../../../components/WorkflowOptimization/OptimizationDetails';

interface OptimizationDetailsPageProps {
  params: {
    id: string;
    optimizationId: string;
  };
}

export default function OptimizationDetailsPage({ params }: OptimizationDetailsPageProps) {
  return <OptimizationDetails workflowId={params.id} optimizationId={params.optimizationId} />;
}
