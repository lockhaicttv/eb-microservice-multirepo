import { join } from 'path';
import { Observable } from 'rxjs';

// ------------------------------------------------------------------
// gRPC contract (single shared proto, one package: "demo")
// ------------------------------------------------------------------

export const PACKAGE_NAME = 'demo';
export const PROTO_FILE = 'demo.proto';

export function demoProtoPath(): string {
  return join(__dirname, 'proto', PROTO_FILE);
}

// Service names — used both as @nestjs/microservices DI tokens and as the
// proto service names given to getService<...>(name).
export const AUTH_SERVICE_NAME = 'AuthService';
export const CATALOG_SERVICE_NAME = 'CatalogService';
export const ORDER_SERVICE_NAME = 'OrderService';
export const PAYMENT_SERVICE_NAME = 'PaymentService';
export const NOTIFICATION_SERVICE_NAME = 'NotificationService';

// ------------------------------------------------------------------
// Auth messages
// ------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  accessToken: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user?: User;
}

export interface ValidateTokenRequest {
  accessToken: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: User;
}

// ------------------------------------------------------------------
// Catalog messages
// ------------------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface ListProductsRequest {
  query: string;
}

export interface ListProductsResponse {
  products: Product[];
}

export interface GetProductRequest {
  productId: string;
}

export interface GetProductResponse {
  product?: Product;
}

// ------------------------------------------------------------------
// Order messages
// ------------------------------------------------------------------

export interface OrderLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  lineItems: OrderLine[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface CreateOrderLine {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  userId: string;
  lineItems: CreateOrderLine[];
}

export interface CreateOrderResponse {
  order?: Order;
}

export interface GetOrderRequest {
  orderId: string;
}

export interface GetOrderResponse {
  order?: Order;
}

export interface ListOrdersRequest {
  userId: string;
}

export interface ListOrdersResponse {
  orders: Order[];
}

// ------------------------------------------------------------------
// Payment messages
// ------------------------------------------------------------------

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  totalAmount: number;
  status: 'PAID' | 'DECLINED' | string;
  reason?: string;
  createdAt: string;
}

export interface ListPaymentsRequest {
  orderId: string;
}

export interface ListPaymentsResponse {
  payments: Payment[];
}

// ------------------------------------------------------------------
// Notification messages
// ------------------------------------------------------------------

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface ListNotificationsRequest {
  userId: string;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
}

// ------------------------------------------------------------------
// Typed clients (shape used by ClientGrpc.getService<T>())
// ------------------------------------------------------------------

export interface AuthServiceClient {
  register(request: RegisterRequest): Observable<RegisterResponse>;
  login(request: LoginRequest): Observable<LoginResponse>;
  validateToken(request: ValidateTokenRequest): Observable<ValidateTokenResponse>;
}

export interface CatalogServiceClient {
  listProducts(request: ListProductsRequest): Observable<ListProductsResponse>;
  getProduct(request: GetProductRequest): Observable<GetProductResponse>;
}

export interface OrderServiceClient {
  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse>;
  getOrder(request: GetOrderRequest): Observable<GetOrderResponse>;
  listOrders(request: ListOrdersRequest): Observable<ListOrdersResponse>;
}

export interface PaymentServiceClient {
  listPayments(request: ListPaymentsRequest): Observable<ListPaymentsResponse>;
}

export interface NotificationServiceClient {
  listNotifications(request: ListNotificationsRequest): Observable<ListNotificationsResponse>;
}

// ------------------------------------------------------------------
// Kafka topics + event payload contracts (async side of the system)
// ------------------------------------------------------------------

export const TOPICS = {
  ORDER_CREATED: 'demo.order.created',
  ORDER_STATUS_UPDATED: 'demo.order.status.updated',
  PAYMENT_CONFIRMED: 'demo.payment.confirmed',
  PAYMENT_DECLINED: 'demo.payment.declined',
  NOTIFICATION_CREATED: 'demo.notification.created',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];

export interface OrderCreatedEvent {
  order: Order;
}

export interface PaymentDecisionEvent {
  orderId: string;
  userId: string;
  totalAmount: number;
  status: 'PAID' | 'DECLINED';
  reason?: string;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  userId: string;
  status: string;
  previousStatus: string;
  totalAmount: number;
}

export interface NotificationCreatedEvent {
  notification: Notification;
}