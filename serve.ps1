$root = Join-Path $PSScriptRoot ""
$port = 5178
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  ".html" = "text/html"
  ".css"  = "text/css"
  ".js"   = "application/javascript"
  ".json" = "application/json"
  ".png"  = "image/png"
  ".svg"  = "image/svg+xml"
}

$pool = [runspacefactory]::CreateRunspacePool(1, 8)
$pool.Open()

$handlerScript = {
  param($context, $root, $mime)
  $request = $context.Request
  $response = $context.Response
  try {
    $response.SendChunked = $false
    $method = $request.HttpMethod

    if ($method -eq "OPTIONS") {
      $response.StatusCode = 204
      $response.ContentLength64 = 0
      $response.OutputStream.Close()
      return
    }

    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path $root ($path.TrimStart("/"))

    if ((Test-Path $filePath -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($filePath)
      $contentType = $mime[$ext]
      if (-not $contentType) { $contentType = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $response.StatusCode = 200
      $response.ContentType = $contentType
      $response.ContentLength64 = [int64]$bytes.Length
      if ($method -ne "HEAD") {
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else {
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $response.StatusCode = 404
      $response.ContentLength64 = [int64]$notFound.Length
      if ($method -ne "HEAD") {
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
      }
    }
  } catch {
  } finally {
    $response.OutputStream.Close()
  }
}

$jobs = New-Object System.Collections.ArrayList

while ($listener.IsListening) {
  $context = $listener.GetContext()

  $ps = [powershell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($handlerScript).AddArgument($context).AddArgument($root).AddArgument($mime)
  $asyncResult = $ps.BeginInvoke()
  [void]$jobs.Add(@{ ps = $ps; ar = $asyncResult })

  for ($i = $jobs.Count - 1; $i -ge 0; $i--) {
    if ($jobs[$i].ar.IsCompleted) {
      try { $jobs[$i].ps.EndInvoke($jobs[$i].ar) } catch {}
      $jobs[$i].ps.Dispose()
      $jobs.RemoveAt($i)
    }
  }
}
