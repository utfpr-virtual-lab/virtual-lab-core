import {
    Box,
    Container,
    Heading,
    VStack,
    Stack,
    IconButton,
    Tooltip,
    SlideFade,
    ButtonGroup,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { useNavigate } from 'react-router-dom';

export const UserPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const navigate = useNavigate();

    React.useEffect(() => {
        setActiveMenuItem('ADMIN_USERS');
    }, []);

    return (
        <Box>
            <Container maxW={'6xl'}>
                <Stack
                    pb={10}
                    maxW={'6xl'}
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
                >
                    <VStack
                        spacing={0}
                        align={{ base: 'center', md: 'initial' }}
                    >
                        <Breadcrumb separator={<Heading>/</Heading>}>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    onClick={() => {
                                        navigate('/admin/users');
                                    }}
                                >
                                    <Heading color='gray.800'>Usuários</Heading>
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <SlideFade
                                in
                                offsetX={'-20px'}
                                offsetY={0}
                            >
                                <BreadcrumbItem>
                                    <BreadcrumbLink isCurrentPage>
                                        <Heading color='gray.800'>TODO</Heading>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </SlideFade>
                        </Breadcrumb>
                    </VStack>

                    <SlideFade
                        in
                        offsetX={'20px'}
                        offsetY={0}
                    >
                        <ButtonGroup>
                            <Tooltip label='Recarregar'>
                                <IconButton
                                    aria-label='Recarregar'
                                    variant={'outline'}
                                    colorScheme='blue'
                                    // hidden={usersQuery.isLoading}
                                    // isLoading={usersQuery.isFetching}
                                    // onClick={() => {
                                    //     usersQuery.refetch().catch(console.error);
                                    // }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>
            </Container>
        </Box>
    );
};
