import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Button,
    HStack,
    Heading,
    IconButton,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useToast,
    Box,
} from '@chakra-ui/react';
import React from 'react';
import { Group } from '../../services/api/protocols';
import * as api from '../../services/api/service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { GroupUsersTable } from '../group-users-table';
import { FiRefreshCw } from 'react-icons/fi';
import { Paginator } from '../paginator';
import { useGroupsUsers } from '../../hooks/group-users';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getErrorMessage, parseSessionData } from '../../services/helpers';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/query/service';
import { AsyncSelect, Select } from 'chakra-react-select';
import { useSearchUsers } from '../../hooks/search-users';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupDetailsModalProps {
    group: Group;
    isOpen: boolean;
    onClose: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ group, isOpen, onClose }) => {
    const [page, setPage] = React.useState(1);
    const toast = useToast();
    const { user } = useAuthenticator((state) => [state.user]);
    const { role } = parseSessionData(user);
    const [textQuery, setTextQuery] = React.useState('');
    const [textQueryDebounced, setTextQueryDebounced] = React.useState(textQuery);

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setTextQueryDebounced(textQuery);
        }, 500);
        return () => {
            clearTimeout(timeout);
        };
    }, [textQuery]);

    const { searchUsersQuery } = useSearchUsers({ textQuery: textQueryDebounced });

    const { groupUsersQuery } =
        role === 'ADMIN'
            ? useGroupsUsers(group.id, { page, resultsPerPage: 5 })
            : { groupUsersQuery: undefined };

    const unlinkUsersFromGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: number; userIds: number[] }) => {
            const { error } = await api.unlinkUsersFromGroup(mut.groupId, mut.userIds);
            if (error !== undefined) throw new Error(error);
            return mut;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries([`groupUsers_${data.groupId}`]).catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Falha ao remover usuário do grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    const linkUsersToGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: number; userIds: number[] }) => {
            const { error } = await api.linkUsersToGroup(mut.groupId, mut.userIds);
            if (error !== undefined) throw new Error(error);
            return mut;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries([`groupUsers_${data.groupId}`]).catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Falha ao adicionar usuários ao grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    const infoTabData: { label: string; value: string }[] = [
        { label: 'Descrição', value: group?.description ?? 'Nenhuma descrição' },
        { label: 'Id do portfólio', value: group?.portfolioId ?? 'Nenhum portfólio' },
        {
            label: 'Criado em',
            value:
                group?.createdAt !== undefined
                    ? dayjs(group?.createdAt).format('DD/MM/YYYY')
                    : 'Nenhuma data',
        },
        {
            label: 'Atualizado',
            value:
                group?.updatedAt !== undefined ? dayjs(group?.updatedAt).fromNow() : 'Nenhuma data',
        },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnEsc
            closeOnOverlayClick
            size={{ base: 'sm', md: '6xl' }}
        >
            <ModalOverlay>
                <ModalContent>
                    <ModalCloseButton />

                    <ModalHeader fontSize='lg'>
                        <Heading
                            size='lg'
                            fontWeight='semibold'
                        >
                            Grupo {group?.name}
                        </Heading>
                    </ModalHeader>

                    <ModalBody>
                        <Tabs>
                            <TabList>
                                <Tab>Info</Tab>
                                <Tab isDisabled={role !== 'ADMIN'}>Usuários</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel>
                                    <Stack
                                        mt={'2%'}
                                        spacing={2}
                                        direction='column'
                                    >
                                        {infoTabData.map((data) => (
                                            <React.Fragment key={data.label}>
                                                <Text
                                                    fontSize='lg'
                                                    color='gray.600'
                                                >
                                                    {data.label}
                                                </Text>
                                                <Text
                                                    fontSize='lg'
                                                    fontWeight='semibold'
                                                >
                                                    {data.value}
                                                </Text>
                                            </React.Fragment>
                                        ))}
                                    </Stack>
                                </TabPanel>
                                <TabPanel>
                                    <Stack
                                        mt={'2%'}
                                        spacing={'6'}
                                    >
                                        <HStack alignItems={'center'}>
                                            <Box w={'100%'}>
                                                <AsyncSelect
                                                    isMulti
                                                    name='Portfólio'
                                                    placeholder='Selecione os usuários'
                                                    isLoading={searchUsersQuery?.isFetching}
                                                    loadOptions={(_inputValue, callback) => {
                                                        callback(
                                                            searchUsersQuery?.data?.map((user) => ({
                                                                label: user.username,
                                                                value: user.id,
                                                            })) ?? [],
                                                        );
                                                    }}
                                                    onInputChange={(value) => {
                                                        setTextQuery(value);
                                                    }}
                                                />
                                            </Box>

                                            <Button
                                                colorScheme={'blue'}
                                                px={10}
                                            >
                                                Adicionar Usuários
                                            </Button>
                                            <IconButton
                                                aria-label='Recarregar'
                                                variant={'outline'}
                                                colorScheme='blue'
                                                isLoading={groupUsersQuery?.isFetching}
                                                onClick={() => {
                                                    groupUsersQuery?.refetch().catch(console.error);
                                                }}
                                            >
                                                <FiRefreshCw />
                                            </IconButton>
                                        </HStack>

                                        <GroupUsersTable
                                            users={groupUsersQuery?.data?.data ?? []}
                                            isLoading={groupUsersQuery?.isLoading ?? false}
                                            isRemovingFromGroup={
                                                unlinkUsersFromGroupMutation.isLoading
                                            }
                                            onRemoveFromGroup={(user) => {
                                                unlinkUsersFromGroupMutation.mutate({
                                                    groupId: group.id,
                                                    userIds: [user.id],
                                                });
                                            }}
                                        />

                                        <Paginator
                                            activePage={page}
                                            onPageChange={(selectedPage) => {
                                                setPage(selectedPage);
                                            }}
                                            totalPages={groupUsersQuery?.data?.numberOfPages ?? 0}
                                        />
                                    </Stack>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>

                    <ModalFooter />
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};
