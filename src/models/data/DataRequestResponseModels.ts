import { is } from '../../extensions/is';
import type { AnyObject, Record } from '../../extensions';
import { DataFilterOperator, type DataFilters } from './DataFiltersModels';
import type { DataPagination } from './DataPaginationModels';
import type { DataSorts } from './DataSortsModels';

export interface DataRequest<T extends Record = Record> {
  filters?: DataFilters<T>;
  sorts?: DataSorts<T>;
  pagination?: DataPagination;
}

export namespace DataRequest {
  export function isEmpty(request: DataRequest): boolean {
    if (request == null) return true;
    if (request.pagination != null && (request.pagination.limit > 0 || (request.pagination?.offset ?? 0) > 0)) return false;
    if (request.sorts instanceof Array && request.sorts.length > 0) return false;
    if (Object.values(request?.filters ?? {}).some(value => {
      if (value == null) return false;
      if (is.plainObject(value) && Object.keys(value)
        .some(key => DataFilterOperator.allKeys.includes(key as DataFilterOperator) && (value as AnyObject)[key] == null)) return false;
      return true;
    })) return false;
    return true;
  }
}

export interface DataResponse<T extends Record = Record> {
  records: T[];
  total: number;
  limit?: number;
  offset?: number;
}
