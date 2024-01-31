import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { LaunchInstanceFromTemplate } from '../../../application/use-cases/instance/launch-instance-from-template';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { Errors } from '../../../domain/dtos/errors';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    SHARED_SECRET_NAME,
    DATABASE_URL_PARAMETER_NAME,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
} = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const instanceRepository = new DatabaseInstanceRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const virtualizationGateway = new AwsVirtualizationGateway(
    configVault,
    AWS_REGION,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
);
const launchInstance = new LaunchInstanceFromTemplate(
    logger,
    auth,
    userRepository,
    instanceRepository,
    virtualizationGateway,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const body = z
            .object({
                templateId: z.string(),
                enableHibernation: z.boolean(),
                instaceType: z.string(),
                ownerId: z.string().optional(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw Errors.validationError(body.error);

        const output = await launchInstance.execute({
            principal: CognitoAuth.extractPrincipal(event),
            templateId: body.data.templateId,
            enableHibernation: body.data.enableHibernation,
            instanceType: body.data.instaceType,
            ownerId: body.data.ownerId === 'me' ? undefined : body.data.ownerId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);