import { render, screen, fireEvent } from "@testing-library/react";
import DailyTasksPage from "@/app/daily-tasks/page";
import { isSameDay, subDays } from "date-fns";

// Mock dexie-react-hooks
jest.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn: any) => fn(),
}));

// Mock the db instance
jest.mock("@/lib/db", () => ({
  db: {
    dailyTasks: {
      orderBy: () => ({
        toArray: () => {
          // Return mock data based on the mock scenario
          // We can use a global variable or just return a fixed set for this simple test
          return global.mockTasks || [];
        }
      }),
      update: jest.fn(),
      add: jest.fn(),
      delete: jest.fn(),
    }
  }
}));

// Define mockTasks on global for the mock to access
declare global {
  var mockTasks: any[];
}

describe("DailyTasksPage", () => {
  beforeEach(() => {
    // Reset mock tasks
    global.mockTasks = [];
  });

  it("calculates percentage and resets daily tasks correctly", () => {
    const today = new Date();
    const yesterday = subDays(today, 1);

    global.mockTasks = [
      { id: 1, title: "Task 1 (Yesterday)", lastCompletedAt: yesterday, order: 0 },
      { id: 2, title: "Task 2 (Today)", lastCompletedAt: today, order: 1 },
      { id: 3, title: "Task 3 (New)", lastCompletedAt: null, order: 2 },
    ];

    render(<DailyTasksPage />);

    // Check Stats
    // Total: 3, Completed: 1 (Task 2) => 33%
    expect(screen.getByText("33% Completed")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 tasks")).toBeInTheDocument();

    // Check Checkboxes (Reset logic)
    // Task 1 (Yesterday) -> Should be unchecked
    const checkbox1 = screen.getByLabelText("Task 1 (Yesterday)");
    expect(checkbox1).not.toBeChecked();

    // Task 2 (Today) -> Should be checked
    const checkbox2 = screen.getByLabelText("Task 2 (Today)");
    expect(checkbox2).toBeChecked();

    // Task 3 (New) -> Should be unchecked
    const checkbox3 = screen.getByLabelText("Task 3 (New)");
    expect(checkbox3).not.toBeChecked();
  });

  it("handles 0 tasks correctly", () => {
    global.mockTasks = [];
    render(<DailyTasksPage />);
    
    expect(screen.getByText("0% Completed")).toBeInTheDocument();
    expect(screen.getByText("0 / 0 tasks")).toBeInTheDocument();
    expect(screen.getByText("No daily tasks yet. Add one to get started!")).toBeInTheDocument();
  });

  it("calculates 100% correctly", () => {
    const today = new Date();
    global.mockTasks = [
      { id: 1, title: "Task 1", lastCompletedAt: today, order: 0 },
    ];
    render(<DailyTasksPage />);
    
    expect(screen.getByText("100% Completed")).toBeInTheDocument();
    expect(screen.getByText("1 / 1 tasks")).toBeInTheDocument();
  });
});
