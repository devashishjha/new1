
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile, Property, OwnerProfile, DealerProfile, DeveloperProfile } from '@/lib/types';
import { MapLocationPicker } from './map-location-picker';
import { Skeleton } from './ui/skeleton';
import { Progress } from './ui/progress';
import { Loader2 } from 'lucide-react';

const propertySchema = z.object({
    // Basic Info
    priceType: z.enum(['rent', 'sale']),
    priceAmount: z.coerce.number().min(1, { message: 'Please enter a valid price.' }),
    location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
    video: z.any().optional(),

    // Property Details
    propertyType: z.enum(['apartment', 'villa', 'row house', 'penthouse', 'independent house', 'builder floor']),
    configuration: z.enum(['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk+']),
    floorNo: z.coerce.number().int(),
    totalFloors: z.coerce.number().int().min(0),
    mainDoorDirection: z.enum(['north-east', 'north-west', 'south-east', 'south-west']),
    openSides: z.enum(['1', '2', '3', '4']),
    housesOnSameFloor: z.coerce.number().int().min(1),

    // Features & Area
    kitchenUtility: z.boolean().default(false),
    hasBalcony: z.boolean().default(false),
    sunlightEntersHome: z.boolean().default(false),
    roomsWithSunlight: z.coerce.number().int().min(0).optional(),
    has2WheelerParking: z.boolean().default(false),
    has4WheelerParking: z.boolean().default(false),
    superBuiltUpArea: z.coerce.number().min(1),
    carpetArea: z.coerce.number().min(1),

    // Amenities
    hasLift: z.boolean().default(false),
    hasChildrenPlayArea: z.boolean().default(false),
    hasDoctorClinic: z.boolean().default(false),
    hasPlaySchool: z.boolean().default(false),
    hasSuperMarket: z.boolean().default(false),
    hasPharmacy: z.boolean().default(false),
    hasClubhouse: z.boolean().default(false),
    hasWaterMeter: z.boolean().default(false),
    hasGasPipeline: z.boolean().default(false),

    // Charges
    maintenancePerMonth: z.coerce.number().nonnegative(),
    securityDeposit: z.coerce.number().nonnegative(),
    moveInCharges: z.coerce.number().nonnegative(),
    brokerage: z.coerce.number().nonnegative().optional(),
});

const getTotalRooms = (config: z.infer<typeof propertySchema>['configuration']): number => {
    switch (config) {
        case 'studio': return 1;
        case '1bhk': return 2; // 1 Bedroom + 1 Hall
        case '2bhk': return 3; // 2 Bedrooms + 1 Hall
        case '3bhk': return 4;
        case '4bhk': return 5;
        case '5bhk+': return 6; // Assumption for 5BHK+
        default: return 1;
    }
};

