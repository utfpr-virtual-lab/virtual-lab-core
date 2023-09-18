import { InstanceState } from '../../services/api/protocols';

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export interface NotificationPayload {
    value: {
        data: {
            subscribe: {
                name: string;
                data: string;
            };
        };
    };
}

export enum NotificationType {
    'EC2_INSTANCE_STATE_CHANGED' = 'EC2_INSTANCE_STATE_CHANGED',
}

export interface NotificationData {
    type: keyof typeof NotificationType;
}

export type NotificationTypeMap = Record<keyof typeof NotificationType, unknown> & {
    [NotificationType.EC2_INSTANCE_STATE_CHANGED]: {
        type: NotificationType.EC2_INSTANCE_STATE_CHANGED;
        id: number;
        awsInstanceId: string;
        name: string;
        state: keyof typeof InstanceState;
    };
};

export interface ReadableNotification {
    id: string;
    text: string;
    viewed: boolean;
}

export interface NotificationsContextData {
    registerHandler: <T extends keyof typeof NotificationType, K = NotificationTypeMap[T]>(
        type: T,
        handler: (data: K) => void,
    ) => string;
    unregisterHandlerById: (id: string) => void;
    unregisterHandlerByType: (type: keyof typeof NotificationType) => void;
    unregisterAllHandlers: () => void;
    notifications: ReadableNotification[];
    markNotificationAsViewed: (id: string) => void;
}