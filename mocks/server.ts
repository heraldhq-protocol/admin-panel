import { setupServer } from 'msw/node'
import { protocolHandlers } from './handlers/protocols'
import { notificationHandlers } from './handlers/notifications'
import { receiptHandlers } from './handlers/receipts'
import { emailHealthHandlers } from './handlers/email-health'
import { designPartnerHandlers } from './handlers/design-partners'
import { incidentHandlers } from './handlers/incidents'
import { teamHandlers } from './handlers/team'
import { overviewHandlers } from './handlers/overview'

export const server = setupServer(
  ...overviewHandlers,
  ...protocolHandlers,
  ...notificationHandlers,
  ...receiptHandlers,
  ...emailHealthHandlers,
  ...designPartnerHandlers,
  ...incidentHandlers,
  ...teamHandlers,
)