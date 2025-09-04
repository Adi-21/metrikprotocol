import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const address = (formData.get('address') as string | null)?.toLowerCase() || undefined;
    const email = (formData.get('email') as string | null) || undefined;
    const fileNames: string[] = [];
    const companyName = (formData.get('companyName') as string | null) || undefined;
    const documentUrls = JSON.parse((formData.get('documentUrls') as string | null) || '[]');
    const imageUrls = JSON.parse((formData.get('imageUrls') as string | null) || '[]');

    for (const [key, value] of formData.entries()) {
      if (key === 'file' && value instanceof File) {
        fileNames.push(value.name);
      }
    }

    if (!address && !email) {
      return NextResponse.json({ error: 'Missing address or email' }, { status: 400 });
    }

    const id = (address || email!)!.toLowerCase();

    const payload = {
      id,
      email,
      walletAddress: address,
      companyName,
      documentPaths: fileNames,
      documentUrls,
      imageUrls,
      kycStatus: 'pending_review',
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('kyc_records')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, record: data });
  } catch (error) {
    console.error('KYC submit error', error);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }
}


