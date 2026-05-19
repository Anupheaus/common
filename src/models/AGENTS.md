# models

Shared value types for data APIs, geometry, sorting, arrays, and dates — used as the common contract between UI, API, and data layers.

## Overview

This module re-exports five sub-modules of pure TypeScript types and constants. There is no runtime logic here beyond the filter operator constant definitions in `data/`. These types are intended to be the shared vocabulary between consumers of this library (e.g. `react-ui`, `socket-api`, `mxdb`) so that request/response shapes, filter operators, and geometry values are consistent.

## Contents

### Data API types (`data/`)
Types for querying and paging collections.
- `DataRequest<T>` — `{ filters?, sorts?, pagination? }` — the standard query envelope sent to data sources.
- `DataResponse<T>` — `{ data: T[]; total: number; limit?; offset? }` — the standard response envelope.
- `DataFilters<T>` — Per-field filter map using MongoDB-style operators.
- `DataFilterOperators` — Constant map of operator id → label (e.g. `$eq` → `'is equal to'`).
- `DataFilterOperator` — Type of a filter operator id; has sub-namespaces `singleValueKeys`, `multiValueKeys`, `booleanKeys`, `arrayValueSingleKeys`, `arrayValueMultiKeys`, `allKeys`.
- `DataSorts<T>` — Per-field sort directions.
- `DataPagination` — `{ limit: number; offset?: number }`.
- `DataRequest.isEmpty(request)` — Returns true if the request has no effective filters, sorts, or pagination.

### Sort types (`sort/`)
- `SortDirection` — `'asc' | 'desc'`
- `Sort` — `{ field: string; direction: SortDirection }`

### Array operation types (`array/`)
Types used by `ArrayModifications` and related utilities.
- `ArrayDiff<T>` — Describes added/updated/removed items between two arrays.
- `MergeOptions<T>` — Options for merging two arrays (key selector, conflict resolution).
- `OrderByConfig<T>` — Column-level sort specification for `orderBy` operations.
- `SyncOptions<T>` — Options for syncing a target array to a source.
- `MapDelegate<T, R>` — A function mapping array items to a result type.

### Geometry types (`geometry/`)
- `Coordinates` — `{ x: number; y: number }`
- `Location` — `{ lat: number; lng: number }`
- `Dimensions` — `{ width: number; height: number }`
- `Size` — alias for `Dimensions`
- `Geometry` — combines coordinates and dimensions

### Date and time types (`date/`)
- `DateRange` — `{ from: Date; to: Date }`
- `TimeRange` — `{ from: string; to: string }` (HH:MM strings)
- `Time` — `string` branded type for HH:MM values

## Decision rationale

The filter operators use MongoDB-style `$`-prefixed keys (`$eq`, `$gt`, etc.) because the primary data backend (`mxdb`) is MongoDB-based. Using the same operator vocabulary across the stack avoids a translation layer.

`DataRequest.isEmpty` is a namespace function (not a standalone export) to keep it colocated with the type it operates on, following the TypeScript namespace-as-companion pattern.

## Ambiguities and gotchas

- **`DataFilterOperator` vs `DataFilterOperators`**: the type (`DataFilterOperator`) is the id string union; the constant (`DataFilterOperators`) is the full operator list with labels and metadata. Don't confuse them.
- **`$elemMatch` is in `arrayValueSingleKeys` but not in `allKeys`**: `allKeys` covers filter keys for scalar fields; `$elemMatch` is for array-valued fields and must be handled separately.
- **`Time` is a branded string**: it is `string` at runtime but typed distinctly so that HH:MM strings are not accidentally assigned from arbitrary strings.
