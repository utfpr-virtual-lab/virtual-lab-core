import {
    AccountRecovery,
    AdvancedSecurityMode,
    ClientAttributes,
    Mfa,
    OAuthScope,
    UserPool,
    UserPoolClient,
    UserPoolDomain,
    VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { Duration, RemovalPolicy } from 'aws-cdk-lib/core';
import * as sst from 'sst/constructs';

const stagesWhereUserPoolIsRetained = ['production'];

export function Auth({ stack, app }: sst.StackContext) {
    const userPool = new UserPool(stack, 'UserPool', {
        accountRecovery: AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
        advancedSecurityMode: AdvancedSecurityMode.AUDIT,
        removalPolicy: stagesWhereUserPoolIsRetained.includes(app.stage) ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
        mfa: Mfa.OPTIONAL,
        mfaSecondFactor: {
            otp: true,
            sms: true,
        },
        selfSignUpEnabled: false,
        lambdaTriggers: {
            // TODO: preTokenGeneration
            // TODO: postConfirmation
        },
        passwordPolicy: {
            minLength: 8,
            requireDigits: true,
            requireLowercase: true,
            requireSymbols: true,
            requireUppercase: true,
            tempPasswordValidity: Duration.days(30),
        },
        signInAliases: {
            email: true,
            preferredUsername: true,
            username: true,
        },
        userInvitation: {
            emailSubject: 'You are invited to join the Virtual Lab',
            emailBody: 'Your username is <strong>{username}</strong> and temporary password is <strong>{####}</strong>',
        },
        userVerification: {
            emailStyle: VerificationEmailStyle.CODE,
            emailSubject: 'Your Virtual Lab verification code',
            emailBody: 'Your verification code is <strong>{####}</strong>',
        },
    });

    const userPoolDomain = new UserPoolDomain(stack, 'UserPoolDomain', {
        userPool,
        cognitoDomain: {
            domainPrefix: `${app.name}-${app.stage}`.toLowerCase(),
        },
    });

    const userPoolClient = new UserPoolClient(stack, 'UserPoolClient', {
        userPool,
        authFlows: {
            adminUserPassword: true,
            custom: true,
            userPassword: true,
            userSrp: true,
        },
        oAuth: {
            scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
            flows: {
                authorizationCodeGrant: true,
                clientCredentials: true,
                implicitCodeGrant: true,
            },

            /**
             * Update this to the URL of your frontend app.
             */
            callbackUrls: ['http://localhost:3000'],
            logoutUrls: ['http://localhost:3000'],
        },
        writeAttributes: new ClientAttributes().withStandardAttributes({
            preferredUsername: true,
            fullname: true,
        }),
    });

    const cognito = new sst.Cognito(stack, 'cognito', {
        login: ['email', 'preferredUsername', 'username'],
        cdk: { userPool, userPoolClient },
    });

    stack.addOutputs({
        userPoolId: cognito.userPoolId,
        userPoolClientId: cognito.userPoolClientId,
        userPoolDomainBaseUrl: userPoolDomain.baseUrl(),
    });

    return {
        userPool,
        userPoolClient,
        userPoolDomain,
        cognito,
    };
}