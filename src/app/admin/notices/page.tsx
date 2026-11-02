'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  Trash2, 
  Pin, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  PartyPopper, 
  Info, 
  CheckCircle2 
} from 'lucide-react';
import { Notice, NoticeCategory } from '@/types';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function AdminNoticesPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('general');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const notices = state.notices || [];

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    appStore.addNotice({
      community_id: state.currentCommunity.id,
      title: title.trim(),
      content: content.trim(),
      category: category,
      is_pinned: isPinned,
      author_id: state.currentUser.id,
      author_name: state.currentUser.full_name || 'Estate Office'
    });

    setBannerMessage(`📢 Notice "${title}" published to all residents!`);
    setIsCreateModalOpen(false);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const handleDeleteNotice = (id: string, noticeTitle: string) => {
    if (confirm(`Are you sure you want to delete notice "${noticeTitle}"?`)) {
      appStore.deleteNotice(id);
      setBannerMessage(`Notice "${noticeTitle}" deleted.`);
      setTimeout(() => setBannerMessage(null), 4000);
    }
  };

  const getCategoryBadge = (cat: NoticeCategory) => {
    switch (cat) {
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            <Wrench className="w-3 h-3" />
            Maintenance
          </span>
        );
      case 'event':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300">
            <PartyPopper className="w-3 h-3" />
            Society Event
          </span>
        );
      case 'emergency':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3" />
            Urgent Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-300">
            <Info className="w-3 h-3" />
            General Notice
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Society Communications
        </span>
      </div>

      {/* Header Banner (Clean Wireframe Style) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-4 h-4" />
            <span>Digital Circulars & Announcements</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Society Notices & Announcements Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast official circulars, lift & water maintenance alerts, AGM meetings, and festive events to all residents.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs touch-press transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Notice</span>
        </button>
      </div>

      {/* Banner */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Notices List */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <Bell className="w-12 h-12 mx-auto text-slate-300" />
            <div className="font-bold text-slate-700">No active society notices</div>
            <p className="text-xs text-slate-400">Click &quot;Publish New Notice&quot; to post your first announcement.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-3xl border-2 p-6 shadow-xs transition-all space-y-3 ${
                notice.is_pinned ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getCategoryBadge(notice.category)}
                  {notice.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-black">
                      <Pin className="w-3 h-3" />
                      Pinned to Top
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Published <TimeAgo date={notice.created_at} /> by {notice.author_name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteNotice(notice.id, notice.title)}
                  className="self-end sm:self-auto p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete Notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="font-black text-lg text-slate-900 tracking-tight">{notice.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {notice.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Publish Notice */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Publish Society Notice</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Heading / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Overhead Tank Cleaning on Saturday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="general">General Society Announcement</option>
                  <option value="maintenance">Maintenance / Repair Work</option>
                  <option value="event">Festive Celebration / Community Event</option>
                  <option value="emergency">Urgent Emergency Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Circular Content</label>
                <textarea
                  rows={4}
                  placeholder="Provide complete details including dates, affected blocks/towers, and guidelines for residents..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="pinNotice" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Pin this circular to the top of Resident Notice Boards
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
