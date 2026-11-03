'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  Camera, 
  ArrowLeft, 
  Building2, 
  Send, 
  Phone, 
  CheckCircle2, 
  Car, 
  AlertCircle,
  AlertTriangle,
  Package,
  Wrench,
  User,
  Users,
  Utensils,
  Truck,
  ShoppingBag,
  Boxes,
  MapPin,
  FileText
} from 'lucide-react';
import { CameraModal } from '@/components/guard/CameraModal';
import { validateIndianPhone } from '@/lib/utils';
import { VisitorCategory, DeliveryCategory } from '@/types';
import { uploadVisitorPhoto } from '@/lib/supabase';

export default function RegisterVisitorPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(appStore.getState());

  // Form State
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('guest');
  const [deliveryCategory, setDeliveryCategory] = useState<DeliveryCategory>('food');
  const [deliveryCompany, setDeliveryCompany] = useState('Swiggy');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedGateId, setSelectedGateId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  
  // Parcel Specific State
  const [parcelCount, setParcelCount] = useState<number>(1);
  const [parcelDetails, setParcelDetails] = useState('');
  const [gateLocation, setGateLocation] = useState('Gate 1 Parcel Desk');

  // Photo State
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [parcelPhotoUrl, setParcelPhotoUrl] = useState<string>('');
  const [activeCameraTarget, setActiveCameraTarget] = useState<'visitor' | 'parcel' | null>(null);

  // Validation & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const blacklistedMatch = visitorPhone.length >= 5 ? appStore.isBlacklisted(visitorPhone) : undefined;

  const gates = state.gates;
  const blocks = state.blocks;
  const flats = state.flats;

  // Initialize gate and block
  useEffect(() => {
    if (gates.length > 0 && !selectedGateId) {
      setSelectedGateId(gates[0].id);
      setGateLocation(`${gates[0].name} Parcel Desk`);
    }
    if (blocks.length > 0 && !selectedBlockId) {
      setSelectedBlockId(blocks[1]?.id || blocks[0].id); // Default to Tower B
    }
  }, [gates, blocks, selectedGateId, selectedBlockId]);

  // Filter flats by selected block
  const availableFlats = flats.filter(f => f.block_id === selectedBlockId);

  // Auto-select first flat if current flat not in block
  useEffect(() => {
    if (availableFlats.length > 0) {
      const match = availableFlats.find(f => f.id === selectedFlatId);
      if (!match) {
        setSelectedFlatId(availableFlats[0].id);
      }
    }
  }, [selectedBlockId, availableFlats, selectedFlatId]);

  const selectedFlat = flats.find(f => f.id === selectedFlatId);

  // Main Category options
  const categoryOptions = [
    { id: 'delivery', label: 'Delivery', icon: Package, color: 'hover:border-amber-500' },
    { id: 'guest', label: 'Guest', icon: User, color: 'hover:border-emerald-500' },
    { id: 'cab', label: 'Cab / Taxi', icon: Car, color: 'hover:border-sky-500' },
    { id: 'service', label: 'Service / Tech', icon: Wrench, color: 'hover:border-purple-500' },
    { id: 'daily_staff', label: 'Daily Staff', icon: Users, color: 'hover:border-indigo-500' }
  ];

  // Required 5 Delivery Categories (Requirement 1)
  const deliveryCategories: Array<{
    id: DeliveryCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    presets: string[];
    defaultPurpose: string;
  }> = [
    {
      id: 'food',
      label: 'Food Delivery',
      icon: Utensils,
      presets: ['Swiggy', 'Zomato', 'EatClub', "Domino's", 'KFC', 'Box8'],
      defaultPurpose: 'Food delivery meal order'
    },
    {
      id: 'courier',
      label: 'Courier & Logistics',
      icon: Truck,
      presets: ['BlueDart', 'DTDC', 'Delhivery', 'DHL', 'FedEx', 'India Post'],
      defaultPurpose: 'Courier parcel handover'
    },
    {
      id: 'grocery',
      label: 'Instant Grocery',
      icon: ShoppingBag,
      presets: ['Blinkit', 'Zepto', 'Instamart', 'BigBasket', 'Nature Basket'],
      defaultPurpose: 'Grocery supplies delivery'
    },
    {
      id: 'e_commerce',
      label: 'E-Commerce',
      icon: Boxes,
      presets: ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Meesho', 'Tata CLiQ'],
      defaultPurpose: 'E-commerce online package order'
    },
    {
      id: 'other',
      label: 'Other Delivery',
      icon: Package,
      presets: ['Laundry', 'Bisleri / Water', 'Medicine / 1mg', 'Flower / Cake', 'Newspaper'],
      defaultPurpose: 'General parcel delivery'
    }
  ];

  const currentDeliveryCategoryConfig = deliveryCategories.find(c => c.id === deliveryCategory) || deliveryCategories[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submission

    const newErrors: Record<string, string> = {};

    if (!visitorName.trim()) {
      newErrors.visitorName = 'Visitor / Delivery agent name is required.';
    }

    if (!visitorPhone.trim()) {
      newErrors.visitorPhone = 'Phone number is required.';
    } else if (!validateIndianPhone(visitorPhone)) {
      newErrors.visitorPhone = 'Enter a valid 10-digit Indian phone number.';
    } else {
      const blacklisted = appStore.isBlacklisted(visitorPhone);
      if (blacklisted) {
        newErrors.visitorPhone = `🚨 VISITOR BLACKLISTED: "${blacklisted.reason}". Entry strictly prohibited!`;
      }
    }

    if (!selectedFlatId) {
      newErrors.flat = 'Please select destination apartment flat.';
    }

    if (!purpose.trim()) {
      newErrors.purpose = 'Visit purpose / delivery notes required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setUploadStatusText('Uploading photos to secure storage...');

    try {
      // Requirement 10: Store photos in private Supabase Storage and store object paths rather than base64
      let finalPhotoPath = photoUrl;
      if (photoUrl && photoUrl.startsWith('data:')) {
        const storedPath = await uploadVisitorPhoto(photoUrl, `agent_${visitorName.trim()}`);
        if (storedPath) finalPhotoPath = storedPath;
      }

      let finalParcelPhotoPath = parcelPhotoUrl;
      if (parcelPhotoUrl && parcelPhotoUrl.startsWith('data:')) {
        const storedParcelPath = await uploadVisitorPhoto(parcelPhotoUrl, `parcel_${deliveryCompany || 'pkg'}`);
        if (storedParcelPath) finalParcelPhotoPath = storedParcelPath;
      }

      setUploadStatusText('Registering delivery request in database...');

      const created = appStore.createVisitorRequest({
        gate_id: selectedGateId || gates[0]?.id || '',
        flat_id: selectedFlatId,
        visitor_name: visitorName.trim(),
        visitor_phone: visitorPhone.trim(),
        visitor_photo_path: finalPhotoPath || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        category,
        delivery_category: category === 'delivery' ? deliveryCategory : undefined,
        delivery_company: category === 'delivery' ? (deliveryCompany || 'General Delivery') : undefined,
        purpose: purpose.trim(),
        vehicle_number: vehicleNumber.trim() || undefined,
        parcel_count: category === 'delivery' ? (parcelCount || 1) : undefined,
        parcel_details: category === 'delivery' ? (parcelDetails.trim() || undefined) : undefined,
        parcel_photo_path: category === 'delivery' ? finalParcelPhotoPath : undefined,
        gate_location: gateLocation.trim() || 'Gate 1 Parcel Desk',
        consent_obtained: true
      });

      // Redirect immediately to live pending screen
      router.push(`/guard/pending?id=${created.id}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setUploadStatusText('');
      alert((err as Error).message || 'Failed to register delivery. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/guard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gate</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Security Gate Terminal</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
            GATE LOGISTICS & VISITOR CHECK-IN
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            New Visitor & Delivery Registration
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Capture agent & parcel details, upload verification photos to private storage, and alert resident in real time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. VISITOR MAIN CATEGORY */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categoryOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setCategory(opt.id as VisitorCategory);
                      if (opt.id === 'delivery' && !purpose) {
                        setPurpose(currentDeliveryCategoryConfig.defaultPurpose);
                      }
                      if (opt.id === 'cab' && !purpose) setPurpose('Resident pick-up / drop-off');
                      if (opt.id === 'service' && !purpose) setPurpose('Maintenance & repair service');
                      if (opt.id === 'guest' && purpose.includes('delivery')) setPurpose('');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all touch-press cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1B. DELIVERY CATEGORIES (Requirement 1 & 2) */}
          {category === 'delivery' && (
            <div className="p-5 bg-amber-50/70 border-2 border-amber-300 rounded-3xl space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-extrabold text-amber-950 uppercase tracking-wider mb-2">
                  Delivery Classification <span className="text-amber-700 font-normal">(Required by Bylaws)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {deliveryCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = deliveryCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setDeliveryCategory(cat.id);
                          setDeliveryCompany(cat.presets[0]);
                          setPurpose(`${cat.presets[0]} - ${cat.defaultPurpose}`);
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-md'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100 font-medium'
                        }`}
                      >
                        <CatIcon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-amber-700'}`} />
                        <span className="text-[11px] text-center leading-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Delivery Provider Presets */}
              <div className="space-y-1.5 pt-1 border-t border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 uppercase">
                  Frequent {currentDeliveryCategoryConfig.label} Partners:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {currentDeliveryCategoryConfig.presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDeliveryCompany(preset);
                        setPurpose(`${preset} Delivery`);
                      }}
                      className={`px-3 py-1 text-xs rounded-lg font-bold border transition-colors cursor-pointer ${
                        deliveryCompany === preset
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Parcel Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Number of Packages
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={parcelCount}
                    onChange={(e) => setParcelCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Parcel Details / AWB / Order # <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={parcelDetails}
                    onChange={(e) => setParcelDetails(e.target.value)}
                    placeholder="e.g. AWB #9812938, BlueDart box, perishable"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. VISITOR BASIC INFORMATION */}
          <div className="space-y-4">
            {/* Blacklist Alert Banner (Story US3.3.2) */}
            {blacklistedMatch && (
              <div className="p-4 bg-red-600 text-white rounded-2xl flex items-start gap-3 shadow-lg animate-pulse">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
                <div className="space-y-1">
                  <div className="font-black text-sm uppercase tracking-wide">
                    🚨 ENTRY BLOCKED: VISITOR ON SOCIETY BLACKLIST
                  </div>
                  <p className="text-xs text-red-100">
                    <strong>{blacklistedMatch.visitor_name}</strong> (+91 {blacklistedMatch.visitor_phone}) is banned by RWA Admin.
                  </p>
                  <p className="text-xs text-red-100 font-medium">
                    Reason: &ldquo;{blacklistedMatch.reason}&rdquo;
                  </p>
                  <div className="text-[11px] text-red-200 font-bold pt-0.5">
                    Do not permit visitor through security barrier. Escalate to Head Supervisor.
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Agent / Visitor Identification & Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {category === 'delivery' ? 'Delivery Agent Name' : 'Visitor Full Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => {
                    setVisitorName(e.target.value);
                    if (errors.visitorName) setErrors({ ...errors, visitorName: '' });
                  }}
                  placeholder={category === 'delivery' ? "e.g. Rahul (Swiggy Rider)" : "e.g. Rahul Sharma"}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    errors.visitorName ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  } focus:outline-hidden focus:border-slate-900`}
                />
                {errors.visitorName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.visitorName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={visitorPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setVisitorPhone(val);
                      if (errors.visitorPhone) setErrors({ ...errors, visitorPhone: '' });
                    }}
                    placeholder="98765 43210"
                    className={`w-full pl-11 pr-4 py-2.5 text-sm font-mono rounded-xl border ${
                      errors.visitorPhone ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                    } focus:outline-hidden focus:border-slate-900`}
                  />
                </div>
                {errors.visitorPhone && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.visitorPhone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visit Purpose / Item Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose) setErrors({ ...errors, purpose: '' });
                  }}
                  placeholder="e.g. Dinner delivery, parcel handover, AC check"
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                    errors.purpose ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  } focus:outline-hidden focus:border-slate-900`}
                />
                {errors.purpose && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.purpose}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Registration No. (Optional)
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA-03-HA-8821"
                  className="w-full px-4 py-2.5 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 3. VISITOR & PARCEL PHOTOGRAPHS (Requirement 2 & 10) */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Verification Photographs (Private Storage)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Visitor / Agent Photo */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Captured visitor" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">
                    {photoUrl ? 'Agent Photo Captured' : 'Visitor / Agent Photo'}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">Facial verification for resident</p>
                  <button
                    type="button"
                    onClick={() => setActiveCameraTarget('visitor')}
                    className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-slate-800"
                  >
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>{photoUrl ? 'Retake' : 'Open Camera'}</span>
                  </button>
                </div>
              </div>

              {/* Optional Parcel Photo for Deliveries */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                  {parcelPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={parcelPhotoUrl} alt="Captured parcel" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">
                    {parcelPhotoUrl ? 'Parcel Photo Attached' : 'Parcel / Box Photo'}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">Optional AWB/box proof</p>
                  <button
                    type="button"
                    onClick={() => setActiveCameraTarget('parcel')}
                    className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-slate-700"
                  >
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>{parcelPhotoUrl ? 'Retake' : 'Snap Parcel'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. DESTINATION FLAT & GATE LOCATION */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              4. Destination Apartment & Gate Desk
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Gate */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Arrival Gate</label>
                <select
                  value={selectedGateId}
                  onChange={(e) => {
                    setSelectedGateId(e.target.value);
                    const g = gates.find(gate => gate.id === e.target.value);
                    if (g) setGateLocation(`${g.name} Parcel Desk`);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
                >
                  {gates.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Tower / Block */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tower / Block</label>
                <select
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
                >
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Flat Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Flat Number</label>
                <select
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:outline-hidden"
                >
                  {availableFlats.map((f) => (
                    <option key={f.id} value={f.id}>
                      Flat {f.flat_number} (Floor {f.floor_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resident Preview */}
            {selectedFlat && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                      Target Apartment
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {selectedFlat.primary_resident_name || 'Resident on Record'} • Flat {selectedFlat.flat_number}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                      <span>Intercom: <strong>#{selectedFlat.intercom_number || '2402'}</strong></span>
                      <span>•</span>
                      <span>Owner Phone: {selectedFlat.primary_resident_phone}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resident Push Ready</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Legal Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              By registering this delivery, an instant notification is transmitted to the resident dashboard. The resident can approve entry, decline entry, or authorize leaving the package at the security desk.
            </span>
          </div>

          {/* SUBMIT BUTTON WITH LOADING & ERROR RESILIENCE */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-4 text-white font-extrabold text-base rounded-2xl shadow-xl transition-all cursor-pointer ${
                isSubmitting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/20 touch-press'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>
                {isSubmitting 
                  ? (uploadStatusText || 'REGISTERING ENTRY...') 
                  : 'REQUEST ENTRY / PARCEL APPROVAL NOW'
                }
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={Boolean(activeCameraTarget)}
        onPhotoCaptured={(url) => {
          if (activeCameraTarget === 'visitor') {
            setPhotoUrl(url);
          } else if (activeCameraTarget === 'parcel') {
            setParcelPhotoUrl(url);
          }
          setActiveCameraTarget(null);
        }}
        onClose={() => setActiveCameraTarget(null)}
      />
    </div>
  );
}
