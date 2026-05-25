'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ChatsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchContacts();
  }, [router]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReveal = (contactId) => {
    setRevealed(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }));
  };

  const copyWhatsApp = (whatsapp, contactId) => {
    navigator.clipboard.writeText(whatsapp);
    setCopied(contactId);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!user) {
    return <div className="text-center py-8">Redirecting...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-6">My Chats</h1>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No contacts yet</p>
          <p className="text-sm text-gray-500">Start contacting sellers to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-primary">{contact.contact_name}</h3>
                  <p className="text-xs text-gray-600 capitalize">{contact.contact_type}</p>
                </div>
                <button
                  onClick={() => toggleReveal(contact.id)}
                  className="text-sm text-accent hover:underline font-medium"
                >
                  {revealed[contact.id] ? 'Hide' : 'Reveal'} WhatsApp
                </button>
              </div>

              {revealed[contact.id] && (
                <div className="bg-accent/5 rounded-lg p-3 flex items-center justify-between">
                  <p className="font-mono text-primary font-medium">{contact.contact_whatsapp}</p>
                  <button
                    onClick={() => copyWhatsApp(contact.contact_whatsapp, contact.id)}
                    className="flex items-center gap-1 text-xs bg-accent text-white px-2 py-1 rounded"
                  >
                    {copied === contact.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
         }
