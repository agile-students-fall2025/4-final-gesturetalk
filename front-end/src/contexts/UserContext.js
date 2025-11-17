import { createContext } from 'react';

// Provides { currentUser, setCurrentUser } via Provider value
const UserContext = createContext({ currentUser: null, setCurrentUser: (user) => {} });

export default UserContext;
