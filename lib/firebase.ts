// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "G-XXXXXXXXXX",
}

// Firebase services cache
let firebaseServices: any = null
let initializationPromise: Promise<any> | null = null

// Initialize Firebase with dynamic imports
export const initializeFirebase = async () => {
  // Return cached services if already initialized
  if (firebaseServices) {
    return firebaseServices
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise
  }

  // Only initialize on client side
  if (typeof window === "undefined") {
    return {
      app: null,
      auth: null,
      db: null,
      rtdb: null,
      storage: null,
      analytics: null,
      googleProvider: null,
    }
  }

  // Create initialization promise
  initializationPromise = (async () => {
    try {
      // Dynamic imports to avoid server-side loading
      const { initializeApp, getApps, getApp } = await import("firebase/app")
      const { getAuth, GoogleAuthProvider } = await import("firebase/auth")
      const { getFirestore } = await import("firebase/firestore")
      const { getDatabase } = await import("firebase/database")
      const { getStorage } = await import("firebase/storage")

      // Initialize Firebase app
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

      // Initialize services
      const auth = getAuth(app)
      const db = getFirestore(app)
      const rtdb = getDatabase(app)
      const storage = getStorage(app)
      const googleProvider = new GoogleAuthProvider()

      // Try to initialize analytics (optional)
      let analytics = null
      try {
        const { getAnalytics } = await import("firebase/analytics")
        analytics = getAnalytics(app)
      } catch (error) {
        console.warn("Analytics not available:", error)
      }

      const services = {
        app,
        auth,
        db,
        rtdb,
        storage,
        analytics,
        googleProvider,
      }

      // Cache the services
      firebaseServices = services
      return services
    } catch (error) {
      console.error("Error initializing Firebase:", error)
      initializationPromise = null // Reset promise on error
      throw error
    }
  })()

  return initializationPromise
}

// Get Firebase services (async)
export const getFirebaseServices = async () => {
  return await initializeFirebase()
}

// Synchronous version that returns null if not initialized
export const getFirebaseServicesSync = () => {
  if (typeof window === "undefined") {
    return {
      app: null,
      auth: null,
      db: null,
      rtdb: null,
      storage: null,
      analytics: null,
      googleProvider: null,
    }
  }

  return (
    firebaseServices || {
      app: null,
      auth: null,
      db: null,
      rtdb: null,
      storage: null,
      analytics: null,
      googleProvider: null,
    }
  )
}

export default firebaseConfig
