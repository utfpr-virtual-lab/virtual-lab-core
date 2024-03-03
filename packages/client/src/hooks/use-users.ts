import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listUsers } from '../services/api';
import { queryClient } from '../services/query-client';

export const useUsers = (props: {
    groupId?: string;
    orderBy?: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'alphabetical';
    order?: 'asc' | 'desc';
    textSearch?: string;
    page: number;
    resultsPerPage: number;
}) => {
    const usersQuery = useQuery({
        queryKey: [
            `users`,
            props.groupId,
            props.orderBy,
            props.order,
            props.textSearch,
            props.page,
            props.resultsPerPage,
        ],
        queryFn: async () => {
            const response = await listUsers({
                groupId: props.groupId,
                orderBy: props.orderBy ?? 'creationDate',
                order: props.order ?? 'desc',
                textSearch: props.textSearch,
                page: props.page,
                resultsPerPage: props.resultsPerPage,
            });

            if (!response.success) throw new Error(response.error);

            response.data.data.forEach((user) => {
                queryClient.setQueryData(['user', user.id], user);
            });

            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return { usersQuery };
};
