import { ReactNode } from 'react';

export interface IDialogActions {
  close(): void;
  addButton(label: ReactNode, isPrimary?: boolean): ReactNode;
}
