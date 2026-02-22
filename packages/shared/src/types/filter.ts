/**
 * Filter types used for querying and filtering platform resources.
 * @module types/filter
 */

/**
 * Supported comparison operators for filter conditions.
 */
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "exists"
  | "between";

/**
 * Logical operators used to combine multiple filter conditions.
 */
export type LogicalOperator = "and" | "or" | "not";

/**
 * A single filter condition applied to a specific field.
 */
export interface FilterCondition {
  /** The name of the field to filter on. */
  field: string;
  /** The comparison operator. */
  operator: FilterOperator;
  /** The value(s) to compare against. */
  value: FilterValue;
}

/**
 * Possible value types for filter conditions.
 */
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | DateRange;

/**
 * A date range used with the "between" operator.
 */
export interface DateRange {
  /** Start of the date range (ISO-8601). */
  from: string;
  /** End of the date range (ISO-8601). */
  to: string;
}

/**
 * A group of filter conditions combined with a logical operator.
 */
export interface FilterGroup {
  /** Logical operator used to combine the conditions. */
  operator: LogicalOperator;
  /** Individual conditions within the group. */
  conditions: FilterCondition[];
  /** Nested filter groups for complex queries. */
  groups?: FilterGroup[];
}

/**
 * Top-level filter parameters sent with a query request.
 */
export interface FilterParams {
  /** The root filter group; all top-level conditions are AND-ed by default. */
  filters: FilterGroup;
}

/**
 * Describes a filterable field exposed by an API endpoint.
 */
export interface FilterFieldDescriptor {
  /** Machine-readable field name. */
  name: string;
  /** Human-readable label for UI display. */
  label: string;
  /** Data type of the field. */
  type: FilterFieldType;
  /** Operators valid for this field. */
  supportedOperators: FilterOperator[];
  /** Whether this field is required in every query. */
  required: boolean;
}

/**
 * Data types of filterable fields.
 */
export type FilterFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "array";

/**
 * Saved / named filter preset that users can store and reuse.
 */
export interface SavedFilter {
  /** Unique identifier for the saved filter. */
  id: string;
  /** Human-readable name given by the user. */
  name: string;
  /** The filter configuration. */
  filter: FilterGroup;
  /** ID of the user who created this filter. */
  createdBy: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
  /** Whether this filter is shared with the team. */
  isShared: boolean;
}
