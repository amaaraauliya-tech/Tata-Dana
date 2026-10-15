# ==============================================================================
# Helper Script: Connect Local Repository to GitHub
# Usage: powershell -File scripts/connect-github.ps1 -RepoUrl "https://github.com/username/tatadana.git"
# ==============================================================================

param (
    [Parameter(Mandatory=$false)]
    [string]$RepoUrl
)

$git = "C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe"

if (-not (Test-Path $git)) {
    $git = "git"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   TataDana - Hubungkan ke GitHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not $RepoUrl) {
    Write-Host ""
    Write-Host "Langkah-langkah membuat repository di GitHub:" -ForegroundColor Yellow
    Write-Host "1. Buka https://github.com/new"
    Write-Host "2. Masukkan Repository name: tatadana"
    Write-Host "3. Pilih Public atau Private"
    Write-Host "4. JANGAN centang 'Add a README file' atau '.gitignore' (sudah ada)"
    Write-Host "5. Klik tombol 'Create repository'"
    Write-Host ""
    $RepoUrl = Read-Host "Masukkan URL repository GitHub Anda (contoh: https://github.com/username/tatadana.git)"
}

if (-not $RepoUrl) {
    Write-Host "❌ URL repository tidak boleh kosong." -ForegroundColor Red
    exit 1
}

Write-Host "`nMenghubungkan remote origin ke: $RepoUrl..." -ForegroundColor Green
& $git remote remove origin 2>$null
& $git remote add origin $RepoUrl

Write-Host "Mengatur branch utama ke 'main'..." -ForegroundColor Green
& $git branch -M main

Write-Host "Melakukan push ke GitHub..." -ForegroundColor Green
& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ BERHASIL TERHUBUNG & TER-PUSH KE GITHUB!" -ForegroundColor Green
    Write-Host "Kunjungi: $RepoUrl" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Push belum selesai atau membutuhkan autentikasi GitHub." -ForegroundColor Yellow
    Write-Host "Tips: Kamu juga bisa membuka GitHub Desktop, klik 'File' -> 'Add Local Repository', pilih folder ini, lalu klik 'Publish repository'!" -ForegroundColor White
}
