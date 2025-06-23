'use client';

import * as React from 'react';
import type { Property } from '@/lib/types';
import type { PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  AreaChart, Bath, BedDouble, Building, Car, Check, ChevronRight, CircleDollarSign, Compass,
  BatteryCharging, Gamepad2, Gift, Home, MessageCircle, Phone, School, ShoppingCart,
  Users, Utensils, Waves, X, Zap, Pill, Sun, Maximize, Wind, CheckCircle2, XCircle, FileText
} from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { formatIndianCurrency } from '@/lib/utils';
import { ChatButton } from './chat-button';

const Amenity = ({ icon, label, available }: { icon: React.ElementType, label: string, available: boolean }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="flex-shrink-0">
      {available ? <Check className="h-5 w-5 text-primary" strokeWidth={3} /> : <X className="h-5 w-5 text-muted-foreground/50" strokeWidth={3} />}
    </div>
    <span className={!available ? 'text-muted-foreground/50 line-through' : ''}>{label}</span>
    <div className="flex-shrink-0 ml-auto">
      {React.createElement(icon, { className: `h-6 w-6 ${available ? 'text-primary' : 'text-muted-foreground/50'}`, strokeWidth: 2 })}
    </div>
  </div>
);

const DetailItem = ({ label, value, icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon && React.createElement(icon, { className: 'w-5 h-5', strokeWidth: 2 })}
      <span>{label}</span>
    </div>
    <span className="font-semibold text-right">{value}</span>
  </div>
);


