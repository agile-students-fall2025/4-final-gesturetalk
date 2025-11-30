import { createContext } from 'react';

// Provides { currentUser, setCurrentUser } via Provider value
const UserContext = createContext({ currentUser: null, setCurrentUser: (user) => {}, isLoading: true });

export default UserContext;
