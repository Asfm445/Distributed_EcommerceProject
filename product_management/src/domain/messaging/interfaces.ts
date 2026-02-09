import { IEvent } from "../entities/models.js";

export interface IMessagingService {
    publishProductEvent(event: IEvent): Promise<void>;
}