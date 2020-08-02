import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IProductsPriceById {
  [id: string]: number;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const productIds = products.map(product => {
      return {
        id: product.id,
      };
    });

    const productList = await this.productsRepository.findAllById(productIds);

    const productsPriceById: IProductsPriceById = {};

    productList.forEach((_, index) => {
      const { id, price } = productList[index];
      productsPriceById[id] = price;
    });

    const productOrder = products.map(product => {
      return {
        product_id: product.id,
        quantity: product.quantity,
        price: Number(productsPriceById[product.id]),
      };
    });

    const order = this.ordersRepository.create({
      customer,
      products: productOrder,
    });

    return order;
  }
}

export default CreateOrderService;
