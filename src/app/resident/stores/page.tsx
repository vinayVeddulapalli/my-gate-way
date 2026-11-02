'use client';

import React, { useState } from 'react';
import { 
  Store, 
  Wrench, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image: string;
}

export default function ResidentStoresPage() {
  const [services] = useState<ServiceItem[]>([
    {
      id: 'srv-1',
      title: 'Home deep cleaning',
      description: 'Full sanitization, kitchen degreasing, bathroom scrubbing, and floor buffing.',
      category: 'Cleaning',
      price: 2499,
      image: '/assets/images/cleaning.jpg'
    },
    {
      id: 'srv-2',
      title: 'AC service and repair',
      description: 'Comprehensive filter cleaning, cooling coil wash, and gas level inspection.',
      category: 'Appliance Repair',
      price: 599,
      image: '/assets/images/ac.jpg'
    },
    {
      id: 'srv-3',
      title: 'Packers and movers',
      description: 'Smooth internal or city shifting coordinated with society gate security.',
      category: 'Moving',
      price: 3500,
      image: '/assets/images/moving.jpg'
    },
    {
      id: 'srv-4',
      title: 'Fresh walls, fresh beginnings',
      description: 'Book a professional painting inspection and shade consultation for your home.',
      category: 'Painting',
      price: 499,
      image: '/assets/images/painting.jpg'
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [bookedService, setBookedService] = useState<string | null>(null);

  const categories = ['All', 'Cleaning', 'Appliance Repair', 'Moving', 'Painting'];

  const filtered = services.filter(s => 
    activeCategory === 'All' ? true : s.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-[#EDE8E0] py-6 pb-28 px-4 sm:px-6">
      <div className="max-w-md lg:max-w-4xl mx-auto space-y-5">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-black text-[#142E31] tracking-tight">
            Stores & Services
          </h1>
          <p className="text-xs text-[#808683] font-medium">Verified partners for Palm Meadows</p>
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

        {/* Booking Notification */}
        {bookedService && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Service request booked for {bookedService}. Society desk will schedule the visit.</span>
          </div>
        )}

        {/* Service Cards Grid */}
        <div className="space-y-4">
          {filtered.map(srv => (
            <div key={srv.id} className="bg-white rounded-3xl border border-[#E7E6E1] overflow-hidden shadow-xs flex flex-col sm:flex-row">
              <div className="sm:w-48 h-40 sm:h-auto relative bg-slate-100 shrink-0">
                <img
                  src={srv.image}
                  alt={srv.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#142E31]/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                  {srv.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-extrabold text-[#142E31]">
                      {srv.title}
                    </h2>
                    <span className="text-sm font-black text-[#142E31]">
                      ₹{srv.price}
                    </span>
                  </div>
                  <p className="text-xs text-[#808683] mt-1 line-clamp-2">
                    {srv.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setBookedService(srv.title);
                      setTimeout(() => setBookedService(null), 4000);
                    }}
                    className="flex-1 py-2.5 bg-[#FFE500] hover:bg-[#ebd400] text-[#142E31] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Service</span>
                  </button>
                  <button
                    onClick={() => alert(`Calling Society Partner Desk for ${srv.title}...`)}
                    className="py-2.5 px-3 bg-[#F6F5F2] hover:bg-[#EAE6DE] text-[#142E31] font-bold text-xs rounded-xl transition-colors cursor-pointer border border-[#E7E6E1]"
                    title="Call Partner"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
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

