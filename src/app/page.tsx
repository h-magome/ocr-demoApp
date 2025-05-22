'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<any>(null)
  const [loadingUpload, setLoadingUpload] = useState(false)
  const [loadingOcr, setLoadingOcr] = useState(false)
  const [loadingExtract, setLoadingExtract] = useState(false)

  // 1. ファイル選択
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
    setUploadUrl(null)
    setOcrResult(null)
    setExtracted(null)
  }

  // 2. アップロード実行
  async function handleUpload() {
    if (!file) return
    setLoadingUpload(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const json = await res.json()
    if (res.ok) {
      setUploadUrl(json.url)
    } else {
      alert('アップロードエラー: ' + JSON.stringify(json))
    }
    setLoadingUpload(false)
  }

  // 3. OCR実行
  async function handleOcr() {
    if (!uploadUrl) return
    setLoadingOcr(true)
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: uploadUrl }),
    })
    const json = await res.json()
    if (res.ok) {
      setOcrResult(json.content)
    } else {
      alert('OCRエラー: ' + JSON.stringify(json))
    }
    setLoadingOcr(false)
  }

  // 4. キーワード抽出実行
  async function handleExtract() {
    if (!ocrResult) return
    setLoadingExtract(true)
    const res = await fetch('/api/extract-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ocrResult }),
    })
    const json = await res.json()
    if (res.ok) {
      setExtracted(json)
    } else {
      alert('抽出エラー: ' + JSON.stringify(json))
    }
    setLoadingExtract(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">OCR + キーワード抽出デモ</h1>

      {/* ファイル選択部分を改善 */}
      <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 w-100">
        <h2 className="text-lg font-medium mb-3">PDFファイルを選択</h2>

        <div className="mb-4">
          {file ? (
            <div className="text-green-600 font-medium">
              <span className="mr-2">✓</span>
              選択済み: {file.name}
            </div>
          ) : (
            <div className="text-gray-500">ファイルが選択されていません</div>
          )}
        </div>

        <label className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded cursor-pointer inline-block transition">
          ファイルを選択
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={handleUpload}
          disabled={!file || loadingUpload}
          className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50 hover:bg-indigo-600 transition"
        >
          {loadingUpload ? 'アップロード中…' : 'アップロード'}
        </button>

        <button
          onClick={handleOcr}
          disabled={!uploadUrl || loadingOcr}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition"
        >
          {loadingOcr ? 'OCR中…' : 'OCR実行'}
        </button>

        <button
          onClick={handleExtract}
          disabled={!ocrResult || loadingExtract}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition"
        >
          {loadingExtract ? '抽出中…' : '項目抽出'}
        </button>
      </div>

      {/* アップロード先のURL */}
      {uploadUrl && (
        <div className="mb-4">
          <h2 className="text-lg font-medium">アップロード先 URL</h2>
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {uploadUrl}
          </a>
        </div>
      )}

      {/* OCR結果のプレビュー */}
      {ocrResult && (
        <div className="mb-6">
          <h2 className="text-xl mb-2">OCR結果（生テキスト）</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{ocrResult}</pre>
        </div>
      )}

      {/* 抽出結果の表示 */}
      {extracted && (
        <div>
          <h2 className="text-xl mb-2">抽出結果</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(extracted, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