export function PropertyDetailsSheet({ open, onOpenChange, property, matchInfo, variant = 'default' }: { open: boolean, onOpenChange: (open: boolean) => void, property: Property, matchInfo: PropertyMatchScoreOutput | null, variant?: 'reels' | 'default' }) {
  if (!property) return null;
  
  const priceDisplay = property.price.type === 'rent'
    ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
    : formatIndianCurrency(property.price.amount);
    
  const descriptionAndAreaCards = (
    <>
      <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-6 h-6" strokeWidth={2.5} />Description</CardTitle></CardHeader>
          <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.description}</p>
          </CardContent>
      </Card>
      <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AreaChart className="w-6 h-6" strokeWidth={2.5} />Area & Sunlight</CardTitle></CardHeader>
          <CardContent className="space-y-4">
              <DetailItem label="Super Built-up Area" value={`${property.area.superBuiltUp} sqft`} />
              <DetailItem label="Carpet Area" value={`${property.area.carpet} sqft`} />
              <DetailItem label="Sunlight Enters" value={property.features.sunlightEntersHome ? 'Yes' : 'No'} icon={Sun} />
              <DetailItem label="Sunlight %" value={`${property.amenities.sunlightPercentage}%`} />
          </CardContent>
      </Card>
    </>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0">
        <ScrollArea className="h-full">
            <SheetHeader className="p-6 bg-cover bg-center text-left" style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${property.image})`}}>
              <SheetTitle className="text-3xl font-bold text-white">{property.title}</SheetTitle>
              <SheetDescription>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:underline">
                      {property.location}
                  </a>
              </SheetDescription>
              <div className="flex gap-2 pt-2 flex-wrap">
                  <Badge variant="secondary">{priceDisplay}</Badge>
                  <Badge variant="secondary">{property.configuration.toUpperCase()}</Badge>
                  <Badge variant="secondary" className="capitalize">{property.propertyType}</Badge>
              </div>
            </SheetHeader>

            <div className="p-6 grid gap-6">
                {matchInfo ? (
                    <Card className='bg-primary/10 border-primary/20'>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-primary'><Zap className='w-6 h-6' strokeWidth={2.5} /> AI Match Analysis ({matchInfo.matchScore}%)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {matchInfo.matches && matchInfo.matches.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> What Matches</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                                        {matchInfo.matches.map((match, i) => <li key={`match-${i}`}>{match}</li>)}
                                    </ul>
                                </div>
                            )}
                            {matchInfo.mismatches && matchInfo.mismatches.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2 pt-3"><XCircle className="w-5 h-5 text-red-400" /> What Doesn't Match</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                                        {matchInfo.mismatches.map((mismatch, i) => <li key={`mismatch-${i}`}>{mismatch}</li>)}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                             <CardTitle className='flex items-center gap-2'><Zap className='w-6 h-6' strokeWidth={2.5}/> AI Match Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                            <Skeleton className='h-4 w-full' />
                             <Skeleton className='h-4 w-[80%]' />
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Home className="w-6 h-6" strokeWidth={2.5} />Property Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem label="Property Type" value={<span className="capitalize">{property.propertyType}</span>} icon={Building} />
                        <DetailItem label="Configuration" value={property.configuration.toUpperCase()} icon={BedDouble} />
                        <DetailItem label="Floor" value={`${property.floorNo} of ${property.totalFloors}`} icon={ChevronRight} />
                        <DetailItem label="Houses on Floor" value={property.features.housesOnSameFloor} icon={Users} />
                        <DetailItem label="Main Door" value={<span className="capitalize">{property.mainDoorDirection.replace('-', ' ')}</span>} icon={Compass} />
                        <DetailItem label="Open Sides" value={property.openSides} icon={Maximize} />
                        <DetailItem label="Kitchen Utility" value={property.kitchenUtility ? 'Yes' : 'No'} icon={Utensils} />
                        <DetailItem label="Balcony" value={property.hasBalcony ? 'Yes' : 'No'} icon={Wind} />
                    </CardContent>
                </Card>

                {variant === 'reels' ? (
                  <div className="grid md:grid-cols-2 gap-6">{descriptionAndAreaCards}</div>
                ) : (
                  descriptionAndAreaCards
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Car className="w-6 h-6" strokeWidth={2.5} />Parking</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="4-Wheeler Parking" value={property.parking.has4Wheeler ? 'Available' : 'Not Available'} />
                            <DetailItem label="2-Wheeler Parking" value={property.parking.has2Wheeler ? 'Available' : 'Not Available'} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CircleDollarSign className="w-6 h-6" strokeWidth={2.5} />Charges</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="Maintenance" value={`₹ ${property.charges.maintenancePerMonth.toLocaleString('en-IN')}/mo`} />
                            <DetailItem label="Security Deposit" value={`₹ ${property.charges.securityDeposit.toLocaleString('en-IN')}`} />
                            <DetailItem label="Brokerage" value={`₹ ${property.charges.brokerage.toLocaleString('en-IN')}`} />
                            <DetailItem label="Move-in Charges" value={`₹ ${property.charges.moveInCharges.toLocaleString('en-IN')}`} />
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gift className="w-6 h-6" strokeWidth={2.5}/>Amenities</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <Amenity icon={Zap} label="Lift Available" available={property.amenities.hasLift} />
                        <Amenity icon={Users} label="Clubhouse" available={property.amenities.hasClubhouse} />
                        <Amenity icon={Gamepad2} label="Children's Play Area" available={property.amenities.hasChildrenPlayArea} />
                        <Amenity icon={Pill} label="Pharmacy" available={property.amenities.hasPharmacy} />
                        <Amenity icon={ShoppingCart} label="Super Market" available={property.amenities.hasSuperMarket} />
                        <Amenity icon={School} label="Play School" available={property.amenities.hasPlaySchool} />
                        <Amenity icon={Home} label="Doctor's Clinic" available={property.amenities.hasDoctorClinic} />
                        <Amenity icon={Waves} label="Water Meter" available={property.amenities.hasWaterMeter} />
                        <Amenity icon={Utensils} label="Gas Pipeline" available={property.amenities.hasGasPipeline} />
                    </CardContent>
                </Card>

            </div>
            <SheetFooter className="p-6 bg-secondary/50 flex flex-row items-center gap-4 sticky bottom-0">
                <Link href={`/view-profile/${property.lister.id}`} className="hover:underline flex-grow">
                    <p className="font-bold">{property.lister.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{property.lister.type}</p>
                </Link>
                <div className="flex items-center gap-2">
                    <Button size="lg" variant="outline"><Phone className="mr-2 h-5 w-5" /> Call</Button>
                    <ChatButton targetUser={property.lister} />
                </div>
            </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
