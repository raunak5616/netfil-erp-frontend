import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Mock child component
const ProblemChild = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test component explosion');
  }
  return <div>Normal Content Displayed</div>;
};

describe('ErrorBoundary Component', () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children correctly when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content Displayed')).toBeInTheDocument();
  });

  it('catches render errors and renders fallback UI with Retry button', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    expect(screen.getByText('Test component explosion')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry component/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('resets error state when Retry Component is clicked', () => {
    let shouldThrow = true;
    const DynamicChild = () => {
      if (shouldThrow) throw new Error('First crash');
      return <div>Recovered Content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('First crash')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /retry component/i }));

    rerender(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered Content')).toBeInTheDocument();
  });
});