export function AddPropertyForm({ mode = 'add', property }: { mode?: 'add' | 'edit', property?: Property }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = React.useState(true);

    const form = useForm<z.infer<typeof propertySchema>>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            priceType: 'sale',
            priceAmount: 0,
            location: '',
            video: null,
            propertyType: 'apartment',
            configuration: '2bhk',
            floorNo: 0,
            totalFloors: 0,
            mainDoorDirection: 'north-east',
            openSides: '1',
            housesOnSameFloor: 1,
            kitchenUtility: false,
            hasBalcony: false,
            sunlightEntersHome: false,
            roomsWithSunlight: 0,
            has2WheelerParking: false,
            has4WheelerParking: false,
            superBuiltUpArea: 0,
            carpetArea: 0,
            hasLift: false,
            hasChildrenPlayArea: false,
            hasDoctorClinic: false,
            hasPlaySchool: false,
            hasSuperMarket: false,
            hasPharmacy: false,
            hasClubhouse: false,
            hasWaterMeter: false,
            hasGasPipeline: false,
            maintenancePerMonth: 0,
            securityDeposit: 0,
            moveInCharges: 0,
            brokerage: 0,
        },
    });

    const configuration = form.watch('configuration');
    const totalRooms = React.useMemo(() => getTotalRooms(configuration), [configuration]);
    const sunlightRoomOptions = Array.from({ length: 11 }, (_, i) => i);
    
    React.useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) {
                setIsProfileLoading(false);
                return;
            }
            if (!db) {
                setIsProfileLoading(false);
                return;
            }
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const profileData = userDocSnap.data() as UserProfile;
                setUserProfile(profileData);
            }
            setIsProfileLoading(false);
        };
        fetchUserProfile();
    }, [user, form]);

    React.useEffect(() => {
        if (mode === 'edit' && property) {
            const totalRoomsForProperty = getTotalRooms(property.configuration);
            const sunlightRooms = Math.round((property.amenities.sunlightPercentage / 100) * totalRoomsForProperty);

            form.reset({
                priceType: property.price.type,
                priceAmount: property.price.amount,
                location: property.location,
                propertyType: property.propertyType,
                configuration: property.configuration,
                floorNo: property.floorNo,
                totalFloors: property.totalFloors,
                mainDoorDirection: property.mainDoorDirection,
                openSides: property.openSides,
                housesOnSameFloor: property.features.housesOnSameFloor,
                kitchenUtility: property.kitchenUtility,
                hasBalcony: property.hasBalcony,
                sunlightEntersHome: property.features.sunlightEntersHome,
                roomsWithSunlight: sunlightRooms,
                has2WheelerParking: property.parking.has2Wheeler,
                has4WheelerParking: property.parking.has4Wheeler,
                superBuiltUpArea: property.area.superBuiltUp,
                carpetArea: property.area.carpet,
                hasLift: property.amenities.hasLift,
                hasChildrenPlayArea: property.amenities.hasChildrenPlayArea,
                hasDoctorClinic: property.amenities.hasDoctorClinic,
                hasPlaySchool: property.amenities.hasPlaySchool,
                hasSuperMarket: property.amenities.hasSuperMarket,
                hasPharmacy: property.amenities.hasPharmacy,
                hasClubhouse: property.amenities.hasClubhouse,
                hasWaterMeter: property.amenities.hasWaterMeter,
                hasGasPipeline: property.amenities.hasGasPipeline,
                maintenancePerMonth: property.charges.maintenancePerMonth,
                securityDeposit: property.charges.securityDeposit,
                moveInCharges: property.charges.moveInCharges,
                brokerage: property.charges.brokerage,
            });
        }
    }, [mode, property, form]);

    async function onSubmit(values: z.infer<typeof propertySchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Authenticated", description: "You must be logged in to add a property." });
            return;
        }

        if (!db || !storage) {
            toast({ variant: 'destructive', title: "Service Unavailable", description: "Cannot submit property. Please ensure Firebase is configured." });
            return;
        }

        setIsSubmitting(true);
        const videoFile = values.video?.[0];

        const finalizeSubmission = async (videoUrl?: string) => {
            try {
                const autoDescription = `A ${values.configuration} ${values.propertyType}, available for ${values.priceType}. Located at ${values.location}.`;

                const totalRoomsCount = getTotalRooms(values.configuration);
                const sunlightPercentage = totalRoomsCount > 0 
                    ? Math.round(((values.roomsWithSunlight || 0) / totalRoomsCount) * 100) 
                    : 0;

                const propertyDataForFirestore = {
                    title: `${values.configuration.toUpperCase()} in ${values.location}`,
                    description: autoDescription,
                    video: videoUrl,
                    price: { type: values.priceType, amount: values.priceAmount },
                    location: values.location,
                    configuration: values.configuration,
                    propertyType: values.propertyType,
                    floorNo: values.floorNo,
                    totalFloors: values.totalFloors,
                    kitchenUtility: values.kitchenUtility,
                    mainDoorDirection: values.mainDoorDirection,
                    openSides: values.openSides,
                    hasBalcony: values.hasBalcony,
                    parking: { has2Wheeler: values.has2WheelerParking, has4Wheeler: values.has4WheelerParking },
                    features: { sunlightEntersHome: values.sunlightEntersHome, housesOnSameFloor: values.housesOnSameFloor },
                    amenities: {
                        hasLift: values.hasLift,
                        hasChildrenPlayArea: values.hasChildrenPlayArea,
                        hasDoctorClinic: values.hasDoctorClinic,
                        hasPlaySchool: values.hasPlaySchool,
                        hasSuperMarket: values.hasSuperMarket,
                        hasPharmacy: values.hasPharmacy,
                        hasClubhouse: values.hasClubhouse,
                        sunlightPercentage: sunlightPercentage,
                        hasWaterMeter: values.hasWaterMeter,
                        hasGasPipeline: values.hasGasPipeline,
                    },
                    area: { superBuiltUp: values.superBuiltUpArea, carpet: values.carpetArea },
                    charges: {
                        maintenancePerMonth: values.maintenancePerMonth,
                        securityDeposit: values.securityDeposit,
                        brokerage: values.brokerage || 0,
                        moveInCharges: values.moveInCharges,
                    },
                };

                if (mode === 'edit' && property) {
                    if (!db) {
                        throw new Error("Firestore is not initialized.");
                    }
                    const propertyDocRef = doc(db, 'properties', property.id);
                    await updateDoc(propertyDocRef, {
                        ...propertyDataForFirestore,
                        ...(videoUrl && videoUrl !== property.video && { status: 'pending-review' })
                    });
                    toast({
                        title: "Property Updated!",
                        description: videoUrl && videoUrl !== property.video ? "Your property video will be reviewed." : "Your property has been successfully updated.",
                    });
                    router.push('/profile');
                } else {
                    if (!db) {
                        throw new Error("Firestore is not initialized.");
                    }
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    let userProfileData: UserProfile;

                    if (userDoc.exists()) {
                        userProfileData = userDoc.data() as UserProfile;
                    } else {
                        toast({ title: "Finalizing Account Setup", description: "We're creating your profile now." });
                        const baseProfile = { id: user.uid, name: user.displayName || user.email?.split('@')[0] || 'New User', email: user.email!, phone: user.phoneNumber || '', avatar: user.photoURL || `https://placehold.co/100x100.png` };
                        userProfileData = { ...baseProfile, type: 'owner' } as OwnerProfile; // Default to 'owner'
                        await setDoc(userDocRef, userProfileData);
                    }

                    const finalData = {
                        ...propertyDataForFirestore,
                        lister: { id: user.uid, name: userProfileData.name, type: userProfileData.type, avatar: userProfileData.avatar, phone: userProfileData.phone },
                        postedOn: serverTimestamp(),
                        image: 'https://placehold.co/1080x1920.png',
                        status: videoUrl ? 'pending-review' : 'available' as const,
                    };
                    await addDoc(collection(db, "properties"), finalData);
                    toast({
                        title: videoUrl ? "Property Submitted for Review!" : "Property Listed!",
                        description: videoUrl ? "Your property will be reviewed and published shortly." : "Your property has been successfully listed.",
                    });
                    form.reset();
                    router.push('/reels');
                }
            } catch (error) {
                console.error("Error finalizing submission:", error);
                toast({ variant: "destructive", title: "Submission Failed", description: "There was an error saving your property data." });
            } finally {
                setIsSubmitting(false);
                setUploadProgress(null);
            }
        };

        if (videoFile) {
            setUploadProgress(0);
            const storageRef = ref(storage, `videos/${user.uid}/${Date.now()}_${videoFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, videoFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload error:", error);
                    toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload your video. Please try again." });
                    setIsSubmitting(false);
                    setUploadProgress(null);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await finalizeSubmission(downloadURL);
                }
            );
        } else {
            const existingVideoUrl = (mode === 'edit' && property?.video) ? property.video : undefined;
            await finalizeSubmission(existingVideoUrl);
        }
    }
    
    if (isSubmitting) {
        return (
            <Card className="text-center p-8">
                <CardHeader>
                    <CardTitle className="text-2xl">{uploadProgress !== null ? 'Uploading Video...' : 'Finalizing Submission...'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {uploadProgress !== null ? (
                        <div className="space-y-4">
                            <Progress value={uploadProgress} />
                            <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}% complete</p>
                        </div>
                    ) : (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    )}
                </CardContent>
            </Card>
        );
    }

    const renderCheckboxField = (name: keyof z.infer<typeof propertySchema>, label: string) => (<FormField control={form.control} name={name} render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><FormLabel>{label}</FormLabel><FormControl><Checkbox checked={field.value as boolean} onCheckedChange={field.onChange}/></FormControl></FormItem>)} />);
    const floorOptions = Array.from({ length: 51 }, (_, i) => i);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="priceType" render={({ field }) => ( <FormItem><FormLabel>Listing for</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="rent">Rent</SelectItem><SelectItem value="sale">Sale</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="priceAmount" render={({ field }) => ( <FormItem><FormLabel>Price Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="5000000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="location" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Pinpoint Location on Map</FormLabel><FormControl><MapLocationPicker value={field.value} onChange={field.onChange} /></FormControl><FormDescription>Search for a location and then drag the pin to the exact property spot.</FormDescription><FormMessage /></FormItem> )} />
                    </CardContent>
                </Card>

                <Accordion type="multiple" className="w-full space-y-4" defaultValue={['item-1', 'item-5']}>
                    <AccordionItem value="item-1" asChild><Card><AccordionTrigger className="p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight">Property Details</h3></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="apartment">Apartment</SelectItem><SelectItem value="villa">Villa</SelectItem><SelectItem value="row house">Row House</SelectItem><SelectItem value="penthouse">Penthouse</SelectItem><SelectItem value="independent house">Independent House</SelectItem><SelectItem value="builder floor">Builder Floor</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="configuration" render={({ field }) => ( <FormItem><FormLabel>Configuration</FormLabel><Select onValueChange={(value) => { field.onChange(value); form.setValue('roomsWithSunlight', 0); }} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="studio">Studio</SelectItem><SelectItem value="1bhk">1BHK</SelectItem><SelectItem value="2bhk">2BHK</SelectItem><SelectItem value="3bhk">3BHK</SelectItem><SelectItem value="4bhk">4BHK</SelectItem><SelectItem value="5bhk+">5BHK+</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="floorNo" render={({ field }) => ( <FormItem><FormLabel>Floor Number</FormLabel><Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{floorOptions.map(n => <SelectItem key={n} value={String(n)}>{n === 0 ? 'Ground' : n}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="totalFloors" render={({ field }) => ( <FormItem><FormLabel>Total Floors in Building</FormLabel><Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{floorOptions.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="mainDoorDirection" render={({ field }) => ( <FormItem><FormLabel>Main Door Direction</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent> {['north-east', 'north-west', 'south-east', 'south-west'].map(d => <SelectItem key={d} value={d} className='capitalize'>{d.replace('-', ' ')}</SelectItem>)} </SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="openSides" render={({ field }) => ( <FormItem><FormLabel>Open Sides</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent> {['1', '2', '3', '4'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)} </SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="housesOnSameFloor" render={({ field }) => ( <FormItem><FormLabel>Houses on Same Floor</FormLabel><FormControl><Input type="number" placeholder="4" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </AccordionContent></Card></AccordionItem>

                    <AccordionItem value="item-2" asChild><Card><AccordionTrigger className="p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight">Features, Area & Parking</h3></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-x-6 gap-y-4">
                        {renderCheckboxField('kitchenUtility', 'Kitchen Utility')}
                        {renderCheckboxField('hasBalcony', 'Has Balcony')}
                        {renderCheckboxField('sunlightEntersHome', 'Sunlight Enters Home')}
                        {renderCheckboxField('has2WheelerParking', '2-Wheeler Parking')}
                        {renderCheckboxField('has4WheelerParking', '4-Wheeler Parking')}
                        <FormField control={form.control} name="superBuiltUpArea" render={({ field }) => ( <FormItem><FormLabel>Super Built-up Area (sqft)</FormLabel><FormControl><Input type="number" placeholder="1200" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="carpetArea" render={({ field }) => ( <FormItem><FormLabel>Carpet Area (sqft)</FormLabel><FormControl><Input type="number" placeholder="950" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="roomsWithSunlight" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rooms with Sunlight</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value || 0)}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {sunlightRoomOptions.map(n => <SelectItem key={`sunlight-${n}`} value={String(n)}>{n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormDescription>Based on a configuration of {totalRooms} rooms.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </AccordionContent></Card></AccordionItem>

                     <AccordionItem value="item-3" asChild><Card><AccordionTrigger className="p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight">Amenities</h3></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-x-6 gap-y-4">
                        {renderCheckboxField('hasLift', 'Lift Available')}
                        {renderCheckboxField('hasChildrenPlayArea', "Children's Play Area")}
                        {renderCheckboxField('hasDoctorClinic', "Doctor's Clinic")}
                        {renderCheckboxField('hasPlaySchool', 'Play School')}
                        {renderCheckboxField('hasSuperMarket', 'Super Market')}
                        {renderCheckboxField('hasPharmacy', 'Pharmacy')}
                        {renderCheckboxField('hasClubhouse', 'Clubhouse')}
                        {renderCheckboxField('hasWaterMeter', 'Water Meter')}
                        {renderCheckboxField('hasGasPipeline', 'Gas Pipeline')}
                    </AccordionContent></Card></AccordionItem>

                    <AccordionItem value="item-4" asChild><Card><AccordionTrigger className="p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight">Charges & Fees</h3></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="maintenancePerMonth" render={({ field }) => ( <FormItem><FormLabel>Maintenance (/month)</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="securityDeposit" render={({ field }) => ( <FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                         <FormField control={form.control} name="brokerage" render={({ field }) => ( <FormItem><FormLabel>Brokerage (if any)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="moveInCharges" render={({ field }) => ( <FormItem><FormLabel>Move-in Charges</FormLabel><FormControl><Input type="number" placeholder="2000" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </AccordionContent></Card></AccordionItem>

                    <AccordionItem value="item-5" asChild><Card><AccordionTrigger className="p-6"><h3 className="text-2xl font-semibold leading-none tracking-tight">Property Media</h3></AccordionTrigger><AccordionContent className="p-6 pt-0 grid gap-6">
                        <FormField
                            control={form.control}
                            name="video"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Property Video</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {mode === 'edit' && property?.video ? 'A video is already uploaded. Uploading a new one will replace it and send it for review.' : 'Upload a short video of your property for the reel. Videos are reviewed before publishing.'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </AccordionContent></Card></AccordionItem>
                </Accordion>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Submitting...') : (mode === 'edit' ? 'Update Property' : 'Submit Property')}
                </Button>
            </form>
        </Form>
    );
}
