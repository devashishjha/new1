
'use server';

import { propertyMatchScore, type PropertyMatchScoreInput, type PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { generatePropertyDescription, type GeneratePropertyDescriptionInput, type GeneratePropertyDescriptionOutput } from '@/ai/flows/generate-property-description';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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
    // In a real app, you might want to log this error to a monitoring service.
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

export async function deletePropertyAction(propertyId: string): Promise<{ success: boolean; message: string }> {
  if (!auth || !db || !storage) {
    return { success: false, message: "Firebase is not configured on the server." };
  }
  // Firestore rules should handle authorization. This action confirms deletion from DB and storage.
  const propertyDocRef = doc(db, 'properties', propertyId);
  try {
    const propertyDoc = await getDoc(propertyDocRef);
    if (!propertyDoc.exists()) {
      return { success: false, message: "Property not found." };
    }
    const propertyData = propertyDoc.data();

    // Attempt to delete video from storage if it exists
    if (propertyData.video) {
      try {
        const videoRef = ref(storage, propertyData.video);
        await deleteObject(videoRef);
      } catch (storageError: any) {
        // Log storage error but don't block firestore deletion unless it's a permission issue.
        console.warn(`Could not delete video from storage: ${storageError.code}`);
        if (storageError.code !== 'storage/object-not-found') {
          // Potentially alert that video file might need manual deletion
        }
      }
    }

    // Delete property from firestore
    // This will fail if firestore rules are not met (i.e., user is not owner)
    await deleteDoc(propertyDocRef);

    return { success: true, message: "Property deleted successfully." };

  } catch (error: any) {
    console.error("Error deleting property:", error);
    if (error.code === 'permission-denied') {
        return { success: false, message: "You are not authorized to delete this property." };
    }
    return { success: false, message: "An unexpected error occurred while deleting the property." };
  }
}

export async function markPropertyAsOccupiedAction(propertyId: string): Promise<{ success: boolean; message: string }> {
  if (!auth || !db) {
    return { success: false, message: "Firebase is not configured on the server." };
  }
  
  const propertyDocRef = doc(db, 'properties', propertyId);
  
  try {
    const propertyDoc = await getDoc(propertyDocRef);

    if (!propertyDoc.exists()) {
      return { success: false, message: "Property not found." };
    }
    
    // Now that we know the doc exists, we can update it.
    // We still rely on Firestore rules to check for ownership.
    await updateDoc(propertyDocRef, {
      isSoldOrRented: true
    });

    return { success: true, message: "Property status updated successfully." };

  } catch (error: any) {
    console.error("Error updating property status:", error);
    
    if (error.code === 'permission-denied') {
        return { success: false, message: "You are not authorized to update this property." };
    }
    
    return { success: false, message: "An unexpected error occurred while updating the property." };
  }
}
