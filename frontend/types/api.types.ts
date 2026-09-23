export type { UserModel, AuthPayloadModel } from './user.types'

export interface EventModel {
  id: string
  title: string
  blurb: string
  ticketPrice: number
  ticketsLeft: number
}

export interface OrderTicketModel {
  eventId: string
  eventName: string
  quantity: number
  ticketPrice: number
}

export type OrderStatus = 'PENDING' | 'PAID' | 'DECLINED'

export interface OrderModel {
  id: string
  userId: string
  status: OrderStatus | string
  totalAmount: number
  tickets: OrderTicketModel[]
  createdAt: string
}

export interface OrderStatusUpdateModel {
  orderId: string
  userId: string
  status: OrderStatus | string
  previousStatus: OrderStatus | string
  totalAmount: number
}

export interface OrderTicketInput {
  eventId: string
  quantity: number
}

export interface PaymentModel {
  id: string
  orderId: string
  userId: string
  status: OrderStatus | string
  totalAmount: number
  reason?: string | null
  createdAt: string
}

export type NotificationType = 'TICKETS_CONFIRMED' | 'TICKETS_DECLINED' | string

export interface NotificationModel {
  id: string
  userId: string
  type: NotificationType
  message: string
  createdAt: string
}

export interface CartLine {
  eventId: string
  eventName: string
  ticketPrice: number
  ticketsLeft: number
  quantity: number
}
