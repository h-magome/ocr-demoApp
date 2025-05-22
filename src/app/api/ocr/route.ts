import { NextResponse } from 'next/server';

const endpoint = process.env.NEXT_PUBLIC_FORM_RECOGNIZER_ENDPOINT!;
const apiKey = process.env.FORM_RECOGNIZER_API_KEY!;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
    const { url } = await req.json();

    // 1) Analyze リクエストを送信
    const analyzeResp = await fetch(
        `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': apiKey,
            },
            body: JSON.stringify({ urlSource: url }),
        }
    );

    if (analyzeResp.status !== 202) {
        const text = await analyzeResp.text();
        return NextResponse.json({ error: text }, { status: analyzeResp.status });
    }

    // 2) Operation-Location ヘッダーを取得
    const operationLocation = analyzeResp.headers.get('Operation-Location');
    if (!operationLocation) {
        return NextResponse.json({ error: 'Operation-Location header is missing.' }, { status: 500 });
    }

    // 3) ポーリングして結果ができるまで待つ
    let resultJson: any;
    for (let i = 0; i < 10; i++) {  // 最大10回まで試す
        await sleep(1000);  // 1秒待機
        const pollResp = await fetch(operationLocation, {
            headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        });
        if (!pollResp.ok) {
            const text = await pollResp.text();
            return NextResponse.json({ error: text }, { status: pollResp.status });
        }
        const pollJson = await pollResp.json();
        if (pollJson.status === 'succeeded') {
            resultJson = pollJson;  // 完了結果を保存
            break;
        }
    }

    if (!resultJson) {
        return NextResponse.json({ error: 'Analysis did not complete in time.' }, { status: 504 });
    }

    // 4) 成功結果をそのまま返却
    const textContent = resultJson.analyzeResult?.content ?? resultJson.content;
    return NextResponse.json({
        content: textContent
    });
} 