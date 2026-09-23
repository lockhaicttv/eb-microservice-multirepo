import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CATALOG_SERVICE_NAME,
  GetProductRequest,
  GetProductResponse,
  ListProductsRequest,
  ListProductsResponse,
} from '@demo/contracts';
import { ProductsStore } from './products.store';

@Controller()
export class CatalogController {
  constructor(private readonly products: ProductsStore) {}

  @GrpcMethod(CATALOG_SERVICE_NAME, 'ListProducts')
  listProducts(req: ListProductsRequest): ListProductsResponse {
    return { products: this.products.list(req?.query) };
  }

  @GrpcMethod(CATALOG_SERVICE_NAME, 'GetProduct')
  getProduct(req: GetProductRequest): GetProductResponse {
    return { product: this.products.get(req.productId) };
  }
}