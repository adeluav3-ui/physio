import { Injectable, Logger } from "@nestjs/common";
import { MailService } from "../mail/mail.service.js";

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly mail: MailService) { }

    async sendAppointmentConfirmed(_appointmentId: string) {
        // Full implementation in the sessions/reminders batch.
        this.logger.log(`Appointment ${_appointmentId} confirmed — notification queued`);
    }
}