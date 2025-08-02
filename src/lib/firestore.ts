import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type CollectionReference,
  type QuerySnapshot,
  type DocumentSnapshot,
  type WriteBatch,
  writeBatch,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Type definitions for our data models
export interface User {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  branch?: string;
  year?: number;
  username?: string;
  image?: string;
  role?: string;
  bio?: string;
  isAdmin?: boolean;
  github?: string;
  linkedin?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Core {
  id?: string;
  name: string;
  email?: string;
  branch: string;
  position: string;
  linkedin?: string;
  github?: string;
  imageSrc: string;
  year: number;
  order: number;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  brief?: string;
  image: string;
  date: Timestamp;
  time?: string;
  venue?: string;
  qr?: string;
  entryFee?: number;
  category: 'PREVIOUS' | 'UPCOMING' | 'CURRENT';
  type: 'SOLO' | 'TEAM';
  minTeamSize: number;
  maxTeamSize: number;
  maxTeams?: number;
  guests?: string[];
  published: boolean;
  registrationsAvailable: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Team {
  id?: string;
  custid: string;
  email: string;
  name?: string;
  leaderId?: string;
  transactionId?: string;
  eventId?: string;
  branch: string;
  role: string;
  linkedin?: string;
  github?: string;
  imageLink?: string;
  position?: 'FIRST' | 'SECOND' | 'THIRD' | 'PARTICIPATION' | 'TO_BE_DETERMINED';
  attended?: boolean;
  isConfirmed?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Recruit {
  id?: string;
  name: string;
  dateOfBirth: Timestamp;
  usn: string;
  yearOfStudy: string;
  branch: string;
  mobileNumber: string;
  personalEmail: string;
  collegeEmail?: string;
  membershipPlan: string;
  csiIdea: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Generic Firestore service class
export class FirestoreService<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getCollection(): CollectionReference<T> {
    return collection(db, this.collectionName) as CollectionReference<T>;
  }

  private getDocument(id: string): DocumentReference<T> {
    return doc(db, this.collectionName, id) as DocumentReference<T>;
  }

  // Create a new document
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.getCollection(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as T);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw new Error(`Failed to create ${this.collectionName}`);
    }
  }

  // Get a document by ID
  async getById(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(this.getDocument(id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName}:`, error);
      throw new Error(`Failed to get ${this.collectionName}`);
    }
  }

  // Get all documents
  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(this.getCollection(), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      throw new Error(`Failed to get all ${this.collectionName}`);
    }
  }

  // Update a document
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = this.getDocument(id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      } as DocumentData);
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw new Error(`Failed to update ${this.collectionName}`);
    }
  }

  // Delete a document
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocument(id));
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw new Error(`Failed to delete ${this.collectionName}`);
    }
  }

  // Query documents with filters
  async query(constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(this.getCollection(), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      console.error(`Error querying ${this.collectionName}:`, error);
      throw new Error(`Failed to query ${this.collectionName}`);
    }
  }

  // Batch operations
  async batch(operations: Array<{ type: 'create' | 'update' | 'delete'; data?: T; id?: string }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(operation => {
        switch (operation.type) {
          case 'create':
            if (operation.data) {
              const docRef = doc(this.getCollection());
              batch.set(docRef, {
                ...operation.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              } as DocumentData);
            }
            break;
          case 'update':
            if (operation.id && operation.data) {
              const docRef = this.getDocument(operation.id);
              batch.update(docRef, {
                ...operation.data,
                updatedAt: serverTimestamp(),
              } as DocumentData);
            }
            break;
          case 'delete':
            if (operation.id) {
              const docRef = this.getDocument(operation.id);
              batch.delete(docRef);
            }
            break;
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error(`Error in batch operation for ${this.collectionName}:`, error);
      throw new Error(`Failed to perform batch operation on ${this.collectionName}`);
    }
  }
}

// Create service instances for each collection
export const userService = new FirestoreService<User>('users');
export const coreService = new FirestoreService<Core>('core');
export const eventService = new FirestoreService<Event>('events');
export const teamService = new FirestoreService<Team>('teams');
export const recruitService = new FirestoreService<Recruit>('recruits');

// Helper functions for common queries
export const firestoreHelpers = {
  // User helpers
  getUserByEmail: (email: string) => userService.query([where('email', '==', email)]),
  getUserByUsername: (username: string) => userService.query([where('username', '==', username)]),
  
  // Core helpers
  getCoreMembers: () => coreService.query([orderBy('order', 'asc')]),
  
  // Event helpers
  getPublishedEvents: () => eventService.query([where('published', '==', true)]),
  getUpcomingEvents: () => eventService.query([
    where('published', '==', true),
    where('category', '==', 'UPCOMING'),
    orderBy('date', 'asc')
  ]),
  
  // Team helpers
  getTeamsByEvent: (eventId: string) => teamService.query([where('eventId', '==', eventId)]),
  getTeamByCustId: (custid: string) => teamService.query([where('custid', '==', custid)]),
  
  // Recruit helpers
  getRecruitsByDate: () => recruitService.query([orderBy('createdAt', 'desc')]),
}; 