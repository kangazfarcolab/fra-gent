import React from 'react';
import OptimizationList from '../../../components/WorkflowOptimization/OptimizationList';

interface OptimizationListPageProps {
  params: {
    id: string;
  };
}

export default function OptimizationListPage({ params }: OptimizationListPageProps) {
  return <OptimizationList workflowId={params.id} />;
}
