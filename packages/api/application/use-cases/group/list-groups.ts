import { z } from 'zod';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { Group } from '../../../domain/entities/group';
import { GroupRepository } from '../../group-repository';
import { Errors } from '../../../domain/dtos/errors';

export const listGroupsInputSchema = z.object({
    principal: principalSchema,
    textQuery: z.string().optional(),
    createdBy: z.string().optional(),
    userId: z.string().optional(),
    orderBy: z.enum(['creationDate', 'lastUpdate', 'name']),
    order: z.enum(['asc', 'desc']),
    pagination: seekPaginationInputSchema,
});
export type ListGroupsInput = z.infer<typeof listGroupsInputSchema>;

export type ListGroupsOutput = SeekPaginated<Group>;

export class ListGroups {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: ListGroupsInput): Promise<ListGroupsOutput> => {
        this.logger.debug('ListGroups.execute', { input });

        const inputValidation = listGroupsInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'NONE');
        const { id } = this.auth.getClaims(validInput.principal);

        if (
            !this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN') &&
            validInput.userId !== undefined &&
            validInput.userId !== id
        ) {
            throw Errors.insufficientRole('ADMIN');
        }

        return await this.groupRepository.list(
            {
                textQuery: validInput.textQuery,
                createdBy: validInput.createdBy,
                userId: validInput.userId,
            },
            validInput.orderBy,
            validInput.order,
            validInput.pagination,
        );
    };
}
