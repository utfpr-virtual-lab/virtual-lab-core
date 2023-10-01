import { EventBridgeHandler } from 'aws-lambda';
import { createHandler, logger } from '../../../integrations/powertools';
import { Ec2InstanceState } from '../../../integrations/aws-ec2/protocols';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { AwsEc2Integration } from '../../../integrations/aws-ec2/service';
import { GuacamoleIntegration } from '../../../integrations/guacamole/service';
import { InstanceRepository } from '../repository';
import { InstanceService } from '../service';
import { UserRepository } from '../../user/repository';
import { UserService } from '../../user/service';
import { AwsAppSyncIntegration } from '../../../integrations/aws-app-sync/service';
import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';

// Config
const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD, APP_SYNC_API_URL } =
    process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Integration
const awsEc2Integration = new AwsEc2Integration({ AWS_REGION });
const guacamoleIntegration = new GuacamoleIntegration();
const awsAppSyncIntegration = new AwsAppSyncIntegration({ AWS_REGION, APP_SYNC_API_URL });
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });

// Repository
const instanceRepository = new InstanceRepository(dbClient);
const userRepository = new UserRepository(dbClient);

// Service
const instanceService = new InstanceService({
    INSTANCE_PASSWORD,
    GUACAMOLE_CYPHER_KEY,
    instanceRepository,
    awsEc2Integration,
    guacamoleIntegration,
    awsServiceCatalogIntegration,
});
const userService = new UserService({ userRepository });

export const handler = createHandler<
    EventBridgeHandler<
        'EC2 Instance State-change Notification',
        { 'instance-id': string; state: keyof typeof Ec2InstanceState },
        void
    >
>(async (event) => {
    const { 'instance-id': instanceId, state } = event.detail;

    const instance = await instanceService.getInstanceByAwsInstanceId(instanceId);

    if (instance === undefined) {
        logger.debug(`Instance ${instanceId} not found in database, skipping notification`);
        return;
    }

    const user = await userService.getUserById(instance.userId);

    if (user === undefined) {
        logger.error(`Instance ${instanceId} has no user associated, skipping notification`);
        return;
    }

    await awsAppSyncIntegration.publishEc2InstanceStateChanged({
        username: user.username,
        id: instance.id,
        awsInstanceId: instance.awsInstanceId!,
        name: instance.name,
        state,
    });
});
