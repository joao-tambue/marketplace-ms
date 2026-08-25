import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { serverConfig } from 'src/config/gateway.config';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService,) {}

  async proxyRequest(
    serviceName: keyof typeof serverConfig,
    method: string,
    path: string,
    data?: any,
    headers?: any,
    userInfo?: any,
  ){
    const service = serverConfig[serviceName];
    const url = `${service.url}${path}`;

    this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`);

    try {
      const enhancedHeaders = {
        ...headers,
        'x-user-id': userInfo?.userId,
        'x-user-email': userInfo?.email,
        'x-user-role': userInfo?.role,
      };

      const response = await firstValueFrom(
        this.httpService.request({
          method: method.toLowerCase() as any,
          url,
          data,
          headers: enhancedHeaders,
          timeout: service.timeout,
        })
      );

      return response;
      
    } catch (error) {
      this.logger.error(`Error proxying ${method} request to ${serviceName}: ${url}`);
      throw error;
    }
  }

  async getServiceHealth(serviceName: keyof typeof serverConfig){
    try {
      const service = serverConfig[serviceName];
      const response = await firstValueFrom(
        this.httpService.get(`${service.url}/health`, {
          timeout: service.timeout,
        })
      );
      return { status: 'healthy', data: response.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'unhealthy', error: errorMessage };
    }
  }
}
