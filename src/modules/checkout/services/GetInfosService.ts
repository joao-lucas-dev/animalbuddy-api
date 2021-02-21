import RedisCache from '@shared/lib/RedisCache';

interface IPayer {
  name: string;
  surname: string;
  email: string;
  phone: string;
  cpf: string;
  zipCode: string;
  street: string;
  number: number;
  complement: string;
  city: string;
  state: string;
  country: string;
}

class GetInfosService {
  async execute(orderId: string): Promise<IPayer | null> {
    const redisCache = new RedisCache();

    const data = await redisCache.recover<IPayer>(`payer:${orderId}`);

    return data;
  }
}

export default GetInfosService;
