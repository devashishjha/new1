
'use client';

import * as React from 'react';
import type { Property } from '@/lib/types';
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
    <div className="flex items-center gap-2 text-white/80">
      {icon && React.createElement(icon, { className: 'w-5 h-5', strokeWidth: 2 })}
      <span>{label}</span>
    </div>
    <span className="font-semibold text-right text-white">{value}</span>
  </div>
);


export function PropertyDetailsSheet({ open, onOpenChange, property, variant = 'default' }: { open: boolean, onOpenChange: (open: boolean) => void, property: Property, variant?: 'reels' | 'default' }) {
  if (!property) return null;
  
  const priceDisplay = property.price.type === 'rent'
    ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
    : formatIndianCurrency(property.price.amount);
    
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 bg-black/50 backdrop-blur-lg border-l border-white/20 text-white">
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
                <Card className="bg-black/40 border-white/10">
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

                <Card className="bg-black/40 border-white/10">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AreaChart className="w-6 h-6" strokeWidth={2.5} />Area & Sunlight</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem label="Super Built-up Area" value={`${property.area.superBuiltUp} sqft`} />
                        <DetailItem label="Carpet Area" value={`${property.area.carpet} sqft`} />
                        <DetailItem label="Sunlight Enters" value={property.features.sunlightEntersHome ? 'Yes' : 'No'} icon={Sun} />
                        <DetailItem label="Sunlight %" value={`${property.amenities.sunlightPercentage}%`} />
                    </CardContent>
                </Card>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-black/40 border-white/10">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Car className="w-6 h-6" strokeWidth={2.5} />Parking</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="4-Wheeler Parking" value={property.parking.has4Wheeler ? 'Available' : 'Not Available'} />
                            <DetailItem label="2-Wheeler Parking" value={property.parking.has2Wheeler ? 'Available' : 'Not Available'} />
                        </CardContent>
                    </Card>
                    <Card className="bg-black/40 border-white/10">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CircleDollarSign className="w-6 h-6" strokeWidth={2.5} />Charges</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="Maintenance" value={`₹ ${property.charges.maintenancePerMonth.toLocaleString('en-IN')}/mo`} />
                            <DetailItem label="Security Deposit" value={`₹ ${property.charges.securityDeposit.toLocaleString('en-IN')}`} />
                            <DetailItem label="Brokerage" value={`₹ ${property.charges.brokerage.toLocaleString('en-IN')}`} />
                            <DetailItem label="Move-in Charges" value={`₹ ${property.charges.moveInCharges.toLocaleString('en-IN')}`} />
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="bg-black/40 border-white/10">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Gift className="w-6 h-6" strokeWidth={2.5}/>Amenities</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-white">
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
            <SheetFooter className="p-4 bg-black/60 flex flex-row items-center gap-4 sticky bottom-0 border-t border-white/20">
                <Link href={`/view-profile/${property.lister.id}`} className="hover:underline flex-grow">
                    <p className="font-bold">{property.lister.name}</p>
                    <p className="text-sm text-white/70 capitalize">{property.lister.type}</p>
                </Link>
                <div className="flex items-center gap-2">
                    {property.lister.phone ? (
                        <a href={`tel:${property.lister.phone}`}>
                            <Button size="lg" variant="outline"><Phone className="mr-2 h-5 w-5" /> Call</Button>
                        </a>
                    ) : (
                         <Button size="lg" variant="outline" disabled><Phone className="mr-2 h-5 w-5" /> Call</Button>
                    )}
                    <ChatButton targetUser={property.lister} />
                </div>
            </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
