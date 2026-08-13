import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NodesService } from '../node/node.service';
import { NotificationType } from '../generated/prisma/enums';

@Injectable()
export class NodeHealthMonitorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NodeHealthMonitorService.name);

  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodesService: NodesService,
  ) {}

  onApplicationBootstrap() {
    this.handleNodeHealthCheck();
  }

  @Cron('0 */3 * * * *', { name: 'node-health-check' })
  async handleNodeHealthCheck(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        'NodeHealthMonitor: previous run still in progress - skipping tick',
      );
      return;
    }

    this.isRunning = true;
    try {
      await this.runHealthCheck();
    } catch (err) {
      console.error(err);
    } finally {
      this.isRunning = false;
    }
  }

  private async runHealthCheck(): Promise<void> {
    const nodes = await this.prisma.node.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        url: true,
        healthStatus: true,
        healthCheckedAt: true,
      },
    });

    if (nodes.length === 0) {
      return;
    }

    this.logger.log(
      `NodeHealthMonitor: checking ${nodes.length} active node(s)`,
    );

    await Promise.allSettled(nodes.map((node) => this.processNode(node)));
  }

  private async processNode(node: {
    id: number;
    name: string;
    url: string;
    healthStatus: string | null;
    healthCheckedAt: Date | null;
  }): Promise<void> {
    try {
      let currentHealthStatus: string;
      try {
        const healthResult = await this.nodesService.nodeHealthDetailed(
          node.url,
        );
        currentHealthStatus = healthResult.healthy ? 'healthy' : 'unhealthy';
      } catch {
        currentHealthStatus = 'offline';
      }

      const previousHealthStatus = node.healthStatus;

      let notification: {
        type: NotificationType;
        title: string;
        message: string;
        nodeId: number;
        watcherId: null;
      } | null = null;

      let notificationType: NotificationType | null = null;
      let resetNodeNotification: boolean = false;

      if (
        previousHealthStatus === 'healthy' &&
        (currentHealthStatus === 'unhealthy' ||
          currentHealthStatus === 'offline')
      ) {
        notificationType = NotificationType.Warning;
        notification = {
          type: NotificationType.Warning,
          title:
            currentHealthStatus === 'offline'
              ? `Node Offline: ${node.name}`
              : `Node Unhealthy: ${node.name}`,
          message:
            currentHealthStatus === 'offline'
              ? `Node "${node.name}" is unreachable - the RPC endpoint did not respond.`
              : `Node "${node.name}" is reachable but reporting a degraded state (no peers, not listening, or currently syncing).`,
          nodeId: node.id,
          watcherId: null,
        };
      }
      // bad state -> HEALTHY: create Info (Recovery) notification and reset state
      else if (
        (previousHealthStatus === 'unhealthy' ||
          previousHealthStatus === 'offline') &&
        currentHealthStatus === 'healthy'
      ) {
        notificationType = NotificationType.Info;
        resetNodeNotification = true;
        notification = {
          type: NotificationType.Info,
          title: `Node Recovered: ${node.name}`,
          message: `Node "${node.name}" has recovered and is now healthy `,
          nodeId: node.id,
          watcherId: null,
        };
      }
      // All other cases: no notification
      // null -> any     : first-run baseline, no alert
      // healthy -> healthy : no change
      // bad -> bad         : already alerted, no duplicate

      await this.prisma.$transaction(async (tx) => {
        await tx.node.update({
          where: { id: node.id },
          data: {
            healthStatus: currentHealthStatus,
            healthCheckedAt: new Date(),
            ...(resetNodeNotification && {
              healthStatus: 'healthy',
            }),
          },
        });

        if (notification) {
          await tx.notification.create({
            data: notification,
          });
        }
      });

      if (notification) {
        this.logger.log(
          `NodeHealthMonitor: [${node.name}] ${previousHealthStatus ?? 'null'} -> ${currentHealthStatus} | type=${notificationType}`,
        );
      }
    } catch (err) {
      console.error(err);
    }
  }
}
