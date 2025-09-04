import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get('address') || '').trim().toLowerCase();
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  const id = (address || email).replace(/^<|>$/g, '');
  if (!id) return NextResponse.json({ kycStatus: 'not_submitted' });

  const { data, error } = await supabase
    .from('kyc_records')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('KYC status read error', error);
    return NextResponse.json({ kycStatus: 'not_submitted' });
  }

  // Map lowercase DB column to camelCase API field
  const status = (data as any)?.kycstatus || (data as any)?.kycStatus || 'not_submitted';
  return NextResponse.json({ kycStatus: status, record: data || null });
}


