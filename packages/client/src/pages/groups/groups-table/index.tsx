import {
    ButtonGroup,
    IconButton,
    Spinner,
    Table,
    TableCaption,
    TableContainer,
    Tag,
    Tbody,
    Td,
    Th,
    Thead,
    Tooltip,
    Tr,
} from '@chakra-ui/react';
import React from 'react';
import { FiEdit } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { useGroupsContext } from '../../../contexts/groups/hook';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export const GroupsTable: React.FC = () => {
    const { isLoading, groups } = useGroupsContext();

    return (
        <TableContainer
            bgColor={'white'}
            p={4}
            borderRadius={12}
            boxShadow={'sm'}
        >
            <Table
                size={'md'}
                variant='simple'
                colorScheme='blue'
            >
                {groups.length === 0 && isLoading === false ? (
                    <TableCaption>Nenhum grupo encontrado</TableCaption>
                ) : null}

                {isLoading !== false ? (
                    <TableCaption>
                        <Spinner
                            size='xl'
                            speed='1s'
                            thickness='4px'
                            color='blue.500'
                            emptyColor='gray.200'
                        />
                    </TableCaption>
                ) : null}

                <Thead>
                    <Tr>
                        <Th>Nome</Th>
                        <Th>Descrição</Th>
                        <Th>Portfólio</Th>
                        <Th>Criado em</Th>
                        <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {isLoading === false &&
                        groups.map((group, index) => (
                            <Tr key={`tr-${index}`}>
                                <Td>{group.name}</Td>
                                <Td>
                                    <Tooltip label={group.description}>
                                        {`${group.description.slice(0, 15)}...`}
                                    </Tooltip>
                                </Td>
                                <Td>
                                    <Tag>{group.portfolioId}</Tag>
                                </Td>

                                <Td>{dayjs(group.createdAt).format('DD/MM/YYYY')}</Td>
                                <Td isNumeric>
                                    <ButtonGroup>
                                        <IconButton
                                            aria-label='Abrir detalhes'
                                            icon={<FiEdit />}
                                            variant='outline'
                                            colorScheme='blue'
                                            size='sm'
                                        />
                                    </ButtonGroup>
                                </Td>
                            </Tr>
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
