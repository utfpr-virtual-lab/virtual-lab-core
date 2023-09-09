import { Box, Drawer, DrawerContent, useColorModeValue, useDisclosure } from '@chakra-ui/react';

import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import React from 'react';

export const MainLayout: React.FC = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Box
            minH='100vh'
            bg={useColorModeValue('gray.100', 'gray.900')}
        >
            <Sidebar
                onClose={() => onClose}
                display={{ base: 'none', md: 'block' }}
            />
            <Drawer
                isOpen={isOpen}
                placement='left'
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size='full'
            >
                <DrawerContent>
                    <Sidebar onClose={onClose} />
                </DrawerContent>
            </Drawer>

            <Navbar onOpen={onOpen} />

            <Box
                ml={{ base: 0, md: 60 }}
                p={4}
            >
                <Outlet />
            </Box>
        </Box>
    );
};