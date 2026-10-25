import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { PlannerLayout } from './PlannerLayout';

describe('Accessibility Attributes & Interactive Roles', () => {
  it('renders LanguageSelector with dynamic accessible aria-label that updates on toggle', () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    );

    const button = screen.getByRole('button', { name: /switch interface language to amharic/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    const amharicButton = screen.getByRole('button', { name: /ቋንቋን ወደ እንግሊዝኛ ቀይር/i });
    expect(amharicButton).toBeInTheDocument();
  });

  it('renders mobile navigation toggle in PlannerLayout with aria-expanded and aria-controls', () => {
    render(
      <MemoryRouter initialEntries={['/daily']}>
        <AuthProvider>
          <LanguageProvider>
            <PlannerLayout>
              <div>Main Content</div>
            </PlannerLayout>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const mobileToggle = screen.getByRole('button', { name: /open navigation menu/i });
    expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    expect(mobileToggle).toHaveAttribute('aria-controls', 'planner-sidebar-navigation');

    fireEvent.click(mobileToggle);

    expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
    expect(mobileToggle).toHaveAttribute('aria-label', 'Close navigation menu');
  });
});
