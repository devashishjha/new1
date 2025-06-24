
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Property } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Slider } from './ui/slider';
import { cn, formatIndianCurrency, dateToJSON } from '@/lib/utils';
import { Input } from './ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

type SortDirection = 'asc' | 'desc';

const propertyTypes = ['apartment', 'villa', 'row house', 'penthouse', 'independent house', 'builder floor'] as const;
const configurations = ['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk+'] as const;
const mainDoorDirections = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'] as const;
const openSides = ['1', '2', '3', '4'] as const;

const searchSchema = z.object({
    lookingTo: z.enum(['rent', 'sale']).default('sale'),
    priceRange: z.array(z.number()).default([0, 50000000]),
    location: z.string().optional(),
    societyName: z.string().optional(),
    propertyType: z.array(z.string()).default([]),
    configuration: z.array(z.string()).default([]),
    floorRange: z.array(z.number()).default([0, 50]),
    totalFloorRange: z.array(z.number()).default([0, 50]),
    housesOnSameFloor: z.number().optional(),
    mainDoorDirection: z.array(z.string()).default([]),
    openSides: z.array(z.string()).default([]),
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
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<z.infer<typeof searchSchema>>(defaultValues);
    const [priceSort, setPriceSort] = useState<'asc' | 'desc' | 'none'>('none');
    const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');

    const form = useForm<z.infer<typeof searchSchema>>({
        resolver: zodResolver(searchSchema),
        defaultValues: filters,
    });
    
    useEffect(() => {
        if (authLoading) return; // Wait for auth to resolve
        
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                const propertiesCol = collection(db, 'properties');
                const q = query(propertiesCol, orderBy('postedOn', 'desc'));
                const snapshot = await getDocs(q);
                const fetchedProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                setProperties(fetchedProperties.map(p => dateToJSON(p)) as Property[]);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, [authLoading]);

    const lookingTo = form.watch('lookingTo');
    const priceRange = form.watch('priceRange');
    const floorRange = form.watch('floorRange');
    const totalFloorRange = form.watch('totalFloorRange');

    const MAX_PRICE_BUY = 50000000; // 5 Cr
    const MAX_PRICE_RENT = 300000; // 3 Lakh
    const currentMaxPrice = lookingTo === 'rent' ? MAX_PRICE_RENT : MAX_PRICE_BUY;
    const priceStep = lookingTo === 'rent' ? 5000 : 100000;

    const filteredAndSortedProperties = useMemo(() => {
        let filtered = [...properties]
            .filter(p => {
                const priceTypeMatch = filters.lookingTo === 'rent' ? p.price.type === 'rent' : p.price.type === 'sale';
                const priceRangeMatch = p.price.amount >= filters.priceRange[0] && p.price.amount <= filters.priceRange[1];
                const locationMatch = !filters.location || p.location.toLowerCase().includes(filters.location.toLowerCase());
                const societyMatch = !filters.societyName || p.societyName.toLowerCase().includes(filters.societyName.toLowerCase());
                const propertyTypeMatch = filters.propertyType.length === 0 || filters.propertyType.includes(p.propertyType);
                const configMatch = filters.configuration.length === 0 || filters.configuration.includes(p.configuration);
                const floorMatch = p.floorNo >= filters.floorRange[0] && p.floorNo <= filters.floorRange[1];
                const totalFloorMatch = p.totalFloors >= filters.totalFloorRange[0] && p.totalFloors <= filters.totalFloorRange[1];
                const housesOnFloorMatch = !filters.housesOnSameFloor || p.features.housesOnSameFloor === filters.housesOnSameFloor;
                const directionMatch = filters.mainDoorDirection.length === 0 || filters.mainDoorDirection.includes(p.mainDoorDirection);
                const openSidesMatch = filters.openSides.length === 0 || filters.openSides.includes(p.openSides);

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

                return priceTypeMatch && priceRangeMatch && locationMatch && societyMatch && propertyTypeMatch && configMatch && floorMatch && totalFloorMatch && housesOnFloorMatch && directionMatch && openSidesMatch && kitchenMatch && balconyMatch && sunlightMatch && parking2WMatch && parking4WMatch && liftMatch && playAreaMatch && clinicMatch && playSchoolMatch && marketMatch && pharmacyMatch && clubhouseMatch && waterMeterMatch && gasMatch;
            });

        const getDate = (p: Property) => p.postedOn instanceof Date ? p.postedOn.getTime() : new Date(p.postedOn as string).getTime();

        filtered.sort((a, b) => {
            // Primary Sort: Price
            if (priceSort !== 'none') {
                const priceA = a.price.amount;
                const priceB = b.price.amount;
                const priceDiff = priceSort === 'asc' ? priceA - priceB : priceB - priceA;
                if (priceDiff !== 0) {
                    return priceDiff;
                }
            }
            
            // Secondary Sort: Date (as tie-breaker or primary sort)
            const dateA = getDate(a);
            const dateB = getDate(b);
            return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return filtered;
    }, [properties, filters, priceSort, dateSort]);

    function onSubmit(values: z.infer<typeof searchSchema>) {
        setFilters(searchSchema.parse(values));
    }

    function handleReset() {
        form.reset(defaultValues);
        setFilters(defaultValues);
        setPriceSort('none');
        setDateSort('desc');
    }
    
    const renderCheckboxGroup = (name: "propertyType" | "configuration" | "mainDoorDirection" | "openSides", items: readonly string[]) => (
         <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {items.map((item) => (
                            <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...field.value, item])
                                                : field.onChange(
                                                    field.value?.filter(
                                                        (value) => value !== item
                                                    )
                                                );
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">{item.replace('-', ' ')}</FormLabel>
                            </FormItem>
                        ))}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
    
    const amenities: { [K in keyof z.infer<typeof searchSchema>]?: string } = {
        kitchenUtility: 'Kitchen Utility',
        hasBalcony: 'Balcony',
        sunlightEntersHome: 'Sunlight',
        has2WheelerParking: '2-Wheeler Parking',
        has4WheelerParking: '4-Wheeler Parking',
        hasLift: 'Lift',
        hasChildrenPlayArea: "Play Area",
        hasDoctorClinic: "Doctor's Clinic",
        hasPlaySchool: 'Play School',
        hasSuperMarket: 'Super Market',
        hasPharmacy: 'Pharmacy',
        hasClubhouse: 'Clubhouse',
        hasWaterMeter: 'Water Meter',
        hasGasPipeline: 'Gas Pipeline',
    };

    const handlePriceSort = (direction: SortDirection) => {
        setPriceSort(priceSort === direction ? 'none' : direction);
    };

    const handleDateSort = (direction: SortDirection) => {
        setDateSort(direction);
    };

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
                                            <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. Koramangala" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={form.control} name="societyName" render={({ field }) => ( <FormItem><FormLabel>Society Name</FormLabel><FormControl><Input placeholder="e.g. Prestige Acropolis" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                        </div>

                                        <FormField control={form.control} name="priceRange" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Budget</FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        min={0}
                                                        max={currentMaxPrice}
                                                        step={priceStep}
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        className="pt-2"
                                                    />
                                                </FormControl>
                                                <div className="flex justify-between text-sm text-muted-foreground pt-2">
                                                    <span>{formatIndianCurrency(priceRange[0])}</span>
                                                    <span>{formatIndianCurrency(priceRange[1])}</span>
                                                </div>
                                            </FormItem>
                                        )} />
                                        
                                        <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="floorRange" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Floor Number</FormLabel>
                                                <FormControl>
                                                    <Slider min={0} max={50} step={1} value={field.value} onValueChange={field.onChange} className="pt-2" />
                                                </FormControl>
                                                <div className="flex justify-between text-sm text-muted-foreground pt-2">
                                                    <span>{floorRange[0]}</span>
                                                    <span>{floorRange[1]}</span>
                                                </div>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="totalFloorRange" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Floors in Building</FormLabel>
                                                <FormControl>
                                                    <Slider min={0} max={50} step={1} value={field.value} onValueChange={field.onChange} className="pt-2" />
                                                </FormControl>
                                                <div className="flex justify-between text-sm text-muted-foreground pt-2">
                                                    <span>{totalFloorRange[0]}</span>
                                                    <span>{totalFloorRange[1]}</span>
                                                </div>
                                            </FormItem>
                                        )} />
                                        </div>

                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Property Type</h3>
                                            {renderCheckboxGroup('propertyType', propertyTypes)}
                                        </div>
                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Configuration</h3>
                                            {renderCheckboxGroup('configuration', configurations)}
                                        </div>
                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Main Door Direction</h3>
                                            {renderCheckboxGroup('mainDoorDirection', mainDoorDirections)}
                                        </div>
                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Open Sides</h3>
                                            {renderCheckboxGroup('openSides', openSides)}
                                        </div>
                                        <div>
                                            <h3 className="mb-4 text-lg font-medium">Features & Amenities</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {Object.entries(amenities).map(([key, label]) => {
                                                    if (!label) return null;
                                                    const name = key as keyof z.infer<typeof searchSchema>;
                                                    return (
                                                        <FormField
                                                            key={name}
                                                            control={form.control}
                                                            name={name}
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={!!field.value}
                                                                            onCheckedChange={field.onChange}
                                                                        />
                                                                    </FormControl>
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

    