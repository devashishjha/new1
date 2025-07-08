
'use server';

import { propertyMatchScore, type PropertyMatchScoreInput, type PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { generatePropertyDescription, type GeneratePropertyDescriptionInput, type GeneratePropertyDescriptionOutput } from '@/ai/flows/generate-property-description';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const isAiEnabled = !!process.env.GOOGLE_API_KEY;

export async function getPropertyMatchScore(input: PropertyMatchScoreInput): Promise<PropertyMatchScoreOutput | null> {
  if (!isAiEnabled) {
    console.warn("AI features are disabled. Missing GOOGLE_API_KEY.");
    return null;
  }
  try {
    const result = await propertyMatchScore(input);
    return result;
  } catch (error) {
    console.error("Error in getPropertyMatchScore action:", error);
    // In a real app, you might want to log this to a monitoring service.
    return null;
  }
}

export async function generatePropertyDescriptionAction(input: GeneratePropertyDescriptionInput): Promise<GeneratePropertyDescriptionOutput | null> {
    if (!isAiEnabled) {
    console.warn("AI features are disabled. Missing GOOGLE_API_KEY.");
    return null;
  }
  try {
    const result = await generatePropertyDescription(input);
    return result;
  } catch (error)
 {
    console.error("Error in generatePropertyDescriptionAction:", error);
    return null;
  }
}

export async function updatePropertyStatusAction(propertyId: string, status: 'available' | 'occupied' | 'on-hold') {
  if (!auth) {
    return { success: false, message: 'Authentication service not available.' };
  }
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: 'You must be logged in to perform this action.' };
  }
  if (!db) {
    return { success: false, message: 'Database service not available.' };
  }

  const propertyDocRef = doc(db, 'properties', propertyId);

  try {
    const propertyDoc = await getDoc(propertyDocRef);
    if (!propertyDoc.exists()) {
        return { success: false, message: 'Property not found.' };
    }

    if (propertyDoc.data().lister.id !== user.uid) {
        return { success: false, message: 'You are not authorized to update this property.' };
    }
    
    await updateDoc(propertyDocRef, { status: status });
    return { success: true, message: `Property status updated to ${status}.` };
  } catch (error) {
    console.error("Error updating property status:", error);
    return { success: false, message: 'An unexpected error occurred while updating the property status.' };
  }
}


export async function deletePropertyAction(propertyId: string) {
    if (!auth) {
        return { success: false, message: 'Authentication service not available.' };
    }
    const user = auth.currentUser;
    if (!user) {
        return { success: false, message: 'You must be logged in to perform this action.' };
    }
    if (!db || !storage) {
        return { success: false, message: 'Database/Storage service not available.' };
    }

    const propertyDocRef = doc(db, 'properties', propertyId);

    try {
        const propertyDoc = await getDoc(propertyDocRef);
        if (!propertyDoc.exists()) {
            return { success: false, message: 'Property not found.' };
        }

        const propertyData = propertyDoc.data();
        if (propertyData.lister.id !== user.uid) {
            return { success: false, message: 'You are not authorized to delete this property.' };
        }
        
        if (propertyData.video) {
            try {
                const videoRef = ref(storage, propertyData.video);
                await deleteObject(videoRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    console.warn(`Could not delete video from storage: ${storageError.code}`);
                }
            }
        }

        await deleteDoc(propertyDocRef);
        return { success: true, message: 'Property successfully deleted.' };
    } catch (error) {
        console.error("Error deleting property:", error);
        return { success: false, message: 'An unexpected error occurred while deleting the property.' };
    }
}
