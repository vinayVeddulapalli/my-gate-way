'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  MessageCircle, 
  Tag, 
  CheckCircle2, 
  Plus, 
  X 
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  seller: string;
  image: string;
  saved: boolean;
}

export default function ResidentMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([
    {
      id: 'list-1',
      title: 'A comfortable accent chair',
      description: 'Well cared for. Pick up within the society from Tower A.',
      category: 'Furniture',
      price: 2500,
      seller: 'Rohan Verma (A-402)',
      image: '/assets/images/chair.jpg',
      saved: false
    },
    {
      id: 'list-2',
      title: 'Three-seater fabric sofa',
      description: 'Clean fabric sofa with removable covers. Light grey tone.',
      category: 'Furniture',
      price: 8500,
      seller: 'Sanjay Dutt (B-1102)',
      image: '/assets/images/sofa.jpg',
      saved: false
    },
    {
      id: 'list-3',
      title: 'City bicycle, ready to ride',
      description: 'Serviced recently. Includes helmet and lock.',
      category: 'Vehicles',
      price: 4500,
      seller: 'Kavita Pillai (C-201)',
      image: '/assets/images/bicycle.jpg',
      saved: false
    },
    {
      id: 'list-4',
      title: 'Handmade wall decor',
      description: 'Two hand-painted canvas pieces made by a neighbour.',
      category: 'Home Decor',
      price: 750,
      seller: 'Meera Sen (A-903)',
      image: '/assets/images/decor.jpg',
      saved: false
    },
    {
      id: 'list-5',
      title: 'Desk chair, free to a neighbour',
      description: 'Collect from Tower B parking lobby this weekend.',
      category: 'Free',
      price: 0,
      seller: 'Vikram Joshi (B-501)',
      image: '/assets/images/chair.jpg',
      saved: false
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const categories = ['All', 'Furniture', 'Vehicles', 'Home Decor', 'Free'];

  const toggleSave = (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, saved: !l.saved } : l));
  };

  const handleMessage = (item: Listing) => {
    setAlertMsg(`Chat enquiry started with ${item.seller} for "${item.title}".`);
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const filtered = listings.filter(item => {
    const matchCat = activeCategory === 'All' ? true : item.category === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                        item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#EDE8E0] py-6 pb-28 px-4 sm:px-6">
      <div className="max-w-md lg:max-w-4xl mx-auto space-y-5">
        {/* Page Title & Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#142E31] tracking-tight">
              Buy & Sell
            </h1>
            <p className="text-xs text-[#808683] font-medium">Within Palm Meadows</p>
          </div>
          <button
            onClick={() => {
              const name = prompt('Item title to sell or give away:');
              if (name) {
                setListings(prev => [
                  {
                    id: `item-${Date.now()}`,
                    title: name,
                    description: 'Available for collection within society.',
                    category: 'Furniture',
                    price: 1000,
                    seller: 'Resident (Verified)',
                    image: '/assets/images/chair.jpg',
                    saved: false
                  },
                  ...prev
                ]);
              }
            }}
            className="px-3.5 py-2 bg-[#FFE500] hover:bg-[#ebd400] text-[#142E31] text-xs font-extrabold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Post Item</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#808683] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search items to buy or adopt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-2xl pl-10 pr-4 py-2.5 text-xs border border-[#E7E6E1] focus:outline-hidden"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                activeCategory === c
                  ? 'bg-[#142E31] text-white border-[#142E31]'
                  : 'bg-white text-[#808683] border-[#E7E6E1] hover:border-[#142E31]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Feedback Alert */}
        {alertMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{alertMsg}</span>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-3xl border border-[#E7E6E1] overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-44 relative bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-[#142E31]/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                    {item.category}
                  </span>
                  <button
                    onClick={() => toggleSave(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#142E31] shadow-xs cursor-pointer"
                  >
                    {item.saved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <div className="text-base font-black text-[#142E31]">
                      {item.price === 0 ? 'FREE' : `₹${item.price.toLocaleString('en-IN')}`}
                    </div>
                    <span className="text-[10px] text-[#808683] font-medium">{item.seller}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#142E31] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#808683] line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => handleMessage(item)}
                  className="w-full py-2 bg-[#F6F5F2] hover:bg-[#EAE6DE] text-[#142E31] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#E7E6E1]"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contact Neighbour</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

