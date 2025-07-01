import type { Property } from './types';

export const dummyProperties: Property[] = [
    // Property 1
    {
        id: 'dummy-1',
        title: 'Spacious 3BHK in HSR Layout',
        description: 'A beautiful and spacious 3BHK apartment located in the heart of HSR Layout. Comes with modern amenities and a great view. Perfect for families.',
        image: 'https://placehold.co/1080x1920.png',
        video: 'https://videos.pexels.com/video-files/8294975/8294975-hd.mp4',
        lister: {
            id: 'lister-1',
            name: 'Priya Sharma',
            type: 'owner',
            avatar: 'https://placehold.co/100x100.png',
            phone: '+919876543210'
        },
        price: { type: 'rent', amount: 65000 },
        location: 'HSR Layout, Bengaluru',
        societyName: 'Prestige Ferns Residency',
        postedOn: new Date().toISOString(),
        videoViews: 1250, // Added
        shortlistCount: 85, // Added
        isSoldOrRented: false, // Added
        configuration: '3bhk',
        propertyType: 'apartment',
        floorNo: 12,
        totalFloors: 20,
        mainDoorDirection: 'north-east',
        openSides: '2',
        kitchenUtility: true,
        hasBalcony: true,
        parking: { has2Wheeler: true, has4Wheeler: true },
        features: { sunlightEntersHome: true, housesOnSameFloor: 3 },
        amenities: {
            hasLift: true,
            hasChildrenPlayArea: true,
            hasDoctorClinic: false,
            hasPlaySchool: true,
            hasSuperMarket: true,
            hasPharmacy: false,
            hasClubhouse: true,
            sunlightPercentage: 80,
            hasWaterMeter: true,
            hasGasPipeline: true
        },
        area: { superBuiltUp: 1800, carpet: 1500 },
        charges: { maintenancePerMonth: 5000, securityDeposit: 200000, brokerage: 0, moveInCharges: 10000 }
    },
    // Property 2
    {
        id: 'dummy-2',
        title: 'Luxury Villa in Whitefield',
        description: 'Experience luxury living in this stunning villa in Whitefield. Private garden, swimming pool, and state-of-the-art interiors.',
        image: 'https://placehold.co/1080x1920.png',
        video: 'https://videos.pexels.com/video-files/5361368/5361368-hd.mp4',
        lister: {
            id: 'lister-2',
            name: 'Rajesh Kumar',
            type: 'developer',
            avatar: 'https://placehold.co/100x100.png',
            phone: '+919876543211'
        },
        price: { type: 'sale', amount: 35000000 }, // 3.5 Cr
        location: 'Whitefield, Bengaluru',
        societyName: 'Palm Meadows',
        postedOn: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        videoViews: 5600, // Added
        shortlistCount: 210, // Added
        isSoldOrRented: false, // Added
        configuration: '4bhk',
        propertyType: 'villa',
        floorNo: 0,
        totalFloors: 1,
        mainDoorDirection: 'north-west',
        openSides: '4',
        kitchenUtility: true,
        hasBalcony: true,
        parking: { has2Wheeler: true, has4Wheeler: true },
        features: { sunlightEntersHome: true, housesOnSameFloor: 1 },
        amenities: {
            hasLift: false,
            hasChildrenPlayArea: true,
            hasDoctorClinic: false,
            hasPlaySchool: false,
            hasSuperMarket: false,
            hasPharmacy: false,
            hasClubhouse: true,
            sunlightPercentage: 90,
            hasWaterMeter: true,
            hasGasPipeline: false
        },
        area: { superBuiltUp: 4000, carpet: 3200 },
        charges: { maintenancePerMonth: 15000, securityDeposit: 0, brokerage: 350000, moveInCharges: 25000 }
    },
    // Property 3
    {
        id: 'dummy-3',
        title: 'Cozy 2BHK in Koramangala',
        description: 'A cozy and well-maintained 2BHK apartment in a prime location in Koramangala. Close to offices, restaurants, and shopping centers.',
        image: 'https://placehold.co/1080x1920.png',
        video: 'https://videos.pexels.com/video-files/8040409/8040409-hd.mp4',
        lister: {
            id: 'lister-3',
            name: 'Anita Desai',
            type: 'dealer',
            avatar: 'https://placehold.co/100x100.png',
            phone: '+919876543212'
        },
        price: { type: 'rent', amount: 45000 },
        location: 'Koramangala, Bengaluru',
        societyName: 'Raheja Residency',
        postedOn: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        videoViews: 890, // Added
        shortlistCount: 45, // Added
        isSoldOrRented: false, // Added
        configuration: '2bhk',
        propertyType: 'apartment',
        floorNo: 5,
        totalFloors: 10,
        mainDoorDirection: 'south-west',
        openSides: '1',
        kitchenUtility: false,
        hasBalcony: true,
        parking: { has2Wheeler: true, has4Wheeler: false },
        features: { sunlightEntersHome: false, housesOnSameFloor: 4 },
        amenities: {
            hasLift: true,
            hasChildrenPlayArea: true,
            hasDoctorClinic: true,
            hasPlaySchool: true,
            hasSuperMarket: true,
            hasPharmacy: true,
            hasClubhouse: false,
            sunlightPercentage: 40,
            hasWaterMeter: true,
            hasGasPipeline: true
        },
        area: { superBuiltUp: 1200, carpet: 950 },
        charges: { maintenancePerMonth: 3000, securityDeposit: 150000, brokerage: 45000, moveInCharges: 5000 }
    },
    // Property 4
    {
        id: 'dummy-4',
        title: 'Modern Studio Apartment',
        description: 'Perfect for students or bachelors, this studio apartment is compact and modern. Fully furnished and ready to move in.',
        image: 'https://placehold.co/1080x1920.png',
        video: 'https://videos.pexels.com/video-files/8294971/8294971-hd.mp4',
        lister: {
            id: 'lister-4',
            name: 'Vikram Singh',
            type: 'owner',
            avatar: 'https://placehold.co/100x100.png',
            phone: '+919876543213'
        },
        price: { type: 'rent', amount: 25000 },
        location: 'Indiranagar, Bengaluru',
        societyName: 'Indiranagar Homes',
        postedOn: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
        videoViews: 3200, // Added
        shortlistCount: 150, // Added
        isSoldOrRented: false, // Added
        configuration: 'studio',
        propertyType: 'builder floor',
        floorNo: 3,
        totalFloors: 4,
        mainDoorDirection: 'south-east',
        openSides: '2',
        kitchenUtility: true,
        hasBalcony: false,
        parking: { has2Wheeler: true, has4Wheeler: false },
        features: { sunlightEntersHome: true, housesOnSameFloor: 2 },
        amenities: {
            hasLift: false,
            hasChildrenPlayArea: false,
            hasDoctorClinic: false,
            hasPlaySchool: false,
            hasSuperMarket: true,
            hasPharmacy: true,
            hasClubhouse: false,
            sunlightPercentage: 60,
            hasWaterMeter: true,
            hasGasPipeline: false
        },
        area: { superBuiltUp: 600, carpet: 500 },
        charges: { maintenancePerMonth: 1000, securityDeposit: 75000, brokerage: 0, moveInCharges: 2000 }
    },
    // Property 5
    {
        id: 'dummy-5',
        title: 'Penthouse with a Rooftop Terrace',
        description: 'Live in style in this luxurious penthouse. Enjoy breathtaking city views from your private rooftop terrace. Exclusive and one of a kind.',
        image: 'https://placehold.co/1080x1920.png',
        video: 'https://videos.pexels.com/video-files/4491536/4491536-hd.mp4',
        lister: {
            id: 'lister-5',
            name: 'Prestige Group',
            type: 'developer',
            avatar: 'https://placehold.co/100x100.png',
            phone: '+919876543214'
        },
        price: { type: 'sale', amount: 50000000 }, // 5 Cr
        location: 'Koramangala, Bengaluru',
        societyName: 'Prestige Pinnacle',
        postedOn: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
        videoViews: 7800, // Added
        shortlistCount: 300, // Added
        isSoldOrRented: true, // Added
        configuration: '5bhk+',
        propertyType: 'penthouse',
        floorNo: 25,
        totalFloors: 25,
        mainDoorDirection: 'north-east',
        openSides: '3',
        kitchenUtility: true,
        hasBalcony: true,
        parking: { has2Wheeler: true, has4Wheeler: true },
        features: { sunlightEntersHome: true, housesOnSameFloor: 1 },
        amenities: {
            hasLift: true,
            hasChildrenPlayArea: true,
            hasDoctorClinic: false,
            hasPlaySchool: false,
            hasSuperMarket: false,
            hasPharmacy: false,
            hasClubhouse: true,
            sunlightPercentage: 100,
            hasWaterMeter: true,
            hasGasPipeline: true
        },
        area: { superBuiltUp: 5000, carpet: 4000 },
        charges: { maintenancePerMonth: 20000, securityDeposit: 0, brokerage: 500000, moveInCharges: 50000 }
    }
];
