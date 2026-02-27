Write-Host "========================================" -ForegroundColor Green
Write-Host "Starting Vistaran Help Desk Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

do {
    Write-Host "Building the application..." -ForegroundColor Yellow
    $buildResult = npm run build
    $buildExitCode = $LASTEXITCODE
    
    if ($buildExitCode -ne 0) {
        Write-Host "Build failed. Retrying in 5 seconds..." -ForegroundColor Red
        Start-Sleep -Seconds 5
        continue
    }

    Write-Host ""
    Write-Host "Starting server on port 3000..." -ForegroundColor Green
    $process = Start-Process node -ArgumentList "server.mjs" -PassThru
    
    Write-Host "Server started with Process ID: $($process.Id)" -ForegroundColor Cyan
    
    # Wait for the process to exit
    do {
        Start-Sleep -Seconds 1
        $processRunning = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    } while ($processRunning)
    
    Write-Host "Server stopped unexpectedly. Restarting in 5 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

} while ($true)