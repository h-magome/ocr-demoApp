import { NextResponse } from 'next/server'

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!
const apiKey = process.env.AZURE_OPENAI_KEY!

export async function POST(req: Request) {
    const { text } = await req.json()

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'system',
                    content: `
以下のテキストから、可能な限り下記のフィールドを JSON 形式で抽出してください。
・取引社名
・品名
・加工の品目（断裁、折り加工、中綴じ 等）
・商品のシリアルナンバー（ある場合のみ）
・入荷日／納期日
・数量
・単価
・サイズ
・包装／梱包の手法

テキストに含まれないフィールドは空のままにしてください。
あいまいな言い回しや同義語も拾ってください。
          `.trim(),
                },
                { role: 'user', content: text },
            ],
            max_tokens: 1000,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err }, { status: res.status })
    }
    const json = await res.json()

    const answer = json.choices?.[0]?.message?.content
    let parsed: any = {}
    try {
        parsed = JSON.parse(answer)
    } catch {
        return NextResponse.json({ error: 'JSON パースに失敗しました', raw: answer })
    }

    return NextResponse.json(parsed)
} 