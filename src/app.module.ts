import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { CommonModule, StorageService, UtilsService } from '@Common';
import { appConfigFactory } from '@Config';
import { AppController } from './app.controller';
import { AppCacheInterceptor } from './app-cache.interceptor';
import { MetricsInterceptor, MetricsModule, MetricsService } from './metrics';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { RedisModule } from './redis';
import { NodeModule } from './node/node.module';
import { WalletModule } from './wallet/wallet.module';
import { AssetModule } from './asset/asset.module';
import { PlatformModule } from './platform/platform.module';
import { ChainModule } from './chain/chain.module';
import { ActionModule } from './action/action.module';
import { WatcherModule } from './watcher/watcher.module';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: (storageService: StorageService) => ({
        ...storageService.defaultMulterOptions,
      }),
      inject: [StorageService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (appConfig: ConfigType<typeof appConfigFactory>) => ({
        ttl: appConfig.cacheTtl,
      }),
      inject: [appConfigFactory.KEY],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    CommonModule,
    MetricsModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    NodeModule,
    WalletModule,
    AssetModule,
    PlatformModule,
    ChainModule,
    ActionModule,
    WatcherModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (
        utilsService: UtilsService,
        metricsService: MetricsService,
      ) => {
        if (utilsService.isMetricsEnabled()) {
          return new MetricsInterceptor(metricsService);
        }
      },
      inject: [UtilsService, MetricsService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AppCacheInterceptor,
    },
  ],
})
export class AppModule {}
