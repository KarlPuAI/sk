import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: NextRequest) {
  const { player_name, score } = await req.json();
  if (!player_name || typeof score !== 'number') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_2ehByYpfvsQ1@ep-billowing-unit-a89jhzom-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  });
  try {
    await client.connect();
    await client.query(
      'INSERT INTO player_score (player_name, score) VALUES ($1, $2)',
      [player_name, score]
    );
    await client.end();
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.end();
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 