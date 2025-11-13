import { createContext } from 'react';

// Provides { currentUser, setCurrentUser } via Provider value
const UserContext = createContext({ currentUser: null, setCurrentUser: () => {} });

export default UserContext;
