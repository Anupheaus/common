import { ReactNode } from 'react';
import { IDialogActions } from './IDialogActions';

export interface IDialog {
  title?: ReactNode;
  message: ReactNode;
  autoHideAfterMilliseconds?: number;
  buttons?(actions: IDialogActions): ReactNode;
}
