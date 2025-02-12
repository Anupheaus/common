import type { SortDirections } from '../sort';
import type { SimpleMapDelegate } from './mapDelegate';

export interface ArrayOrderByConfig<T> {
  direction?: SortDirections;
  delegate: SimpleMapDelegate<T>;
}
