import { describe, expect, it } from "vitest";
import { validateModifierSelections, type ModifierGroupRules } from "@/domain/cart/validateModifierSelections";

const sizeGroup: ModifierGroupRules = {
  id: "size",
  name: "Size",
  selectionType: "SINGLE",
  minSelect: 1,
  maxSelect: 1,
  required: true,
  availableOptionIds: ["small", "medium", "large"],
};

const extrasGroup: ModifierGroupRules = {
  id: "extras",
  name: "Extras",
  selectionType: "MULTI",
  minSelect: 0,
  maxSelect: 2,
  required: false,
  availableOptionIds: ["extra-matcha", "cold-foam", "extra-shot"],
};

describe("validateModifierSelections", () => {
  it("passes when a required single-select group has exactly one valid option", () => {
    expect(() =>
      validateModifierSelections([sizeGroup], [{ modifierGroupId: "size", optionIds: ["medium"] }]),
    ).not.toThrow();
  });

  it("rejects a missing required group", () => {
    expect(() => validateModifierSelections([sizeGroup], [])).toThrow(/choose an option/i);
  });

  it("rejects more than one option in a SINGLE group", () => {
    expect(() =>
      validateModifierSelections([sizeGroup], [{ modifierGroupId: "size", optionIds: ["small", "large"] }]),
    ).toThrow(/single selection/i);
  });

  it("rejects exceeding maxSelect on a MULTI group", () => {
    expect(() =>
      validateModifierSelections(
        [extrasGroup],
        [{ modifierGroupId: "extras", optionIds: ["extra-matcha", "cold-foam", "extra-shot"] }],
      ),
    ).toThrow(/at most 2/i);
  });

  it("allows an optional MULTI group to be skipped entirely", () => {
    expect(() => validateModifierSelections([extrasGroup], [])).not.toThrow();
  });

  it("rejects an option id that isn't currently available", () => {
    expect(() =>
      validateModifierSelections([sizeGroup], [{ modifierGroupId: "size", optionIds: ["jumbo"] }]),
    ).toThrow(/no longer available/i);
  });

  it("rejects a selection referencing a group that isn't configured for this product", () => {
    expect(() =>
      validateModifierSelections(
        [sizeGroup],
        [
          { modifierGroupId: "size", optionIds: ["medium"] },
          { modifierGroupId: "unknown-group", optionIds: ["x"] },
        ],
      ),
    ).toThrow(/no longer applies/i);
  });
});
