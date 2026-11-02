'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Home, 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  Phone, 
  Bed, 
  Bath, 
  Maximize2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  type: 'Rent' | 'Buy';
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  saved: boolean;
}

export default function ResidentHomesPage() {
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 'prop-1',
      title: 'A bright 3 BHK to call home',
      description: 'Sunlit rooms, two balconies and a view of the gardens.',
      type: 'Rent',
      price: 42000,
      bedrooms: 3,
      bathrooms: 3,
      sqft: 1650,
      saved: false
    },
    {
      id: 'prop-2',
      title: 'Garden-facing 2 BHK apartment',
      description: 'A thoughtfully planned home with covered parking and clubhouse access.',
      type: 'Buy',
      price: 9200000,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1220,
      saved: false
    }
  ]);

  const [filterType, setFilterType] = useState<'All' | 'Rent' | 'Buy'>('All');
  const [search, setSearch] = useState('');
  const [inquired, setInquired] = useState<string | null>(null);

  const toggleSave = (id: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  const filtered = properties.filter(p => {
    const matchType = filterType === 'All' ? true : p.type === filterType;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                        p.description.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#EDE8E0] py-6 pb-28 px-4 sm:px-6">
      <div className="max-w-md lg:max-w-4xl mx-auto space-y-5">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#142E31] tracking-tight">
            Homes
          </h1>
          <span className="text-xs font-semibold text-[#808683]">Palm Meadows</span>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#808683] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search homes for rent or buy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-2xl pl-10 pr-4 py-2.5 text-xs border border-[#E7E6E1] focus:outline-hidden"
            />
          </div>
          <div className="flex gap-1 bg-white p-1 rounded-2xl border border-[#E7E6E1]">
            {(['All', 'Rent', 'Buy'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  filterType === t ? 'bg-[#FFE500] text-[#142E31]' : 'text-[#808683]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Alert */}
        {inquired && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Enquiry sent to the society desk for {inquired}.</span>
          </div>
        )}

        {/* Listings */}
        <div className="space-y-4">
          {filtered.map(prop => (
            <div key={prop.id} className="bg-white rounded-3xl border border-[#E7E6E1] overflow-hidden shadow-xs">
              <div className="h-44 relative bg-slate-100">
                <img
                  src="/assets/images/community.jpg"
                  alt={prop.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-[#142E31]/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  For {prop.type}
                </div>
                <button
                  onClick={() => toggleSave(prop.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#142E31] shadow-xs cursor-pointer"
                >
                  {prop.saved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-[#142E31] leading-snug">
                      {prop.title}
                    </h2>
                    <p className="text-xs text-[#808683] mt-0.5">
                      {prop.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-[#142E31]">
                      {prop.type === 'Rent' ? `₹${prop.price.toLocaleString('en-IN')}/mo` : `₹${(prop.price / 100000).toFixed(1)}L`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#808683] pt-2 border-t border-[#E7E6E1]">
                  <div className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4" />
                    <span>{prop.bedrooms} Beds</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath className="w-4 h-4" />
                    <span>{prop.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" />
                    <span>{prop.sqft} sq.ft</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setInquired(prop.title);
                      setTimeout(() => setInquired(null), 4000);
                    }}
                    className="w-full py-2.5 bg-[#142E31] hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Society Desk</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

