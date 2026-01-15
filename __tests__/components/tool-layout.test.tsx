import { render, screen } from "@testing-library/react";
import { ToolLayout } from "@/components/tool-layout";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe("ToolLayout", () => {
  it("should render title and description", () => {
    render(
      <ToolLayout title="Test Tool" description="Test description">
        <div>Content</div>
      </ToolLayout>
    );

    expect(screen.getByText("Test Tool")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should render children", () => {
    render(
      <ToolLayout title="Test Tool" description="Test description">
        <div data-testid="child-content">Child Content</div>
      </ToolLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should render back button with link to home", () => {
    render(
      <ToolLayout title="Test Tool" description="Test description">
        <div>Content</div>
      </ToolLayout>
    );

    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("should render title as h1", () => {
    render(
      <ToolLayout title="My Tool Title" description="Description">
        <div>Content</div>
      </ToolLayout>
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("My Tool Title");
  });
});
