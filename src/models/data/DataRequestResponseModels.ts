import type { Record } from '../../extensions';
import type { DataFilters } from './DataFilterModels';
import type { DataPagination } from './DataPaginationModels';
import type { DataSorts } from './DataSortsModels';

export interface DataRequest<T extends Record = Record> {
  filters?: DataFilters<T>;
  sorts?: DataSorts<T>;
  pagination?: DataPagination;
}

export interface DataResponse<T extends Record = Record> {
  records: T[];
  totalRecordCount: number;
}
