export interface Notification {
  id: string;

  title: string;
  message: string;

  type:
    | 'Info'
    | 'Success'
    | 'Warning'
    | 'Error'
    | 'System';

  recipientId?: string;
  recipientRole?: string;

  isRead: boolean;

  referenceId?: string;
  referenceType?: string;

  createdAt: Date;
  readAt?: Date;
}