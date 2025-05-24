import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ErrorTestComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test infinite loop error: Maximum update depth exceeded');
  }

  return (
    <div className="p-4 border rounded-lg bg-red-50">
      <h3 className="font-medium mb-2">Error Boundary Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click the button below to trigger an error and test the error boundary system.
      </p>
      <Button 
        onClick={() => setShouldError(true)}
        variant="destructive"
      >
        Trigger Test Error
      </Button>
    </div>
  );
}