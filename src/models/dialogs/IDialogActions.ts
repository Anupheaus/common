import { ReactNode } from 'react';

export interface IDialogActions {
  close(): void;
  addButton(label: string | ReactNode, isPrimary?: boolean): ReactNode;
}
