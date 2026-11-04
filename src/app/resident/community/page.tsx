'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  UserPlus, 
  Users, 
  Wrench, 
  ClipboardList, 
  Home, 
  Handshake, 
  Building2, 
  Receipt, 
  Bell, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Send, 
  Building,
  Shield,
  CheckCircle2
} from 'lucide-react';

interface Comment {
  author: string;
  body: string;
}

interface Post {
  id: string;
  author: string;
  initials: string;
  community: string;
  body: string;
  comments: Comment[];
}

export default function ResidentCommunityPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'post-1',
      author: 'Neha Kapoor',
      initials: 'N',
      community: 'Palm Meadows',
      body: 'Join a garden clean-up this Sunday at 8 AM. Meet by the clubhouse. Everyone is welcome.',
      comments: []
    },
    {
      id: 'post-2',
      author: 'Priya Menon',
      initials: 'P',
      community: 'Palm Meadows',
      body: 'I have a few novels looking for their next reader. Leave a comment to join.',
      comments: []
    }
  ]);
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  const handleAddComment = (postId: string) => {
    const text = (newCommentText[postId] || '').trim();
    if (!text) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { author: state.currentUser.full_name || 'Resident', body: text }]
        };
      }
      return p;
    }));
    setNewCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#EDE8E0] py-6 px-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-48 bg-white/60 rounded-3xl animate-pulse" />
          <div className="h-28 bg-white/60 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const actions = [
    { label: 'Pre-Approve', icon: UserPlus, href: '/resident/passes' },
    { label: 'Visitors', icon: Users, href: '/resident/passes' },
    { label: 'Services', icon: Wrench, href: '/resident/stores' },
    { label: 'Notice Board', icon: ClipboardList, href: '/resident/community#notices' },
    { label: 'My Home', icon: Home, href: '/resident/settings' },
    { label: 'Buy & Sell', icon: Handshake, href: '/resident/marketplace' },
    { label: 'Homes', icon: Building, href: '/resident/homes' },
    { label: 'My Requests', icon: Receipt, href: '/resident/passes' },
    { label: 'Updates', icon: Bell, href: '/resident/inbox' },
    { label: 'Membership', icon: Plus, href: '/resident/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#EDE8E0] py-6 pb-28 px-4 sm:px-6">
      <div className="max-w-md lg:max-w-4xl mx-auto space-y-6">
        {/* HERO CARD (Image 1) - Dusk Photograph of Palm Meadows */}
        <div className="relative rounded-3xl overflow-hidden shadow-xs h-52 bg-slate-900 flex flex-col justify-end p-6">
          <img
            src="/assets/images/community.jpg"
            alt="Palm Meadows"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#123E34]/90 via-[#123E34]/40 to-transparent" />
          <div className="relative z-10 space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-200">
              A little more connected
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {state.currentCommunity.name}
            </h1>
          </div>
        </div>

        {/* Section Heading & Subtitle (Image 1) */}
        <div>
          <h2 className="text-2xl font-black text-[#142E31] tracking-tight">
            {state.currentCommunity.name}
          </h2>
          <p className="text-xs text-[#808683] mt-1 font-medium">
            Your neighbours. Your everyday.
          </p>
        </div>

        {/* 3 Stats Boxes: Homes 40, Blocks 4, Residents 2 (Image 1) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-3xl p-4 border border-[#E7E6E1] shadow-xs">
            <div className="text-xs font-semibold text-[#808683]">Homes</div>
            <div className="text-2xl font-black text-[#142E31] mt-2">40</div>
          </div>
          <div className="bg-white rounded-3xl p-4 border border-[#E7E6E1] shadow-xs">
            <div className="text-xs font-semibold text-[#808683]">Blocks</div>
            <div className="text-2xl font-black text-[#142E31] mt-2">4</div>
          </div>
          <div className="bg-white rounded-3xl p-4 border border-[#E7E6E1] shadow-xs">
            <div className="text-xs font-semibold text-[#808683]">Residents</div>
            <div className="text-2xl font-black text-[#142E31] mt-2">2</div>
          </div>
        </div>

        {/* Community Actions - 10 Icons in 5x2 Grid (Image 1) */}
        <div className="space-y-3.5">
          <h3 className="font-extrabold text-base text-[#142E31]">
            Community Actions
          </h3>

          <div className="grid grid-cols-5 gap-y-4 gap-x-2 text-center">
            {actions.map((act) => {
              const IconComp = act.icon;
              return (
                <Link
                  key={act.label}
                  href={act.href}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-2xl bg-white border border-[#E7E6E1] shadow-2xs flex items-center justify-center text-[#142E31] transition-transform group-hover:scale-105">
                    <IconComp className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">
                    {act.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* NOTICE BOARD SECTION (Image 2) */}
        <div id="notices" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#142E31]">
              Notice Board
            </h3>
            <Link
              href="/resident/notices"
              className="text-xs font-bold text-[#E05D44] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E7E6E1] shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#17464B]" />
              <span className="text-xs font-bold text-[#17464B]">Maintenance</span>
            </div>

            <h4 className="font-extrabold text-base text-[#142E31]">
              Water tank cleaning · Sunday
            </h4>

            <p className="text-xs text-[#808683] leading-relaxed">
              Water will be paused from 10 AM to 12 PM for scheduled maintenance.
            </p>
          </div>
        </div>

        {/* CONNECT WITH NEIGHBOURS SECTION (Image 2) */}
        <div className="space-y-3 pt-2">
          <div>
            <h3 className="font-extrabold text-base text-[#142E31]">
              Connect with Neighbours
            </h3>
            <p className="text-xs text-[#808683] mt-0.5">
              Residents who call your society home
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            <div className="bg-white rounded-2xl p-4 border border-[#E7E6E1] shadow-xs flex items-center gap-3 min-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-[#70959D] text-white font-black text-sm flex items-center justify-center shrink-0">
                {(state.currentUser.full_name || 'R').charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-[#142E31]">{state.currentUser.full_name || 'Resident Owner'}</div>
                <div className="text-[11px] text-[#808683]">{state.currentUser.flat_display || 'Verified Resident'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY & SOCIETY DIRECTORY (Image 2) */}
        <div id="directory" className="space-y-3 pt-2">
          <h3 className="font-extrabold text-base text-[#142E31]">
            Security & Society Directory
          </h3>

          <div className="bg-white rounded-3xl p-5 border border-[#E7E6E1] shadow-xs divide-y divide-[#E7E6E1]">
            {/* Admin */}
            <div className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F6F5F2] flex items-center justify-center text-[#142E31]">
                  <Building2 className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#142E31]">Community Admin</div>
                  <div className="text-xs text-[#808683]">Estate Management Office</div>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#44816A]" />
            </div>

            {/* Guard */}
            <div className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F6F5F2] flex items-center justify-center text-[#142E31]">
                  <Shield className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#142E31]">Security Officer</div>
                  <div className="text-xs text-[#808683]">Main Gate 1 Kiosk</div>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#44816A]" />
            </div>
          </div>
        </div>

        {/* COMMUNITY POSTS (Image 3) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#142E31]">
              Community Posts
            </h3>
            <button
              onClick={() => {
                const text = prompt('Share a message with your society:');
                if (text) {
                  setPosts(prev => [
                    {
                      id: `post-${Date.now()}`,
                      author: state.currentUser.full_name || 'Resident',
                      initials: (state.currentUser.full_name || 'R').charAt(0),
                      community: state.currentCommunity.name,
                      body: text,
                      comments: []
                    },
                    ...prev
                  ]);
                }
              }}
              className="text-xs font-bold text-[#142E31] hover:text-[#E05D44] flex items-center gap-1 cursor-pointer"
            >
              <span>New Post</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-5 border border-[#E7E6E1] shadow-xs space-y-3.5"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#7D9567] text-white font-extrabold text-sm flex items-center justify-center">
                      {post.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#142E31]">{post.author}</div>
                      <div className="text-[11px] text-[#808683]">{post.community}</div>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-[#808683]" />
                </div>

                {/* Body */}
                <p className="text-xs text-[#142E31] leading-relaxed">
                  {post.body}
                </p>

                {/* Input box */}
                <div className="flex items-center gap-2 bg-[#F6F5F2] rounded-2xl px-3.5 py-2 border border-[#E7E6E1]">
                  <input
                    type="text"
                    placeholder="Add your thoughts..."
                    value={newCommentText[post.id] || ''}
                    onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(post.id);
                    }}
                    className="flex-1 bg-transparent text-xs text-[#142E31] placeholder-[#808683] focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="p-1 text-[#142E31] hover:text-[#E05D44] cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Comment count & list */}
                <div className="text-[11px] text-[#808683]">
                  {post.comments.length} comments
                </div>

                {post.comments.length > 0 && (
                  <div className="pt-2 border-t border-[#E7E6E1] space-y-1.5">
                    {post.comments.map((c, idx) => (
                      <div key={idx} className="text-xs bg-slate-50 p-2.5 rounded-xl">
                        <span className="font-bold text-[#142E31]">{c.author}: </span>
                        <span className="text-[#808683]">{c.body}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

