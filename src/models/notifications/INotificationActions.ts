import { ReactNode } from 'react';

export interface INotificationActions {
  close(): void;
  addButton(label: ReactNode, isPrimary?: boolean): ReactNode;
}
