import { SortDirections } from '../sort';
import { SimpleMapDelegate } from './mapDelegate';

export interface IArrayOrderByConfig<T> {
  direction?: SortDirections;
  delegate: SimpleMapDelegate<T>;
}
