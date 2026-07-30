import { render, screen, fireEvent } from "@testing-library/react";
import ScreenComparatorPage from "@/app/tools/screen-comparator/page";

describe("ScreenComparatorPage", () => {
  it("allows editing the right URL even when synced", () => {
    render(<ScreenComparatorPage />);
    
    // Check if both URLs are initially example.com (default)
    const leftInput = screen.getByLabelText(/Left Screen URL/i) as HTMLInputElement;
    const rightInput = screen.getByLabelText(/Right Screen URL/i) as HTMLInputElement;
    
    expect(leftInput.value).toBe("https://example.com");
    expect(rightInput.value).toBe("https://example.com");
    
    // By default, it's synced. Let's make sure right input is NOT disabled.
    expect(rightInput.disabled).toBe(false);
    
    // Change the right URL
    fireEvent.change(rightInput, { target: { value: "https://google.com" } });
    
    // Because it's synced, both should update to google.com
    expect(rightInput.value).toBe("https://google.com");
    expect(leftInput.value).toBe("https://google.com");
  });

  it("allows editing the right URL independently when not synced", () => {
    render(<ScreenComparatorPage />);
    
    // Disconnect sync
    const syncButton = screen.getByText(/URLs Linked/i);
    fireEvent.click(syncButton);
    
    const leftInput = screen.getByLabelText(/Left Screen URL/i) as HTMLInputElement;
    const rightInput = screen.getByLabelText(/Right Screen URL/i) as HTMLInputElement;
    
    // Change the right URL
    fireEvent.change(rightInput, { target: { value: "https://github.com" } });
    
    // Left URL should remain unchanged
    expect(rightInput.value).toBe("https://github.com");
    expect(leftInput.value).toBe("https://example.com");
  });
});
