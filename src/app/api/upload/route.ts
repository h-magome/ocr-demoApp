import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
        }

        const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

        const blobSvc = BlobServiceClient.fromConnectionString(connStr);
        const container = blobSvc.getContainerClient(containerName);

        const blobName = `${Date.now()}-${file.name}`;
        const blockBlob = container.getBlockBlobClient(blobName);

        const arrayBuf = await file.arrayBuffer();
        await blockBlob.uploadData(Buffer.from(arrayBuf), {
            blobHTTPHeaders: { blobContentType: file.type },
        });

        return NextResponse.json({ url: blockBlob.url });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
} 