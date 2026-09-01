import { downloadZip } from 'https://esm.ext.archive.org/client-zip@2/index.js'
import { log, warn } from 'https://av.archive.org/js/util/log.js'

async function downloadFilesAsZip() {
  const filesToFetch = [
    { url: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/132.ogg', name: '132.ogg' },
    { url: 'https://traceypooh.com/img/2025-europe-00.avif', name: '0.avif' },
    { url: 'https://traceypooh.com/img/2025-europe-01.avif', name: '1.avif' },
    { url: 'https://cors.archive.org/cors/commute/commute.mp4', name: 'c.mp4' },
    { url: 'https://cdn.jsdelivr.net/gh/traceypooh/poohbot/img/2025-europe-02.avif', name: '2.avif' },
    { url: 'https://cdn.jsdelivr.net/gh/traceypooh/poohbot/img/2025-europe-03.avif', name: '3.avif' },
  ]

  const totalFiles = filesToFetch.length
  let filesProcessed = 0

  // Grab UI Elements
  const container = document.getElementById('progressContainer')
  const bar = document.getElementById('progressBar')
  const text = document.getElementById('progressText')
  const btn = document.getElementById('downloadBtn')

  // Helper function to update the progress bar UI
  function updateProgress(fileName) {
    filesProcessed += 1
    const percentage = Math.round((filesProcessed / totalFiles) * 100)
    bar.style.width = `${percentage}%`
    text.innerText = `Zipping: ${filesProcessed}/${totalFiles} (${fileName})`
  }

  try {
    // Show progress bar and disable button during active downloads
    container.style.display = 'block'
    bar.style.width = '0%'
    text.innerText = 'Connecting to servers...'
    btn.disabled = true

    // 1. Map files to promises.
    const filePromises = filesToFetch.map(async (file) => {
      const res = await fetch(file.url)
      if (!res.ok) throw new Error(`Failed to download ${file.name}: ${res.statusText}`)

      // Intercept the stream reading to trigger UI updates when data finishes streaming
      const originalBody = res.body
      const transformStream = new TransformStream({
        flush(_controller) {
          // Triggers exactly when client-zip finishes pulling the last chunk of this file
          updateProgress(file.name)
        },
      })

      return {
        name: file.name,
        input: new Response(originalBody.pipeThrough(transformStream)),
      }
    })

    // 2. Resolve metadata wrapper array
    const resolvedFiles = await Promise.all(filePromises)
    text.innerText = 'Waiting for user save location...'

    const zipResponse = downloadZip(resolvedFiles)
    const zipStream = zipResponse.body

    // 3. Feature Detection (Chrome/Edge/Firefox)
    if ('showSaveFilePicker' in window) {
      log('Using low-memory direct disk streaming...')

      const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'photos.zip',
        types: [{ description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } }],
      })

      const writableStream = await fileHandle.createWritable()

      text.innerText = 'Streaming directly to disk...'
      await zipStream.pipeTo(writableStream)
      log('Streaming complete!')
    } else {
      // 4. Fallback Path (Safari/Mobile)
      warn('Streaming unsupported. Falling back to memory-buffered BLOB.')
      text.innerText = 'Building zip in memory (Safari/Mobile)...'

      const blob = await zipResponse.blob()

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'photod.zip'
      link.click()
      log('Blob download triggered.')
    }

    // Success UI clean up
    text.innerText = 'Download complete!'
    setTimeout(() => { container.style.display = 'none' }, 3000)
  } catch (error) {
    if (error.name === 'AbortError') {
      log('User cancelled the save dialog.')
      text.innerText = 'Download cancelled.'
      setTimeout(() => { container.style.display = 'none' }, 2000)
      return
    }
    console.error('ZIP Generation failed:', error.message)
    alert(`Could not download files: ${error.message}`)
    container.style.display = 'none'
  } finally {
    // Re-enable the download button
    btn.disabled = false
  }
}

// Inject the UI markup (button + hidden progress bar).
// `type=module` scripts are deferred, so the document is already parsed here.
document.body.insertAdjacentHTML('afterbegin', `
<button id="downloadBtn">Download ZIP</button>

<!-- Progress Bar Container (Hidden by default) -->
<div id="progressContainer" style="display: none; margin-top: 15px; width: 300px;">
    <div style="background-color: #f3f3f3; border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
      <div id="progressBar" style="width: 0%; height: 20px; background-color: #4CAF50; transition: width 0.3s ease;">
      </div>
    </div>
    <small id="progressText" style="display: block; margin-top: 5px; color: #555;">Preparing files...</small>
</div>
`)

document.getElementById('downloadBtn').addEventListener('click', downloadFilesAsZip)
