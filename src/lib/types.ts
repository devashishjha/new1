

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
    avatar?: string;
    phone?: string;
  };
  price: {
    type: 'rent' | 'sale';
    amount: number;
  };
  location: string;
  societyName?: string;
  postedOn: Timestamp | Date | string;
  videoViews?: number;
  shortlistCount?: number;
  status: 'available' | 'occupied' | 'on-hold' | 'pending-review';
  
  configuration: 'studio' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | '5bhk+';
  floorNo: number;
  totalFloors: number;
  kitchenUtility: boolean;
  propertyType: 'apartment' | 'villa' | 'row house' | 'penthouse' | 'independent house' | 'builder floor';
  mainDoorDirection: 'north-east' | 'north-west' | 'south-east' | 'south-west';
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
  avatar?: string;
  role?: 'admin' | 'service-provider';
};

export type SearchHistoryItem = {
    display: string;
    filters: object; // Storing the raw filter object from search-client.tsx
}

export type SeekerProfile = BaseProfile & {
  type: 'seeker';
  searchCriteria: string;
  searchHistory?: SearchHistoryItem[];
};

export type OwnerProfile = BaseProfile & {
  type: 'owner';
};

export type DealerProfile = BaseProfile & {
  type: 'dealer';
  companyName?: string;
  reraId?: string;
};

export type DeveloperProfile = BaseProfile & {
  type: 'developer';
  companyName?: string;
  reraId?: string;
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
  id:string;
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

// --- Ironing Types ---

export type IroningAddress = {
    apartmentName: string;
    block: string;
    floorNo: string;
    flatNo: string;
};

export type IroningProfile = {
    name?: string;
    email?: string;
    phone?: string;
    address?: IroningAddress;
};

export type IroningOrderItem = {
    name: string;
    price: number;
    quantity: number;
};

export type IroningOrderStatus = 'placed' | 'picked-up' | 'processing' | 'out-for-delivery' | 'completed';

export type StatusUpdate = {
  status: IroningOrderStatus;
  timestamp: Timestamp | Date | string;
  updatedBy: string; // userId of who updated it
};


export type IroningOrder = {
    id: string; // Firestore document ID
    orderId: number; // Sequential numeric ID
    userId: string;
    userEmail: string;
    userName?: string;
    userPhone?: string;
    items: IroningOrderItem[];
    totalCost: number;
    totalItems: number;
    status: IroningOrderStatus;
    placedAt: Timestamp | Date | string;
    address: IroningAddress;
    statusHistory?: StatusUpdate[];
    estimatedDelivery?: Timestamp | Date | string;
};
