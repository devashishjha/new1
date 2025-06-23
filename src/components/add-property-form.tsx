'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { generatePropertyDescriptionAction } from '@/app/actions';
import type { GeneratePropertyDescriptionInput } from '@/ai/flows/generate-property-description';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';


const propertySchema = z.object({
    // Basic Info
    priceType: z.enum(['rent', 'sale']),
    priceAmount: z.coerce.number().min(1, { message: 'Please enter a valid price.' }),
    location: z.string().min(5, { message: 'Please enter a valid location.' }),
    societyName: z.string().min(2, { message: 'Please enter a society name.' }),
    description: z.string().max(500, "Description must be 500 characters or less.").optional(),
    video: z.any().optional(),

    // Property Details
    propertyType: z.enum(['apartment', 'villa', 'row house', 'penthouse', 'independent house', 'builder floor']),
    configuration: z.enum(['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk+']),
    floorNo: z.coerce.number().int(),
    totalFloors: z.coerce.number().int().min(0),
    mainDoorDirection: z.enum(['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west']),
    openSides: z.enum(['1', '2', '3', '4']),
    housesOnSameFloor: z.coerce.number().int().min(1),

    // Features & Area
    kitchenUtility: z.boolean().default(false),
    hasBalcony: z.boolean().default(false),
    sunlightEntersHome: z.boolean().default(false),
    sunlightPercentage: z.number().min(0).max(100).default(50),
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

export function AddPropertyForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const form = useForm<z.infer<typeof propertySchema>>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            priceType: 'sale',
            propertyType: 'apartment',
            configuration: '2bhk',
            mainDoorDirection: 'east',
            openSides: '1',
            kitchenUtility: false,
            hasBalcony: false,
            sunlightEntersHome: false,
            sunlightPercentage: 50,
            has2WheelerParking: false,
            has4WheelerParking: false,
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
            description: "",
        },
    });

    async function handleGenerateDescription() {
        setIsGenerating(true);
        try {
            const values = form.getValues();
            const amenities = [];
            if (values.hasLift) amenities.push('Lift');
            if (values.hasClubhouse) amenities.push('Clubhouse');
            if (values.hasChildrenPlayArea) amenities.push("Children's Play Area");
            if (values.hasSuperMarket) amenities.push("Super Market");
            
            const input: GeneratePropertyDescriptionInput = {
                priceType: values.priceType,
                priceAmount: values.priceAmount,
                location: values.location,
                societyName: values.societyName,
                propertyType: values.propertyType,
                configuration: values.configuration,
                floorNo: values.floorNo,
                totalFloors: values.totalFloors,
                superBuiltUpArea: values.superBuiltUpArea,
                carpetArea: values.carpetArea,
                mainDoorDirection: values.mainDoorDirection,
                hasBalcony: values.hasBalcony,
                amenities: amenities,
            };
            const result = await generatePropertyDescriptionAction(input);
            if (result?.description) {
                form.setValue('description', result.description);
                toast({ title: "Description Generated!", description: "The AI has written a description for you." });
            } else {
                throw new Error("AI did not return a description.");
            }
        } catch (error) {
             toast({ variant: 'destructive', title: "Generation Failed", description: "Could not generate a description." });
        } finally {
            setIsGenerating(false);
        }
    }

    async function onSubmit(values: z.infer<typeof propertySchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Authenticated", description: "You must be logged in to add a property." });
            return;
        }
        setIsSubmitting(true);

        try {
            let videoUrl: string | undefined = undefined;
            const videoFile = values.video?.[0] as File | undefined;

            if (videoFile) {
                toast({ title: "Uploading Video...", description: "Please wait while we upload your property video." });
                const storageRef = ref(storage, `videos/${user.uid}/${Date.now()}_${videoFile.name}`);
                const uploadResult = await uploadBytes(storageRef, videoFile);
                videoUrl = await getDownloadURL(uploadResult.ref);
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                throw new Error("User profile not found.");
            }
            const userProfile = userDoc.data() as UserProfile;

            const propertyData = {
                title: `${values.configuration.toUpperCase()} in ${values.societyName}`,
                description: values.description || '',
                image: 'https://placehold.co/1080x1920.png',
                video: videoUrl,
                lister: {
                    id: user.uid,
                    name: userProfile.name,
                    type: userProfile.type,
                },
                price: { type: values.priceType, amount: values.priceAmount },
                location: values.location,
                societyName: values.societyName,
                postedOn: serverTimestamp(),
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
                    sunlightPercentage: values.sunlightPercentage,
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

            await addDoc(collection(db, "properties"), propertyData);
            
            toast({
                title: "Property Submitted!",
                description: "Your property has been successfully listed.",
            });
            form.reset();
            router.push('/reels');
        } catch (error) {
            console.error("Error submitting property:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was an error submitting your property. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const renderCheckboxField = (name: keyof z.infer<typeof propertySchema>, label: string) => ( <FormField control={form.control} name={name} render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"> <FormLabel>{label}</FormLabel> <FormControl> <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} /> </FormControl> </FormItem> )} /> );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <Card>
                    <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="priceType" render={({ field }) => ( <FormItem><FormLabel>Listing for</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="rent">Rent</SelectItem><SelectItem value="sale">Sale</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="priceAmount" render={({ field }) => ( <FormItem><FormLabel>Price Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="5000000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="location" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Location</FormLabel><FormControl><Textarea placeholder="Full address of the property" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="societyName" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Society Name</FormLabel><FormControl><Input placeholder="Sunshine Apartments" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem className="md:col-span-2"> <div className="flex items-center justify-between"> <FormLabel>Property Description</FormLabel> <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}> <Wand2 className="mr-2 h-4 w-4" /> {isGenerating ? 'Generating...' : 'Generate with AI'} </Button> </div> <FormControl> <Textarea rows={5} placeholder="A compelling description of your property..." {...field} /> </FormControl> <FormDescription> You can write your own or use the AI generator based on the details you've provided. </FormDescription> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name="video" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Property Video</FormLabel> <FormControl> <Input type="file" accept="video/*" {...form.register('video')} /> </FormControl> <FormDescription> Upload a short video of your property for the reel. </FormDescription> <FormMessage /> </FormItem> )} />
                    </CardContent>
                </Card>

                <Accordion type="multiple" className="w-full space-y-4" defaultValue={['item-1']}>
                    <AccordionItem value="item-1" asChild><Card><AccordionTrigger className="p-6"><CardTitle>Property Details</CardTitle></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="propertyType" render={({ field }) => ( <FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="apartment">Apartment</SelectItem><SelectItem value="villa">Villa</SelectItem><SelectItem value="row house">Row House</SelectItem><SelectItem value="penthouse">Penthouse</SelectItem><SelectItem value="independent house">Independent House</SelectItem><SelectItem value="builder floor">Builder Floor</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="configuration" render={({ field }) => ( <FormItem><FormLabel>Configuration</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="studio">Studio</SelectItem><SelectItem value="1bhk">1BHK</SelectItem><SelectItem value="2bhk">2BHK</SelectItem><SelectItem value="3bhk">3BHK</SelectItem><SelectItem value="4bhk">4BHK</SelectItem><SelectItem value="5bhk+">5BHK+</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="floorNo" render={({ field }) => ( <FormItem><FormLabel>Floor Number</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="totalFloors" render={({ field }) => ( <FormItem><FormLabel>Total Floors in Building</FormLabel><FormControl><Input type="number" placeholder="20" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="mainDoorDirection" render={({ field }) => ( <FormItem><FormLabel>Main Door Direction</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent> {['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'].map(d => <SelectItem key={d} value={d} className='capitalize'>{d.replace('-', ' ')}</SelectItem>)} </SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="openSides" render={({ field }) => ( <FormItem><FormLabel>Open Sides</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent> {['1', '2', '3', '4'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)} </SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="housesOnSameFloor" render={({ field }) => ( <FormItem><FormLabel>Houses on Same Floor</FormLabel><FormControl><Input type="number" placeholder="4" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </AccordionContent></Card></AccordionItem>

                    <AccordionItem value="item-2" asChild><Card><AccordionTrigger className="p-6"><CardTitle>Features, Area & Parking</CardTitle></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-x-6 gap-y-4">
                        {renderCheckboxField('kitchenUtility', 'Kitchen Utility')}
                        {renderCheckboxField('hasBalcony', 'Has Balcony')}
                        {renderCheckboxField('sunlightEntersHome', 'Sunlight Enters Home')}
                        {renderCheckboxField('has2WheelerParking', '2-Wheeler Parking')}
                        {renderCheckboxField('has4WheelerParking', '4-Wheeler Parking')}
                        <FormField control={form.control} name="superBuiltUpArea" render={({ field }) => ( <FormItem><FormLabel>Super Built-up Area (sqft)</FormLabel><FormControl><Input type="number" placeholder="1200" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="carpetArea" render={({ field }) => ( <FormItem><FormLabel>Carpet Area (sqft)</FormLabel><FormControl><Input type="number" placeholder="950" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="sunlightPercentage" render={({ field }) => ( <FormItem> <FormLabel>Sunlight Percentage ({field.value}%)</FormLabel> <FormControl> <Slider min={0} max={100} step={5} defaultValue={[field.value]} onValueChange={(value) => field.onChange(value[0])} /> </FormControl> </FormItem> )} />
                    </AccordionContent></Card></AccordionItem>

                     <AccordionItem value="item-3" asChild><Card><AccordionTrigger className="p-6"><CardTitle>Amenities</CardTitle></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-x-6 gap-y-4">
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

                    <AccordionItem value="item-4" asChild><Card><AccordionTrigger className="p-6"><CardTitle>Charges & Fees</CardTitle></AccordionTrigger><AccordionContent className="p-6 pt-0 grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="maintenancePerMonth" render={({ field }) => ( <FormItem><FormLabel>Maintenance (/month)</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="securityDeposit" render={({ field }) => ( <FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                         <FormField control={form.control} name="brokerage" render={({ field }) => ( <FormItem><FormLabel>Brokerage (if any)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="moveInCharges" render={({ field }) => ( <FormItem><FormLabel>Move-in Charges</FormLabel><FormControl><Input type="number" placeholder="2000" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </AccordionContent></Card></AccordionItem>
                </Accordion>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || isGenerating}>
                    {isSubmitting ? 'Submitting...' : 'Submit Property'}
                </Button>
            </form>
        </Form>
    );
}
