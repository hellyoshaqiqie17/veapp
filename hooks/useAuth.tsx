import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
    auth,
    createUserWithEmailAndPassword,
    get,
    GoogleAuthProvider,
    onAuthStateChanged,
    ref,
    rtdb,
    set,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    User
} from '../services/firebase';

interface Driver {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  joinDate: number;
  employmentType: string;
  driverPhotoUrl: string;
  drivingLicensePhotoUrl: string;
  nationalIdPhotoUrl: string;
  employeeCardPhotoUrl: string;
  vehicleUsed: string;
}

interface AuthContextType {
  user: User | null;
  driver: Driver | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, driverData: Partial<Driver>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  promptGoogleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '844821073092-1ktiq064q6cipmm8r69ktj0tnqlo48qf.apps.googleusercontent.com',
    });
  }, []);

  const generateUserId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 28; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchDriverData = async (email: string): Promise<Driver | null> => {
    try {
      const driversRef = ref(rtdb, 'Drivers');
      const snapshot = await get(driversRef);
      
      if (snapshot.exists()) {
        const drivers = snapshot.val();
        for (const key in drivers) {
          if (drivers[key].email === email) {
            return { ...drivers[key], id: key };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching driver data:', error);
      return null;
    }
  };

  const createDriver = async (email: string, driverData: Partial<Driver>): Promise<Driver> => {
    const userId = generateUserId();
    const timestamp = Date.now();
    
    const newDriver: Driver = {
      userId,
      email,
      fullName: driverData.fullName || '',
      phoneNumber: driverData.phoneNumber || '',
      address: driverData.address || '',
      dateOfBirth: driverData.dateOfBirth || '',
      joinDate: timestamp,
      employmentType: driverData.employmentType || 'Full-Time',
      driverPhotoUrl: driverData.driverPhotoUrl || '',
      drivingLicensePhotoUrl: driverData.drivingLicensePhotoUrl || '',
      nationalIdPhotoUrl: driverData.nationalIdPhotoUrl || '',
      employeeCardPhotoUrl: driverData.employeeCardPhotoUrl || '',
      vehicleUsed: driverData.vehicleUsed || '',
    };

    const newDriverRef = ref(rtdb, `Drivers/-${timestamp}`);
    await set(newDriverRef, newDriver);

    return newDriver;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
      const existingDriver = await fetchDriverData(email);
      
      if (existingDriver) {
        setDriver(existingDriver);
      } else {
        const newDriver = await createDriver(email, {});
        setDriver(newDriver);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login gagal. Silakan coba lagi.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Email tidak terdaftar.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Password salah.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email atau password salah.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti.';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    driverData: Partial<Driver>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      
      const newDriver = await createDriver(email, driverData);
      setDriver(newDriver);

      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      let errorMessage = 'Registrasi gagal. Silakan coba lagi.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email sudah terdaftar.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah. Minimal 6 karakter.';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Sign out from Google first
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in with Google
      }
      await signOut(auth);
      setUser(null);
      setDriver(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Native Google Sign-In function
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Check if Play Services are available
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google (native dialog)
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        // Create Firebase credential with the Google ID token
        const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        
        if (userCredential.user?.email) {
          const existingDriver = await fetchDriverData(userCredential.user.email);
          
          if (existingDriver) {
            setDriver(existingDriver);
          } else {
            const newDriver = await createDriver(userCredential.user.email, {
              fullName: userCredential.user.displayName || '',
            });
            setDriver(newDriver);
          }
        }
        return { success: true };
      } else {
        return { success: false, error: 'Tidak mendapatkan token dari Google.' };
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Login dibatalkan.' };
      } else if (error.code === 'IN_PROGRESS') {
        return { success: false, error: 'Proses login sedang berlangsung.' };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return { success: false, error: 'Google Play Services tidak tersedia.' };
      }
      
      return { success: false, error: 'Login dengan Google gagal. Silakan coba lagi.' };
    } finally {
      setLoading(false);
    }
  };

  // Prompt Google Login (calls loginWithGoogle directly)
  const promptGoogleLogin = () => {
    loginWithGoogle();
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser?.email) {
        const driverData = await fetchDriverData(firebaseUser.email);
        setDriver(driverData);
      } else {
        setDriver(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    driver,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    promptGoogleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
