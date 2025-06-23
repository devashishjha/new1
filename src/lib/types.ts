import type { Timestamp } from "firebase/firestore";

export type Property = {
  id: string;
  title: string;
  description: string;
  image: string;
  video?: string;
  lister: {
    id: string;
    name: string;
    type: 'owner' | 'developer' | 'dealer';
  };
  price: {
    type: 'rent' | 'sale';
    amount: number;
  };
  location: string;
  societyName: string;
  postedOn: Timestamp | Date | string;
  
  configuration: 'studio' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | '5bhk+';
  floorNo: number;
  totalFloors: number;
  kitchenUtility: boolean;
  propertyType: 'apartment' | 'villa' | 'row house' | 'penthouse' | 'independent house' | 'builder floor';
  mainDoorDirection: 'north' | 'south' | 'east' | 'west' | 'north-east' | 'north-west' | 'south-east' | 'south-west';
  openSides: '1' | '2' | '3' | '4';
  hasBalcony: boolean;
  
  parking: {
    has2Wheeler: boolean;
    has4Wheeler: boolean;
  };
  
  features: {
    sunlightEntersHome: boolean;
    housesOnSameFloor: number;
  };
  
  amenities: {
    hasLift: boolean;
    hasChildrenPlayArea: boolean;
    hasDoctorClinic: boolean;
    hasPlaySchool: boolean;
    hasSuperMarket: boolean;
    hasPharmacy: boolean;
    hasClubhouse: boolean;
    sunlightPercentage: number;
    hasWaterMeter: boolean;
    hasGasPipeline: boolean;
  };
  
  area: {
      superBuiltUp: number;
      carpet: number;
  };
  
  charges: {
      maintenancePerMonth: number;
      securityDeposit: number;
      brokerage: number;
      moveInCharges: number;
  };
};

// --- User Profile Types ---

type BaseProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
};

export type SeekerProfile = BaseProfile & {
  type: 'seeker';
  searchCriteria: string;
  searchHistory?: string[];
};

export type OwnerProfile = BaseProfile & {
  type: 'owner';
};

export type DealerProfile = BaseProfile & {
  type: 'dealer';
  companyName: string;
  reraId?: string;
};

export type DeveloperProfile = BaseProfile & {
  type: 'developer';
  companyName: string;
  reraId: string;
};

export type UserProfile = SeekerProfile | OwnerProfile | DealerProfile | DeveloperProfile;

// --- Chat Types ---

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
};

export type ChatConversation = {
  id: string;
  participantIds: string[];
  participants: {
    [key: string]: {
      name: string;
      avatar: string;
    }
  };
  lastMessage: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  unreadCount: number;
  messages: ChatMessage[];
};
