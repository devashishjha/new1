
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Property, UserProfile, SeekerProfile, SearchHistoryItem } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { cn, formatIndianCurrency, dateToJSON } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { LocationAutocomplete } from './location-autocomplete';
import { History, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SortDirection = 'asc' | 'desc';

const propertyTypes = ['apartment', 'villa', 'row house', 'penthouse', 'independent house', 'builder floor'] as const;
const configurations = ['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk+'] as const;
const mainDoorDirections = ['north-east', 'north-west', 'south-east', 'south-west'] as const;
const openSides = ['1', '2', '3', '4'] as const;

const searchSchema = z.object({
    lookingTo: z.enum(['rent', 'sale']).default('sale'),
    priceRange: z.array(z.number()).default([0, 50000000]),
    location: z.string().optional(),
    propertyType: z.string().optional(),
    configuration: z.string().optional(),
    floorNo: z.coerce.number().optional(),
    totalFloors: z.coerce.number().optional(),
    housesOnSameFloor: z.coerce.number().optional(),
    mainDoorDirection: z.string().optional(),
    openSides: z.string().optional(),
    sunlightPercentageRange: z.array(z.number()).default([0, 100]),
    kitchenUtility: z.boolean().optional(),
    hasBalcony: z.boolean().optional(),
    sunlightEntersHome: z.boolean().optional(),
    has2WheelerParking: z.boolean().optional(),
    has4WheelerParking: z.boolean().optional(),
    hasLift: z.boolean().optional(),
    hasChildrenPlayArea: z.boolean().optional(),
    hasDoctorClinic: z.boolean().optional(),
    hasPlaySchool: z.boolean().optional(),
    hasSuperMarket: z.boolean().optional(),
    hasPharmacy: z.boolean().optional(),
    hasClubhouse: z.boolean().optional(),
    hasWaterMeter: z.boolean().optional(),
    hasGasPipeline: z.boolean().optional(),
});

const defaultValues = searchSchema.parse({});

const CardSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
)

