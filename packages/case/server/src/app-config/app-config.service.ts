import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AppConfig } from '../../../shared/interfaces/app-config.interface'

/**
 * AppConfigService is a service that handles operations related to the application configuration.
 * @class AppConfigService
 */
@Injectable()
export class AppConfigService {
  /**
  * Constructs an instance of AppConfigService.
  * @param configService - The service to access the application configuration.
  */
  constructor(private readonly configService: ConfigService) { }
  /**
   * Retrieves the application configuration.
   * @returns A promise that resolves to the application configuration.
   */
  getAppConfig(): AppConfig {
    const nodeEnv: string = this.configService.get('nodeEnv')

    return {
      production: nodeEnv === 'production'
    }
  }
}
