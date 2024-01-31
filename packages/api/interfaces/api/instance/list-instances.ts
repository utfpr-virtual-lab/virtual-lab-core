import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { ListInstances } from '../../../application/use-cases/instance/list-instances';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
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
const instanceRepository = new DatabaseInstanceRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const virtualizationGateway = new AwsVirtualizationGateway(
    configVault,
    AWS_REGION,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
);
const listUserInstances = new ListInstances(
    logger,
    auth,
    instanceRepository,
    virtualizationGateway,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const query = z
            .object({
                orderBy: z
                    .enum(['creationDate', 'lastConnectionDate', 'name'])
                    .default('creationDate'),
                order: z.enum(['asc', 'desc']).default('asc'),
                resultsPerPage: z.number({ coerce: true }).min(1).max(60).default(10),
                page: z.number({ coerce: true }).min(1).default(1),
                ownerId: z.string().optional(),
            })
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw Errors.validationError(query.error);

        const output = await listUserInstances.execute({
            principal: CognitoAuth.extractPrincipal(event),
            orderBy: query.data.orderBy,
            order: query.data.order,
            pagination: {
                resultsPerPage: query.data.resultsPerPage,
                page: query.data.page,
            },
            ownerId: query.data.ownerId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);