import { NextRequest, NextResponse } from 'next/server';
import { getStockData } from '@/lib/0.entry/get-stock-data';

export async function GET(_req: NextRequest, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol?.toUpperCase().trim();

  if (!symbol || !/^[A-Z.\-]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
  }

  try {
    const { data, isSample } = await getStockData(symbol);
    return NextResponse.json({ data, isSample });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: `Could not load data for "${symbol}"` }, { status: 500 });
  }
}
