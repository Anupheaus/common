import type { Record } from '../extensions';

export type AddIsNewFlagToRecord<T extends Record> = T & { isNew?: boolean; };

export interface ArrayModificationsApplyToOptions {
  applyAddedAtTheEnd?: boolean;
}
