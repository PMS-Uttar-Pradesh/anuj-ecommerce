"use client";

import React, { useActionState, useState } from "react";
import {
  User,
  Mail,
  Tag,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { submitSupportRequest } from "@/lib/actions/support";

const initialState = {
  success: false,
  message: "",
  error: "",
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [state, formAction, isPending] = useActionState(
    async (prevState: any) => {
      const res = await submitSupportRequest(formData);
      if (res.success) {
        setFormData({ name: "", email: "", subject: "", message: "" });
        return { success: true, message: res.message || "Request submitted!", error: "" };
      } else {
        return { success: false, message: "", error: res.error || "Failed to submit." };
      }
    },
    initialState
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="min-h-screen bg-[var(--ag-gray-100)] dark:bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="font-display font-black text-4xl sm:text-5xl text-[var(--ag-dark)] dark:text-white tracking-tight mb-4">
            Contact Support
          </h1>
          <p className="text-base text-[var(--ag-gray-500)] dark:text-slate-400 font-medium">
            Have questions about our stationery products, orders, or customization? 
            Reach out to our support team.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[var(--card)] border border-[var(--ag-gray-200)] dark:border-[var(--border)] rounded-2xl p-8 shadow-md">
              <h2 className="font-display font-bold text-xl text-[var(--ag-dark)] dark:text-white mb-6">
                Support Channels
              </h2>

              <div className="space-y-6">
                {/* Email Support */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--ag-red)]/10 text-[var(--ag-red)] flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ag-dark)] dark:text-white">Email Support</h3>
                    <p className="text-xs text-[var(--ag-gray-500)] mt-1">pmsshop.in@gmail.com</p>
                    <p className="text-[10px] text-[var(--ag-gray-400)] mt-0.5">Average response: &lt; 24h</p>
                  </div>
                </div>

                {/* Telephone Support */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--ag-red)]/10 text-[var(--ag-red)] flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ag-dark)] dark:text-white">Call Support</h3>
                    <p className="text-xs text-[var(--ag-gray-500)] mt-1">+91 7880786433</p>
                    <p className="text-[10px] text-[var(--ag-gray-400)] mt-0.5">Mon - Fri: 9AM - 6PM IST</p>
                  </div>
                </div>

                {/* Main Office */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--ag-red)]/10 text-[var(--ag-red)] flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ag-dark)] dark:text-white">Location</h3>
                    <p className="text-xs text-[var(--ag-gray-500)] mt-1">
                      Khargasenpur, Thanagaddi Jalalpur Road,
                      <br />
                      Near Krishak College, Uttar Pradesh, 222181
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--ag-red)]/10 text-[var(--ag-red)] flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ag-dark)] dark:text-white">Business Hours</h3>
                    <p className="text-xs text-[var(--ag-gray-500)] mt-1">Monday - Saturday</p>
                    <p className="text-[10px] text-[var(--ag-gray-400)] mt-0.5">Closed on National Holidays</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-[var(--ag-gray-500)]">
              🔒 Your support request is encrypted and protected
            </p>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-[var(--card)] border border-[var(--ag-gray-200)] dark:border-[var(--border)] rounded-2xl p-8 sm:p-10 shadow-xl">
              <h2 className="font-display font-bold text-2xl text-[var(--ag-dark)] dark:text-white mb-6">
                Send a Message
              </h2>

              {/* Status Banners */}
              {state.error && (
                <div className="flex items-center gap-3 text-sm font-semibold text-[var(--ag-red)] bg-[var(--ag-red)]/8 p-4 rounded-xl mb-6 border border-[var(--ag-red)]/15 animate-fadeInUp">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              {state.success && (
                <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600 bg-emerald-500/8 p-4 rounded-xl mb-6 border border-emerald-500/15 animate-fadeInUp">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{state.message}</span>
                </div>
              )}

              <form action={formAction} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="contact-name"
                      className="text-[11px] font-bold uppercase tracking-wider text-[var(--ag-gray-500)] dark:text-slate-400"
                    >
                      Your Name
                    </label>
                    <div className="relative flex items-center">
                      <User
                        size={16}
                        className="absolute left-3 text-[var(--ag-gray-500)] pointer-events-none"
                      />
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isPending}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] bg-white dark:bg-transparent text-sm font-semibold text-[var(--ag-dark)] dark:text-white placeholder:text-[var(--ag-gray-500)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="contact-email"
                      className="text-[11px] font-bold uppercase tracking-wider text-[var(--ag-gray-500)] dark:text-slate-400"
                    >
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail
                        size={16}
                        className="absolute left-3 text-[var(--ag-gray-500)] pointer-events-none"
                      />
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isPending}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] bg-white dark:bg-transparent text-sm font-semibold text-[var(--ag-dark)] dark:text-white placeholder:text-[var(--ag-gray-500)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-subject"
                    className="text-[11px] font-bold uppercase tracking-wider text-[var(--ag-gray-500)] dark:text-slate-400"
                  >
                    Subject
                  </label>
                  <div className="relative flex items-center">
                    <Tag
                      size={16}
                      className="absolute left-3 text-[var(--ag-gray-500)] pointer-events-none"
                    />
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      placeholder="How can we help you?"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] bg-white dark:bg-transparent text-sm font-semibold text-[var(--ag-dark)] dark:text-white placeholder:text-[var(--ag-gray-500)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-message"
                    className="text-[11px] font-bold uppercase tracking-wider text-[var(--ag-gray-500)] dark:text-slate-400"
                  >
                    Message
                  </label>
                  <div className="relative flex items-start">
                    <MessageSquare
                      size={16}
                      className="absolute left-3 top-3.5 text-[var(--ag-gray-500)] pointer-events-none"
                    />
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Type your message details here..."
                      required
                      value={formData.message}
                      onChange={handleChange}
                      disabled={isPending}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] bg-white dark:bg-transparent text-sm font-semibold text-[var(--ag-dark)] dark:text-white placeholder:text-[var(--ag-gray-500)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Message
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
