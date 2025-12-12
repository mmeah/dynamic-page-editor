import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  console.log('API route /api/_dev/[...path] was hit.');
  console.log('Path:', params.path);
  return new NextResponse('Hello from the API route', {
    status: 200,
  });
}