export function SearchClient() {
    const { user, loading: authLoading } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [userProfile, setUserProfile] = useState<SeekerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);
    const [filters, setFilters] = useState<z.infer<typeof searchSchema>>(defaultValues);
    const [priceSort, setPriceSort] = useState<'asc' | 'desc' | 'none'>('none');
    const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
    const { toast } = useToast();

    const form = useForm<z.infer<typeof searchSchema>>({
        resolver: zodResolver(searchSchema),
        defaultValues: filters,
    });
    
    useEffect(() => {
        if (authLoading) return;
        
        setIsLoading(true);
        if (!db) {
            setProperties([]);
            setIsLoading(false);
            return;
        }

        const propertiesCol = collection(db, 'properties');
        const q = query(propertiesCol);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
            setProperties(fetchedProperties.map(p => dateToJSON(p)) as Property[]);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching properties:", error);
            setProperties([]);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [authLoading]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user && db) {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().type === 'seeker') {
                    setUserProfile(docSnap.data() as SeekerProfile);
                }
            } else {
                setUserProfile(null);
            }
        };
        fetchUserProfile();
    }, [user]);


    const lookingTo = form.watch('lookingTo');
    const priceRange = form.watch('priceRange');
    const sunlightPercentageRange = form.watch('sunlightPercentageRange');

    const MAX_PRICE_BUY = 50000000;
    const MAX_PRICE_RENT = 300000;
    const currentMaxPrice = lookingTo === 'rent' ? MAX_PRICE_RENT : MAX_PRICE_BUY;
    const priceStep = lookingTo === 'rent' ? 5000 : 100000;

    const filteredAndSortedProperties = useMemo(() => {
        let filtered = [...properties]
            .filter(p => {
                if (p.status !== 'available') return false;

                const priceTypeMatch = filters.lookingTo === 'rent' ? p.price.type === 'rent' : p.price.type === 'sale';
                const priceRangeMatch = p.price.amount >= filters.priceRange[0] && p.price.amount <= filters.priceRange[1];
                const locationMatch = !filters.location || p.location.toLowerCase().includes(filters.location.toLowerCase());
                const propertyTypeMatch = !filters.propertyType || p.propertyType === filters.propertyType;
                const configMatch = !filters.configuration || p.configuration === filters.configuration;
                const floorMatch = filters.floorNo === undefined || p.floorNo === filters.floorNo;
                const totalFloorMatch = filters.totalFloors === undefined || p.totalFloors === filters.totalFloors;
                const housesOnFloorMatch = !filters.housesOnSameFloor || p.features.housesOnSameFloor === filters.housesOnSameFloor;
                const directionMatch = !filters.mainDoorDirection || p.mainDoorDirection === filters.mainDoorDirection;
                const openSidesMatch = !filters.openSides || p.openSides === filters.openSides;

                const sunlightMatchCheck = p.amenities.sunlightPercentage >= filters.sunlightPercentageRange[0] && p.amenities.sunlightPercentage <= filters.sunlightPercentageRange[1];

                const kitchenMatch = filters.kitchenUtility === undefined || filters.kitchenUtility === null || p.kitchenUtility === filters.kitchenUtility;
                const balconyMatch = filters.hasBalcony === undefined || filters.hasBalcony === null || p.hasBalcony === filters.hasBalcony;
                const sunlightMatch = filters.sunlightEntersHome === undefined || filters.sunlightEntersHome === null || p.features.sunlightEntersHome === filters.sunlightEntersHome;
                const parking2WMatch = filters.has2WheelerParking === undefined || filters.has2WheelerParking === null || p.parking.has2Wheeler === filters.has2WheelerParking;
                const parking4WMatch = filters.has4WheelerParking === undefined || filters.has4WheelerParking === null || p.parking.has4Wheeler === filters.has4WheelerParking;
                const liftMatch = filters.hasLift === undefined || filters.hasLift === null || p.amenities.hasLift === filters.hasLift;
                const playAreaMatch = filters.hasChildrenPlayArea === undefined || filters.hasChildrenPlayArea === null || p.amenities.hasChildrenPlayArea === filters.hasChildrenPlayArea;
                const clinicMatch = filters.hasDoctorClinic === undefined || filters.hasDoctorClinic === null || p.amenities.hasDoctorClinic === filters.hasDoctorClinic;
                const playSchoolMatch = filters.hasPlaySchool === undefined || filters.hasPlaySchool === null || p.amenities.hasPlaySchool === filters.hasPlaySchool;
                const marketMatch = filters.hasSuperMarket === undefined || filters.hasSuperMarket === null || p.amenities.hasSuperMarket === filters.hasSuperMarket;
                const pharmacyMatch = filters.hasPharmacy === undefined || filters.hasPharmacy === null || p.amenities.hasPharmacy === filters.hasPharmacy;
                const clubhouseMatch = filters.hasClubhouse === undefined || filters.hasClubhouse === null || p.amenities.hasClubhouse === filters.hasClubhouse;
                const waterMeterMatch = filters.hasWaterMeter === undefined || filters.hasWaterMeter === null || p.amenities.hasWaterMeter === filters.hasWaterMeter;
                const gasMatch = filters.hasGasPipeline === undefined || filters.hasGasPipeline === null || p.amenities.hasGasPipeline === filters.hasGasPipeline;

                return priceTypeMatch && priceRangeMatch && locationMatch && propertyTypeMatch && configMatch && floorMatch && totalFloorMatch && housesOnFloorMatch && directionMatch && openSidesMatch && sunlightMatchCheck && kitchenMatch && balconyMatch && sunlightMatch && parking2WMatch && parking4WMatch && liftMatch && playAreaMatch && clinicMatch && playSchoolMatch && marketMatch && pharmacyMatch && clubhouseMatch && waterMeterMatch && gasMatch;
            });

        const getDate = (p: Property) => p.postedOn instanceof Date ? p.postedOn.getTime() : new Date(p.postedOn as string).getTime();

        filtered.sort((a, b) => {
            if (priceSort !== 'none') {
                const priceA = a.price.amount;
                const priceB = b.price.amount;
                const priceDiff = priceSort === 'asc' ? priceA - priceB : priceB - a.price.amount;
                if (priceDiff !== 0) return priceDiff;
            }
            
            const dateA = getDate(a);
            const dateB = getDate(b);
            return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return filtered;
    }, [properties, filters, priceSort, dateSort]);

    async function onSubmit(values: z.infer<typeof searchSchema>) {
        const parsedValues = searchSchema.parse(values);
        setFilters(parsedValues);
        
        if (user && db && userProfile?.type === 'seeker') {
            const searchParts = [
                `Looking to ${values.lookingTo}`,
                values.location ? `in ${values.location}` : '',
                values.configuration ? `${values.configuration.toUpperCase()}` : '',
                values.propertyType ? `${values.propertyType}` : '',
                `up to ${formatIndianCurrency(values.priceRange[1])}`
            ].filter(Boolean).join(', ');

            if (searchParts.length > `Looking to ${values.lookingTo}, up to ${formatIndianCurrency(values.priceRange[1])}`.length) {
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    const newHistoryItem: SearchHistoryItem = {
                        display: searchParts,
                        filters: parsedValues
                    };
                    const newHistory = [newHistoryItem, ...(userProfile.searchHistory || [])].slice(0, 5);
                    await updateDoc(userDocRef, { searchHistory: newHistory });
                    setUserProfile(prev => prev ? ({ ...prev, searchHistory: newHistory }) : null);
                } catch (error) {
                    console.error("Error updating search history:", error);
                }
            }
        }
    }

    function handleReset() {
        form.reset(defaultValues);
        setFilters(defaultValues);
        setPriceSort('none');
        setDateSort('desc');
    }

    const handleClearHistory = async () => {
        if (user && db) {
            setIsUpdatingHistory(true);
            const userDocRef = doc(db, 'users', user.uid);
            try {
                await updateDoc(userDocRef, { searchHistory: [] });
                setUserProfile(prev => prev ? ({ ...prev, searchHistory: [] }) : null);
                toast({ title: "Search history cleared." });
            } catch (error) {
                console.error("Error clearing search history:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not clear history." });
            } finally {
                setIsUpdatingHistory(false);
            }
        }
    }
    
    const handleHistoryClick = (item: SearchHistoryItem) => {
        // Zod parse is important here to ensure default values are applied
        // for any fields that might be missing from the saved filter object.
        const filtersToApply = searchSchema.parse(item.filters);
        form.reset(filtersToApply);
        onSubmit(filtersToApply);
    };

    const amenities: { [K in keyof z.infer<typeof searchSchema>]?: string } = {
        kitchenUtility: 'Kitchen Utility', hasBalcony: 'Balcony', sunlightEntersHome: 'Sunlight',
        has2WheelerParking: '2-Wheeler Parking', has4WheelerParking: '4-Wheeler Parking', hasLift: 'Lift',
        hasChildrenPlayArea: "Play Area", hasDoctorClinic: "Doctor's Clinic", hasPlaySchool: 'Play School',
        hasSuperMarket: 'Super Market', hasPharmacy: 'Pharmacy', hasClubhouse: 'Clubhouse',
        hasWaterMeter: 'Water Meter', hasGasPipeline: 'Gas Pipeline',
    };

    const handlePriceSort = (direction: SortDirection) => setPriceSort(priceSort === direction ? 'none' : direction);
    const handleDateSort = (direction: SortDirection) => setDateSort(direction);

    const floorOptions = Array.from({ length: 51 }, (_, i) => i);

    if (isLoading || authLoading) {
        return (
             <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Search Properties</h1>
                <p className="text-muted-foreground mb-8">Find your next home by searching and sorting.</p>
                <Skeleton className="h-64 w-full mb-8" />
                <div className="flex flex-col sm:flex-row gap-6 my-8">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-9 w-52" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Search Properties</h1>
            <p className="text-muted-foreground mb-8">Find your next home by searching and sorting.</p>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <Accordion type="multiple" className="w-full -m-6" defaultValue={['item-1']}>
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="p-6"><CardTitle>Advanced Search</CardTitle></AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="lookingTo" render={({ field }) => ( <FormItem><FormLabel>Looking to</FormLabel><Select onValueChange={(value) => { field.onChange(value); form.setValue('priceRange', [0, value === 'rent' ? MAX_PRICE_RENT : MAX_PRICE_BUY]); }} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="rent">Rent</SelectItem><SelectItem value="sale">Sale</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><LocationAutocomplete placeholder="e.g. Koramangala" value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )}/>
                                        </div>

                                        <FormField control={form.control} name="priceRange" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Budget</FormLabel>
                                                <FormControl><Slider min={0} max={currentMaxPrice} step={priceStep} value={field.value} onValueChange={field.onChange} className="pt-2" /></FormControl>
                                                <div className="flex justify-between text-sm text-muted-foreground pt-2">
                                                    <span>{formatIndianCurrency(priceRange[0])}</span>
                                                    <span>{formatIndianCurrency(priceRange[1])}</span>
                                                </div>
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="sunlightPercentageRange" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sunlight Percentage in Rooms</FormLabel>
                                                <FormControl><Slider min={0} max={100} step={5} value={field.value} onValueChange={field.onChange} className="pt-2" /></FormControl>
                                                <div className="flex justify-between text-sm text-muted-foreground pt-2">
                                                    <span>{sunlightPercentageRange[0]}%</span>
                                                    <span>{sunlightPercentageRange[1]}%</span>
                                                </div>
                                            </FormItem>
                                        )} />
                                        
                                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl><SelectContent>{propertyTypes.map(item => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="configuration" render={({ field }) => ( <FormItem><FormLabel>Configuration</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl><SelectContent>{configurations.map(item => <SelectItem key={item} value={item} className="capitalize">{item.toUpperCase()}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="mainDoorDirection" render={({ field }) => ( <FormItem><FormLabel>Main Door Direction</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl><SelectContent>{mainDoorDirections.map(item => <SelectItem key={item} value={item} className="capitalize">{item.replace('-', ' ')}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="openSides" render={({ field }) => ( <FormItem><FormLabel>Open Sides</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl><SelectContent>{openSides.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name="floorNo" render={({ field }) => ( <FormItem><FormLabel>Floor Number</FormLabel><Select onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)} value={field.value !== undefined ? String(field.value) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl><SelectContent>{floorOptions.map(n => <SelectItem key={`floor-${n}`} value={String(n)}>{n === 0 ? 'Ground' : n}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                                            <FormField control={form.control} name="totalFloors" render={({ field }) => ( <FormItem><FormLabel>Total Floors in Building</FormLabel><Select onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)} value={field.value !== undefined ? String(field.value) : ''}><FormControl><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger></FormControl><SelectContent>{floorOptions.map(n => <SelectItem key={`total-floor-${n}`} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                                        </div>
                                        
                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Features & Amenities</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {Object.entries(amenities).map(([key, label]) => {
                                                    if (!label) return null;
                                                    const name = key as keyof z.infer<typeof searchSchema>;
                                                    return (
                                                        <FormField key={name} control={form.control} name={name}
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                    <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                                                    <FormLabel className="font-normal">{label}</FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                    <div className="flex gap-4">
                        <Button type="submit" size="lg" className="w-full">Search Properties</Button>
                        <Button type="button" size="lg" variant="outline" className="w-full" onClick={handleReset}>Reset Filters</Button>
                    </div>
                </form>
            </Form>

            {userProfile?.searchHistory && userProfile.searchHistory.length > 0 && (
                <Card className="mt-8">
                    <CardHeader className='flex-row items-center justify-between'>
                        <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Recent Searches</CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleClearHistory} disabled={isUpdatingHistory}>
                            {isUpdatingHistory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Clear History
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {userProfile.searchHistory.map((item, index) => (
                                <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-sm py-1 px-3 cursor-pointer hover:bg-primary/20"
                                    onClick={() => handleHistoryClick(item)}
                                >
                                    {item.display}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-6 my-8">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by Price:</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className={cn(priceSort === 'desc' && 'border-primary text-primary font-bold')} onClick={() => handlePriceSort('desc')}>High to Low</Button>
                        <Button size="sm" variant="outline" className={cn(priceSort === 'asc' && 'border-primary text-primary font-bold')} onClick={() => handlePriceSort('asc')}>Low to High</Button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by Date:</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className={cn(dateSort === 'desc' && 'border-primary text-primary font-bold')} onClick={() => handleDateSort('desc')}>Newest</Button>
                        <Button size="sm" variant="outline" className={cn(dateSort === 'asc' && 'border-primary text-primary font-bold')} onClick={() => handleDateSort('asc')}>Oldest</Button>
                    </div>
                </div>
            </div>

            {filteredAndSortedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedProperties.map(property => (
                        <ShortlistedPropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border border-dashed rounded-lg mt-10">
                    <h2 className="text-xl font-semibold">No Properties Found</h2>
                    <p className="text-muted-foreground mt-2">Try adjusting your search filters.</p>
                </div>
            )}
        </div>
    );
}
