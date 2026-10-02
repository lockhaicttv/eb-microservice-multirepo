import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import {
  CATALOG_SERVICE_NAME,
  CreateProductRequest,
  CreateProductResponse,
  GetProductRequest,
  GetProductResponse,
  ListOwnerProductsRequest,
  ListOwnerProductsResponse,
  ListProductsRequest,
  ListProductsResponse,
} from '@demo/contracts';
import { CatalogAuthService } from './catalog-auth.service';
import { ProductsStore } from './products.store';
import { canManageOwnEvents } from './roles';

/**
 * Reasons a request can be refused, carried explicitly so the BFF can map them
 * onto the right HTTP status instead of pattern-matching a message string.
 */
export type CatalogErrorCode = 'UNAUTHENTICATED' | 'PERMISSION_DENIED' | 'INVALID_ARGUMENT' | 'INTERNAL';

export class CatalogError extends Error {
  constructor(
    readonly code: CatalogErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}

const GRPC_STATUS_BY_CODE: Record<CatalogErrorCode, GrpcStatus> = {
  UNAUTHENTICATED: GrpcStatus.UNAUTHENTICATED,
  PERMISSION_DENIED: GrpcStatus.PERMISSION_DENIED,
  INVALID_ARGUMENT: GrpcStatus.INVALID_ARGUMENT,
  INTERNAL: GrpcStatus.INTERNAL,
};

const rethrow = (err: unknown, logger: Logger, label: string): never => {
  if (err instanceof CatalogError) {
    throw new RpcException({ code: GRPC_STATUS_BY_CODE[err.code], message: err.message });
  }
  // Unexpected error: keep internals out of the wire but log the real cause.
  logger.error(`${label} unexpected`, err instanceof Error ? err.stack : String(err));
  throw new RpcException({ code: GrpcStatus.INTERNAL, message: 'INTERNAL_ERROR' });
};

/**
 * Runs `fn` and converts any thrown CatalogError into an RpcException carrying a
 * real gRPC status. Returns the resolved value so the caller keeps its exact
 * return type.
 */
const handle = async <T>(logger: Logger, label: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    rethrow(err, logger, label);
    throw err; // unreachable; rethrow() always throws. Keeps the return type exact.
  }
};

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_PRICE = 1_000_000;
const MAX_STOCK = 1_000_000;

/**
 * Validate an owner-submitted listing before it reaches the database.
 *
 * The DB has CHECK constraints on price/stock, but those only catch the numeric
 * cases — a blank name or an absurd title has to be refused here, where the
 * caller can be told why.
 */
function validateListing(input: { name: string; description: string; price: number; stock: number }): {
  name: string;
  description: string;
  price: number;
  stock: number;
} {
  const name = (input.name ?? '').trim();
  if (!name) throw new CatalogError('INVALID_ARGUMENT', 'NAME_REQUIRED');
  if (name.length > MAX_NAME_LENGTH) throw new CatalogError('INVALID_ARGUMENT', 'NAME_TOO_LONG');

  const description = (input.description ?? '').trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new CatalogError('INVALID_ARGUMENT', 'DESCRIPTION_TOO_LONG');
  }

  if (!Number.isFinite(input.price) || input.price < 0 || input.price > MAX_PRICE) {
    throw new CatalogError('INVALID_ARGUMENT', 'PRICE_OUT_OF_RANGE');
  }

  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > MAX_STOCK) {
    throw new CatalogError('INVALID_ARGUMENT', 'STOCK_OUT_OF_RANGE');
  }

  return { name, description, price: input.price, stock: input.stock };
}

@Controller()
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);

  constructor(
    private readonly products: ProductsStore,
    private readonly auth: CatalogAuthService,
  ) {}

  @GrpcMethod(CATALOG_SERVICE_NAME, 'ListProducts')
  listProducts(req: ListProductsRequest): ListProductsResponse {
    return this.handle('ListProducts', async () => ({
      products: await this.products.list(req?.query),
    }));
  }

  @GrpcMethod(CATALOG_SERVICE_NAME, 'GetProduct')
  getProduct(req: GetProductRequest): GetProductResponse {
    return this.handle('GetProduct', async () => ({
      product: await this.products.get(req.productId),
    }));
  }

  @GrpcMethod(CATALOG_SERVICE_NAME, 'CreateProduct')
  createProduct(req: CreateProductRequest): CreateProductResponse {
    return this.handle('CreateProduct', async () => {
      const owner = await this.requireEventManager(req.accessToken);
      const listing = validateListing({
        name: req.name,
        description: req.description,
        price: req.price,
        stock: req.stock,
      });
      return { product: await this.products.create({ ...listing, ownerUserId: owner.id }) };
    });
  }

  @GrpcMethod(CATALOG_SERVICE_NAME, 'ListOwnerProducts')
  listOwnerProducts(req: ListOwnerProductsRequest): ListOwnerProductsResponse {
    return this.handle('ListOwnerProducts', async () => {
      const owner = await this.requireEventManager(req.accessToken);
      return { products: await this.products.listByOwner(owner.id) };
    });
  }

  /**
   * Single gate for the owner surface. Identity is resolved first and the
   * capability second, so an unauthenticated caller gets 401 and never learns
   * whether they would have been allowed anyway.
   */
  private async requireEventManager(accessToken: string) {
    const user = await this.auth.identify(accessToken);
    if (!user) throw new CatalogError('UNAUTHENTICATED', 'UNAUTHORIZED');
    if (!canManageOwnEvents(user.role)) {
      this.logger.warn(`user ${user.id} (${user.role}) denied create/list own events`);
      throw new CatalogError('PERMISSION_DENIED', 'FORBIDDEN');
    }
    return user;
  }

  /**
   * Run a handler and convert a domain error into a gRPC status. Anything not
   * modelled as a CatalogError is an unexpected fault and is logged with its
   * stack before being reported as INTERNAL, so the client never sees internals.
   */
  private async handle<T>(operation: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (err) {
      if (err instanceof CatalogError) {
        throw new RpcException({ code: GRPC_STATUS_BY_CODE[err.code], details: err.message });
      }
      this.logger.error(`${operation} failed`, err instanceof Error ? err.stack : undefined);
      throw new RpcException({ code: GrpcStatus.INTERNAL, details: 'INTERNAL' });
    }
  }
}
