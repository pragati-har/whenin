'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Coffee, Eye, EyeOff, Filter, MapPin, Search, Star } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { CafeCard } from '@/components/cafes/CafeCard';
import { OfferCard } from '@/components/offers/OfferCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField } from '@/components/ui/InputField';
import { useAuth } from '@/context/AuthContext';
import { useCafes } from '@/hooks/useCafes';
import { useDebounce } from '@/hooks/useDebounce';
import { useOffers } from '@/hooks/useOffers';

function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf5] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] bg-[#f5e7dc] p-8 shadow-sm sm:p-10">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-[#5f463d]">
            <Coffee className="text-[#c85d2b]" size={18} />
            Discover your city. Find your next favourite place.
          </div>
          <h1 className="max-w-lg text-4xl font-black tracking-tight text-[#2d1b16] sm:text-5xl">
            WHEN IN
          </h1>
          <p className="mt-4 max-w-lg text-lg text-[#5f463d]">
            Explore local cafes, unlock dine-in offers, and discover the neighbourhood spots you&apos;ll keep returning to.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <div className="text-3xl font-black text-[#c85d2b]">15</div>
              <div className="mt-2 text-sm text-[#5f463d]">Seed cafes</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-black text-[#c85d2b]">24/7</div>
              <div className="mt-2 text-sm text-[#5f463d]">Local discovery</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-black text-[#c85d2b]">Live</div>
              <div className="mt-2 text-sm text-[#5f463d]">Offer alerts</div>
            </Card>
          </div>
        </div>

        <div className="rounded-[32px] border border-[#f0e4d6] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex gap-2 rounded-full bg-[#f7eee7] p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-[#c85d2b] text-white' : 'text-[#5f463d]'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'register' ? 'bg-[#c85d2b] text-white' : 'text-[#5f463d]'}`}
            >
              Register
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <InputField label="Name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
            )}
            <InputField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            <label className="block w-full text-sm font-medium text-[#2d1b16]">
              <span className="mb-2 block">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#e7d9cf] bg-white px-3 py-2.5 pr-10 outline-none transition focus:border-[#c85d2b] focus:ring-2 focus:ring-[#f3d3bd]"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-[#5f463d]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full" disabled={loading} onClick={() => void submit()}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const { state } = useAuth();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Pune');
  const [cuisine, setCuisine] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const { cafes, loading, pagination } = useCafes(debouncedSearch, page, 6, city, cuisine);
  const { offers } = useOffers();

  if (!state.user) {
    return <AuthScreen />;
  }

  const featuredCafes = cafes.filter((cafe) => cafe.featured).slice(0, 3);

  return (
    <AppShell>
      <section className="mb-8 rounded-[28px] bg-[#f7efe9] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#7a5d53]">
              <MapPin size={12} className="text-[#c85d2b]" />
              <span>{city}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[#2d1b16] md:text-4xl">Welcome back, {state.user.name}.</h2>
            <p className="mt-2 max-w-xl text-[#5f463d]">Your next favourite cafe is waiting nearby. Search by vibe, cuisine, or neighbourhood.</p>
          </div>
          <Link href="/submit-cafe">
            <Button icon={<ArrowRight size={16} />} className="px-5 py-3">Suggest a Cafe</Button>
          </Link>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <div className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Cafes</div>
          <div className="mt-2 text-3xl font-black text-[#c85d2b]">{pagination.totalRecords}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Featured</div>
          <div className="mt-2 text-3xl font-black text-[#c85d2b]">{featuredCafes.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Offers</div>
          <div className="mt-2 text-3xl font-black text-[#c85d2b]">{offers.length}</div>
        </Card>
      </section>

      <section className="mb-8 rounded-[28px] border border-[#f0e4d6] bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 text-[#8f6a5f]" size={18} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#e7d9cf] bg-[#fffaf5] py-2.5 pl-10 pr-3 outline-none focus:border-[#c85d2b] focus:ring-2 focus:ring-[#f3d3bd]"
              placeholder="Search cafe, locality or cuisine"
            />
          </div>
          <select
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#e7d9cf] bg-[#fffaf5] px-3 py-2.5 text-[#2d1b16] outline-none"
          >
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
          </select>
          <select
            value={cuisine}
            onChange={(event) => {
              setCuisine(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#e7d9cf] bg-[#fffaf5] px-3 py-2.5 text-[#2d1b16] outline-none"
          >
            <option value="">All cuisines</option>
            <option value="Cafe">Cafe</option>
            <option value="Italian">Italian</option>
            <option value="North Indian">North Indian</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-[#2d1b16]">Featured cafes</h3>
          <Link href="/offers" className="text-sm font-medium text-[#c85d2b]">See offers</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredCafes.length > 0 ? featuredCafes.map((cafe) => <CafeCard key={cafe._id} cafe={cafe} />) : <Card>No featured cafes found.</Card>}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-[#2d1b16]">Discover cafes</h3>
          <div className="flex items-center gap-2 text-sm text-[#5f463d]">
            <Filter size={14} />
            {loading ? 'Loading...' : `${pagination.totalRecords} results`}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cafes.map((cafe) => (
            <CafeCard key={cafe._id} cafe={cafe} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" disabled={!pagination.hasPreviousPage || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Previous
          </Button>
          <span className="text-sm text-[#5f463d]">
            Page {pagination.currentPage} / {pagination.totalPages}
          </span>
          <Button variant="secondary" disabled={!pagination.hasNextPage || loading} onClick={() => setPage((value) => value + 1)}>
            Next
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-[#2d1b16]">Dine-in offers</h3>
          <Link href="/offers" className="text-sm font-medium text-[#c85d2b]">View all</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {offers.slice(0, 3).map((offer) => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default function HomePage() {
  const { state } = useAuth();
  return state.user ? <DashboardOverview /> : <AuthScreen />;
}
