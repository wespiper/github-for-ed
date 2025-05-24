import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentWritingDashboard } from '../StudentWritingDashboard';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('StudentWritingDashboard', () => {
  it('shows loading state when data is being fetched', () => {
    renderWithQueryClient(
      <StudentWritingDashboard studentId="student-1" assignmentId="assignment-1" />
    );
    
    // Component should show loading animation when data is being fetched
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders without crashing when both studentId and assignmentId are provided', () => {
    expect(() => {
      renderWithQueryClient(
        <StudentWritingDashboard studentId="student-1" assignmentId="assignment-1" />
      );
    }).not.toThrow();
  });

  it('renders without crashing when no assignmentId is provided', () => {
    expect(() => {
      renderWithQueryClient(
        <StudentWritingDashboard studentId="student-1" />
      );
    }).not.toThrow();
  });

  it('shows selection message when no assignment is provided', () => {
    renderWithQueryClient(
      <StudentWritingDashboard studentId="student-1" />
    );
    
    expect(screen.getByText('Select an assignment to view your writing progress.')).toBeInTheDocument();
  });
});