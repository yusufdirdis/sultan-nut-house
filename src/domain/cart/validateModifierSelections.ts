import { AppError } from "@/lib/errors";

export interface ModifierGroupRules {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTI";
  minSelect: number;
  maxSelect: number;
  required: boolean;
  availableOptionIds: string[];
}

export interface ModifierSelection {
  modifierGroupId: string;
  optionIds: string[];
}

/**
 * Validates a customer's modifier selections for one product against its
 * configured ModifierGroup rules (required/optional, min/max, single/multi,
 * availability). Shared by every product that uses the modifier system
 * (drinks, sandwiches, pastries, desserts, and future items) rather than
 * being reimplemented per component.
 */
export function validateModifierSelections(groups: ModifierGroupRules[], selections: ModifierSelection[]): void {
  const selectionByGroup = new Map(selections.map((selection) => [selection.modifierGroupId, selection]));

  for (const group of groups) {
    const selection = selectionByGroup.get(group.id);
    const optionIds = selection?.optionIds ?? [];

    if (group.required && optionIds.length === 0) {
      throw new AppError(`Please choose an option for "${group.name}".`, "MODIFIER_REQUIRED");
    }

    if (group.selectionType === "SINGLE" && optionIds.length > 1) {
      throw new AppError(`"${group.name}" only allows a single selection.`, "MODIFIER_SINGLE_SELECT_VIOLATED");
    }

    if (optionIds.length < group.minSelect) {
      throw new AppError(`Choose at least ${group.minSelect} option(s) for "${group.name}".`, "MODIFIER_MIN_NOT_MET");
    }

    if (optionIds.length > group.maxSelect) {
      throw new AppError(`Choose at most ${group.maxSelect} option(s) for "${group.name}".`, "MODIFIER_MAX_EXCEEDED");
    }

    for (const optionId of optionIds) {
      if (!group.availableOptionIds.includes(optionId)) {
        throw new AppError(
          `One of the selected options for "${group.name}" is no longer available.`,
          "MODIFIER_OPTION_UNAVAILABLE",
        );
      }
    }
  }

  const knownGroupIds = new Set(groups.map((group) => group.id));
  for (const selection of selections) {
    if (!knownGroupIds.has(selection.modifierGroupId)) {
      throw new AppError("This item was configured with an option that no longer applies.", "MODIFIER_GROUP_UNKNOWN");
    }
  }
}
