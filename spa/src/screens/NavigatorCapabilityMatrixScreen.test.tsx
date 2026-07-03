import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  capabilityDescriptions,
  providerMatrix,
} from "../data/navigatorCapabilityData";
import { NavigatorCapabilityMatrixScreen } from "./NavigatorCapabilityMatrixScreen";

function hasExactDescendantText(text: string) {
  return (_content: string, node: Element | null) => {
    if (!node?.textContent?.includes(text)) {
      return false;
    }

    return Array.from(node.children).every(
      (child) => !child.textContent?.includes(text),
    );
  };
}

describe("NavigatorCapabilityMatrixScreen", () => {
  it("renders provider columns, capability meanings, and provider notes", () => {
    const { container } = render(
      <MemoryRouter>
        <NavigatorCapabilityMatrixScreen />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Navigator Capability Matrix" }),
    ).toBeInTheDocument();

    providerMatrix.forEach((provider) => {
      expect(screen.getAllByText(provider.provider).length).toBeGreaterThan(0);
      expect(screen.getByText(hasExactDescendantText(provider.notes))).toBeInTheDocument();
    });

    capabilityDescriptions.forEach((capability) => {
      expect(screen.getAllByText(capability.name).length).toBeGreaterThan(0);
      expect(
        screen.getByText(hasExactDescendantText(capability.meaning)),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTitle(providerMatrix[0].capability.Waypoints.detail),
    ).toHaveTextContent(providerMatrix[0].capability.Waypoints.icon);
    expect(screen.getByText(/Strong support/)).toBeInTheDocument();
    expect(container.querySelectorAll(".navigator-comparison__section")).toHaveLength(3);
  });
});
