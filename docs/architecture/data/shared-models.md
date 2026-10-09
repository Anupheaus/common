# Shared data, sort, geometry and date types

> The shared data-request, sort, array-operation, geometry and date types other packages build their contracts on.
>
> Status: accepted · Version 1

## Data API

| Type | Shape |
|---|---|
| `DataRequest<T>` | `{ filters?, sorts?, pagination? }` |
| `DataResponse<T>` | `{ data: T[]; total: number; limit?; offset? }` |
| `DataFilters<T>` | per-field filter map, MongoDB-style operators |
| `DataSorts<T>` | per-field sort directions |
| `DataPagination` | `{ limit: number; offset? }` |

`DataFilterOperators` maps operator ids to labels (`$eq` → "is equal to"); `DataFilterOperator` is the id union and carries the namespace lists `singleValueKeys`, `multiValueKeys`, `booleanKeys`, `arrayValueSingleKeys`, `arrayValueMultiKeys` and `allKeys`. `$elemMatch` is array-valued and is deliberately not in `allKeys`. `DataRequest.isEmpty(request)` reports a request with no effective filters, sorts or pagination.

## Other groups

- Sort: `SortDirection` (`'asc' | 'desc'`), `Sort`.
- Array operations: `ArrayDiff`, `MergeOptions`, `OrderByConfig`, `SyncOptions`, `MapDelegate`.
- Geometry: `Coordinates`, `Location`, `Dimensions` (aliased as `Size`), `Geometry`.
- Date and time: `DateRange`, `TimeRange`, `Time` (a branded `HH:MM` string).

## Decision

Filter operators are MongoDB-style (`$`-prefixed) because mxdb, the primary data backend, is MongoDB-based: sharing the operator vocabulary avoids a translation layer. `DataRequest.isEmpty` is a namespace function beside its type rather than a standalone export.
