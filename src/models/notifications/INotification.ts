import { ReactNode } from 'react';
import { INotificationActions } from './INotificationActions';
import { ImplementationModes } from './ImplementationModes';

export interface INotification {
  title?: ReactNode;
  message: ReactNode;
  autoHideAfterMilliseconds?: number;
  implementationMode: ImplementationModes;
  buttons?(actions: INotificationActions): ReactNode;
}
