/**
 * Sort-related types for ordering query results.
 * @module types/sort
 */

/**
 * Direction in which results are sorted.
 */
export type SortDirection = "asc" | "desc";

/**
 * A single sort criterion applied to query results.
 */
export interface SortParam {
  /** The field name to sort by. */
  field: string;
  /** The direction of the sort. */
  direction: SortDirection;
}

/**
 * A collection of sort criteria applied in order of priority.
 */
export interface MultiSortParams {
  /** Ordered list of sort criteria; earlier entries take higher priority. */
  sorts: SortParam[];
}

/**
 * Predefined sort options exposed to the user interface.
 */
export interface SortOption {
  /** Machine-readable identifier for this sort option. */
  id: string;
  /** Human-readable label displayed in the UI. */
  label: string;
  /** The field that this option sorts by. */
  field: string;
  /** Default direction when this option is selected. */
  defaultDirection: SortDirection;
}

/**
 * Commonly used sort fields for platform resources.
 */
export type CommonSortField =
  | "createdAt"
  | "updatedAt"
  | "name"
  | "status"
  | "priority";

/**
 * Sort configuration for a specific resource type.
 * @template TField - Union type of allowed sort field names.
 */
export interface SortConfig<TField extends string = string> {
  /** List of fields that are sortable. */
  allowedFields: TField[];
  /** The default field to sort by when none is specified. */
  defaultField: TField;
  /** The default direction to sort by when none is specified. */
  defaultDirection: SortDirection;
  /** Maximum number of simultaneous sort criteria allowed. */
  maxSortCriteria: number;
}

/**
 * Typed sort parameter bound to a known set of fields.
 * @template TField - Union type of allowed sort field names.
 */
export interface TypedSortParam<TField extends string = string> {
  /** The field to sort by, constrained to known fields. */
  field: TField;
  /** The direction of the sort. */
  direction: SortDirection;
}

/**
 * Sort state tracked by a UI component.
 * @template TField - Union type of allowed sort field names.
 */
export interface SortState<TField extends string = string> {
  /** Currently active sort field. */
  activeField: TField | null;
  /** Current sort direction. */
  activeDirection: SortDirection;
  /** History of previously applied sort criteria. */
  history: TypedSortParam<TField>[];
}
